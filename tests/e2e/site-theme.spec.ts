import { test, expect, request as requestFactory } from '@playwright/test';
import type { APIRequestContext, Page } from '@playwright/test';

test.skip(process.env.GALLERY_QA !== '1', 'Dedicated QA DB/Redis opt-in required.');
test.describe.configure({ mode: 'serial' });
test.setTimeout(120_000);

let editor: APIRequestContext;
let editorState: Awaited<ReturnType<APIRequestContext['storageState']>>;
let original: Record<string, unknown>;

const ICE = 'rgb(42, 160, 223)';
const RED = 'rgb(255, 23, 61)';

async function accentOf(page: Page) {
  return page.evaluate(() => {
    const probe = document.createElement('span');
    probe.className = 'text-rave-red';
    document.body.appendChild(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });
}

async function setTheme(theme: unknown) {
  return editor.put('/api/v1/admin/settings/site', { data: { ...original, theme } });
}

test.beforeAll(async ({ baseURL }) => {
  const target = new URL(baseURL!);
  if (!['localhost', '127.0.0.1'].includes(target.hostname) || target.port !== '43291') throw new Error('Theme tests only target loopback:43291.');
  const client = await requestFactory.newContext({ baseURL });
  expect((await client.post('/api/v1/auth/login', { data: { email: 'qa-editor@example.test', password: 'Gallery-QA-Only-2026!' } })).status()).toBe(200);
  editorState = await client.storageState();
  await client.dispose();
  const token = editorState.cookies.find((cookie) => cookie.name === 'destiny_csrf')!.value;
  editor = await requestFactory.newContext({ baseURL, storageState: editorState, extraHTTPHeaders: { 'x-csrf-token': token } });
  original = (await (await editor.get('/api/v1/admin/settings/site')).json()).data;
});
test.afterAll(async () => {
  if (original) expect((await editor.put('/api/v1/admin/settings/site', { data: original })).status()).toBe(200);
  await editor?.dispose();
});

test('the default theme keeps the original neon red', async ({ page }) => {
  expect((await setTheme('connection')).status()).toBe(200);
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'connection');
  expect(await accentOf(page)).toBe(RED);
});

test('choosing Highland in Settings › Site recolours every public page, but not Admin', async ({ browser, page }) => {
  expect((await setTheme('highland')).status()).toBe(200);
  expect((await (await editor.get('/api/v1/admin/settings/site')).json()).data.theme).toBe('highland');
  for (const path of ['/', '/events', '/tickets', '/tables', '/gallery', '/about', '/no-such-page']) {
    await page.goto(path);
    await expect(page.locator('html'), path).toHaveAttribute('data-theme', 'highland');
    expect(await accentOf(page), path).toBe(ICE);
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), path).toBe('rgb(4, 9, 14)');
  }
  // Solid ice-cyan buttons use dark text so labels stay readable.
  await page.goto('/');
  const solid = page.locator('header a.bg-rave-red, header a.from-rave-red, header .bg-rave-red').first();
  if (await solid.count()) expect(await solid.evaluate((el) => getComputedStyle(el).color)).toBe('rgb(6, 23, 35)');

  const admin = await (await browser.newContext({ storageState: editorState })).newPage();
  await admin.goto('/admin/settings/site');
  await expect(admin.getByRole('combobox', { name: /Site colour theme/ })).toHaveValue('highland');
  await expect(admin.locator('html')).toHaveAttribute('data-theme', 'connection');
  expect(await accentOf(admin)).toBe(RED);
  await admin.context().close();
});

test('an unknown theme is rejected and nothing changes', async ({ page }) => {
  const response = await setTheme('neon-green');
  expect(response.status()).toBe(422);
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'highland');
});
