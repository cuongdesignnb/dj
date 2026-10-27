import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { test, expect, request as requestFactory } from '@playwright/test';
import type { APIRequestContext, Page } from '@playwright/test';

test.skip(process.env.GALLERY_QA !== '1', 'Explicit isolated QA opt-in required.');
test.setTimeout(120_000);
test.use({ actionTimeout: 10_000 });
type Snapshot = { event: { id: string; status: string; vipEnabled: boolean; vipBookingEnabled: boolean }; packages: unknown[]; booths: unknown[]; tiers: unknown[] };
type Cms = { status: string; locale: string; data: { sections?: Array<{ key: string; title: string; description?: string; enabled?: boolean }>; [key: string]: unknown }; seo: Record<string, unknown> };
type Asset = { id: string; kind: string };
type Album = { id: string; slug: string; title: string; media: Array<{ caption: string; image: { alt: string } }> };
let admin: APIRequestContext;
let cookies: Awaited<ReturnType<APIRequestContext['storageState']>>['cookies'];
let snapshot: Snapshot;
let cms: Cms;
let locations: Array<{ locationKey: string; menuId: string | null }>;
let menuId: string;
let linkedEventId: string;
const albums: Array<{ id: string; slug: string; title: string; count: number }> = [];
const prefix = 'qa-uat-' + randomUUID().slice(0, 8);
function fixture<T>(action: string, value: unknown = {}): T {
  // Compose pins its own DB URL. Neither the caller nor a production env can override it.
  const output = execFileSync('docker', ['compose', '-f', 'docker/compose.gallery-qa.yml', 'exec', '-T', '--env', 'QA_FIXTURE_ACTION=' + action, '--env', 'QA_FIXTURE_VALUE=' + JSON.stringify(value), 'app', 'node', '--input-type=module'], { input: readFileSync(path.resolve('tests/fixtures/post-gallery-qa.mjs')), encoding: 'utf8', timeout: 30_000 });
  return JSON.parse(output.trim()) as T;
}
async function invalidate(eventId = snapshot.event.id) {
  expect((await admin.patch('/api/v1/admin/events/' + eventId + '/vip/settings', { data: {} })).status()).toBe(200);
}
async function setState(mode: string) { fixture('state', { mode }); await invalidate(); }
const primary = (page: Page) => page.getByRole('navigation', { name: 'Primary', exact: true });

test.beforeAll(async ({ baseURL }) => {
  const target = new URL(baseURL!);
  if (!['127.0.0.1', 'localhost'].includes(target.hostname) || target.port !== '43291') throw new Error('Post-Gallery UAT only targets loopback:43291');
  snapshot = fixture<Snapshot>('snapshot');
  const client = await requestFactory.newContext({ baseURL });
  const login = await client.post('/api/v1/auth/login', { data: { email: 'qa-admin@example.test', password: 'Gallery-QA-Only-2026!' } });
  expect(login.status()).toBe(200);
  const storage = await client.storageState(); cookies = storage.cookies;
  const token = cookies.find((cookie) => cookie.name === 'destiny_csrf')!.value;
  await client.dispose();
  admin = await requestFactory.newContext({ baseURL, storageState: storage, extraHTTPHeaders: { 'x-csrf-token': token } });
  cms = (await (await admin.get('/api/v1/admin/page-content/gallery-list')).json()).data;
  locations = (await (await admin.get('/api/v1/admin/navigation/locations')).json()).data;
  const menu = await admin.post('/api/v1/admin/navigation/menus', { data: { key: prefix, name: 'QA UAT Menu', status: 'DRAFT' } });
  expect(menu.status()).toBe(201); menuId = (await menu.json()).data.id;
  expect((await admin.patch('/api/v1/admin/navigation/menus/' + menuId, { data: { status: 'PUBLISHED', items: [['Home', 'home'], ['VIP Tables', 'tables'], ['Book Now', 'book-now'], ['Gallery', 'gallery']].map(([labelEn, routeKey], sortOrder) => ({ id: randomUUID(), labelEn, routeKey, itemType: 'INTERNAL_ROUTE', parentId: null, enabled: true, sortOrder })) } })).status()).toBe(200);
  for (const locationKey of ['HEADER_PRIMARY', 'MOBILE_PRIMARY']) expect((await admin.patch('/api/v1/admin/navigation/locations', { data: { locationKey, menuId } })).status()).toBe(200);
  linkedEventId = fixture<{ id: string }>('linked-event', { status: 'PUBLISHED' }).id;
  const assets: Asset[] = (await (await admin.get('/api/v1/admin/media?pageSize=100')).json()).data.items;
  // Albums hold images only; the library may also contain videos (e.g. a hero background video).
  const images = assets.filter((asset) => asset.kind !== 'document' && asset.kind !== 'video-thumbnail').slice(0, 15);
  expect(images.length).toBe(15);
  for (const [label, count, eventId] of [['DESTINY', 15, linkedEventId], ['ECHO', 9, null]] as const) {
    const slug = prefix + '-' + label.toLowerCase();
    const title = 'QA ' + label + ' ' + prefix;
    const response = await admin.post('/api/v1/admin/gallery', { data: { title, slug, status: 'PUBLISHED', coverMediaId: images[0].id, eventId, featured: true, items: images.slice(0, count).map((image, index) => ({ mediaId: image.id, altText: 'QA ALT ' + index, caption: 'QA caption ' + index, sortOrder: index })) } });
    expect(response.status()).toBe(201);
    albums.push({ id: (await response.json()).data.id, title, slug, count });
  }
  const sections = (cms.data.sections ?? []).filter((section) => !['albums', 'gallery', 'featured'].includes(section.key));
  const change = await admin.patch('/api/v1/admin/page-content/gallery-list', { data: { ...cms, data: { ...cms.data, sections: [...sections, { key: 'albums', title: 'QA ALBUMS', enabled: true }, { key: 'gallery', title: 'QA Preview', enabled: true }, { key: 'featured', title: 'QA Featured', enabled: true }] } } });
  expect(change.status()).toBe(200);
});

test.afterAll(async () => {
  if (snapshot) { fixture('restore', snapshot); if (admin) await invalidate(); }
  if (admin) {
    if (cms) await admin.patch('/api/v1/admin/page-content/gallery-list', { data: cms });
    for (const location of locations ?? []) if (['HEADER_PRIMARY', 'MOBILE_PRIMARY'].includes(location.locationKey)) await admin.patch('/api/v1/admin/navigation/locations', { data: { locationKey: location.locationKey, menuId: location.menuId } });
    for (const album of albums) await admin.post('/api/v1/admin/gallery/' + album.id + '/archive');
    await admin.dispose();
  }
  if (linkedEventId) fixture('linked-event', { status: 'ARCHIVED' });
});

test('Menu Builder route picker publishes one shared menu to desktop and mobile', async ({ page }) => {
  expect((await admin.patch('/api/v1/admin/navigation/menus/' + menuId, { data: { status: 'DRAFT', items: [] } })).status()).toBe(200);
  await page.context().addCookies(cookies);
  await page.goto('/admin/navigation/menus/' + menuId);
  for (const [label, href] of [['Home', '/'], ['VIP Tables', '/tables'], ['Book Now', '/book-now'], ['Gallery', '/gallery']]) {
    await page.getByRole('textbox', { name: 'Search routes', exact: true }).fill(label);
    await page.getByRole('button', { name: label + ' ' + href, exact: true }).click();
  }
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await expect(page.getByText('Menu published.', { exact: true }).last()).toBeVisible();
  const saved = (await (await admin.get('/api/v1/admin/navigation/menus/' + menuId)).json()).data;
  expect(saved.status).toBe('PUBLISHED');
  expect(saved.items.map((item: { routeKey: string }) => item.routeKey)).toEqual(['home', 'tables', 'book-now', 'gallery']);
  await page.goto('/gallery');
  await expect(primary(page).getByRole('link', { name: 'Gallery', exact: true })).toHaveAttribute('href', '/gallery');
  const desktopLabels = await primary(page).getByRole('link').allTextContents();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  const mobile = page.getByRole('navigation', { name: 'Mobile primary', exact: true });
  await expect(mobile.getByRole('link', { name: 'Gallery', exact: true })).toBeVisible();
  expect(await mobile.getByRole('link').allTextContents()).toEqual(desktopLabels);
  await page.getByRole('button', { name: 'Close menu', exact: true }).click();
});

test('VIP states are deterministic through direct URL, menu and reload on Tables and Book Now', async ({ page }) => {
  for (const mode of ['vip-disabled', 'booking-disabled', 'no-active-package', 'no-booths', 'no-availability', 'ready', 'invalid-response', 'service-unavailable']) {
    await setState(mode);
    for (const [route, label] of [['/tables', 'VIP Tables'], ['/book-now', 'Book Now']]) {
      await page.goto(route);
      const assertState = async () => {
        if (mode === 'ready') {
          await expect(page.getByText('$3,200', { exact: true }).first()).toBeVisible();
          await expect(page.getByRole('group', { name: 'Bottle preferences', exact: true })).toBeVisible();
          if (route === '/tables') await expect(page.locator('#club-map').getByRole('button', { name: /^Booth / }).first()).toBeEnabled();
          else await expect(page.locator('#booking-form form')).toBeVisible();
        } else if (mode === 'service-unavailable') {
          // DESTINY is unpublished here, so the default VIP pages move on to the next published
          // event (the linked QA event) instead of reporting an outage; never DESTINY's data.
          await expect(page.locator('main#main')).toContainText('QA linked event');
          await expect(page.getByText('$3,200', { exact: true })).toHaveCount(0);
        } else await expect(page.locator('[data-vip-state="' + mode + '"]').first()).toBeVisible();
        if (!['invalid-response', 'service-unavailable'].includes(mode)) await expect(page.locator('body')).not.toContainText(/service returned data|could not read|couldn't reach the VIP service/i);
      };
      await assertState();
      await page.reload(); await assertState();
      await page.goto('/gallery');
      await primary(page).getByRole('link', { name: label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(route + '$')); await assertState();
    }
  }
});

test('request-only form persists one real request with nullable booth and bottles, never a reservation/payment', async ({ page, request }) => {
  await setState('no-booths');
  const email = prefix + '@example.test';
  await page.goto('/book-now');
  await expect(page.locator('#booking-form form')).toBeVisible();
  await expect(page.getByText('This is a booking request, not a confirmed reservation.', { exact: true })).toBeVisible();
  await page.locator('input[name="fullName"]').fill('QA Only Guest');
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="phone"]').fill('+61000000000');
  await page.getByRole('group', { name: 'Bottle preferences', exact: true }).getByRole('checkbox').first().click();
  const submit = page.locator('#booking-form button[type="submit"]');
  const received = page.waitForResponse((response) => response.url().endsWith('/api/v1/booking-requests') && response.request().method() === 'POST');
  await submit.dblclick();
  const response = await received;
  expect(response.status()).toBe(202);
  const data = (await response.json()).data;
  expect(data.status).toBe('RECEIVED');
  await expect(page.getByText('Request received', { exact: true })).toBeVisible();
  await expect(submit).toBeDisabled();
  await expect(page.locator('#booking-form')).toContainText('not a confirmed reservation');
  expect(fixture<{ count: number; requests: unknown[] }>('booking-count', { email })).toMatchObject({ count: 1, requests: [{ status: 'RECEIVED', preferredBoothId: null, bottles: [{ bottleOptionId: expect.any(String) }] }] });
  await expect(page.getByRole('button', { name: /Continue to payment|Pay now/ })).toHaveCount(0);
  const vip = (await (await request.get('/api/v1/events/destiny/vip')).json()).data;
  const base = { eventId: snapshot.event.id, vipPackageId: vip.packages[0].id, fullName: 'QA Guest', email, groupSize: 2, preferredBoothId: null, bottleIds: [] };
  for (const invalid of [{ eventId: '' }, { vipPackageId: null }, { groupSize: 16 }, { bottleIds: [randomUUID()] }]) expect((await request.post('/api/v1/booking-requests', { data: { ...base, ...invalid } })).status()).toBe(422);
  await setState('vip-disabled');
  expect((await request.post('/api/v1/booking-requests', { data: base })).status()).toBe(409);
  expect(fixture<{ count: number }>('booking-count', { email }).count).toBe(1);
});

test('Tickets zero-tier coming-soon and protected admin readiness explain configuration', async ({ page, request }) => {
  await setState('vip-disabled');
  await page.goto('/tickets');
  await expect(page.getByTestId('ticket-empty-state')).toBeVisible();
  await expect(page.locator('#ticket-options input, #ticket-options select, #ticket-options button')).toHaveCount(0);
  await page.context().addCookies(cookies);
  await page.goto('/admin/events/' + snapshot.event.id + '/vip');
  const vip = page.getByRole('region', { name: 'VIP readiness', exact: true });
  await expect(vip).toContainText('Booking is enabled but VIP is disabled.');
  await expect(vip).toContainText('Tables content');
  await expect(vip).toContainText('PUBLISHED');
  await page.goto('/admin/events/' + snapshot.event.id + '/tickets');
  await expect(page.getByRole('region', { name: 'Ticket readiness', exact: true })).toContainText('no active ticket tiers');
  expect((await request.get('/api/v1/admin/events/' + snapshot.event.id + '/vip/readiness')).status()).toBe(401);
});

test('Gallery catalogue precedes labelled preview; linked/unlinked/hidden event CTAs and ordered ALT/caption stay correct', async ({ page, request }) => {
  await page.goto('/gallery');
  const catalogue = page.getByTestId('album-catalogue');
  await expect(catalogue.getByRole('heading', { name: 'QA ALBUMS', exact: true })).toBeVisible();
  for (const album of albums) await expect(catalogue.locator('[data-album-slug="' + album.slug + '"]')).toContainText(album.count + ' photos');
  const positions = await page.locator('#collections, #gallery-preview').evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().top));
  expect(positions[0]).toBeLessThan(positions[1]);
  await expect(page.getByTestId('gallery-preview-label')).toContainText('Previewing:');
  expect(await page.locator('#gallery-preview img').count()).toBeLessThanOrEqual(6);
  const [linked, echo] = albums;
  await expect(catalogue.locator('[data-album-slug="' + echo.slug + '"]').getByRole('link', { name: 'View Event', exact: true })).toHaveCount(0);
  await page.goto('/gallery/' + echo.slug);
  await expect(page.locator('[aria-labelledby="collection-cta-title"]').getByRole('link', { name: 'View Event', exact: true })).toHaveCount(0);
  await expect(page.locator('a[href="/event"]')).toHaveCount(0);
  await page.goto('/gallery/' + linked.slug);
  const cta = page.locator('[aria-labelledby="collection-cta-title"]');
  await expect(cta.getByRole('link', { name: 'View Event', exact: true })).toHaveAttribute('href', '/events/qa-post-gallery-event');
  await cta.getByRole('link', { name: 'View Event', exact: true }).click();
  await expect(page).toHaveURL(/\/events\/qa-post-gallery-event$/);
  await expect(page.getByRole('heading', { name: 'QA linked event', exact: true })).toBeVisible();
  const payload: Album = (await (await request.get('/api/v1/gallery/' + linked.slug)).json()).data;
  expect(payload.media.map((item) => item.caption)).toEqual(Array.from({ length: 15 }, (_, index) => 'QA caption ' + index));
  expect(payload.media.map((item) => item.image.alt)).toEqual(Array.from({ length: 15 }, (_, index) => 'QA ALT ' + index));
  for (const status of ['DRAFT', 'ARCHIVED', 'DELETED']) {
    fixture('linked-event', { status }); await invalidate(linkedEventId);
    const album = (await (await request.get('/api/v1/gallery/' + linked.slug)).json()).data;
    expect(album.eventHref).toBeNull();
    await page.goto('/gallery/' + linked.slug);
    await expect(page.locator('[aria-labelledby="collection-cta-title"]').getByRole('link', { name: 'View Event', exact: true })).toHaveCount(0);
  }
  fixture('linked-event', { status: 'PUBLISHED' }); await invalidate(linkedEventId);
  await page.goto('/gallery'); await catalogue.scrollIntoViewIfNeeded();
  // Capture rendered cards, not the first frame of their reveal animation.
  await expect.poll(() => catalogue.locator('[data-album-slug]').evaluateAll((elements) => elements.every((element) => Number(getComputedStyle(element).opacity) >= 0.99))).toBe(true);
  await expect.poll(() => catalogue.locator('img').evaluateAll((elements) => elements.every((element) => (element as HTMLImageElement).complete && (element as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await catalogue.screenshot({ path: 'test-results/post-gallery-catalogue.jpg', type: 'jpeg' });
  // CMS controls heading and preview visibility, not a hardcoded public switch.
  const current = (await (await admin.get('/api/v1/admin/page-content/gallery-list')).json()).data as Cms;
  expect((await admin.patch('/api/v1/admin/page-content/gallery-list', { data: { ...current, data: { ...current.data, sections: current.data.sections!.map((section) => section.key === 'gallery' ? { ...section, enabled: false } : section) } } })).status()).toBe(200);
  await page.reload(); await expect(page.getByTestId('gallery-preview-label')).toHaveCount(0);
  expect((await admin.patch('/api/v1/admin/page-content/gallery-list', { data: current })).status()).toBe(200);
});

test('slow desktop/mobile navigation shows one immediate nonblocking reduced-motion-safe progress indicator and clears', async ({ page }, testInfo) => {
  await setState('vip-disabled');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const waterfall: Array<{ url: string; status: number; ms: number }> = [];
  await page.route('**/*', async (route) => {
    const req = route.request();
    if (req.url().includes('_rsc=') && /\/(tables|book-now)(\?|$)/.test(new URL(req.url()).pathname + new URL(req.url()).search)) {
      const started = Date.now();
      const response = await route.fetch();
      await new Promise((resolve) => setTimeout(resolve, 1500));
      waterfall.push({ url: new URL(req.url()).pathname, status: response.status(), ms: Date.now() - started });
      await route.fulfill({ response });
    } else await route.continue();
  });
  await page.goto('/gallery');
  await primary(page).getByRole('link', { name: 'VIP Tables', exact: true }).click();
  const indicator = page.getByTestId('navigation-progress');
  await expect(indicator).toBeVisible();
  await expect(indicator).toHaveCount(1);
  expect(await indicator.locator('span').evaluate((element) => getComputedStyle(element).animationName)).toBe('none');
  expect(await indicator.evaluate((element) => getComputedStyle(element).pointerEvents)).toBe('none');
  await expect(page.locator('[data-vip-state="vip-disabled"]')).toBeVisible();
  await expect(indicator).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  await page.getByRole('navigation', { name: 'Mobile primary', exact: true }).getByRole('link', { name: 'Book Now', exact: true }).click();
  await expect(indicator).toBeVisible();
  await expect(indicator).toHaveCount(1);
  await expect(page).toHaveURL(/\/book-now$/);
  await expect(page.locator('[data-vip-state="vip-disabled"]')).toBeVisible();
  await expect(indicator).toHaveCount(0);
  expect(waterfall.length).toBeGreaterThanOrEqual(2);
  await testInfo.attach('navigation-waterfall', { body: JSON.stringify(waterfall, null, 2), contentType: 'application/json' });
  await page.screenshot({ path: 'test-results/post-gallery-vip-disabled-mobile.jpg', type: 'jpeg' });
});

test('measured cold/warm SSR, API cache reuse and responsive lazy Gallery images', async ({ page, baseURL }, testInfo) => {
  await setState('vip-disabled');
  const since = new Date().toISOString();
  const probes: Array<{ route: string; sample: number; ttfbSeconds: number; totalSeconds: number; bytes: number }> = [];
  for (const route of ['/tables', '/book-now', '/gallery']) for (const sample of [1, 2, 3]) {
    const output = execFileSync(process.platform === 'win32' ? 'curl.exe' : 'curl', ['-sS', '--max-time', '20', '-o', process.platform === 'win32' ? 'NUL' : '/dev/null', '-w', '{"ttfbSeconds":%{time_starttransfer},"totalSeconds":%{time_total},"bytes":%{size_download}}', baseURL + route], { encoding: 'utf8', timeout: 25_000 });
    probes.push({ route, sample, ...JSON.parse(output) });
  }
  const logs = execFileSync('docker', ['compose', '-f', 'docker/compose.gallery-qa.yml', 'logs', '--since', since, 'app'], { encoding: 'utf8', timeout: 15_000 });
  const calls: Array<{ route: string; method: string; status: number; duration: number }> = [];
  for (const line of logs.split(/\r?\n/)) {
    const start = line.indexOf('{"requestId"');
    if (start < 0) continue;
    const row = JSON.parse(line.slice(start));
    if (row.method === 'GET') calls.push({ route: row.route, method: row.method, status: row.status, duration: row.duration });
  }
  // The two page renders + their metadata must reuse the same 300-second tagged API entries.
  for (const route of ['/api/v1/events/destiny', '/api/v1/events/destiny/vip', '/api/v1/gallery']) expect(calls.filter((row) => row.route === route).length).toBeLessThanOrEqual(1);
  await page.goto('/gallery');
  const catalogueImages = page.getByTestId('album-catalogue').locator('img');
  expect(await catalogueImages.count()).toBeGreaterThan(0);
  for (const image of await catalogueImages.all()) {
    await expect(image).toHaveAttribute('loading', 'lazy');
    // Vector SVGs are intrinsically scalable and deliberately bypass Next's raster optimizer.
    if ((await image.getAttribute('src'))?.startsWith('/_next/image?')) await expect(image).toHaveAttribute('sizes', /vw/);
  }
  for (const image of await page.locator('#gallery-preview img').all()) await expect(image).toHaveAttribute('loading', 'lazy');
  const images = await page.locator('main img').evaluateAll((elements) => elements.map((element) => ({ src: element.getAttribute('src'), sizes: element.getAttribute('sizes'), loading: element.getAttribute('loading'), srcset: element.hasAttribute('srcset') })));
  expect(images.some((image) => image.src?.includes('/_next/image?') && image.srcset)).toBe(true);
  const navigation = await page.evaluate(() => {
    const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return { ttfbMs: entry.responseStart - entry.requestStart, responseMs: entry.responseEnd - entry.requestStart, domContentLoadedMs: entry.domContentLoadedEventEnd - entry.startTime };
  });
  const report = { environment: 'isolated Node 22 Docker / Chrome loopback:43291', state: 'VIP_DISABLED', note: 'TTFB is streamed shell time; total includes SSR response completion. Not a production before/after speed claim.', probes, calls, images, navigation };
  writeFileSync(testInfo.outputPath('performance.json'), JSON.stringify(report, null, 2));
  await testInfo.attach('post-gallery-performance', { body: JSON.stringify(report, null, 2), contentType: 'application/json' });
});
