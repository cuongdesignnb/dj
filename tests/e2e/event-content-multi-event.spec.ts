import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test, expect, request as requestFactory } from '@playwright/test';
import type { APIRequestContext, Browser, Page } from '@playwright/test';

test.skip(process.env.GALLERY_QA !== '1', 'Dedicated QA DB/Redis opt-in required.');
test.describe.configure({ mode: 'serial' });
test.setTimeout(120_000);
test.use({ actionTimeout: 10_000 });

type Setup = { eventId: string; packageId: string };
type Content = { rows: Array<{ key: string; status: string; translations: Array<{ locale: string; contentJson: Record<string, unknown> }> }>; audits: Array<{ action: string }> };
let admin: APIRequestContext;
let viewer: APIRequestContext;
let adminState: Awaited<ReturnType<APIRequestContext['storageState']>>;
let setup: Setup;
const slug = 'qa-multi-event';
const title = 'QA Multi Event';
const email = 'qa-multi-' + randomUUID().slice(0, 8) + '@example.test';

function fixture<T>(action: string, value: unknown = {}): T {
  // Compose pins its own DB URL. Neither the caller nor a production env can override it.
  const output = execFileSync('docker', ['compose', '-f', 'docker/compose.gallery-qa.yml', 'exec', '-T', '--env', 'QA_FIXTURE_ACTION=' + action, '--env', 'QA_FIXTURE_VALUE=' + JSON.stringify(value), 'app', 'node', '--input-type=module'], { input: readFileSync(path.resolve('tests/fixtures/event-content-qa.mjs')), encoding: 'utf8', timeout: 30_000 });
  return JSON.parse(output.trim()) as T;
}
async function login(baseURL: string, role: 'admin' | 'viewer') {
  const client = await requestFactory.newContext({ baseURL });
  expect((await client.post('/api/v1/auth/login', { data: { email: 'qa-' + role + '@example.test', password: 'Gallery-QA-Only-2026!' } })).status()).toBe(200);
  const storageState = await client.storageState();
  const token = storageState.cookies.find((cookie) => cookie.name === 'destiny_csrf')!.value;
  await client.dispose();
  return { storageState, context: await requestFactory.newContext({ baseURL, storageState, extraHTTPHeaders: { 'x-csrf-token': token } }) };
}
async function adminPage(browser: Browser): Promise<Page> {
  return (await browser.newContext({ storageState: adminState })).newPage();
}
async function publishFromEditor(page: Page, adminPath: string, expectedEyebrow: string) {
  await page.goto(adminPath);
  await expect(page.getByText('This event has no saved content for this page yet.', { exact: false })).toBeVisible();
  await expect(page.getByText(/Not saved yet/i)).toBeVisible();
  await expect(page.locator('#cms-hero-eyebrow')).toHaveValue(expectedEyebrow);
  const saved = page.waitForResponse((response) => response.url().includes('/api/v1/admin/page-content/') && response.request().method() === 'PATCH');
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  expect((await saved).status()).toBe(200);
  await expect(page.getByText('Published page content.', { exact: true }).last()).toBeVisible();
  await page.reload();
  await expect(page.getByText(/Key: .* · PUBLISHED/)).toBeVisible();
  await expect(page.getByText('This event has no saved content for this page yet.', { exact: false })).toHaveCount(0);
}

test.beforeAll(async ({ baseURL }) => {
  const target = new URL(baseURL!);
  if (!['localhost', '127.0.0.1'].includes(target.hostname) || target.port !== '43291') throw new Error('Event content tests only target loopback:43291.');
  setup = fixture<Setup>('setup');
  const adminLogin = await login(baseURL!, 'admin');
  admin = adminLogin.context; adminState = adminLogin.storageState;
  viewer = (await login(baseURL!, 'viewer')).context;
  // Fixture writes bypass the API; flush the public event caches the same way an admin save would.
  expect((await admin.patch('/api/v1/admin/events/' + setup.eventId + '/vip/settings', { data: {} })).status()).toBe(200);
});
test.afterAll(async () => {
  fixture('cleanup');
  await admin?.dispose();
  await viewer?.dispose();
});

test('A: admin editors start from an event draft for an event created after seeding, and save it to the DB', async ({ browser, page }) => {
  for (const kind of ['tickets', 'tables', 'booking']) {
    const response = await admin.get('/api/v1/admin/page-content/' + kind + ':' + setup.eventId);
    expect(response.status()).toBe(200);
    expect((await response.json()).data).toMatchObject({ id: null, status: 'MISSING', persisted: false });
  }
  expect(fixture<Content>('content').rows).toHaveLength(0);

  // Not published yet: the public page explains it instead of an outage message.
  await page.goto('/tickets?event=' + slug);
  await expect(page.getByText('Ticket information for this event has not been published yet.', { exact: true })).toBeVisible();

  const editor = await adminPage(browser);
  await publishFromEditor(editor, '/admin/events/' + setup.eventId + '/tickets/content', title);
  await publishFromEditor(editor, '/admin/events/' + setup.eventId + '/vip/tables-content', title);
  await publishFromEditor(editor, '/admin/events/' + setup.eventId + '/vip/booking-content', title);
  await editor.context().close();

  const content = fixture<Content>('content');
  expect(content.rows.map((row) => [row.key.split(':')[0], row.status]).sort()).toEqual([['booking', 'PUBLISHED'], ['tables', 'PUBLISHED'], ['tickets', 'PUBLISHED']]);
  expect(content.rows.every((row) => row.translations.some((item) => item.locale === 'en'))).toBe(true);
  expect(content.audits.filter((audit) => audit.action === 'create')).toHaveLength(3);
  const tickets = await admin.get('/api/v1/admin/page-content/tickets:' + setup.eventId);
  expect((await tickets.json()).data).toMatchObject({ status: 'PUBLISHED', persisted: true });

  // A viewer can read but never save.
  const read = await viewer.get('/api/v1/admin/page-content/tickets:' + setup.eventId);
  expect(read.status()).toBe(200);
  expect((await viewer.patch('/api/v1/admin/page-content/tickets:' + setup.eventId, { data: { data: (await read.json()).data.data, status: 'DRAFT' } })).status()).toBe(403);
});

test('A: unknown events can neither be drafted nor created', async () => {
  const ghost = randomUUID();
  const read = await admin.get('/api/v1/admin/page-content/tickets:' + ghost);
  expect(read.status()).toBe(404);
  expect((await read.json()).error.message).toBe('Event not found.');
  const draft = (await (await admin.get('/api/v1/admin/page-content/tickets:' + setup.eventId)).json()).data.data;
  expect((await admin.patch('/api/v1/admin/page-content/tickets:' + ghost, { data: { data: draft, status: 'PUBLISHED' } })).status()).toBe(404);
  expect(fixture<{ count: number }>('count-content', { key: 'tickets:' + ghost }).count).toBe(0);
});

test('B: /tickets, /tables and /book-now serve the chosen event; the default event is unchanged', async ({ page }) => {
  await page.goto('/tickets?event=' + slug);
  await expect(page).toHaveTitle(new RegExp('^' + title + ' Tickets \| '));
  await expect(page.getByText('QA Multi General', { exact: true }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByText('QA Multi General', { exact: true }).first()).toBeVisible();

  await page.goto('/tickets');
  await expect(page).not.toHaveTitle(new RegExp(title));
  await expect(page.getByText('QA Multi General', { exact: true })).toHaveCount(0);

  await page.goto('/tables?event=' + slug);
  await expect(page).toHaveTitle(new RegExp('^' + title + ' VIP Tables \| '));
  await expect(page.getByText('$1,500', { exact: true }).first()).toBeVisible();
  await expect(page.locator('a[href^="/book-now?event=' + slug + '"]').first()).toBeVisible();

  await page.goto('/tables');
  await expect(page).not.toHaveTitle(new RegExp(title));

  await page.goto('/book-now?event=' + slug);
  await expect(page.locator('#booking-form form')).toBeVisible();
  await expect(page.getByRole('group', { name: 'Choose an experience' }).getByRole('link')).toHaveAttribute('href', '/tickets?event=' + slug);
});

test('B: a booking request from /book-now?event= is stored against that event', async ({ page }) => {
  await page.goto('/book-now?event=' + slug);
  await expect(page.locator('#booking-form form')).toBeVisible();
  await page.locator('input[name="fullName"]').fill('QA Multi Guest');
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="phone"]').fill('+61000000000');
  const received = page.waitForResponse((response) => response.url().endsWith('/api/v1/booking-requests') && response.request().method() === 'POST');
  await page.locator('#booking-form button[type="submit"]').click();
  const response = await received;
  expect(response.status()).toBe(202);
  await expect(page.getByText('Request received', { exact: true })).toBeVisible();
  expect(fixture<{ requests: unknown[] }>('bookings', { email }).requests).toEqual([{ eventId: setup.eventId, status: 'RECEIVED', vipPackageId: setup.packageId }]);
});

test('B: the event page links stay on its event; destiny keeps its plain links', async ({ page }) => {
  await page.goto('/events/' + slug);
  await expect(page.locator('header a[href="/tickets?event=' + slug + '"]').first()).toBeVisible();
  await expect(page.locator('a[href="/tables?event=' + slug + '"]').first()).toBeAttached();
  await expect(page.locator('a[href="/book-now?event=' + slug + '"]').first()).toBeAttached();
  await expect(page.locator('footer a[href="/events/' + slug + '"]').first()).toBeAttached();

  await page.goto('/events/destiny');
  await expect(page.locator('header a[href="/tickets"]').first()).toBeVisible();
  await expect(page.locator('a[href^="/tickets?event="], a[href^="/tables?event="], a[href^="/book-now?event="]')).toHaveCount(0);
});

test('B: malformed or unknown event slugs render not-found, never another event', async ({ page }) => {
  // These routes stream (loading.tsx), so Next.js answers notFound() with HTTP 200 plus
  // noindex and the not-found UI, exactly like /events/<unknown> already does.
  for (const route of ['/tickets', '/tables', '/book-now']) {
    for (const query of ['?event=no-such-event-qa', '?event=..%2Fadmin']) {
      const response = await page.goto(route + query);
      expect(response!.status(), route + query).toBeLessThan(500);
      await expect(page.getByText(/could not be found/i).first(), route + query).toBeVisible();
      await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute('content', /noindex/);
      await expect(page).not.toHaveTitle(/DESTINY|QA Multi Event/);
    }
    expect((await page.goto(route + '?event=destiny'))!.status(), route).toBeLessThan(500);
  }
});

test('Admin readiness shows the public page and flags unpublished tickets content', async ({ browser }) => {
  const readiness = await (await admin.get('/api/v1/admin/events/' + setup.eventId + '/tickets/readiness')).json();
  expect(readiness.data.facts['Public page']).toBe('/tickets?event=' + slug);
  expect(readiness.data.facts['Tickets content']).toBe('PUBLISHED');
  const vip = await (await admin.get('/api/v1/admin/events/' + setup.eventId + '/vip/readiness')).json();
  expect(vip.data.facts['Public pages']).toBe('/tables?event=' + slug + ' · /book-now?event=' + slug);
  const page = await adminPage(browser);
  await page.goto('/admin/events/' + setup.eventId + '/tickets');
  await expect(page.getByText('/tickets?event=' + slug, { exact: true })).toBeVisible();
  await page.context().close();
});
