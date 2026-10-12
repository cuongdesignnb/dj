import { test, expect, request as requestFactory } from '@playwright/test';
import type { APIRequestContext, Browser, Page } from '@playwright/test';

test.skip(process.env.GALLERY_QA !== '1', 'Dedicated QA DB/Redis opt-in required.');
test.describe.configure({ mode: 'serial' });
test.setTimeout(120_000);
test.use({ actionTimeout: 10_000 });

type State = Awaited<ReturnType<APIRequestContext['storageState']>>;
let viewer: State;
let editor: State;

async function login(baseURL: string, role: 'viewer' | 'editor'): Promise<State> {
  const client = await requestFactory.newContext({ baseURL });
  expect((await client.post('/api/v1/auth/login', { data: { email: `qa-${role}@example.test`, password: 'Gallery-QA-Only-2026!' } })).status()).toBe(200);
  const state = await client.storageState();
  await client.dispose();
  return state;
}
/** Automated browsers never get tours on their own; these tests opt in explicitly. */
async function tourPage(browser: Browser, state: State): Promise<Page> {
  const context = await browser.newContext({ storageState: state });
  await context.addInitScript(() => window.localStorage.setItem('connection-rave:admin-tour:allow-automation', '1'));
  return context.newPage();
}
const popover = (page: Page) => page.locator('.driver-popover.cr-tour');

test.beforeAll(async ({ baseURL }) => {
  const target = new URL(baseURL!);
  if (!['localhost', '127.0.0.1'].includes(target.hostname) || target.port !== '43291') throw new Error('Toast/tour tests only target loopback:43291.');
  viewer = await login(baseURL!, 'viewer');
  editor = await login(baseURL!, 'editor');
});

test('admin tour starts once, can be skipped, stays skipped, and the Guide button replays it to the end', async ({ browser }) => {
  const page = await tourPage(browser, viewer);
  await page.goto('/admin');
  await expect(popover(page)).toBeVisible();
  await expect(popover(page)).toContainText('Welcome to the Connection Rave admin');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(popover(page)).toContainText('Main menu');
  await page.getByRole('button', { name: 'Skip tour' }).click();
  await expect(popover(page)).toHaveCount(0);

  await page.reload();
  await page.waitForTimeout(1500);
  await expect(popover(page)).toHaveCount(0);
  const stored = await page.evaluate(() => Object.entries(window.localStorage).find(([key]) => key.startsWith('connection-rave:admin-tour:v1:'))?.[1]);
  expect(JSON.parse(stored ?? '{}')).toMatchObject({ dashboard: 'skipped' });

  await page.getByRole('button', { name: /Guide|Open the guide/ }).click();
  await expect(popover(page)).toContainText('Welcome to the Connection Rave admin');
  for (let i = 0; i < 20 && await page.getByRole('button', { name: 'Next' }).isVisible(); i += 1) await page.getByRole('button', { name: 'Next' }).click();
  await expect(popover(page)).toContainText('Overview');
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(popover(page)).toHaveCount(0);
  const done = await page.evaluate(() => Object.entries(window.localStorage).find(([key]) => key.startsWith('connection-rave:admin-tour:v1:'))?.[1]);
  expect(JSON.parse(done ?? '{}')).toMatchObject({ dashboard: 'done' });
  await page.context().close();
});

test('page guides only count steps that exist; Escape closes them; automated browsers without opt-in get no tour', async ({ browser }) => {
  const page = await tourPage(browser, viewer);
  await page.goto('/admin/media');
  await expect(popover(page)).toContainText('Find files');
  await page.keyboard.press('Escape');
  await expect(popover(page)).toHaveCount(0);
  await page.context().close();

  const plain = await (await browser.newContext({ storageState: viewer })).newPage();
  await plain.goto('/admin/events');
  await plain.waitForTimeout(1500);
  await expect(popover(plain)).toHaveCount(0);
  await plain.context().close();
});

test('admin toasts appear above an open drawer and can be dismissed', async ({ browser }) => {
  const page = await (await browser.newContext({ storageState: editor })).newPage();
  await page.goto('/admin/media');
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.locator('main ul li button').first().click();
  const drawer = page.locator('dialog[open]');
  await expect(drawer).toBeVisible();
  await drawer.getByRole('button', { name: 'Copy URL' }).click();
  const toastCard = page.locator('[data-toast-stack="admin"] [data-toast]').first();
  await expect(toastCard).toBeVisible();
  // The toast must be the top-most element at its own centre, i.e. not covered by the dialog.
  const onTop = await toastCard.evaluate((element) => { const box = element.getBoundingClientRect(); const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2); return Boolean(hit && element.contains(hit)); });
  expect(onTop).toBe(true);
  await toastCard.getByRole('button', { name: 'Dismiss notification' }).click();
  await expect(toastCard).toHaveCount(0);
  await page.context().close();
});

test('public contact form confirms a sent message with a toast (no false "could not be reached")', async ({ page }) => {
  await page.goto('/contact');
  await page.getByLabel('Name').fill('QA Toast Visitor');
  await page.getByLabel('Email').fill('qa-toast@example.test');
  await page.getByLabel('Message').fill('Testing the site-wide toast on the isolated QA stack.');
  const sent = page.waitForResponse((response) => response.url().endsWith('/api/v1/contact') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Send message' }).click();
  expect((await sent).status()).toBeLessThan(300);
  await expect(page.locator('[data-toast-stack="site"] [data-toast="success"]')).toContainText('Message sent');
  await expect(page.getByText('Thanks — your message has been received.')).toBeVisible();
  await expect(page.getByText('could not be reached')).toHaveCount(0);
  await expect(page.getByLabel('Name')).toHaveValue('');
});
