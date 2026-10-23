import { test, expect, devices } from '@playwright/test';
import type { Page } from '@playwright/test';

test.skip(process.env.GALLERY_QA !== '1', 'Dedicated QA stack opt-in required.');

async function expectVisibleCardsRevealed(page: Page) {
  await page.goto('/');
  await page.getByRole('link', { name: /view full lineup/i }).first().scrollIntoViewIfNeeded();
  const images = page.locator('a[href^="/lineup/"] div[style*="background-image"]');
  await expect(images.first()).toBeAttached();
  // Cards actually showing inside the carousel (it clips the ones further right).
  const shownStates = () => images.evaluateAll((els) => els
    .filter((el) => {
      const r = el.getBoundingClientRect();
      const scroller = el.closest('.overflow-x-auto')!.getBoundingClientRect();
      return r.left < scroller.right - 40 && r.right > scroller.left + 40 && r.top < window.innerHeight && r.bottom > 0;
    })
    .map((el) => getComputedStyle(el).clipPath));
  expect((await shownStates()).length).toBeGreaterThan(0);
  await expect.poll(async () => (await shownStates()).every((clip) => clip.startsWith('inset(0')), { timeout: 3_000 }).toBe(true);
  // The first card in particular, which used to stay blank.
  expect(await images.first().evaluate((el) => getComputedStyle(el).clipPath)).toMatch(/^inset\(0/);
}

test('home lineup: the first artist card shows its image as soon as the cards appear', async ({ page }) => {
  await page.setViewportSize({ width: 1620, height: 900 });
  await expectVisibleCardsRevealed(page);
});

test.describe('on a phone', () => {
  const { defaultBrowserType: _browser, ...iPhone } = devices['iPhone 13'];
  void _browser;
  test.use(iPhone);
  test('the first artist card is revealed too', async ({ page }) => {
    await expectVisibleCardsRevealed(page);
  });
});
