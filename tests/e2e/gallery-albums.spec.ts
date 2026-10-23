import { randomUUID } from 'node:crypto';
import { test, expect, request as requestFactory } from '@playwright/test';
import type { APIRequestContext, Locator, Page } from '@playwright/test';

// Explicit opt-in and loopback-only target: these tests must never write to production.
test.skip(process.env.GALLERY_QA !== '1', 'Requires the isolated Gallery QA stack and fixtures.');
test.setTimeout(90_000);
test.use({ actionTimeout: 10_000 });

type Media = { id: string; name: string; url: string; alt: string; kind: string };
type Album = { id: string; slug: string; title: string; status: string; items: Array<{ image: { mediaId: string; alt: string }; caption: string; sortOrder: number }> };
let admin: APIRequestContext;
let editor: APIRequestContext;
let viewer: APIRequestContext;
let state: Awaited<ReturnType<APIRequestContext['storageState']>>;
let media: Media[];
let eventId: string;
const missingId = '00000000-0000-0000-0000-000000000001';
const slug = (label: string) => `qa-${label}-${randomUUID().slice(0, 8)}`;

// Populated below using one login per role, so repeated tests don't trip the login rate limit.
async function authenticatedClient(baseURL: string, role: string) {
  const client = await requestFactory.newContext({ baseURL });
  expect((await client.post('/api/v1/auth/login', { data: { email: `qa-${role}@example.test`, password: 'Gallery-QA-Only-2026!' } })).status()).toBe(200);
  const storageState = await client.storageState();
  const token = storageState.cookies.find((item) => item.name === 'destiny_csrf')?.value;
  expect(token).toBeTruthy();
  await client.dispose();
  return requestFactory.newContext({ baseURL, storageState, extraHTTPHeaders: { 'x-csrf-token': token! } });
}

test.beforeAll(async ({ baseURL }) => {
  const target = new URL(baseURL!);
  if (!['127.0.0.1', 'localhost'].includes(target.hostname) || target.port !== '43291') throw new Error('Gallery tests only target localhost:43291.');
  admin = await authenticatedClient(baseURL!, 'admin');
  editor = await authenticatedClient(baseURL!, 'editor');
  viewer = await authenticatedClient(baseURL!, 'viewer');
  state = await admin.storageState();
  const assets = await admin.get('/api/v1/admin/media?pageSize=100');
  expect(assets.status()).toBe(200);
  media = (await assets.json()).data.items;
  expect(media.find((item) => item.name === 'hero-crowd.jpg')).toBeTruthy();
  eventId = (await (await admin.get('/api/v1/events/destiny')).json()).data.id;
});
test.afterAll(async () => {
  await Promise.all([admin?.dispose(), editor?.dispose(), viewer?.dispose()]);
});

function payload(albumSlug: string) {
  return { title: 'Gallery QA', slug: albumSlug, status: 'DRAFT', coverMediaId: media.find((item) => item.name === 'hero-crowd.jpg')!.id };
}
async function getAlbum(id: string): Promise<Album> {
  const response = await admin.get(`/api/v1/admin/gallery/${id}`);
  expect(response.status()).toBe(200);
  return (await response.json()).data;
}
async function chooseImage(page: Page, field: Locator, name: string) {
  await field.getByRole('button', { name: /Choose image|Replace/, exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Choose from media library' });
  await dialog.getByRole('button', { name, exact: true }).click();
  await expect(dialog).not.toBeVisible();
}
async function publish(page: Page) {
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await page.getByRole('dialog', { name: 'Publish now?' }).getByRole('button', { name: 'Publish', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Publish now?' })).not.toBeVisible();
}

test('real admin form saves Draft, reloads, publishes, reorders/removes images and handles API errors without losing input', async ({ page, request }) => {
  await page.context().addCookies(state.cookies);
  const albumSlug = slug('form');
  const title = `Gallery QA ${albumSlug}`;
  await page.goto('/admin/gallery/new');
  await page.getByRole('button', { name: 'Save Draft', exact: true }).click();
  await expect(page.getByRole('main').getByRole('alert')).toBeVisible();
  await page.getByRole('textbox', { name: 'Title (required)', exact: true }).fill(title);
  await page.getByRole('textbox', { name: 'Slug (required)', exact: true }).fill(albumSlug);
  await chooseImage(page, page.locator('[data-field="cover"]'), 'hero-crowd.jpg');
  await page.getByLabel('Related event', { exact: true }).selectOption(eventId);
  await page.getByRole('tab', { name: 'Media', exact: true }).click();
  for (const [index, name] of ['artist-maya.jpg', 'artist-ryal.jpg'].entries()) {
    await page.getByRole('button', { name: 'Add item', exact: true }).click();
    const field = page.locator('[data-field="image"]').nth(index);
    await chooseImage(page, field, name);
    await field.getByLabel('Alt text', { exact: true }).fill(`QA alt ${index + 1}`);
    await page.getByRole('textbox', { name: 'Caption', exact: true }).nth(index).fill(`QA caption ${index + 1}`);
  }
  await page.getByRole('button', { name: 'Save Draft', exact: true }).click();
  // Rapid keyboard resubmission must not create another album.
  await page.keyboard.press('Control+s');
  await page.keyboard.press('Control+s');
  await expect(page).toHaveURL(/\/admin\/gallery\/[0-9a-f-]+\/edit$/);
  const id = page.url().split('/').at(-2)!;
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Title (required)', exact: true })).toHaveValue(title);
  await page.getByRole('tab', { name: 'Media', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Caption', exact: true }).nth(1)).toHaveValue('QA caption 2');
  expect((await getAlbum(id)).items).toHaveLength(2);
  expect((await (await admin.get(`/api/v1/admin/gallery?search=${albumSlug}`)).json()).data.total).toBe(1);
  expect((await request.get(`/api/v1/gallery/${albumSlug}`)).status()).toBe(404);
  const draftResponse = await page.goto(`/gallery/${albumSlug}`);
  expect([200, 404]).toContain(draftResponse!.status()); // Next loading boundaries can stream notFound after HTTP headers.
  await expect(page.getByRole('heading', { name: 'Collection Not Found', exact: true })).toBeVisible();
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute('content', /noindex/);
  await expect(page.locator('#collection-media-grid')).toHaveCount(0);
  expect(JSON.stringify((await (await request.get('/api/v1/events/destiny')).json()).data.gallery)).not.toContain(albumSlug);

  await page.goto(`/admin/gallery/${id}/edit`);
  await publish(page);
  await expect.poll(async () => (await getAlbum(id)).status).toBe('published');
  await page.goto('/admin/gallery');
  await expect(page.getByRole('link', { name: title, exact: true })).toBeVisible();
  await page.goto('/gallery');
  await expect(page.getByRole('link', { name: new RegExp(title) }).first()).toBeVisible();
  expect((await page.goto(`/gallery/${albumSlug}`))!.status()).toBe(200);
  await expect(page.locator('#collection-media-grid img').first()).toHaveAttribute('alt', 'QA alt 1');
  await page.locator('#collection-media-grid').scrollIntoViewIfNeeded();
  await page.locator('#collection-media-grid button').first().click();
  await expect(page.getByRole('dialog')).toContainText('QA caption 1');
  await expect.poll(() => page.getByRole('dialog').getByRole('img').evaluate((element) => {
    const image = element as HTMLImageElement;
    return image.complete && image.naturalWidth > 0 && getComputedStyle(image.parentElement!).opacity === '1';
  })).toBe(true);
  await page.screenshot({ path: 'test-results/gallery-published.jpg', type: 'jpeg' });
  await page.getByRole('button', { name: /Close/ }).last().click();

  await page.goto(`/admin/gallery/${id}/edit`);
  await page.getByRole('tab', { name: 'Media', exact: true }).click();
  await page.getByRole('button', { name: 'Move Item 2: QA caption 2 up', exact: true }).click();
  await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
  await expect.poll(async () => (await getAlbum(id)).items[0].caption).toBe('QA caption 2');
  await page.goto(`/gallery/${albumSlug}`);
  await expect(page.locator('#collection-media-grid img').first()).toHaveAttribute('alt', 'QA alt 2');

  await page.goto(`/admin/gallery/${id}/edit`);
  await page.getByRole('tab', { name: 'Media', exact: true }).click();
  await page.getByRole('button', { name: 'Remove Item 2: QA caption 1', exact: true }).click();
  await page.getByRole('dialog', { name: 'Remove item?' }).getByRole('button', { name: 'Remove', exact: true }).click();
  await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
  await expect.poll(async () => (await getAlbum(id)).items.length).toBe(1);
  const removedMedia = media.find((item) => item.name === 'artist-maya.jpg')!;
  expect((await admin.get(`/api/v1/admin/media/${removedMedia.id}`)).status()).toBe(200);

  await page.getByRole('tab', { name: 'Album', exact: true }).click();
  await page.getByRole('textbox', { name: 'Title (required)', exact: true }).fill('Keep this input on API error');
  const clashSlug = slug('clash');
  expect((await admin.post('/api/v1/admin/gallery', { data: payload(clashSlug) })).status()).toBe(201);
  await page.getByRole('textbox', { name: 'Slug (required)', exact: true }).fill(clashSlug);
  await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText(/slug/i);
  await expect(page.getByRole('textbox', { name: 'Title (required)', exact: true })).toHaveValue('Keep this input on API error');
  expect((await getAlbum(id)).title).toBe(title);
  await page.getByRole('textbox', { name: 'Slug (required)', exact: true }).fill(albumSlug);
  await page.getByRole('combobox', { name: /^Status/ }).selectOption('draft');
  await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
  await expect.poll(async () => (await getAlbum(id)).status).toBe('draft');
  const unpublishedResponse = await page.goto(`/gallery/${albumSlug}`);
  expect([200, 404]).toContain(unpublishedResponse!.status());
  await expect(page.getByRole('heading', { name: 'Collection Not Found', exact: true })).toBeVisible();
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute('content', /noindex/);
  await expect(page.locator('#collection-media-grid')).toHaveCount(0);
  expect((await request.get(`/api/v1/gallery/${albumSlug}`)).status()).toBe(404);
  await page.goto('/gallery');
  await expect(page.locator(`a[href="/gallery/${albumSlug}"]`)).toHaveCount(0);
});

test('real API saves 15 existing images consistently and invalid mutations leave the album unchanged', async ({ request, page }) => {
  const albumSlug = slug('fifteen');
  // Albums hold images only; the library may also contain videos (e.g. a hero background video).
  const images = media.filter((item) => item.kind !== 'document' && item.kind !== 'video-thumbnail').slice(0, 15);
  expect(images).toHaveLength(15);
  const items = images.map((image, index) => ({ mediaId: image.id, altText: `Placement alt ${index}`, caption: `Caption ${index}`, category: 'crowd', sortOrder: 14 - index }));
  const response = await admin.post('/api/v1/admin/gallery', { data: { ...payload(albumSlug), eventId, items } });
  expect(response.status()).toBe(201);
  const created = (await response.json()).data;
  const before = await getAlbum(created.id);
  expect(before.status).toBe('draft');
  expect(before.items.map((item) => item.caption)).toEqual(items.map((item) => item.caption).reverse());
  expect((await request.get(`/api/v1/gallery/${albumSlug}`)).status()).toBe(404);
  for (const change of [
    { title: '' }, { coverMediaId: missingId }, { eventId: missingId },
    { items: [{ mediaId: missingId }] },
    { coverMediaId: media.find((item) => item.kind === 'document')!.id },
    { items: [{ id: missingId, mediaId: images[0].id }] },
  ]) {
    expect((await admin.patch(`/api/v1/admin/gallery/${created.id}`, { data: change })).status()).toBe(422);
    expect(await getAlbum(created.id)).toEqual(before);
  }
  expect((await admin.patch(`/api/v1/admin/gallery/${created.id}`, { data: { status: 'PUBLISHED' } })).status()).toBe(200);
  const published = (await (await request.get(`/api/v1/gallery/${albumSlug}`)).json()).data;
  expect(published.media).toHaveLength(15);
  expect(published.media[0].caption).toBe('Caption 14');
  expect(published.media[0].image.alt).toBe('Placement alt 14');
  expect((await admin.patch(`/api/v1/admin/gallery/${created.id}`, { data: { slug: `${albumSlug}-renamed` } })).status()).toBe(200);
  expect((await request.get(`/api/v1/gallery/${albumSlug}`)).status()).toBe(404);
  const renamedResponse = await request.get(`/gallery/${albumSlug}`, { maxRedirects: 0 });
  expect([200, 308]).toContain(renamedResponse.status()); // A loading boundary can stream Next's permanent meta redirect.
  await page.goto(`/gallery/${albumSlug}`);
  await expect(page).toHaveURL(new RegExp(`/gallery/${albumSlug}-renamed$`));
  await expect(page.locator('#collection-media-grid img').first()).toHaveAttribute('alt', 'Placement alt 14');
  expect((await admin.post(`/api/v1/admin/gallery/${created.id}/archive`)).status()).toBe(200);
  expect((await request.get(`/api/v1/gallery/${albumSlug}-renamed`)).status()).toBe(404);
});

test('required fields, permissions, CSRF, duplicate slug and concurrent submission are enforced by the API', async ({ request }) => {
  for (const key of ['title', 'slug', 'coverMediaId']) {
    const input: Record<string, unknown> = payload(slug('invalid'));
    delete input[key];
    const response = await admin.post('/api/v1/admin/gallery', { data: input });
    expect(response.status()).toBe(422);
    expect((await response.json()).error.fieldErrors[key]).toBeTruthy();
  }
  expect((await request.post('/api/v1/admin/gallery', { data: payload(slug('anonymous')) })).status()).toBe(401);
  const noCsrf = await requestFactory.newContext({ baseURL: process.env.PLAYWRIGHT_BASE_URL, storageState: state });
  expect((await noCsrf.post('/api/v1/admin/gallery', { data: payload(slug('csrf')) })).status()).toBe(403);
  await noCsrf.dispose();
  const editorDraft = await editor.post('/api/v1/admin/gallery', { data: payload(slug('editor')) });
  expect(editorDraft.status()).toBe(201);
  const id = (await editorDraft.json()).data.id;
  expect((await editor.patch(`/api/v1/admin/gallery/${id}`, { data: { title: 'Editor update' } })).status()).toBe(200);
  expect((await editor.post('/api/v1/admin/gallery', { data: { ...payload(slug('editor-publish')), status: 'PUBLISHED' } })).status()).toBe(403);
  expect((await editor.patch(`/api/v1/admin/gallery/${id}`, { data: { status: 'PUBLISHED' } })).status()).toBe(403);
  expect((await editor.post(`/api/v1/admin/gallery/${id}/publish`)).status()).toBe(403);
  expect((await viewer.get(`/api/v1/admin/gallery/${id}`)).status()).toBe(200);
  expect((await viewer.post('/api/v1/admin/gallery', { data: payload(slug('viewer')) })).status()).toBe(403);
  expect((await viewer.patch(`/api/v1/admin/gallery/${id}`, { data: { title: 'Unauthorized' } })).status()).toBe(403);
  const duplicateSlug = slug('double-submit');
  const results = await Promise.all([0, 1].map(() => admin.post('/api/v1/admin/gallery', { data: payload(duplicateSlug) })));
  expect(results.map((result) => result.status()).sort()).toEqual([201, 422]);
  expect((await (await admin.get(`/api/v1/admin/gallery?search=${duplicateSlug}`)).json()).data.total).toBe(1);
});
