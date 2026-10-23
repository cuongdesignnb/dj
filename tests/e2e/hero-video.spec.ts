import path from 'node:path';
import { test, expect, request as requestFactory } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';

test.skip(process.env.GALLERY_QA !== '1', 'Dedicated QA DB/Redis opt-in required.');
test.describe.configure({ mode: 'serial' });
test.setTimeout(150_000);
test.use({ actionTimeout: 15_000 });

let editor: APIRequestContext;
let editorState: Awaited<ReturnType<APIRequestContext['storageState']>>;
let original: Record<string, unknown>;
let videoSrc = '';

test.beforeAll(async ({ baseURL }) => {
  const target = new URL(baseURL!);
  if (!['localhost', '127.0.0.1'].includes(target.hostname) || target.port !== '43291') throw new Error('Hero video tests only target loopback:43291.');
  const client = await requestFactory.newContext({ baseURL });
  expect((await client.post('/api/v1/auth/login', { data: { email: 'qa-editor@example.test', password: 'Gallery-QA-Only-2026!' } })).status()).toBe(200);
  editorState = await client.storageState();
  await client.dispose();
  const token = editorState.cookies.find((cookie) => cookie.name === 'destiny_csrf')!.value;
  editor = await requestFactory.newContext({ baseURL, storageState: editorState, extraHTTPHeaders: { 'x-csrf-token': token } });
  original = (await (await editor.get('/api/v1/admin/content/home')).json()).data;
});
test.afterAll(async () => {
  if (original) expect((await editor.put('/api/v1/admin/content/home', { data: original })).status()).toBe(200);
  await editor?.dispose();
});

test('an editor uploads a background video in Homepage › Hero and saves it', async ({ browser }) => {
  const page = await (await browser.newContext({ storageState: editorState })).newPage();
  await page.goto('/admin/content/home');
  const field = page.getByText('Hero background video', { exact: true }).locator('xpath=ancestor::*[.//button][1]');
  await expect(field).toContainText('No video selected.');
  await field.getByRole('button', { name: 'Choose video' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('MP4 (H.264), up to 20 MB');
  await dialog.locator('input[type="file"]').setInputFiles(path.resolve('tests/fixtures/media/qa-hero.webm'));
  await expect(dialog).toBeHidden();
  const chosen = field.getByText(/^\/api\/v1\/media\/[0-9a-f-]{36}$/);
  await expect(chosen).toBeVisible();
  videoSrc = (await chosen.textContent())!.trim();
  await expect(field.locator(`video[src="${videoSrc}"]`)).toHaveCount(1);
  await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
  await expect.poll(async () => (await (await editor.get('/api/v1/admin/content/home')).json()).data.hero?.video?.src).toBe(videoSrc);
  await page.context().close();
});

test('the media route serves byte ranges so Safari/iOS can play the video', async ({ request }) => {
  const full = await request.get(videoSrc);
  expect(full.status()).toBe(200);
  expect(full.headers()['accept-ranges']).toBe('bytes');
  const size = Number(full.headers()['content-length']);
  const head = await request.get(videoSrc, { headers: { range: 'bytes=0-1' } });
  expect(head.status()).toBe(206);
  expect(head.headers()['content-range']).toBe(`bytes 0-1/${size}`);
  expect((await head.body()).byteLength).toBe(2);
  const tail = await request.get(videoSrc, { headers: { range: 'bytes=-10' } });
  expect(tail.status()).toBe(206);
  expect((await tail.body()).equals((await full.body()).subarray(size - 10))).toBe(true);
  expect((await request.get(videoSrc, { headers: { range: `bytes=${size}-` } })).status()).toBe(416);
});

test('the homepage plays it muted on a loop behind the hero', async ({ page }) => {
  await page.goto('/');
  const video = page.locator('video[data-hero-video]');
  await expect(video).toHaveAttribute('src', videoSrc);
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => ({ muted: v.muted, loop: v.loop, inline: v.playsInline, playing: !v.paused && v.readyState >= 2 && v.currentTime > 0 }))).toEqual({ muted: true, loop: true, inline: true, playing: true });
  // Sponsors, title and the ticket button still sit on top of the video.
  await expect(page.locator('[data-sponsor-slot="hero"]')).toBeVisible();
  await expect(page.getByRole('link', { name: /view ticket details|get tickets/i }).first()).toBeVisible();
});

test('reduced-motion visitors get the still image only', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('section').first()).toBeVisible();
  await expect(page.locator('video[data-hero-video]')).toHaveCount(0);
  await context.close();
});

test('removing the video brings the hero back to the image', async ({ page }) => {
  const current = (await (await editor.get('/api/v1/admin/content/home')).json()).data;
  expect((await editor.put('/api/v1/admin/content/home', { data: { ...current, hero: { ...current.hero, video: null } } })).status()).toBe(200);
  await page.goto('/');
  await expect(page.locator('video[data-hero-video]')).toHaveCount(0);
});

test('uploads show live progress and can be cancelled; files over 20 MB are refused before sending', async ({ browser }) => {
  const context = await browser.newContext({ storageState: editorState });
  const page = await context.newPage();
  // ~100 KB/s upload so the 0.5 MB test video takes a few seconds.
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 20, downloadThroughput: -1, uploadThroughput: 100 * 1024 });
  const uploads: string[] = [];
  page.on('request', (request) => { if (request.url().includes('/api/v1/admin/media/upload')) uploads.push(request.url()); });

  await page.goto('/admin/content/home');
  const field = page.getByText('Hero background video', { exact: true }).locator('xpath=ancestor::*[.//button][1]');
  await field.getByRole('button', { name: /Choose video|Replace/ }).click();
  const dialog = page.getByRole('dialog');

  await dialog.locator('input[type="file"]').setInputFiles({ name: 'too-big.mp4', mimeType: 'video/mp4', buffer: Buffer.alloc(21 * 1024 * 1024) });
  await expect(dialog.getByRole('alert')).toContainText('This file is 21 MB. Files must be 20 MB or smaller');
  expect(uploads).toEqual([]);

  await dialog.locator('input[type="file"]').setInputFiles(path.resolve('tests/fixtures/media/qa-hero.webm'));
  const bar = dialog.getByRole('progressbar', { name: 'Upload progress' });
  await expect(bar).toBeVisible();
  await expect(dialog.locator('[data-upload-progress] [role="status"]')).toContainText(/\d+% · [\d.]+ MB of 0\.5 MB/);
  await expect.poll(async () => Number(await bar.getAttribute('aria-valuenow')), { timeout: 15_000 }).toBeGreaterThan(10);
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(bar).toBeHidden();
  await expect(dialog.getByRole('alert')).toHaveCount(0);
  await context.close();
});
