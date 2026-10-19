import { execFileSync } from 'node:child_process';
import { test, expect, request as requestFactory } from '@playwright/test';
import type { APIRequestContext, Locator, Page } from '@playwright/test';

test.skip(process.env.GALLERY_QA !== '1', 'Dedicated QA DB/Redis opt-in required.');
test.describe.configure({ mode: 'serial' });
test.setTimeout(180_000);
test.use({ actionTimeout: 10_000 });

// Seeded by `npm run db:seed:sponsors` (prisma/seeds/16-sponsors.ts), in Admin order.
const SPONSORS = [
  { slug: 'mcq', src: '/assets/logo-mcq.svg', role: 'Powered by' },
  { slug: 'bihi-entertainment', src: '/assets/logo-bihi.svg', role: 'Presented by' },
  { slug: 'bi-hair', src: '/assets/logo-bi-hair.svg', role: 'Official Partner' },
  { slug: 'vina9', src: '/assets/logo-vina9.svg', role: 'Official Partner' },
];
const SRCS = SPONSORS.map((sponsor) => sponsor.src);

let admin: APIRequestContext;
let adminState: Awaited<ReturnType<APIRequestContext['storageState']>>;

function sql(statement: string) {
  // Compose pins the QA database; this never reaches another environment.
  return execFileSync('docker', ['compose', '-f', 'docker/compose.gallery-qa.yml', 'exec', '-T', 'postgres', 'psql', '-U', 'gallery_qa', '-d', 'destiny_gallery_qa', '-tAc', statement], { encoding: 'utf8', timeout: 30_000 }).trim();
}

/**
 * Saves VINA9 as published through the Admin API. Unlike a raw SQL write this revalidates the
 * public sponsor cache, so the suite also starts clean right after an out-of-band seed.
 */
async function republishVina9() {
  const [id, logoMediaId] = sql("select id || '|' || logo_media_id from partners where slug = 'vina9'").split('|');
  const translations = (['en', 'vi'] as const).map((locale) => ({ locale, name: 'VINA9', tagline: 'Official Partner' }));
  const response = await admin.put(`/api/v1/admin/partners/${id}`, { data: { slug: 'vina9', type: 'sponsor', status: 'PUBLISHED', logoMediaId, featured: false, sortOrder: 3, translations } });
  expect(response.status()).toBe(200);
}

async function srcs(slot: Locator) {
  return slot.locator('img[data-partner-logo]').evaluateAll((items) => items.map((item) => item.getAttribute('src')));
}

/** Every logo in the slot is decoded by the browser (scrolls lazy ones into view first). */
async function expectRendered(page: Page, slot: Locator, label: string) {
  const logos = slot.locator('img[data-partner-logo]');
  for (let index = 0; index < await logos.count(); index += 1) {
    const logo = logos.nth(index);
    await logo.scrollIntoViewIfNeeded();
    await expect.poll(() => logo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0), { message: `${label} logo ${index}` }).toBe(true);
    const box = await logo.boundingBox();
    expect(box?.height ?? 0, `${label} logo ${index} height`).toBeGreaterThan(20);
  }
}

test.beforeAll(async ({ baseURL }) => {
  const target = new URL(baseURL!);
  if (!['localhost', '127.0.0.1'].includes(target.hostname) || target.port !== '43291') throw new Error('Sponsor tests only target loopback:43291.');
  const client = await requestFactory.newContext({ baseURL });
  expect((await client.post('/api/v1/auth/login', { data: { email: 'qa-admin@example.test', password: 'Gallery-QA-Only-2026!' } })).status()).toBe(200);
  adminState = await client.storageState();
  await client.dispose();
  const token = adminState.cookies.find((cookie) => cookie.name === 'destiny_csrf')!.value;
  admin = await requestFactory.newContext({ baseURL, storageState: adminState, extraHTTPHeaders: { 'x-csrf-token': token } });
  await republishVina9();
});
test.afterAll(async () => {
  // The admin test publishes VINA9 again through the UI; this only repairs an interrupted run.
  if (admin && sql("select status from partners where slug = 'vina9'") !== 'PUBLISHED') await republishVina9();
  await admin?.dispose();
});

test('seeded sponsor logos are served as SVG files', async ({ request }) => {
  for (const src of SRCS) {
    const response = await request.get(src);
    expect(response.status(), src).toBe(200);
    expect(response.headers()['content-type'], src).toContain('image/svg+xml');
  }
  const partners = (await (await request.get('/api/v1/partners')).json()).data as Array<{ id: string; slug: string; tagline: string | null; logo: { src: string } | null }>;
  const bySlug = new Map(partners.map((partner) => [partner.slug, partner]));
  for (const sponsor of SPONSORS) {
    expect(bySlug.get(sponsor.slug)?.logo?.src, sponsor.slug).toBe(sponsor.src);
    expect(bySlug.get(sponsor.slug)?.tagline, sponsor.slug).toBe(sponsor.role);
  }
  // The partner id is the partner's own, not a translation row's.
  const ids = sql(`select id from partners where slug in ('mcq','bihi-entertainment','bi-hair','vina9')`).split('\n');
  for (const sponsor of SPONSORS) expect(ids).toContain(bySlug.get(sponsor.slug)?.id);
});

test('home hero, VIP block and footer show every sponsor from Admin, in order', async ({ page }) => {
  await page.goto('/');
  const hero = page.locator('[data-sponsor-slot="hero"]');
  await expect(hero.locator('img[data-partner-logo]')).toHaveCount(SPONSORS.length);
  expect(await srcs(hero)).toEqual(SRCS);
  await expect(hero).toContainText('Powered by MCQ', { ignoreCase: true });
  await expect(hero).toContainText('Presented by BIHI Entertainment', { ignoreCase: true });
  await expect(hero).toContainText('Official Partner VINA9', { ignoreCase: true });
  await expectRendered(page, hero, 'hero');
  // The old hard-coded pair is gone: every logo now comes from the partner data.
  await expect(page.locator('img[src="/assets/logo-mcq.svg"]:not([data-partner-logo])')).toHaveCount(0);
  await expect(page.locator('img[src="/assets/logo-bihi.svg"]:not([data-partner-logo])')).toHaveCount(0);

  const vipLead = page.locator('section').filter({ has: page.locator('img[data-site-logo]') }).locator(`img[data-partner-logo][src="${SRCS[0]}"]`);
  await expect(vipLead.first()).toBeAttached();

  const footer = page.locator('[data-sponsor-slot="home-footer"]');
  expect(await srcs(footer)).toEqual(SRCS);
  await expectRendered(page, footer, 'home footer');
  // Partners with a logo are not repeated as plain text.
  await expect(footer.getByText('Official Partners', { exact: true })).toHaveCount(0);
});

test('shared footers on support, legal, listing and event pages show the sponsors', async ({ page }) => {
  for (const path of ['/faq', '/terms', '/privacy', '/events', '/tickets', '/gallery', '/news']) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBeLessThan(500);
    const slot = page.locator('[data-sponsor-slot="footer"]');
    if (await slot.count() === 0) {
      // Some pages render the home footer instead.
      expect(await srcs(page.locator('[data-sponsor-slot="home-footer"]')), path).toEqual(SRCS);
      continue;
    }
    expect(await srcs(slot), path).toEqual(SRCS);
    await expectRendered(page, slot, path);
  }
  await page.goto('/events/destiny');
  const eventFooter = page.locator('[data-sponsor-slot="event-footer"]');
  expect(await srcs(eventFooter)).toEqual(SRCS);
  await expectRendered(page, eventFooter, '/events/destiny');
});

test('partners and about pages render the seeded logos', async ({ page }) => {
  for (const path of ['/partners', '/about']) {
    await page.goto(path);
    const found = await page.locator('img[data-partner-logo]').evaluateAll((items) => items.map((item) => item.getAttribute('src')));
    for (const src of SRCS) expect(found, `${path} ${src}`).toContain(src);
    await expect(page.locator('img[data-partner-logo][src=""]'), path).toHaveCount(0);
  }
});

test('unpublishing a sponsor in Admin removes it everywhere, publishing brings it back', async ({ browser, page }) => {
  const vina9 = { id: sql("select id from partners where slug = 'vina9'") };
  expect(vina9.id).toMatch(/^[0-9a-f-]{36}$/);
  const editor = await (await browser.newContext({ storageState: adminState })).newPage();
  const status = async () => (await (await admin.get(`/api/v1/admin/partners/${vina9.id}`)).json()).data.status;

  await editor.goto(`/admin/partners/${vina9.id}/edit`);
  await expect(editor.getByRole('textbox', { name: /^Name/ })).toHaveValue('VINA9');
  await expect(editor.getByRole('textbox', { name: /^Tagline/ })).toHaveValue('Official Partner');
  await editor.getByRole('combobox', { name: /^Status/ }).selectOption('draft');
  await editor.getByRole('button', { name: 'Save Changes', exact: true }).click();
  await expect.poll(status).toBe('draft');

  await expect.poll(async () => {
    await page.goto('/');
    return srcs(page.locator('[data-sponsor-slot="hero"]'));
  }).toEqual(SRCS.slice(0, 3));
  await page.goto('/faq');
  expect(await srcs(page.locator('[data-sponsor-slot="footer"]'))).toEqual(SRCS.slice(0, 3));

  await editor.reload();
  await editor.getByRole('button', { name: 'Publish', exact: true }).click();
  await editor.getByRole('dialog', { name: 'Publish now?' }).getByRole('button', { name: 'Publish', exact: true }).click();
  await expect.poll(status).toBe('published');
  await expect.poll(async () => {
    await page.goto('/');
    return srcs(page.locator('[data-sponsor-slot="hero"]'));
  }).toEqual(SRCS);
  await editor.context().close();
});
