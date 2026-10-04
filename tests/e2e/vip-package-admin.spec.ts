import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test, expect, request as requestFactory } from '@playwright/test';
import type { APIRequestContext, Locator, Page } from '@playwright/test';
import type { PackageChoice } from '@/lib/admin/events/vip-package';

test.skip(process.env.GALLERY_QA !== '1', 'Dedicated QA DB/Redis opt-in required.');
test.setTimeout(90_000);
test.use({ actionTimeout: 10_000 });
type PackageRow = PackageChoice & { description: string | null; capacity: number; includedBottleCount: number; packageBottles: Array<{ bottleOptionId: string }> };
type Snapshot = { event: { id: string }; packages: PackageRow[]; bottles: Array<{ id: string; name: string; enabled: boolean; mediaId: string | null }>; booths: unknown[] };
type Created = { eventId: string; packageId: string; alternativeId: string; foreignEventId: string; foreignPackageId: string; bottleIds: string[] };
type Inspection = { pkg: PackageRow; defaultPackageId: string | null; packageCount: number; bottles: Array<{ id: string; name: string }>; audits: Array<{ action: string; requestId: string }> };
let admin: APIRequestContext;
let viewer: APIRequestContext;
let state: Awaited<ReturnType<APIRequestContext['storageState']>>;
let snapshot: Snapshot;
let created: Created;
let baseline: Inspection;
const packageId = '00000000-0000-0000-0000-000000000001';
const bottleNames = ['Belvedere Vodka', 'Hennessy VS', 'El Jimador Tequila', 'Moët & Chandon', 'Jager', 'WAP Cranberry Peach'];
function fixture<T>(action: string, value: unknown = {}): T {
  const output = execFileSync('docker', ['compose', '-f', 'docker/compose.gallery-qa.yml', 'exec', '-T', '--env', 'QA_FIXTURE_ACTION=' + action, '--env', 'QA_FIXTURE_VALUE=' + JSON.stringify(value), 'app', 'node', '--input-type=module'], { input: readFileSync(path.resolve('tests/fixtures/vip-package-admin-qa.mjs')), encoding: 'utf8', timeout: 30_000 });
  return JSON.parse(output.trim()) as T;
}
const endpoint = () => '/api/v1/admin/events/' + created.eventId + '/vip';
const sortedIds = (row: PackageRow) => row.packageBottles.map((item) => item.bottleOptionId).sort();
const rowView = (page: Page) => page.locator('[data-resource-id="' + packageId + '"]');
async function getPackage(id = packageId): Promise<PackageRow> {
  const response = await admin.get(endpoint() + '/packages'); expect(response.status()).toBe(200);
  return (await response.json()).data.find((row: PackageRow) => row.id === id);
}
async function saveRow(page: Page, row: Locator) {
  const response = page.waitForResponse((result) => result.url().endsWith('/vip/packages/' + packageId) && result.request().method() === 'PATCH');
  await row.getByRole('button', { name: 'Save', exact: true }).click();
  expect((await response).status()).toBe(200);
  await expect(page.getByText('VIP package saved.', { exact: true }).last()).toBeVisible();
}
async function settingsSave(page: Page) {
  await page.getByRole('button', { name: 'Save settings', exact: true }).click();
  await expect(page.getByText('Event settings saved.', { exact: true }).last()).toBeVisible();
}
async function publicRequestOnly(page: Page) {
  await page.goto('/tables');
  await expect(page.getByText('$3,200', { exact: true }).first()).toBeVisible();
  await expect(page.locator('[data-vip-state="no-booths"]')).toBeVisible();
  await expect(page.locator('#club-map').getByRole('button', { name: /^Booth / })).toHaveCount(0);
  await page.goto('/book-now');
  await expect(page.locator('#booking-form form')).toBeVisible();
  await expect(page.locator('[data-vip-state="no-booths"]')).toBeVisible();
  await expect(page.getByText('This is a booking request, not a confirmed reservation.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Pay now|Continue to payment/ })).toHaveCount(0);
}
test.beforeAll(async ({ baseURL }) => {
  const target = new URL(baseURL!);
  if (!['localhost', '127.0.0.1'].includes(target.hostname) || target.port !== '43291') throw new Error('VIP package tests only target loopback:43291.');
  snapshot = fixture<Snapshot>('snapshot');
  created = fixture<Created>('setup');
  for (const role of ['admin', 'viewer']) {
    const client = await requestFactory.newContext({ baseURL });
    expect((await client.post('/api/v1/auth/login', { data: { email: 'qa-' + role + '@example.test', password: 'Gallery-QA-Only-2026!' } })).status()).toBe(200);
    const storageState = await client.storageState();
    const token = storageState.cookies.find((cookie) => cookie.name === 'destiny_csrf')!.value;
    await client.dispose();
    const authenticated = await requestFactory.newContext({ baseURL, storageState, extraHTTPHeaders: { 'x-csrf-token': token } });
    if (role === 'admin') { admin = authenticated; state = storageState; } else viewer = authenticated;
  }
  expect((await admin.patch(endpoint() + '/settings', { data: {} })).status()).toBe(200);
  baseline = fixture<Inspection>('inspect');
  expect(sortedIds(baseline.pkg)).toEqual(sortedIds(snapshot.packages.find((row) => row.id === packageId)!));
  expect(sortedIds(baseline.pkg)).toHaveLength(6);
});
test.afterAll(async () => {
  if (snapshot) {
    fixture('restore', { ...snapshot, created });
    if (admin && created) expect((await admin.patch(endpoint() + '/settings', { data: {} })).status()).toBe(200);
  }
  await Promise.all([admin?.dispose(), viewer?.dispose()]);
});

test('Admin toggles seeded BOOTH PACKAGE, persists default picker, and invalidates cached request-only pages', async ({ page, request }) => {
  await page.context().addCookies(state.cookies);
  // Prime both tagged public page reads with the genuine no-active-package state.
  for (const route of ['/tables', '/book-now']) {
    await page.goto(route); await expect(page.locator('[data-vip-state="no-active-package"]')).toBeVisible();
  }
  await page.goto('/admin/events/' + created.eventId + '/vip/packages');
  const row = rowView(page);
  await expect(row.getByLabel('Enabled', { exact: true })).not.toBeChecked();
  await expect(row.getByLabel(/^Price \(AUD dollars\)/)).toHaveValue('3200.00');
  await expect(row.getByLabel('Capacity', { exact: true })).toHaveValue('15');
  await row.getByLabel('Enabled', { exact: true }).check();
  let sent: Record<string, unknown> | undefined;
  page.on('request', (req) => { if (req.method() === 'PATCH' && req.url().endsWith('/vip/packages/' + packageId)) sent = req.postDataJSON(); });
  await saveRow(page, row); expect(sent).not.toHaveProperty('bottleOptionIds');
  await page.reload(); await expect(row.getByLabel('Enabled', { exact: true })).toBeChecked();
  const saved = await getPackage(); expect(saved).toMatchObject({ id: packageId, enabled: true, priceMinor: 320000, capacity: 15, includedBottleCount: 3 });
  expect(sortedIds(saved)).toEqual(sortedIds(baseline.pkg));
  expect(fixture<Inspection>('inspect').packageCount).toBe(baseline.packageCount);
  expect((await (await request.get('/api/v1/events/destiny/vip')).json()).data.packages.some((pkg: { id: string }) => pkg.id === packageId)).toBe(true);
  await publicRequestOnly(page);
  await page.goto('/admin/events/' + created.eventId + '/vip');
  const picker = page.getByRole('combobox', { name: 'Default package', exact: true });
  await expect(picker).toBeVisible();
  await expect(picker.locator('option[value="' + created.foreignPackageId + '"]')).toHaveCount(0);
  await picker.selectOption(packageId); await settingsSave(page);
  await page.reload(); await expect(picker).toHaveValue(packageId);
  await expect(page.getByRole('region', { name: 'VIP readiness', exact: true })).toContainText('Active package exists but no booths are configured.');
  expect(fixture<Inspection>('inspect').defaultPackageId).toBe(packageId);
  await page.screenshot({ path: 'test-results/vip-package-admin-default.jpg', type: 'jpeg', fullPage: true });
  await picker.selectOption(''); await settingsSave(page);
  await page.reload(); await expect(picker).toHaveValue('');
  expect(fixture<Inspection>('inspect').defaultPackageId).toBeNull();
  await picker.selectOption(packageId); await settingsSave(page);
  await page.reload(); await expect(picker).toHaveValue(packageId);
  await page.goto('/admin/events/' + created.eventId + '/vip/packages');
  await row.getByLabel('Enabled', { exact: true }).uncheck(); await saveRow(page, row);
  await page.reload(); await expect(row.getByLabel('Enabled', { exact: true })).not.toBeChecked();
  expect(sortedIds(await getPackage())).toEqual(sortedIds(baseline.pkg));
  // Another active package must not replace an explicitly disabled default.
  const alternate = await getPackage(created.alternativeId);
  expect((await admin.patch(endpoint() + '/packages/' + alternate.id, { data: { ...alternate, enabled: true } })).status()).toBe(200);
  await page.goto('/admin/events/' + created.eventId + '/vip');
  await expect(picker).toHaveValue(packageId);
  await expect(page.getByText(/The selected default package is disabled\. Enable it/)).toBeVisible();
  await page.goto('/tables'); await expect(page.locator('[data-vip-state="no-active-package"]')).toBeVisible();
  expect((await admin.patch(endpoint() + '/packages/' + alternate.id, { data: { ...alternate, enabled: false } })).status()).toBe(200);
  await page.goto('/admin/events/' + created.eventId + '/vip/packages');
  await row.getByLabel('Enabled', { exact: true }).check(); await saveRow(page, row);
  await publicRequestOnly(page);
});

test('visual package checklist persists exact bottle selection, preserves global bottles and shows images/status', async ({ page }) => {
  await page.context().addCookies(state.cookies);
  await page.goto('/admin/events/' + created.eventId + '/vip/packages');
  const row = rowView(page), choices = row.getByRole('group', { name: 'Package Bottle Options', exact: true });
  await expect(choices.getByRole('checkbox')).toHaveCount(6);
  for (const name of bottleNames) await expect(choices.getByRole('checkbox', { name: new RegExp(name) })).toBeChecked();
  const bottles = (await (await admin.get(endpoint() + '/bottles')).json()).data;
  for (const bottle of bottles) if (bottle.media) await expect(choices.locator('img[alt="' + (bottle.media.altText || bottle.name) + '"]')).toBeVisible();
  for (const name of bottleNames.slice(2)) await choices.getByRole('checkbox', { name: new RegExp(name) }).uncheck();
  await saveRow(page, row); await page.reload();
  const selectedIds = snapshot.bottles.filter((bottle) => bottleNames.slice(0, 2).includes(bottle.name)).map((bottle) => bottle.id).sort();
  expect(sortedIds(await getPackage())).toEqual(selectedIds);
  await expect(choices.getByRole('checkbox', { checked: true })).toHaveCount(2);
  for (const name of bottleNames) await choices.getByRole('checkbox', { name: new RegExp(name) }).check();
  await saveRow(page, row); await page.reload();
  await expect(choices.getByRole('checkbox', { checked: true })).toHaveCount(6);
  expect(sortedIds(await getPackage())).toEqual(sortedIds(baseline.pkg));
  expect(fixture<Inspection>('inspect').bottles).toEqual(baseline.bottles);
  await choices.scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/vip-package-admin-bottles.jpg', type: 'jpeg', fullPage: true });
  // An assigned but disabled global bottle is visibly marked and not offered to guests.
  const bottle = bottles.find((item: { name: string }) => item.name === bottleNames[0]);
  expect((await admin.patch(endpoint() + '/bottles/' + bottle.id, { data: { ...bottle, enabled: false } })).status()).toBe(200);
  await page.reload();
  await expect(choices.getByRole('checkbox', { name: /Belvedere Vodka Disabled/ })).toBeChecked();
  await page.goto('/book-now');
  await expect(page.getByRole('checkbox', { name: /Belvedere Vodka/ }).first()).toBeDisabled();
  expect((await admin.patch(endpoint() + '/bottles/' + bottle.id, { data: { ...bottle, enabled: true } })).status()).toBe(200);
  expect(sortedIds(await getPackage())).toEqual(sortedIds(baseline.pkg));
  expect(fixture<Inspection>('inspect').bottles).toEqual(baseline.bottles);
});

test('real validation errors expose fields/request ID, retain edits, and suppress repeated Save', async ({ page }) => {
  await page.context().addCookies(state.cookies);
  await page.goto('/admin/events/' + created.eventId + '/vip/packages');
  const row = rowView(page);
  const before = await getPackage();
  await row.getByLabel('Package Name', { exact: true }).fill('');
  await row.getByLabel(/^Price \(AUD dollars\)/).fill('3100.00');
  const failed = page.waitForResponse((response) => response.url().endsWith('/vip/packages/' + packageId) && response.request().method() === 'PATCH');
  await row.getByRole('button', { name: 'Save', exact: true }).click();
  const response = await failed; expect(response.status()).toBe(422);
  const error = (await response.json()).error;
  await expect(row.getByRole('alert')).toContainText(error.message);
  await expect(row.getByRole('alert')).toContainText(error.fieldErrors.name);
  await expect(row.getByRole('alert')).toContainText('Request ID: ' + error.requestId);
  await expect(row.getByLabel('Package Name', { exact: true })).toHaveValue('');
  await expect(row.getByLabel('Package Name', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  await expect(row.getByLabel(/^Price \(AUD dollars\)/)).toHaveValue('3100.00');
  expect(await getPackage()).toEqual(before);
  await row.scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/vip-package-admin-error.jpg', type: 'jpeg' });
  await row.getByLabel('Package Name', { exact: true }).fill('BOOTH PACKAGE');
  await row.getByLabel(/^Price \(AUD dollars\)/).fill('3200.00');
  let patches = 0;
  await page.route('**/vip/packages/' + packageId, async (route) => {
    if (route.request().method() === 'PATCH') { patches++; await new Promise((resolve) => setTimeout(resolve, 250)); }
    await route.continue();
  });
  await row.getByRole('button', { name: 'Save', exact: true }).dblclick();
  await expect(page.getByText('VIP package saved.', { exact: true }).last()).toBeVisible();
  expect(patches).toBe(1);
  await page.unroute('**/vip/packages/' + packageId);
  await page.reload(); await expect(row.getByLabel(/^Price \(AUD dollars\)/)).toHaveValue('3200.00');
  expect(fixture<Inspection>('inspect').packageCount).toBe(baseline.packageCount);
});

test('real API enforces RBAC/CSRF, scoped defaults, explicit relation updates and atomic validation failures', async ({ request, baseURL }) => {
  const url = endpoint() + '/packages/' + packageId;
  const before = await getPackage();
  expect((await viewer.get(endpoint() + '/packages')).status()).toBe(200);
  expect((await request.patch(url, { data: before })).status()).toBe(401);
  expect((await viewer.patch(url, { data: before })).status()).toBe(403);
  const noCsrf = await requestFactory.newContext({ baseURL, storageState: state });
  expect((await noCsrf.patch(url, { data: before })).status()).toBe(403);
  expect((await noCsrf.patch(url, { data: before, headers: { 'x-csrf-token': 'invalid' } })).status()).toBe(403);
  await noCsrf.dispose();
  expect((await admin.patch(url, { data: before, headers: { origin: 'https://untrusted.example.test' } })).status()).toBe(403);
  expect(await getPackage()).toEqual(before);
  for (const enabled of [false, true]) {
    expect((await admin.patch(url, { data: { ...before, enabled } })).status()).toBe(200);
    expect(await getPackage()).toMatchObject({ id: packageId, enabled, priceMinor: 320000, capacity: 15, includedBottleCount: 3 });
    expect(sortedIds(await getPackage())).toEqual(sortedIds(baseline.pkg));
  }
  const afterToggle = await getPackage();
  const invalid = await admin.patch(url, { data: { ...before, name: 'MUST NOT PERSIST', priceMinor: 1, bottleOptionIds: [randomUUID()] } });
  expect(invalid.status()).toBe(422); expect((await invalid.json()).error.fieldErrors.bottleOptionIds).toBeTruthy();
  expect(await getPackage()).toEqual(afterToggle);
  expect((await admin.patch(endpoint() + '/settings', { data: { defaultPackageId: packageId } })).status()).toBe(200);
  for (const badDefault of [randomUUID(), created.foreignPackageId]) {
    const result = await admin.patch(endpoint() + '/settings', { data: { defaultPackageId: badDefault } });
    expect(result.status()).toBe(422); expect((await result.json()).error.fieldErrors.defaultPackageId).toBeTruthy();
    expect(fixture<Inspection>('inspect').defaultPackageId).toBe(packageId);
  }
  expect((await admin.patch(endpoint() + '/packages/' + created.foreignPackageId, { data: before })).status()).toBe(404);
  const malformed = await admin.patch(endpoint() + '/packages/not-a-uuid', { data: before });
  expect(malformed.status()).toBe(422); expect((await malformed.json()).error.fieldErrors.id).toBeTruthy();
  const two = sortedIds(before).slice(0, 2);
  expect((await admin.patch(url, { data: { ...before, bottleOptionIds: two } })).status()).toBe(200);
  expect(sortedIds(await getPackage())).toEqual(two);
  expect((await admin.patch(url, { data: { ...before, bottleOptionIds: [two[0], two[0]] } })).status()).toBe(422);
  expect(sortedIds(await getPackage())).toEqual(two);
  expect((await admin.patch(url, { data: { ...before, bottleOptionIds: sortedIds(before) } })).status()).toBe(200);
  const after = fixture<Inspection>('inspect');
  expect(sortedIds(after.pkg)).toEqual(sortedIds(baseline.pkg));
  expect(after.bottles).toEqual(baseline.bottles); expect(after.packageCount).toBe(baseline.packageCount);
  expect(after.audits.some((audit) => audit.action === 'update' && Boolean(audit.requestId))).toBe(true);
});
