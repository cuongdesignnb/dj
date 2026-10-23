import { test, expect, request as requestFactory } from '@playwright/test';
import type { APIRequestContext, Locator, Page } from '@playwright/test';
import { ADMIN_NAV } from '../../lib/admin/nav';

test.skip(process.env.GALLERY_QA !== '1', 'Dedicated QA DB/Redis opt-in required.');
test.setTimeout(240_000);

let adminState: Awaited<ReturnType<APIRequestContext['storageState']>>;

test.beforeAll(async ({ baseURL }) => {
  const target = new URL(baseURL!);
  if (!['localhost', '127.0.0.1'].includes(target.hostname) || target.port !== '43291') throw new Error('Popup sweep only targets loopback:43291.');
  const client = await requestFactory.newContext({ baseURL });
  expect((await client.post('/api/v1/auth/login', { data: { email: 'qa-admin@example.test', password: 'Gallery-QA-Only-2026!' } })).status()).toBe(200);
  adminState = await client.storageState();
  await client.dispose();
});

/** Every interactive entry is inside the viewport and is what the pointer would actually hit. */
async function expectUsable(page: Page, panel: Locator, entries: Locator, label: string) {
  await expect(panel, label).toBeVisible();
  const viewport = page.viewportSize()!;
  const count = await entries.count();
  expect(count, `${label}: entries`).toBeGreaterThan(0);
  for (let i = 0; i < count; i += 1) {
    // Long lists (search results) scroll inside their own panel by design.
    await entries.nth(i).scrollIntoViewIfNeeded();
    const box = (await entries.nth(i).boundingBox())!;
    expect(box.y + box.height, `${label} entry ${i} bottom`).toBeLessThanOrEqual(viewport.height + 0.5);
    expect(box.y, `${label} entry ${i} top`).toBeGreaterThanOrEqual(-0.5);
    const hitsSelf = await entries.nth(i).evaluate((el) => {
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return !!hit && (hit === el || el.contains(hit));
    });
    expect(hitsSelf, `${label} entry ${i} is not covered or clipped`).toBe(true);
  }
}

test('every Admin list screen: the last row action menu is fully visible and clickable', async ({ browser }) => {
  const context = await browser.newContext({ storageState: adminState, viewport: { width: 1440, height: 800 } });
  const page = await context.newPage();
  const hrefs = [...new Set(ADMIN_NAV.flatMap((group) => group.items.map((item) => item.href)))].filter((href) => !href.endsWith('/new'));
  const checked: string[] = [];
  for (const href of hrefs) {
    await page.goto(href);
    const triggers = page.locator('table').getByRole('button', { name: /^Actions for / });
    await page.waitForLoadState('networkidle');
    if (await triggers.count() === 0) continue;
    await triggers.last().scrollIntoViewIfNeeded();
    await triggers.last().click();
    const menu = page.locator('[data-row-menu]');
    await expectUsable(page, menu, menu.getByRole('menuitem'), href);
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    checked.push(href);
  }
  // The sweep must actually have exercised the list screens.
  expect(checked.length, `checked: ${checked.join(', ')}`).toBeGreaterThanOrEqual(8);
  await context.close();
});

test('top bar search results, notifications and account menu are fully visible', async ({ browser }) => {
  const context = await browser.newContext({ storageState: adminState, viewport: { width: 1440, height: 800 } });
  const page = await context.newPage();
  await page.goto('/admin/events');
  await page.getByPlaceholder('Search anything...').fill('destiny');
  const results = page.getByRole('listbox', { name: 'Search results' });
  await expect(results.getByRole('option').first()).toBeVisible();
  await expectUsable(page, results, results.getByRole('option'), 'search');
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: /^Notifications,/ }).click();
  const panel = page.locator('[id]').filter({ hasText: 'Notifications' }).filter({ has: page.locator('p') }).last();
  await expect(panel).toBeVisible();

  await page.getByRole('button', { name: /Site administrator|QA admin|Gallery QA/i }).last().click();
  const account = page.getByRole('menu');
  await expectUsable(page, account, account.getByRole('menuitem'), 'account menu');
  await context.close();
});
