import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test, expect, request as requestFactory } from '@playwright/test';
import type { APIRequestContext, Browser, Page } from '@playwright/test';

test.skip(process.env.GALLERY_QA !== '1', 'Dedicated QA DB/Redis opt-in required.');
test.describe.configure({ mode: 'serial' });
test.setTimeout(120_000);
test.use({ actionTimeout: 10_000 });

const SLUG = 'qa-setup-status';
let eventId: string;
let editorState: Awaited<ReturnType<APIRequestContext['storageState']>>;

function fixture<T>(action: string): T {
  // Compose pins its own DB URL. Neither the caller nor a production env can override it.
  const output = execFileSync('docker', ['compose', '-f', 'docker/compose.gallery-qa.yml', 'exec', '-T', '--env', 'QA_FIXTURE_ACTION=' + action, 'app', 'node', '--input-type=module'], { input: readFileSync(path.resolve('tests/fixtures/setup-status-qa.mjs')), encoding: 'utf8', timeout: 30_000 });
  return JSON.parse(output.trim()) as T;
}
async function signedIn(browser: Browser): Promise<Page> {
  return (await browser.newContext({ storageState: editorState })).newPage();
}

test.beforeAll(async ({ baseURL }) => {
  const target = new URL(baseURL!);
  if (!['localhost', '127.0.0.1'].includes(target.hostname) || target.port !== '43291') throw new Error('Setup status tests only target loopback:43291.');
  eventId = fixture<{ eventId: string }>('setup').eventId;
  const client = await requestFactory.newContext({ baseURL });
  // The editor can view events; it keeps the qa-admin login budget for the other suites.
  expect((await client.post('/api/v1/auth/login', { data: { email: 'qa-editor@example.test', password: 'Gallery-QA-Only-2026!' } })).status()).toBe(200);
  editorState = await client.storageState();
  await client.dispose();
});
test.afterAll(() => { fixture('cleanup'); });

test('Ticketing lists each event with what visitors see and a button to the missing step', async ({ browser }) => {
  const page = await signedIn(browser);
  await page.goto('/admin/ticketing');
  const card = page.locator(`[data-event-card="${SLUG}"]`);
  await expect(card.locator('[data-setup-badge="not-live"]')).toHaveText('Not showing yet');
  await expect(card).toContainText('Not showing yet — No ticket tiers are enabled');
  await expect(card).toContainText('The Tickets page says "Ticket information is being prepared."');
  // Passing checks are summarised on one line.
  await expect(card).toContainText('Event is published · Tickets page content is published');
  await card.getByRole('link', { name: 'Add ticket tier', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/admin/events/${eventId}/tickets/tiers$`));

  // The default event's badge agrees with what its public Tickets page shows right now.
  await page.goto('/tickets');
  const publicEmpty = await page.getByTestId('ticket-empty-state').count() > 0;
  await page.goto('/admin/ticketing');
  await expect(page.locator('[data-event-card="destiny"] [data-setup-badge]')).toHaveAttribute('data-setup-badge', publicEmpty ? 'not-live' : 'live');
  await page.context().close();
});

test('VIP / Tables explains "VIP package details are being prepared" and links to VIP Packages', async ({ browser }) => {
  const page = await signedIn(browser);
  await page.goto('/admin/vip');
  const card = page.locator(`[data-event-card="${SLUG}"]`);
  await expect(card).toContainText('Not showing yet — No VIP package is enabled');
  await expect(card).toContainText('VIP package details are being prepared.');
  await expect(card.getByRole('link', { name: 'Add VIP package', exact: true })).toHaveAttribute('href', `/admin/events/${eventId}/vip/packages`);
  // The settings page shows the same checklist, with the technical facts folded away.
  await page.goto(`/admin/events/${eventId}/vip`);
  const readiness = page.getByRole('region', { name: 'VIP readiness', exact: true });
  await expect(readiness.locator('[data-setup-check="packages"][data-level="blocking"]')).toBeVisible();
  await expect(readiness.getByText('Technical details')).toBeVisible();
  await page.context().close();
});

test('signed-in admins get a "fix in Admin" link on the empty public pages; visitors do not', async ({ browser }) => {
  const admin = await signedIn(browser);
  await admin.goto(`/tickets?event=${SLUG}`);
  const empty = admin.getByTestId('ticket-empty-state');
  await expect(empty).toContainText('Ticket information is being prepared.');
  await expect(empty.getByRole('link', { name: 'Add ticket tiers in Admin' })).toHaveAttribute('href', `/admin/events/${eventId}/tickets/tiers`);
  await expect(empty).toContainText('Only visible to you because you are signed in to Admin.');

  await admin.goto(`/tables?event=${SLUG}`);
  await expect(admin.locator('[data-vip-state="no-active-package"]')).toContainText('VIP package details are being prepared.');
  await expect(admin.getByRole('link', { name: 'Add a VIP package in Admin' })).toHaveAttribute('href', `/admin/events/${eventId}/vip/packages`);
  await admin.context().close();

  const visitor = await (await browser.newContext()).newPage();
  const sessionCalls: string[] = [];
  visitor.on('request', (request) => { if (request.url().includes('/api/v1/auth/session')) sessionCalls.push(request.url()); });
  for (const url of [`/tickets?event=${SLUG}`, `/tables?event=${SLUG}`]) {
    await visitor.goto(url);
    await expect(visitor.getByText(/being prepared/).first()).toBeVisible();
    await expect(visitor.locator('[data-admin-fix-link]')).toHaveCount(0);
  }
  // Visitors without the admin cookie never ask the server about a session.
  expect(sessionCalls).toEqual([]);
  await visitor.context().close();
});

test('adding a tier turns the Ticketing status to "Live on site"', async ({ browser }) => {
  fixture('add-tier');
  const page = await signedIn(browser);
  await page.goto('/admin/ticketing');
  const card = page.locator(`[data-event-card="${SLUG}"]`);
  await expect(card.locator('[data-setup-badge="live"]')).toHaveText('Live on site');
  await expect(card).toContainText('Showing ticket options on the site');
  await expect(card).toContainText('1 ticket tier enabled');
  await page.context().close();
});
