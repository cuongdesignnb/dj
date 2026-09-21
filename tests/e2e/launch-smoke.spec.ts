import { test, expect } from '@playwright/test';

const publicRoutes = [
  '/',
  '/about',
  '/partners',
  '/events',
  '/events/past',
  '/events/destiny',
  '/tickets',
  '/tables',
  '/book-now',
  '/lineup',
  '/lineup/bi-hi',
  '/gallery',
  '/gallery/destiny',
  '/news',
  '/news/welcome-to-connection',
  '/shop',
  '/shop/connection-hoodie',
  '/cart',
  '/checkout/pay/00000000-0000-0000-0000-000000000000',
  '/checkout/result',
  '/faq',
  '/contact',
  '/terms',
  '/privacy',
];

test('public launch smoke routes have controlled outcomes', async ({ page, request }) => {
  const health = await request.get('/api/health');
  expect(health.status()).toBe(200);

  for (const route of publicRoutes) {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response, `${route} should return a response`).toBeTruthy();
    expect(response!.status(), `${route} should not return a server error`).toBeLessThan(500);
    await expect(page.locator('body')).not.toContainText(/couldn['’]t load|could not load|internal server error|application error/i);
  }
});
