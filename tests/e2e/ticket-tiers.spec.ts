import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test, expect, request as requestFactory } from '@playwright/test';
import type { APIRequestContext, Browser, Page } from '@playwright/test';

test.skip(process.env.GALLERY_QA !== '1', 'Dedicated QA DB/Redis opt-in required.');
test.describe.configure({ mode: 'serial' });
test.setTimeout(120_000);
test.use({ actionTimeout: 10_000 });

type Setup = { eventId: string };
type Tier = { name: string; priceMinor: number; availabilityStatus: string; capacity: number | null; minQuantity: number; maxQuantity: number | null; badge: string | null; enabled: boolean };
type Tiers = { tiers: Tier[]; sale: { ticketSaleStart: string | null; ticketSaleEnd: string | null; ticketSaleStatus: string } };
let editorState: Awaited<ReturnType<APIRequestContext['storageState']>>;
let setup: Setup;
const slug = 'qa-multi-event';

function fixture<T>(action: string, value: unknown = {}): T {
  // Compose pins its own DB URL. Neither the caller nor a production env can override it.
  const output = execFileSync('docker', ['compose', '-f', 'docker/compose.gallery-qa.yml', 'exec', '-T', '--env', 'QA_FIXTURE_ACTION=' + action, '--env', 'QA_FIXTURE_VALUE=' + JSON.stringify(value), 'app', 'node', '--input-type=module'], { input: readFileSync(path.resolve('tests/fixtures/event-content-qa.mjs')), encoding: 'utf8', timeout: 30_000 });
  return JSON.parse(output.trim()) as T;
}
async function editorPage(browser: Browser): Promise<Page> {
  return (await browser.newContext({ storageState: editorState })).newPage();
}
const tierCard = (page: Page, name: string) => page.locator('article').filter({ has: page.locator(`input[value="${name}"]`) });

test.beforeAll(async ({ baseURL }) => {
  const target = new URL(baseURL!);
  if (!['localhost', '127.0.0.1'].includes(target.hostname) || target.port !== '43291') throw new Error('Ticket tier tests only target loopback:43291.');
  setup = fixture<Setup>('setup');
  // An editor (events.edit, not admin) is who maintains ticket tiers day to day.
  const client = await requestFactory.newContext({ baseURL });
  expect((await client.post('/api/v1/auth/login', { data: { email: 'qa-editor@example.test', password: 'Gallery-QA-Only-2026!' } })).status()).toBe(200);
  editorState = await client.storageState();
  await client.dispose();
  // The public tickets page needs published ticket content for this event.
  const token = editorState.cookies.find((cookie) => cookie.name === 'destiny_csrf')!.value;
  const api = await requestFactory.newContext({ baseURL, storageState: editorState, extraHTTPHeaders: { 'x-csrf-token': token } });
  const draft = (await (await api.get('/api/v1/admin/page-content/tickets:' + setup.eventId)).json()).data.data;
  expect((await api.patch('/api/v1/admin/page-content/tickets:' + setup.eventId, { data: { data: draft, status: 'PUBLISHED', locale: 'en' } })).status()).toBe(200);
  await api.dispose();
});
test.afterAll(() => { fixture('cleanup'); });

test('editor adds a ticket tier in dollars with labelled options; mistakes show field errors, not "Something went wrong"', async ({ browser, page }) => {
  const admin = await editorPage(browser);
  await admin.goto('/admin/events/' + setup.eventId + '/tickets/tiers');
  const existing = tierCard(admin, 'QA Multi General');
  await expect(existing.getByLabel('Price (AUD) *')).toHaveValue('45.00');
  await expect(existing.getByLabel('Availability')).toHaveValue('AVAILABLE');
  await expect(existing.getByText('Shown as AUD 45.00.')).toBeVisible();

  await admin.getByRole('button', { name: 'Add tier' }).click();
  const card = admin.locator('article').last();
  await card.getByLabel('Tier name *').fill('Early Bird');
  await card.getByLabel('Badge (optional)').fill('Best value');
  await card.getByLabel('Price (AUD) *').fill('$99');
  await expect(card.getByText('Not a valid amount. Use dollars and cents, e.g. 45.00.')).toBeVisible();
  await card.getByLabel('Minimum per order').fill('4');
  await card.getByLabel('Maximum per order (optional)').fill('2');
  const rejected = admin.waitForResponse((response) => response.url().endsWith('/tickets/tiers') && response.request().method() === 'POST');
  await card.getByRole('button', { name: 'Save', exact: true }).click();
  expect((await rejected).status()).toBe(422);
  await expect(card.getByText('Enter the price in dollars, e.g. 45.00.', { exact: true })).toBeVisible();
  await expect(card.getByText('Some ticket tier fields need attention.')).toBeVisible();
  await expect(card.getByText(/priceMinor/)).toHaveCount(0);
  await expect(admin.getByText('Something went wrong.')).toHaveCount(0);
  expect(fixture<Tiers>('tiers').tiers.map((tier) => tier.name)).toEqual(['QA Multi General']);

  // Cross-field checks run once the basic fields are valid.
  await card.getByLabel('Price (AUD) *').fill('99');
  await expect(card.getByText('Shown as AUD 99.00.')).toBeVisible();
  const quantities = admin.waitForResponse((response) => response.url().endsWith('/tickets/tiers') && response.request().method() === 'POST');
  await card.getByRole('button', { name: 'Save', exact: true }).click();
  expect((await quantities).status()).toBe(422);
  await expect(card.getByText('Maximum per order cannot be below the minimum.', { exact: true })).toBeVisible();

  await card.getByLabel('Maximum per order (optional)').fill('6');
  await card.getByLabel('Availability').selectOption({ label: 'On request' });
  await card.getByLabel('Capacity (optional)').fill('150');
  const created = admin.waitForResponse((response) => response.url().endsWith('/tickets/tiers') && response.request().method() === 'POST');
  await card.getByRole('button', { name: 'Save', exact: true }).click();
  expect((await created).status()).toBe(201);

  await admin.reload();
  const saved = tierCard(admin, 'Early Bird');
  await expect(saved.getByLabel('Price (AUD) *')).toHaveValue('99.00');
  await expect(saved.getByLabel('Availability')).toHaveValue('ON_REQUEST');
  await expect(saved.getByLabel('Capacity (optional)')).toHaveValue('150');
  await expect(saved.getByLabel('Badge (optional)')).toHaveValue('Best value');
  await admin.context().close();
  expect(fixture<Tiers>('tiers').tiers).toContainEqual(expect.objectContaining({ name: 'Early Bird', priceMinor: 9900, availabilityStatus: 'ON_REQUEST', capacity: 150, minQuantity: 4, maxQuantity: 6, badge: 'Best value', enabled: true }));

  await page.goto('/tickets?event=' + slug);
  await expect(page.getByText('Early Bird', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('$99', { exact: false }).first()).toBeVisible();
});

test('editor sets the sale window in local time; it reloads and a reversed window is refused on the field', async ({ browser }) => {
  const admin = await editorPage(browser);
  await admin.goto('/admin/events/' + setup.eventId + '/tickets');
  await expect(admin.getByLabel('Sale status')).toHaveValue('COMING_SOON');
  await expect(admin.getByLabel('Sale status').locator('option:checked')).toHaveText('Coming soon');
  await admin.getByLabel('Sale opens (your local time)').fill('2026-11-01T20:30');
  await admin.getByLabel('Sale closes (your local time)').fill('2026-11-01T18:00');
  await admin.getByRole('button', { name: 'Save settings' }).click();
  await expect(admin.getByText('Sale end must be after sale start.')).toBeVisible();
  expect(fixture<Tiers>('tiers').sale.ticketSaleStart).toBeNull();

  await admin.getByLabel('Sale closes (your local time)').fill('2026-11-02T02:00');
  await admin.getByRole('button', { name: 'Save settings' }).click();
  await expect(admin.getByText('Event settings saved.').last()).toBeVisible();
  await admin.reload();
  await expect(admin.getByLabel('Sale opens (your local time)')).toHaveValue('2026-11-01T20:30');
  await expect(admin.getByLabel('Sale closes (your local time)')).toHaveValue('2026-11-02T02:00');
  const sale = fixture<Tiers>('tiers').sale;
  expect(new Date(sale.ticketSaleStart!).getTime()).toBe(new Date('2026-11-01T20:30').getTime());
  await admin.context().close();
});
