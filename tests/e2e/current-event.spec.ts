import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test, expect, request as requestFactory } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';

test.skip(process.env.GALLERY_QA !== '1', 'Dedicated QA DB/Redis opt-in required.');
test.describe.configure({ mode: 'serial' });
test.setTimeout(120_000);
test.use({ actionTimeout: 15_000 });

const PROVIDER_URL = 'https://ticketscandy.com/e/qa-current-test';
let ids: Record<string, string>;
let editor: APIRequestContext;
let editorState: Awaited<ReturnType<APIRequestContext['storageState']>>;
let originalHome: Record<string, unknown>;

function fixture<T>(action: string): T {
  // Compose pins its own DB URL. Neither the caller nor a production env can override it.
  const output = execFileSync('docker', ['compose', '-f', 'docker/compose.gallery-qa.yml', 'exec', '-T', '--env', 'QA_FIXTURE_ACTION=' + action, 'app', 'node', '--input-type=module'], { input: readFileSync(path.resolve('tests/fixtures/current-event-qa.mjs')), encoding: 'utf8', timeout: 30_000 });
  return JSON.parse(output.trim()) as T;
}
async function setCurrentEvent(eventId: string) {
  const current = (await (await editor.get('/api/v1/admin/content/home')).json()).data;
  expect((await editor.put('/api/v1/admin/content/home', { data: { ...current, hero: { ...current.hero, eventId } } })).status()).toBe(200);
}

test.beforeAll(async ({ baseURL }) => {
  const target = new URL(baseURL!);
  if (!['localhost', '127.0.0.1'].includes(target.hostname) || target.port !== '43291') throw new Error('Current event tests only target loopback:43291.');
  ids = fixture<Record<string, string>>('setup');
  const client = await requestFactory.newContext({ baseURL });
  expect((await client.post('/api/v1/auth/login', { data: { email: 'qa-editor@example.test', password: 'Gallery-QA-Only-2026!' } })).status()).toBe(200);
  editorState = await client.storageState();
  await client.dispose();
  const token = editorState.cookies.find((cookie) => cookie.name === 'destiny_csrf')!.value;
  editor = await requestFactory.newContext({ baseURL, storageState: editorState, extraHTTPHeaders: { 'x-csrf-token': token } });
  originalHome = (await (await editor.get('/api/v1/admin/content/home')).json()).data;
});
test.afterAll(async () => {
  if (originalHome) expect((await editor.put('/api/v1/admin/content/home', { data: originalHome })).status()).toBe(200);
  fixture('cleanup');
  await editor?.dispose();
});

test('Admin › Homepage › Current event drives the homepage, /tickets and /event', async ({ browser, page, request }) => {
  const admin = await (await browser.newContext({ storageState: editorState })).newPage();
  await admin.goto('/admin/content/home');
  const select = admin.getByRole('combobox', { name: /Current event/ });
  await select.selectOption(ids['qa-current']);
  await admin.getByRole('button', { name: 'Save Changes', exact: true }).click();
  await expect.poll(async () => (await (await editor.get('/api/v1/admin/content/home')).json()).data.hero?.eventId).toBe(ids['qa-current']);
  await admin.context().close();

  await page.goto('/');
  await expect(page.locator('h1').first()).toHaveText('QA Current Event');
  // Sold only through TicketsCandy: the homepage tickets block links straight there.
  const homeBuy = page.locator('[data-ticket-provider]').getByRole('link', { name: /Buy tickets on TicketsCandy/ });
  await expect(homeBuy).toHaveAttribute('href', PROVIDER_URL);
  await expect(homeBuy).toHaveAttribute('target', '_blank');

  await page.goto('/tickets');
  const ticketsBuy = page.getByTestId('ticket-provider-only').getByRole('link', { name: /Buy tickets on TicketsCandy/ });
  await expect(ticketsBuy).toHaveAttribute('href', PROVIDER_URL);
  await expect(page.getByText('Ticket information is being prepared.')).toHaveCount(0);

  const redirect = await request.get('/event', { maxRedirects: 0 });
  expect(redirect.status()).toBe(307);
  // Relative, so the proxy never leaks the container's internal address.
  expect(redirect.headers().location).toBe('/events/qa-current');
  expect((await request.get('/event?from=menu', { maxRedirects: 0 })).headers().location).toBe('/events/qa-current?from=menu');

  // DESTINY itself is still reachable on its own pages.
  expect((await request.get('/tickets?event=destiny')).status()).toBe(200);
});

test('two ways to buy: direct checkout on this site and the TicketsCandy link side by side', async ({ page }) => {
  fixture('add-direct-tier');
  await setCurrentEvent(ids['qa-current']);
  await page.goto('/');
  // Hero: the main button stays on our tickets page, the seller is a second option.
  await expect(page.getByRole('link', { name: /View Ticket Details/ }).first()).toHaveAttribute('href', '/tickets');
  await expect(page.locator('[data-hero-provider]')).toHaveAttribute('href', PROVIDER_URL);
  await expect(page.locator('[data-ticket-provider]')).toContainText('Buy below on this site, or get the same tickets through TicketsCandy.');

  await page.goto('/tickets');
  const option = page.locator('[data-provider-option]').getByRole('link', { name: /Buy on TicketsCandy/ });
  await expect(option).toHaveAttribute('href', PROVIDER_URL);
  await expect(option).toHaveAttribute('target', '_blank');
  await page.getByRole('button', { name: 'Increase quantity for QA Direct General' }).click();
  // Direct checkout appears and the third-party option stays available.
  await expect(page.getByRole('button', { name: 'Continue to secure payment' })).toBeVisible();
  await expect(option).toBeVisible();
});

test('past events (marked Past, or whose date is over) move below the upcoming list', async ({ page, request }) => {
  const upcoming = ((await (await request.get('/api/v1/events')).json()).data as Array<{ slug: string }>).map((e) => e.slug);
  expect(upcoming).toContain('qa-current');
  expect(upcoming).not.toContain('qa-past');
  expect(upcoming).not.toContain('qa-auto-past');
  const past = ((await (await request.get('/api/v1/events/past')).json()).data as Array<{ slug: string }>).map((e) => e.slug);
  // Most recent first.
  expect(past.indexOf('qa-auto-past')).toBeGreaterThanOrEqual(0);
  expect(past.indexOf('qa-auto-past')).toBeLessThan(past.indexOf('qa-past'));

  await page.goto('/events');
  const teaser = page.locator('[data-past-events]');
  await expect(teaser).toBeVisible();
  await expect(teaser).toContainText('QA Auto Past Event');
  await expect(teaser).toContainText('QA Past Event');
  await expect(teaser.getByRole('link', { name: /View all past events/ })).toHaveAttribute('href', '/events/past');
  // The past section sits below the upcoming events.
  const order = await page.evaluate(() => {
    const teaserTop = document.querySelector('[data-past-events]')!.getBoundingClientRect().top;
    const upcomingCard = [...document.querySelectorAll('a[href="/events/qa-current"]')].map((a) => a.getBoundingClientRect().top).filter((top) => top < teaserTop);
    return upcomingCard.length > 0;
  });
  expect(order).toBe(true);
  // A past card still opens that event's page.
  await expect(teaser.locator('a[href="/events/qa-past"]').first()).toBeVisible();

  await page.goto('/events/past');
  await expect(page.getByText('QA Past Event').first()).toBeVisible();
});

test('choosing a past event as current is ignored; clearing it falls back to the next upcoming event', async ({ page }) => {
  await setCurrentEvent(ids['qa-past']);
  await page.goto('/');
  await expect(page.locator('h1').first()).not.toHaveText('QA Past Event');

  await setCurrentEvent('');
  await page.goto('/');
  // Nothing chosen: the next dated upcoming event wins over undated DESTINY.
  await expect(page.locator('h1').first()).toHaveText('QA Current Event');
});
