import { test, expect, devices } from '@playwright/test';

test.skip(process.env.GALLERY_QA !== '1', 'Dedicated QA stack opt-in required.');

const ALIASES: Array<[string, string]> = [
  ['/home', '/'],
  ['/index.html', '/'],
  ['/ticket', '/tickets'],
  ['/table', '/tables'],
  ['/vip', '/tables'],
  ['/booking', '/book-now'],
  ['/book', '/book-now'],
  ['/artists', '/lineup'],
  ['/merch', '/shop'],
  ['/sponsors', '/partners'],
  ['/photos', '/gallery'],
  ['/contact-us', '/contact'],
];

test('common shortened links redirect temporarily and keep the query string', async ({ request }) => {
  for (const [source, destination] of ALIASES) {
    const response = await request.get(source, { maxRedirects: 0 });
    expect(response.status(), source).toBe(307);
    expect(response.headers().location, source).toBe(destination);
  }
  const scoped = await request.get('/ticket?event=hi-land-perth', { maxRedirects: 0 });
  expect(scoped.headers().location).toBe('/tickets?event=hi-land-perth');
});

test('an unknown URL shows the branded 404 with a way back, and is not indexed', async ({ page }) => {
  const response = await page.goto('/this-page-does-not-exist');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: "This page doesn't exist" })).toBeVisible();
  await expect(page.getByText('This page could not be found')).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute('content', /noindex/);
  await expect(page.locator('header img[data-site-logo]')).toBeVisible();
  await page.locator('[data-not-found]').getByRole('link', { name: 'Back to home' }).click();
  await expect(page).toHaveURL(/\/$/);
});

test.describe('on a phone', () => {
  const { defaultBrowserType: _browser, ...iPhone } = devices['iPhone 13'];
  void _browser;
  test.use(iPhone);

  test('a capitalised path from autocorrect lands on the real page', async ({ page }) => {
    await page.goto('/Tickets');
    await expect(page).toHaveURL(/\/tickets$/);
    await page.goto('/Gallery?x=1');
    await expect(page).toHaveURL(/\/gallery\?x=1$/);
  });

  test('the 404 fits the screen and its buttons are tappable', async ({ page }) => {
    await page.goto('/nope');
    const home = page.locator('[data-not-found]').getByRole('link', { name: 'Back to home' });
    await expect(home).toBeVisible();
    expect((await home.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});
