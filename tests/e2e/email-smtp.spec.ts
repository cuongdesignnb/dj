import { readFileSync, existsSync } from 'node:fs';
import { test, expect, request as requestFactory } from '@playwright/test';
import type { APIRequestContext, Page } from '@playwright/test';

// Needs the QA stack and a local SMTP sink reachable from the app container:
//   node smtp-sink.mjs 2525 <file>   then   SMTP_SINK_FILE=<file> SMTP_SINK_HOST=host.docker.internal
const sinkFile = process.env.SMTP_SINK_FILE ?? '';
const sinkHost = process.env.SMTP_SINK_HOST ?? 'host.docker.internal';
test.skip(process.env.GALLERY_QA !== '1' || !sinkFile, 'QA stack and SMTP sink opt-in required.');
test.describe.configure({ mode: 'serial' });
test.setTimeout(120_000);

const PASSWORD = 'qa-smtp-app-password-123';
let admin: APIRequestContext;
let adminState: Awaited<ReturnType<APIRequestContext['storageState']>>;

interface SunkMail { from: string; to: string[]; auth: { user: string; pass: string } | null; data: string }
function sunk(): SunkMail[] {
  if (!existsSync(sinkFile)) return [];
  return readFileSync(sinkFile, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line) as SunkMail);
}
/** The Subject header, unfolded and with MIME encoded-words decoded. */
function subjectOf(mail: SunkMail) {
  const match = mail.data.match(/^Subject:(.*(?:\n[ \t].*)*)/m);
  const raw = (match?.[1] ?? '').replace(/\n[ \t]+/g, ' ').trim();
  return raw.replace(/=\?utf-8\?([qb])\?([^?]*)\?=\s*/gi, (_, kind: string, body: string) =>
    kind.toLowerCase() === 'b'
      ? Buffer.from(body, 'base64').toString('utf8')
      : Buffer.from(body.replace(/_/g, ' ').replace(/=([0-9A-F]{2})/gi, (_m, hex: string) => String.fromCharCode(parseInt(hex, 16))), 'latin1').toString('utf8'),
  ).trim();
}
async function waitForMail(match: (mail: SunkMail) => boolean) {
  await expect.poll(() => sunk().some(match), { timeout: 20_000 }).toBe(true);
  return sunk().filter(match).at(-1)!;
}

test.beforeAll(async ({ baseURL }) => {
  const target = new URL(baseURL!);
  if (!['localhost', '127.0.0.1'].includes(target.hostname) || target.port !== '43291') throw new Error('Email tests only target loopback:43291.');
  const client = await requestFactory.newContext({ baseURL });
  expect((await client.post('/api/v1/auth/login', { data: { email: 'qa-admin@example.test', password: 'Gallery-QA-Only-2026!' } })).status()).toBe(200);
  adminState = await client.storageState();
  await client.dispose();
  const token = adminState.cookies.find((cookie) => cookie.name === 'destiny_csrf')!.value;
  admin = await requestFactory.newContext({ baseURL, storageState: adminState, extraHTTPHeaders: { 'x-csrf-token': token } });
});

test.afterAll(async () => {
  // Leave QA with email switched off and no stored server.
  await admin?.put('/api/v1/admin/settings/email', { data: { enabled: false, host: '', username: '', fromEmail: '', fromName: '', notifyTo: '', autoReplyContact: false } });
  await admin?.dispose();
});

async function openEmailSettings(page: Page) {
  await page.goto('/admin/settings/email');
  await expect(page.getByRole('heading', { name: 'Email (SMTP)' }).first()).toBeVisible();
}

test('Admin › Settings › Email (SMTP) stores the server with an encrypted password and sends a test email', async ({ browser }) => {
  const page = await (await browser.newContext({ storageState: adminState })).newPage();
  await openEmailSettings(page);
  await page.getByRole('switch', { name: 'Send emails from the website' }).click();
  await page.getByLabel('SMTP host').fill(sinkHost);
  await page.getByLabel('Port').fill('2525');
  await page.getByLabel('Security').selectOption('none');
  await page.getByLabel('Username').fill('qa-smtp@example.test');
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByLabel('From name').fill('Connection QA');
  await page.getByLabel('From email').fill('qa-smtp@example.test');
  await page.getByLabel('Send notifications to').fill('team-a@example.test, team-b@example.test');
  await page.getByRole('switch', { name: 'Confirm contact messages' }).click();
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page.getByText('Changes saved.').first()).toBeVisible();

  await page.reload();
  await expect(page.getByText('Stored (encrypted)')).toBeVisible();
  await expect(page.getByLabel('Password', { exact: true })).toHaveValue('');
  // The API never hands the password (or its encrypted form) back.
  const read = await admin.get('/api/v1/admin/settings/email');
  const body = await read.text();
  expect(body).not.toContain(PASSWORD);
  expect(body).not.toContain('passwordSealed');

  const test = page.locator('[data-email-test]');
  await test.getByLabel('Send to').fill('owner-check@example.test');
  await test.getByRole('button', { name: 'Send test email' }).click();
  await expect(page.getByText('Test email sent to owner-check@example.test').first()).toBeVisible();
  const mail = await waitForMail((m) => m.to.some((to) => to.includes('owner-check@example.test')));
  expect(mail.auth).toEqual({ user: 'qa-smtp@example.test', pass: PASSWORD });
  expect(subjectOf(mail)).toMatch(/^Test email from /);
  await page.reload();
  await expect(page.getByText(/Test email sent \d{4}-\d{2}-\d{2}/)).toBeVisible();
  await page.context().close();
});

test('a contact message emails the team (reply-to the visitor) and sends the visitor a copy', async ({ request }) => {
  const stamp = Date.now();
  const response = await request.post('/api/v1/contact', { data: { fullName: 'QA Mail Visitor', email: `qa-visitor-${stamp}@example.test`, message: `QA contact ${stamp}: is there a table for six?`, locale: 'en' } });
  expect(response.status()).toBe(202);
  const team = await waitForMail((m) => m.to.some((to) => to.includes('team-a@example.test')) && m.data.includes(`QA contact ${stamp}`));
  expect(team.to.join(' ')).toContain('team-b@example.test');
  expect(team.data).toMatch(new RegExp(`Reply-To: qa-visitor-${stamp}@example.test`, 'i'));
  expect(subjectOf(team)).toBe('New contact message — QA Mail Visitor');
  const copy = await waitForMail((m) => m.to.some((to) => to.includes(`qa-visitor-${stamp}@example.test`)));
  expect(subjectOf(copy)).toMatch(/^We received your message — /);
});

test('an unreachable mail server shows a clear error in Admin', async ({ browser }) => {
  // Point at a port nothing listens on: the test send fails and Admin explains why.
  expect((await admin.put('/api/v1/admin/settings/email', { data: { port: 2599 } })).status()).toBe(200);
  const page = await (await browser.newContext({ storageState: adminState })).newPage();
  await openEmailSettings(page);
  const test = page.locator('[data-email-test]');
  await test.getByLabel('Send to').fill('owner-check@example.test');
  await test.getByRole('button', { name: 'Send test email' }).click();
  await expect(test.locator('[data-email-test-error]')).toContainText(/Cannot reach the SMTP server/);
  await page.reload();
  await expect(page.getByText(/^Failed \d{4}/)).toBeVisible();
  // The password survives a change that keeps the same server and username.
  await expect(page.getByText('Stored (encrypted)')).toBeVisible();
  await page.context().close();
});
