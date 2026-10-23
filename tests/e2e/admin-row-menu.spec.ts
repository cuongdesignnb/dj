import { test, expect, request as requestFactory } from '@playwright/test';
import type { APIRequestContext, Locator, Page } from '@playwright/test';

test.skip(process.env.GALLERY_QA !== '1', 'Dedicated QA DB/Redis opt-in required.');
test.describe.configure({ mode: 'serial' });

let editorState: Awaited<ReturnType<APIRequestContext['storageState']>>;

test.beforeAll(async ({ baseURL }) => {
  const target = new URL(baseURL!);
  if (!['localhost', '127.0.0.1'].includes(target.hostname) || target.port !== '43291') throw new Error('Row menu tests only target loopback:43291.');
  const client = await requestFactory.newContext({ baseURL });
  expect((await client.post('/api/v1/auth/login', { data: { email: 'qa-editor@example.test', password: 'Gallery-QA-Only-2026!' } })).status()).toBe(200);
  editorState = await client.storageState();
  await client.dispose();
});

/** Every item is inside the viewport and is the element actually hit at its centre (nothing clips or covers it). */
async function expectFullyUsable(page: Page, menu: Locator) {
  const items = menu.getByRole('menuitem');
  expect(await items.count()).toBeGreaterThan(0);
  const viewport = page.viewportSize()!;
  for (let i = 0; i < await items.count(); i += 1) {
    const box = (await items.nth(i).boundingBox())!;
    expect(box.y, `item ${i} top`).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height, `item ${i} bottom`).toBeLessThanOrEqual(viewport.height);
    expect(box.x + box.width, `item ${i} right`).toBeLessThanOrEqual(viewport.width);
    const hit = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest('[role="menuitem"]')?.textContent?.trim() ?? null, [box.x + box.width / 2, box.y + box.height / 2]);
    expect(hit, `item ${i} is on top`).toBe((await items.nth(i).textContent())?.trim());
  }
}

for (const path of ['/admin/partners', '/admin/events', '/admin/artists']) {
  test(`the last row's actions menu on ${path} is fully visible and usable`, async ({ browser }) => {
    const context = await browser.newContext({ storageState: editorState, viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(path);
    const triggers = page.locator('table').getByRole('button', { name: /^Actions for / });
    await expect(triggers.first()).toBeVisible();
    await triggers.last().click();
    const menu = page.locator('[data-row-menu]');
    await expect(menu).toBeVisible();
    await expectFullyUsable(page, menu);
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    await expect(triggers.last()).toBeFocused();
    await context.close();
  });
}

test('near the bottom of the screen the menu opens upwards and follows scrolling', async ({ browser }) => {
  const context = await browser.newContext({ storageState: editorState, viewport: { width: 1280, height: 640 } });
  const page = await context.newPage();
  await page.goto('/admin/partners');
  const trigger = page.locator('table').getByRole('button', { name: /^Actions for / }).last();
  await trigger.scrollIntoViewIfNeeded();
  // Put the last row right at the bottom edge of the viewport.
  await page.evaluate(() => {
    const button = [...document.querySelectorAll('table button[aria-label^="Actions for "]')].pop()!;
    window.scrollBy({ top: button.getBoundingClientRect().bottom - window.innerHeight + 12, behavior: 'instant' });
  });
  await trigger.click();
  const menu = page.locator('[data-row-menu]');
  await expect(menu).toHaveAttribute('data-placement', 'top');
  await expectFullyUsable(page, menu);
  // After scrolling, the menu stays attached to its trigger (above or below it).
  const attached = async () => {
    const m = (await menu.boundingBox())!;
    const t = (await trigger.boundingBox())!;
    return Math.min(Math.abs(m.y + m.height + 4 - t.y), Math.abs(m.y - (t.y + t.height + 4))) <= 2;
  };
  expect(await attached()).toBe(true);
  await page.evaluate(() => window.scrollBy({ top: -40, behavior: 'instant' }));
  await expect.poll(attached).toBe(true);
  // Clicking outside closes it; clicking an item works.
  await page.mouse.click(5, 5);
  await expect(menu).toHaveCount(0);
  await trigger.click();
  await menu.getByRole('menuitem', { name: 'Edit' }).click();
  await expect(page).toHaveURL(/\/admin\/partners\/.+\/edit$/);
  await context.close();
});
