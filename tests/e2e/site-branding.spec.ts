import { test, expect, request as requestFactory } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';

test.skip(process.env.GALLERY_QA !== '1', 'Dedicated QA DB/Redis opt-in required.');
test.describe.configure({ mode: 'serial' });
test.setTimeout(120_000);

let editor: APIRequestContext;
let original: Record<string, unknown>;
const LOGO = { src: '/assets/logo-mcq.svg', alt: 'QA Brand Logo', mediaId: null };
const FAVICON = { src: '/assets/logo-bihi.svg', alt: 'QA favicon', mediaId: null };

test.beforeAll(async ({ baseURL }) => {
  const target = new URL(baseURL!);
  if (!['localhost', '127.0.0.1'].includes(target.hostname) || target.port !== '43291') throw new Error('Branding tests only target loopback:43291.');
  const client = await requestFactory.newContext({ baseURL });
  expect((await client.post('/api/v1/auth/login', { data: { email: 'qa-editor@example.test', password: 'Gallery-QA-Only-2026!' } })).status()).toBe(200);
  const state = await client.storageState();
  await client.dispose();
  const token = state.cookies.find((cookie) => cookie.name === 'destiny_csrf')!.value;
  editor = await requestFactory.newContext({ baseURL, storageState: state, extraHTTPHeaders: { 'x-csrf-token': token } });
  const response = await editor.get('/api/v1/admin/settings/site');
  expect(response.status()).toBe(200);
  original = (await response.json()).data;
});
test.afterAll(async () => {
  if (original) expect((await editor.put('/api/v1/admin/settings/site', { data: original })).status()).toBe(200);
  await editor?.dispose();
});

test('the logo and favicon chosen in Settings › Site appear in every public header, footer and the SEO data', async ({ page }) => {
  expect((await editor.put('/api/v1/admin/settings/site', { data: { ...original, logo: LOGO, favicon: FAVICON } })).status()).toBe(200);
  expect((await (await editor.get('/api/v1/admin/settings/site')).json()).data.logo).toMatchObject({ src: LOGO.src, alt: LOGO.alt });

  for (const path of ['/', '/events', '/events/destiny', '/about', '/partners', '/tickets', '/gallery']) {
    await page.goto(path);
    const logos = page.locator('img[data-site-logo]');
    await expect(logos.first(), path).toHaveAttribute('src', LOGO.src);
    // Header and footer both show it on every page.
    expect(await logos.count(), path).toBeGreaterThanOrEqual(2);
    for (const src of await logos.evaluateAll((items) => items.map((item) => item.getAttribute('src')))) expect(src, path).toBe(LOGO.src);
    await expect(page.locator('img[src="/assets/logo-connection.svg"]'), path).toHaveCount(0);
    await expect(page.locator('link[rel="icon"]').first(), path).toHaveAttribute('href', new RegExp(FAVICON.src.replace(/\./g, '\\.')));
  }
  await page.goto('/');
  await expect(page.locator('header img[data-site-logo]')).toHaveAttribute('alt', LOGO.alt);
  const organization = await page.locator('script[type="application/ld+json"]').evaluateAll((items) => items.map((item) => JSON.parse(item.textContent || '{}')).find((item) => item['@type'] === 'Organization'));
  expect(organization.logo).toMatch(/\/assets\/logo-mcq\.svg$/);
});

test('restoring the setting brings the original logo back without a redeploy', async ({ page }) => {
  expect((await editor.put('/api/v1/admin/settings/site', { data: original })).status()).toBe(200);
  await page.goto('/');
  const expected = typeof (original.logo as { src?: unknown } | null)?.src === 'string' && (original.logo as { src: string }).src ? (original.logo as { src: string }).src : '/assets/logo-connection.svg';
  await expect(page.locator('header img[data-site-logo]')).toHaveAttribute('src', expected);
});
