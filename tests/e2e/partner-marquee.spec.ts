import { test, expect, devices } from '@playwright/test';
import type { Page } from '@playwright/test';

test.skip(process.env.GALLERY_QA !== '1', 'Dedicated QA stack opt-in required.');

async function expectSeamless(page: Page) {
  await page.goto('/');
  const strip = page.locator('[data-partner-marquee]');
  await strip.scrollIntoViewIfNeeded();
  const m = await strip.evaluate((el) => {
    const track = el.querySelector('.partner-marquee-track') as HTMLElement;
    const halves = [...track.children] as HTMLElement[];
    const animation = track.getAnimations()[0];
    const duration = Number(animation.effect!.getComputedTiming().duration);
    animation.pause();
    animation.currentTime = 0;
    const firstAtStart = halves[0].getBoundingClientRect().left;
    // One full loop: the track has moved by exactly one half.
    animation.currentTime = duration - 0.001;
    const secondAtEnd = halves[1].getBoundingClientRect().left;
    return {
      halves: halves.length,
      widths: halves.map((h) => h.getBoundingClientRect().width),
      viewport: window.innerWidth,
      seam: Math.abs(secondAtEnd - firstAtStart),
      logos: el.querySelectorAll('img[data-partner-logo]').length,
    };
  });
  expect(m.halves).toBe(2);
  expect(Math.abs(m.widths[0] - m.widths[1])).toBeLessThan(1);
  // Each half covers the screen, so no blank space ever shows.
  expect(m.widths[0]).toBeGreaterThan(m.viewport);
  expect(m.seam).toBeLessThan(1);
  expect(m.logos).toBeGreaterThan(0);
}

test('the partner marquee loops seamlessly and fills the screen on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 900 });
  await expectSeamless(page);
});

test.describe('on a phone', () => {
  const { defaultBrowserType: _browser, ...iPhone } = devices['iPhone 13'];
  void _browser;
  test.use(iPhone);
  test('loops seamlessly too', async ({ page }) => { await expectSeamless(page); });
});

test('reduced motion stops the marquee', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  const running = await page.locator('[data-partner-marquee] .partner-marquee-track').evaluate((el) => el.getAnimations().length);
  expect(running).toBe(0);
  await context.close();
});
