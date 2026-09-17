import { PrismaClient } from '@prisma/client';

import { ARTISTS, BOOTH_CODES, BOTTLES, EVENT_GENRES, TICKET_TIERS } from './seeds/context';

const db = new PrismaClient();

function assertGate(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

async function main() {
  const event = await db.event.findUnique({ where: { slug: 'destiny' } });
  if (!event) throw new Error('DESTINY event is missing');
  assertGate(event.startAt === null && event.endAt === null, 'DESTINY must remain undated while TBA');

  const [artists, tickets, booths, bottles, partners, pages, locales, roles, media] = await Promise.all([
    db.artist.count({ where: { slug: { in: ARTISTS.map(([slug]) => slug) }, deletedAt: null } }),
    db.ticketTier.count({ where: { eventId: event.id, name: { in: TICKET_TIERS.map((tier) => tier.name) }, enabled: true } }),
    db.vipBooth.count({ where: { eventId: event.id, code: { in: BOOTH_CODES }, availabilityStatus: 'ON_REQUEST' } }),
    db.bottleOption.count({ where: { name: { in: [...BOTTLES] }, enabled: true } }),
    db.partner.count({ where: { slug: { in: ['mcq', 'bihi-entertainment'] }, status: 'PUBLISHED' } }),
    db.contentPage.count({ where: { slug: { in: ['home', 'about', 'contact'] }, status: 'PUBLISHED' } }),
    db.locale.count({ where: { code: { in: ['en', 'vi'] }, enabled: true } }),
    db.role.count({ where: { key: { in: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EDITOR', 'VIEWER'] } } }),
    db.mediaAsset.count({ where: { storageKey: { in: ['assets/hero-crowd.jpg', 'assets/event-poster.jpg', 'assets/vip-booth.jpg', 'assets/bar-list.jpg', 'assets/club-map.jpg', 'assets/logo-connection.svg', 'assets/logo-mcq.svg', 'assets/logo-bihi.svg'] } } }),
  ]);
  assertGate(artists >= 8, `Expected 8 canonical artists, found ${artists}`);
  assertGate(tickets >= 3, `Expected 3 ticket tiers, found ${tickets}`);
  assertGate(booths >= 12, `Expected 12 on-request booths, found ${booths}`);
  assertGate(bottles >= 6, `Expected 6 bottle options, found ${bottles}`);
  assertGate(partners >= 2, `Expected 2 confirmed partners, found ${partners}`);
  assertGate(pages >= 3, `Expected home/about/contact content pages, found ${pages}`);
  assertGate(locales === 2, `Expected en and vi locales, found ${locales}`);
  assertGate(roles === 5, `Expected five baseline roles, found ${roles}`);
  assertGate(media >= 8, `Expected registered source media, found ${media}`);
  assertGate(EVENT_GENRES.length === 4, 'Canonical genre definition is incomplete');

  const previewProducts = await db.product.findMany({ where: { slug: { in: ['destiny-oversized-tee', 'connection-hoodie', 'metro-city-poster', 'sound-meets-soul-cap', 'connection-tote', 'rave-sticker-pack'] } }, select: { status: true, publishedAt: true, indexable: true } });
  assertGate(previewProducts.every((row) => row.status !== 'PUBLISHED' && row.publishedAt === null && !row.indexable), 'Preview products must not be published or indexable');
  const legacyProduct = await db.product.findUnique({ where: { slug: 'destiny-poster' }, select: { status: true, publishedAt: true, indexable: true } });
  if (legacyProduct) assertGate(legacyProduct.status !== 'PUBLISHED' && legacyProduct.publishedAt === null && !legacyProduct.indexable, 'Legacy preview product must not be published or indexable');
  const previewNews = await db.newsArticle.findUnique({ where: { slug: 'welcome-to-connection' }, select: { status: true, publishedAt: true, indexable: true } });
  if (previewNews) assertGate(previewNews.status !== 'PUBLISHED' && previewNews.publishedAt === null && !previewNews.indexable, 'Preview news must not be published or indexable');
  const previewGallery = await db.galleryAlbum.findMany({ where: { slug: { in: ['destiny', 'destiny-preview'] } }, select: { status: true, publishedAt: true, indexable: true } });
  assertGate(previewGallery.every((row) => row.status !== 'PUBLISHED' && row.publishedAt === null && !row.indexable), 'Preview gallery must not be published or indexable');
  const legal = await db.legalDocument.findMany({ where: { type: { in: ['terms', 'privacy'] } }, select: { status: true, publishedAt: true, indexable: true } });
  assertGate(legal.length === 2 && legal.every((row) => row.status === 'DRAFT' && row.publishedAt === null && !row.indexable), 'Terms and privacy must remain drafts');

  console.log('SEED_VERIFY=PASS');
  console.log(JSON.stringify({ DESTINY: 1, artists, tickets, booths, bottles, partners, pages, locales, roles, media, previewProducts: previewProducts.length, legal: legal.length }, null, 2));
}

main()
  .catch((error) => {
    console.error(`SEED_VERIFY=FAIL: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
