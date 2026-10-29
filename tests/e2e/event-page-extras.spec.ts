import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test, expect, request as requestFactory } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';

test.skip(process.env.GALLERY_QA !== '1', 'Dedicated QA DB/Redis opt-in required.');
test.describe.configure({ mode: 'serial' });
test.setTimeout(120_000);
test.use({ actionTimeout: 15_000 });

let ids: Record<string, string>;
let editor: APIRequestContext;
let editorState: Awaited<ReturnType<APIRequestContext['storageState']>>;

function fixture<T>(action: string): T {
  // Compose pins its own DB URL. Neither the caller nor a production env can override it.
  const output = execFileSync('docker', ['compose', '-f', 'docker/compose.gallery-qa.yml', 'exec', '-T', '--env', 'QA_FIXTURE_ACTION=' + action, 'app', 'node', '--input-type=module'], { input: readFileSync(path.resolve('tests/fixtures/current-event-qa.mjs')), encoding: 'utf8', timeout: 30_000 });
  return JSON.parse(output.trim()) as T;
}

const content = {
  highlights: [{ icon: 'Music', title: 'QA Highlight Techno', description: 'Fast club genres.', enabled: true }],
  expectations: [{ icon: 'Headphones', title: 'QA Continuous sets', description: 'All night long.', enabled: true }],
  experience: { image: null, captions: ['Bass', 'Lights'] },
  goodToKnow: [{ icon: 'IdCard', title: 'QA 18+ with photo ID', description: 'No ID, no entry.', enabled: true }],
  venue: { image: null, description: 'QA venue description.', directions: 'QA: walk from the train station.' },
  organiser: { name: 'QA Organiser Co', description: 'Runs the night.', website: 'https://example.test', instagram: '', facebook: '' },
  finalCta: { title: 'Ready for QA night?', subtitle: 'See you there.' },
};

test.beforeAll(async ({ baseURL }) => {
  const target = new URL(baseURL!);
  if (!['localhost', '127.0.0.1'].includes(target.hostname) || target.port !== '43291') throw new Error('Event page tests only target loopback:43291.');
  ids = fixture<Record<string, string>>('setup');
  const client = await requestFactory.newContext({ baseURL });
  expect((await client.post('/api/v1/auth/login', { data: { email: 'qa-editor@example.test', password: 'Gallery-QA-Only-2026!' } })).status()).toBe(200);
  editorState = await client.storageState();
  await client.dispose();
  const token = editorState.cookies.find((cookie) => cookie.name === 'destiny_csrf')!.value;
  editor = await requestFactory.newContext({ baseURL, storageState: editorState, extraHTTPHeaders: { 'x-csrf-token': token } });
});
test.afterAll(async () => {
  fixture('cleanup');
  await editor?.dispose();
});

test('an event page without extra content shows no "coming soon" placeholders', async ({ page }) => {
  await page.goto('/events/qa-current');
  await expect(page.locator('main')).not.toContainText(/coming soon|to be confirmed/i);
  // The venue map and directions are always there; reviews invite the first one.
  await expect(page.locator('[data-venue-map] iframe')).toHaveAttribute('src', /maps\.google\.com\/maps\?q=.*Perth.*output=embed/);
  await expect(page.locator('[data-venue-directions]')).toHaveAttribute('href', /google\.com\/maps\/dir\//);
  await expect(page.getByText('Be the first to leave a review')).toBeVisible();
  await expect(page.locator('#good-to-know')).toHaveCount(0);
});

test('Admin › Event Page Content fills highlights, Good to Know, venue, organiser and the closing CTA', async ({ page }) => {
  const key = `event:${ids['qa-current']}`;
  expect((await editor.patch(`/api/v1/admin/page-content/${key}`, { data: { data: content, status: 'PUBLISHED', locale: 'en' } })).status()).toBe(200);
  await page.goto('/events/qa-current');
  await expect(page.locator('#about')).toContainText('QA Highlight Techno');
  await expect(page.locator('#expect')).toContainText('QA Continuous sets');
  await expect(page.locator('#expect')).toContainText('Lights');
  await expect(page.locator('#good-to-know')).toContainText('QA 18+ with photo ID');
  await expect(page.locator('#venue')).toContainText('QA: walk from the train station.');
  const organiser = page.locator('[data-event-organiser]');
  await expect(organiser).toContainText('QA Organiser Co');
  await expect(organiser.getByRole('link', { name: /example\.test/ })).toHaveAttribute('href', 'https://example.test');
  await expect(page.getByRole('heading', { name: 'Ready for QA night?' })).toBeVisible();
  await expect(page.locator('[data-event-share]')).toBeVisible();
});

test('a visitor review stays hidden until an editor approves it in Admin › Reviews', async ({ browser, page }) => {
  await page.goto('/events/qa-current');
  const form = page.locator('[data-review-form]');
  await form.getByRole('button', { name: 'Send review' }).click();
  await expect(form).toContainText('Choose a star rating.');
  await form.getByRole('button', { name: '5 stars' }).click();
  await form.getByLabel('Name').fill('QA Review Writer');
  await form.getByLabel('Email').fill('qa-review@example.test');
  await form.getByLabel('Your review').fill('QA review: brilliant night and great sound.');
  await form.getByRole('button', { name: 'Send review' }).click();
  await expect(page.locator('[data-review-sent]')).toBeVisible();

  await page.reload();
  await expect(page.locator('#reviews')).not.toContainText('QA review: brilliant night');

  const admin = await (await browser.newContext({ storageState: editorState })).newPage();
  await admin.goto('/admin/reviews');
  const row = admin.locator('[data-review-row]').filter({ hasText: 'QA Review Writer' });
  await row.getByRole('button', { name: 'Approve' }).click();
  await expect(admin.getByText('Review is now shown on the website.').first()).toBeVisible();
  await admin.context().close();

  await page.reload();
  await expect(page.locator('#reviews')).toContainText('QA review: brilliant night and great sound.');
  await expect(page.locator('[data-review-summary]')).toContainText('5.0');
});
