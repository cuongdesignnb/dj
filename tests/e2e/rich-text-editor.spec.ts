import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test, expect, request as requestFactory } from '@playwright/test';
import type { APIRequestContext, Browser, Locator, Page } from '@playwright/test';

test.skip(process.env.GALLERY_QA !== '1', 'Dedicated QA DB/Redis opt-in required.');
test.describe.configure({ mode: 'serial' });
test.setTimeout(120_000);
test.use({ actionTimeout: 10_000 });

type Setup = { eventId: string; packageId: string };
let admin: APIRequestContext;
let adminState: Awaited<ReturnType<APIRequestContext['storageState']>>;
let setup: Setup;
const slug = 'qa-multi-event';

function fixture<T>(action: string, value: unknown = {}): T {
  // Compose pins its own DB URL. Neither the caller nor a production env can override it.
  const output = execFileSync('docker', ['compose', '-f', 'docker/compose.gallery-qa.yml', 'exec', '-T', '--env', 'QA_FIXTURE_ACTION=' + action, '--env', 'QA_FIXTURE_VALUE=' + JSON.stringify(value), 'app', 'node', '--input-type=module'], { input: readFileSync(path.resolve('tests/fixtures/event-content-qa.mjs')), encoding: 'utf8', timeout: 30_000 });
  return JSON.parse(output.trim()) as T;
}
async function adminPage(browser: Browser): Promise<Page> {
  return (await browser.newContext({ storageState: adminState })).newPage();
}
/** The editor (toolbar + content) that owns the textbox with this accessible name. */
function editorFor(page: Page, name: string): { box: Locator; tool: (label: string) => Locator } {
  const box = page.getByRole('textbox', { name, exact: true });
  const root = page.locator('[data-rich-text-editor]').filter({ has: box });
  return { box, tool: (label) => root.getByRole('button', { name: label, exact: true }) };
}

test.beforeAll(async ({ baseURL }) => {
  const target = new URL(baseURL!);
  if (!['localhost', '127.0.0.1'].includes(target.hostname) || target.port !== '43291') throw new Error('Rich text tests only target loopback:43291.');
  setup = fixture<Setup>('setup');
  const client = await requestFactory.newContext({ baseURL });
  expect((await client.post('/api/v1/auth/login', { data: { email: 'qa-admin@example.test', password: 'Gallery-QA-Only-2026!' } })).status()).toBe(200);
  adminState = await client.storageState();
  await client.dispose();
  const token = adminState.cookies.find((cookie) => cookie.name === 'destiny_csrf')!.value;
  admin = await requestFactory.newContext({ baseURL, storageState: adminState, extraHTTPHeaders: { 'x-csrf-token': token } });
});
test.afterAll(async () => {
  fixture('cleanup');
  await admin?.dispose();
});

test('event long description: toolbar formatting saves as rich text and renders on the event page', async ({ browser, page }) => {
  const editor = await adminPage(browser);
  await editor.goto('/admin/events/' + setup.eventId + '/edit');
  const long = editorFor(editor, 'Long description');
  await expect(long.box).toBeVisible();
  // Loading the editors must not mark the form as changed.
  await expect(editor.getByText('All changes saved', { exact: true })).toBeVisible();
  await long.box.click();
  await editor.keyboard.type('Hi-Land intro paragraph.');
  await editor.keyboard.press('Enter');
  await long.tool('Bold').click();
  await editor.keyboard.type('Bold words');
  await long.tool('Bold').click();
  await editor.keyboard.type(' then normal text.');
  await editor.keyboard.press('Enter');
  await long.tool('Bulleted list').click();
  await editor.keyboard.type('First point');
  await editor.keyboard.press('Enter');
  await editor.keyboard.type('Second point');
  await editor.keyboard.press('Enter');
  await editor.keyboard.press('Enter');
  await editor.keyboard.type('Tickets: ');
  await long.tool('Link').click();
  await editor.getByRole('textbox', { name: 'Link address' }).fill('javascript:alert(1)');
  await editor.getByRole('button', { name: 'Apply link', exact: true }).click();
  await expect(editor.getByText('Use https://, mailto:, tel: or a site path starting with /.')).toBeVisible();
  await editor.getByRole('textbox', { name: 'Link address' }).fill('/tickets?event=' + slug);
  await editor.getByRole('button', { name: 'Apply link', exact: true }).click();
  await expect(long.box.locator('strong')).toHaveText('Bold words');
  await expect(long.box.locator('li')).toHaveText(['First point', 'Second point']);

  await expect(editor.getByText('Unsaved changes', { exact: true })).toBeVisible();
  await editor.getByRole('button', { name: /^Save (Changes|Draft)$/ }).click();
  await expect(editor.getByText('All changes saved', { exact: true })).toBeVisible();
  await editor.reload();
  const reloaded = editorFor(editor, 'Long description');
  await expect(editor.getByText('All changes saved', { exact: true })).toBeVisible();
  await expect(reloaded.box.locator('strong')).toHaveText('Bold words');
  await expect(reloaded.box.locator('li')).toHaveText(['First point', 'Second point']);
  await expect(reloaded.box.locator('a')).toHaveAttribute('href', '/tickets?event=' + slug);
  await editor.context().close();

  const record = (await (await admin.get('/api/v1/admin/events/' + setup.eventId)).json()).data;
  const stored: string = record.longDescription.en;
  expect(stored).toContain('**Bold words**');
  expect(stored).toMatch(/^[-*+] First point$/m);
  expect(stored).toContain('[/tickets?event=' + slug + '](/tickets?event=' + slug + ')');
  expect(stored).not.toContain('javascript:');

  await page.goto('/events/' + slug);
  const about = page.locator('[data-rich-text]').filter({ hasText: 'Hi-Land intro paragraph.' }).first();
  await expect(about.locator('strong')).toHaveText('Bold words');
  await expect(about.locator('li')).toHaveText(['First point', 'Second point']);
  await expect(about.locator('a[href="/tickets?event=' + slug + '"]')).toBeVisible();
  const description = await page.locator('meta[name="description"]').getAttribute('content');
  expect(description).toContain('Hi-Land intro paragraph.');
  expect(description).not.toMatch(/\*\*|\]\(|^- /);
});

test('CMS content: hero and FAQ answers keep formatting from Admin to the tickets page', async ({ browser, page }) => {
  const editor = await adminPage(browser);
  await editor.goto('/admin/events/' + setup.eventId + '/tickets/content');
  await expect(editor.getByText(/Not saved yet/i)).toBeVisible();
  const hero = editorFor(editor, 'Hero description');
  await hero.box.click();
  await editor.keyboard.press('Control+A');
  await editor.keyboard.type('Doors at ');
  await hero.tool('Italic').click();
  await editor.keyboard.type('nine sharp');
  await expect(hero.tool('Bulleted list')).toHaveCount(0);

  await editor.getByRole('button', { name: 'Add question' }).click();
  const answer = editorFor(editor, 'Answer');
  await answer.box.last().click();
  await editor.keyboard.type('Bring ');
  await answer.tool('Bold').last().click();
  await editor.keyboard.type('photo ID');
  const saved = editor.waitForResponse((response) => response.url().includes('/api/v1/admin/page-content/') && response.request().method() === 'PATCH');
  await editor.getByRole('button', { name: 'Publish', exact: true }).click();
  expect((await saved).status()).toBe(200);
  await editor.context().close();

  const content = (await (await admin.get('/api/v1/admin/page-content/tickets:' + setup.eventId)).json()).data.data;
  expect(content.hero.description).toBe('Doors at *nine sharp*');
  expect(content.faq.at(-1).answer).toBe('Bring **photo ID**');

  await page.goto('/tickets?event=' + slug);
  await expect(page.locator('[data-rich-text] em').filter({ hasText: 'nine sharp' })).toBeVisible();
});
