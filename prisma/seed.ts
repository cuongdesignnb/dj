import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const db = new PrismaClient();

const permissions = [
  'events.view', 'events.create', 'events.edit', 'events.publish', 'events.delete',
  'artists.view', 'artists.create', 'artists.edit', 'artists.publish', 'artists.delete',
  'products.view', 'products.create', 'products.edit', 'products.publish', 'products.delete',
  'orders.view', 'orders.edit', 'orders.notes',
  'news.view', 'news.create', 'news.edit', 'news.publish', 'news.delete',
  'gallery.view', 'gallery.create', 'gallery.edit', 'gallery.publish', 'gallery.delete',
  'media.view', 'media.create', 'media.edit', 'media.delete',
  'content.view', 'content.edit', 'content.publish',
  'partners.view', 'partners.create', 'partners.edit', 'partners.delete',
  'staff.view', 'staff.create', 'staff.edit', 'staff.disable',
  'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
  'settings.view', 'settings.edit',
  'support.view', 'support.edit',
];

const artists = [
  ['ryal', 'RYAL', 'VIETNAM', 'artist-ryal.jpg'],
  ['nicole-chen', 'NICOLE CHEN', 'SINGAPORE', 'artist-nicole-chen.jpg'],
  ['kickcheeze', 'KICKCHEEZE', 'AUSTRALIA', 'artist-kickcheeze.jpg'],
  ['bi-hi', 'BI HI', 'VIETNAM', 'artist-bi-hi.jpg'],
  ['rysal', 'RYSAL', 'AUSTRALIA', 'artist-rysal.jpg'],
  ['maya', 'MAYA', 'SINGAPORE', 'artist-maya.jpg'],
  ['mico', 'MICO', 'AUSTRALIA', 'artist-mico.jpg'],
  ['ems', 'EMS', 'AUSTRALIA', 'artist-ems.jpg'],
] as const;

const bottles = [
  'Belvedere Vodka',
  'Hennessy VS',
  'El Jimador Tequila',
  'Moët & Chandon',
  'Jager',
  'WAP Cranberry Peach',
] as const;

async function seedMedia(storageKey: string, altText: string) {
  return db.mediaAsset.upsert({
    where: { storageKey },
    update: { altText, publicUrl: `/${storageKey}` },
    create: {
      storageDriver: 'LOCAL',
      storageKey,
      publicUrl: `/${storageKey}`,
      mimeType: storageKey.endsWith('.svg') ? 'image/svg+xml' : 'image/jpeg',
      sizeBytes: 0,
      altText,
    },
  });
}

async function seedAccessControl() {
  const permissionRows = await Promise.all(
    permissions.map((key) => {
      const [module, action] = key.split('.');
      return db.permission.upsert({
        where: { key },
        update: { module, action },
        create: { key, module, action },
      });
    }),
  );

  const role = await db.role.upsert({
    where: { key: 'super_admin' },
    update: { name: 'Super administrator', isSystem: true },
    create: { key: 'super_admin', name: 'Super administrator', isSystem: true },
  });

  await Promise.all(
    permissionRows.map((permission) =>
      db.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      }),
    ),
  );

  const email = process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD;
  if (!email || !password) {
    console.log('[seed] ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD are not set; no admin user created.');
    return;
  }

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  const user = await db.adminUser.upsert({
    where: { email },
    update: { name: 'Site administrator', passwordHash, status: 'ACTIVE' },
    create: { email, name: 'Site administrator', passwordHash, status: 'ACTIVE' },
  });

  await db.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    update: {},
    create: { userId: user.id, roleId: role.id },
  });
}

async function seedDestiny() {
  const poster = await seedMedia('assets/event-poster.jpg', 'DESTINY event poster');
  const hero = await seedMedia('assets/hero-crowd.jpg', 'Crowd at a Connection Rave event');

  const event = await db.event.upsert({
    where: { slug: 'destiny' },
    update: {
      status: 'PUBLISHED',
      dateStatus: 'TBA',
      scheduleStatus: 'TBC',
      startAt: null,
      endAt: null,
      venueName: 'Metro City',
      city: 'Perth',
      country: 'Australia',
      posterMediaId: poster.id,
      heroMediaId: hero.id,
      featured: true,
      publishedAt: new Date(),
    },
    create: {
      slug: 'destiny',
      status: 'PUBLISHED',
      lifecycleStatus: 'UPCOMING',
      dateStatus: 'TBA',
      scheduleStatus: 'TBC',
      venueName: 'Metro City',
      city: 'Perth',
      country: 'Australia',
      posterMediaId: poster.id,
      heroMediaId: hero.id,
      featured: true,
      publishedAt: new Date(),
    },
  });

  for (const locale of ['en', 'vi']) {
    await db.eventTranslation.upsert({
      where: { eventId_locale: { eventId: event.id, locale } },
      update: {
        title: 'DESTINY',
        eyebrow: 'MUSIC MEETS SOUL',
        shortDescription: locale === 'vi' ? 'Âm nhạc, văn hóa và con người kết nối tại Perth.' : 'Music, culture and people connect in Perth.',
        description: locale === 'vi'
          ? 'DESTINY là trải nghiệm nightlife nơi âm nhạc, văn hóa và con người gặp nhau trên sàn nhảy.'
          : 'DESTINY is a high-energy nightlife experience where music, culture and people meet on the dancefloor.',
      },
      create: {
        eventId: event.id,
        locale,
        title: 'DESTINY',
        eyebrow: 'MUSIC MEETS SOUL',
        shortDescription: locale === 'vi' ? 'Âm nhạc, văn hóa và con người kết nối tại Perth.' : 'Music, culture and people connect in Perth.',
        description: locale === 'vi'
          ? 'DESTINY là trải nghiệm nightlife nơi âm nhạc, văn hóa và con người gặp nhau trên sàn nhảy.'
          : 'DESTINY is a high-energy nightlife experience where music, culture and people meet on the dancefloor.',
      },
    });
  }

  await db.eventGenre.deleteMany({ where: { eventId: event.id } });
  await db.eventGenre.createMany({
    data: ['EDM', 'Hardstyle', 'Techno', 'Vinahouse'].map((genre, sortOrder) => ({ eventId: event.id, genre, sortOrder })),
  });

  await db.ticketTier.deleteMany({ where: { eventId: event.id } });
  await db.ticketTier.createMany({
    data: [
      { eventId: event.id, name: 'Student Concession', priceMinor: 3500, currency: 'AUD', badge: 'Best Value', availabilityStatus: 'NOT_AVAILABLE', sortOrder: 0 },
      { eventId: event.id, name: 'Final Release', priceMinor: 6600, currency: 'AUD', availabilityStatus: 'NOT_AVAILABLE', sortOrder: 1 },
      { eventId: event.id, name: 'Ticket At Door', priceMinor: 10000, currency: 'AUD', purchasableAtDoor: true, availabilityStatus: 'NOT_AVAILABLE', sortOrder: 2 },
    ],
  });

  const vip = await db.vipPackage.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: { eventId: event.id, name: 'BOOTH PACKAGE', priceMinor: 320000, capacity: 15, includedBottleCount: 3, enabled: true, sortOrder: 0 },
    create: { id: '00000000-0000-0000-0000-000000000001', eventId: event.id, name: 'BOOTH PACKAGE', priceMinor: 320000, currency: 'AUD', capacity: 15, includedBottleCount: 3, enabled: true, sortOrder: 0 },
  });

  await db.vipBooth.deleteMany({ where: { eventId: event.id } });
  await db.vipBooth.createMany({ data: [
    { eventId: event.id, code: 'L01', zone: 'left', x: 18, y: 52, sortOrder: 0 },
    { eventId: event.id, code: 'L02', zone: 'left', x: 30, y: 38, sortOrder: 1 },
    { eventId: event.id, code: 'R01', zone: 'right', x: 82, y: 52, sortOrder: 2 },
    { eventId: event.id, code: 'R02', zone: 'right', x: 70, y: 38, sortOrder: 3 },
    { eventId: event.id, code: 'F01', zone: 'front', x: 50, y: 22, sortOrder: 4 },
  ] });

  for (const [sortOrder, name] of bottles.entries()) {
    const bottle = await db.bottleOption.upsert({
      where: { name },
      update: { enabled: true, sortOrder },
      create: { name, enabled: true, sortOrder },
    });
    await db.vipPackageBottle.upsert({
      where: { vipPackageId_bottleOptionId: { vipPackageId: vip.id, bottleOptionId: bottle.id } },
      update: {},
      create: { vipPackageId: vip.id, bottleOptionId: bottle.id },
    });
  }

  for (const [sortOrder, [slug, name, country, portraitFile]] of artists.entries()) {
    const portrait = await seedMedia(`assets/${portraitFile}`, `${name}, ${country.toLowerCase()} artist`);
    const artist = await db.artist.upsert({
      where: { slug },
      update: { country, yearLabel: '2026', status: 'PUBLISHED', portraitMediaId: portrait.id, featured: true },
      create: { slug, country, yearLabel: '2026', status: 'PUBLISHED', portraitMediaId: portrait.id, featured: true },
    });
    for (const locale of ['en', 'vi']) {
      await db.artistTranslation.upsert({
        where: { artistId_locale: { artistId: artist.id, locale } },
        update: { name },
        create: { artistId: artist.id, locale, name },
      });
    }
    await db.eventArtist.upsert({
      where: { eventId_artistId: { eventId: event.id, artistId: artist.id } },
      update: { sortOrder },
      create: { eventId: event.id, artistId: artist.id, sortOrder },
    });
  }
}

async function seedProducts() {
  const categories = [
    ['apparel', 'Apparel'],
    ['accessories', 'Accessories'],
    ['posters', 'Posters'],
  ] as const;
  const categoryRows = new Map<string, string>();
  for (const [key, label] of categories) {
    const category = await db.productCategory.upsert({ where: { key }, update: { label }, create: { key, label } });
    categoryRows.set(key, category.id);
  }

  const catalogue = [
    { slug: 'destiny-oversized-tee', title: 'DESTINY Oversized Tee', category: 'apparel', priceMinor: 6500, image: 'merch/tee-front.svg', featured: true },
    { slug: 'connection-hoodie', title: 'Connection Hoodie', category: 'apparel', priceMinor: 11000, image: 'merch/hoodie-front.svg', featured: false },
    { slug: 'destiny-poster', title: 'DESTINY Poster', category: 'posters', priceMinor: 2500, image: 'merch/poster.svg', featured: false },
  ] as const;

  for (const [sortOrder, item] of catalogue.entries()) {
    const media = await seedMedia(item.image, item.title);
    const product = await db.product.upsert({
      where: { slug: item.slug },
      update: { categoryId: categoryRows.get(item.category), status: 'PUBLISHED', basePriceMinor: item.priceMinor, currency: 'AUD', featured: item.featured, publishedAt: new Date() },
      create: { slug: item.slug, categoryId: categoryRows.get(item.category), status: 'PUBLISHED', basePriceMinor: item.priceMinor, currency: 'AUD', featured: item.featured, publishedAt: new Date() },
    });
    for (const locale of ['en', 'vi']) {
      await db.productTranslation.upsert({ where: { productId_locale: { productId: product.id, locale } }, update: { title: item.title, excerpt: locale === 'vi' ? 'Sản phẩm chính thức của Connection.' : 'Official Connection merchandise.', description: locale === 'vi' ? 'Sản phẩm được phát hành từ catalogue đã xuất bản.' : 'Published merchandise from the Connection catalogue.' }, create: { productId: product.id, locale, title: item.title, excerpt: locale === 'vi' ? 'Sản phẩm chính thức của Connection.' : 'Official Connection merchandise.', description: locale === 'vi' ? 'Sản phẩm được phát hành từ catalogue đã xuất bản.' : 'Published merchandise from the Connection catalogue.' } });
    }
    await db.productImage.deleteMany({ where: { productId: product.id } });
    await db.productImage.create({ data: { productId: product.id, mediaId: media.id, label: 'Primary', sortOrder } });
  }
}

async function seedNewsAndGallery() {
  const hero = await seedMedia('assets/hero-crowd.jpg', 'Connection Rave crowd');
  const poster = await seedMedia('assets/event-poster.jpg', 'DESTINY poster');
  const event = await db.event.findUniqueOrThrow({ where: { slug: 'destiny' } });
  const article = await db.newsArticle.upsert({ where: { slug: 'welcome-to-connection' }, update: { status: 'PUBLISHED', featured: true, heroMediaId: hero.id, cardMediaId: poster.id, relatedEventId: event.id, publishedAt: new Date() }, create: { slug: 'welcome-to-connection', category: 'announcements', status: 'PUBLISHED', featured: true, heroMediaId: hero.id, cardMediaId: poster.id, relatedEventId: event.id, publishedAt: new Date() } });
  const body = [{ id: 'intro', type: 'paragraph', text: 'Connection brings music, people and culture together through published experiences in Perth.' }, { id: 'next', type: 'heading', level: 2, text: 'The next connection' }, { id: 'details', type: 'paragraph', text: 'Follow the published event record for confirmed information as it is released.' }];
  for (const locale of ['en', 'vi']) await db.newsTranslation.upsert({ where: { articleId_locale: { articleId: article.id, locale } }, update: { title: locale === 'vi' ? 'Chào mừng đến với Connection' : 'Welcome to Connection', excerpt: locale === 'vi' ? 'Tin chính thức từ Connection.' : 'Official updates from Connection.', bodyBlocksJson: body, quickSummaryJson: [], readingTimeOverride: 2 }, create: { articleId: article.id, locale, title: locale === 'vi' ? 'Chào mừng đến với Connection' : 'Welcome to Connection', excerpt: locale === 'vi' ? 'Tin chính thức từ Connection.' : 'Official updates from Connection.', bodyBlocksJson: body, quickSummaryJson: [], readingTimeOverride: 2 } });
  const tag = await db.tag.upsert({ where: { key: 'connection' }, update: { label: 'Connection' }, create: { key: 'connection', label: 'Connection' } });
  await db.newsTag.upsert({ where: { articleId_tagId: { articleId: article.id, tagId: tag.id } }, update: {}, create: { articleId: article.id, tagId: tag.id } });

  const album = await db.galleryAlbum.upsert({ where: { slug: 'destiny-preview' }, update: { status: 'PUBLISHED', featured: true, coverMediaId: hero.id, heroMediaId: hero.id, eventId: event.id, venue: 'Metro City, Perth', publishedAt: new Date() }, create: { slug: 'destiny-preview', status: 'PUBLISHED', featured: true, coverMediaId: hero.id, heroMediaId: hero.id, eventId: event.id, venue: 'Metro City, Perth', publishedAt: new Date() } });
  for (const locale of ['en', 'vi']) await db.galleryTranslation.upsert({ where: { albumId_locale: { albumId: album.id, locale } }, update: { title: 'DESTINY Preview', subtitle: 'Music meets soul', description: 'Published visual material from the DESTINY programme.' }, create: { albumId: album.id, locale, title: 'DESTINY Preview', subtitle: 'Music meets soul', description: 'Published visual material from the DESTINY programme.' } });
  await db.galleryMedia.deleteMany({ where: { albumId: album.id } });
  await db.galleryMedia.create({ data: { albumId: album.id, mediaId: hero.id, mediaType: 'PHOTO', category: 'production', featured: true, sortOrder: 0, title: 'Connection atmosphere' } });
}

async function seedSupportAndLegal() {
  const categoryDefinitions = [['tickets', 'Ticket', 'ticket'], ['entry', 'Entry', 'entry'], ['vip-tables', 'VIP Tables', 'crown'], ['venue', 'Venue', 'pin']] as const;
  for (const [key, label, icon] of categoryDefinitions) {
    const category = await db.faqCategory.upsert({ where: { key }, update: { icon: icon, sortOrder: categoryDefinitions.findIndex((item) => item[0] === key) }, create: { key, icon, sortOrder: categoryDefinitions.findIndex((item) => item[0] === key) } });
    const item = await db.faqItem.upsert({ where: { id: `00000000-0000-0000-0000-0000000001${String(categoryDefinitions.findIndex((row) => row[0] === key) + 1).padStart(2, '0')}` }, update: { categoryId: category.id, published: true }, create: { id: `00000000-0000-0000-0000-0000000001${String(categoryDefinitions.findIndex((row) => row[0] === key) + 1).padStart(2, '0')}`, categoryId: category.id, published: true, sortOrder: 0 } });
    for (const locale of ['en', 'vi']) await db.faqTranslation.upsert({ where: { faqId_locale: { faqId: item.id, locale } }, update: { question: locale === 'vi' ? `${label} — thông tin` : `${label} information`, answer: locale === 'vi' ? 'Thông tin sẽ được cập nhật từ nội dung đã xuất bản.' : 'Information is updated from the published event content.', keywordsJson: [key] }, create: { faqId: item.id, locale, question: locale === 'vi' ? `${label} — thông tin` : `${label} information`, answer: locale === 'vi' ? 'Thông tin sẽ được cập nhật từ nội dung đã xuất bản.' : 'Information is updated from the published event content.', keywordsJson: [key] } });
  }
  const sections = [{ id: 'scope', navLabel: 'Scope', title: 'Scope', paragraphs: ['This document describes the terms for using the Connection website and published experiences.'], sortOrder: 0 }, { id: 'contact', navLabel: 'Contact', title: 'Contact', paragraphs: ['Contact details are published when confirmed by the organiser.'], sortOrder: 1 }];
  for (const type of ['terms', 'privacy']) {
    const document = await db.legalDocument.upsert({ where: { type }, update: { status: 'PUBLISHED', version: '1.0', effectiveAt: new Date(), publishedAt: new Date() }, create: { type, status: 'PUBLISHED', version: '1.0', effectiveAt: new Date(), publishedAt: new Date() } });
    for (const locale of ['en', 'vi']) await db.legalTranslation.upsert({ where: { documentId_locale: { documentId: document.id, locale } }, update: { title: type === 'terms' ? 'Terms & Conditions' : 'Privacy Policy', intro: 'Published legal information for this website.', sectionsJson: sections }, create: { documentId: document.id, locale, title: type === 'terms' ? 'Terms & Conditions' : 'Privacy Policy', intro: 'Published legal information for this website.', sectionsJson: sections } });
  }
}

async function seedPartnersAndSettings() {
  const partners = [
    ['mcq', 'MCQ Supermarket'],
    ['bihi-entertainment', 'BIHI Entertainment'],
  ] as const;
  for (const [slug, name] of partners) {
    const partner = await db.partner.upsert({
      where: { slug },
      update: { type: 'PARTNER', status: 'PUBLISHED' },
      create: { slug, type: 'PARTNER', status: 'PUBLISHED' },
    });
    for (const locale of ['en', 'vi']) {
      await db.partnerTranslation.upsert({
        where: { partnerId_locale: { partnerId: partner.id, locale } },
        update: { name },
        create: { partnerId: partner.id, locale, name },
      });
    }
  }

  for (const [key, valueJson, isPublic] of [
    ['site.brand', { name: 'Connection Rave', tagline: 'Same people. A brighter tomorrow.' }, true],
    ['site.languages', { default: 'en', supported: ['en', 'vi'] }, true],
    ['site.contact', { email: null, phone: null }, true],
  ] as const) {
    await db.siteSetting.upsert({ where: { key }, update: { valueJson, isPublic }, create: { key, valueJson, isPublic } });
  }

}

async function main() {
  await seedAccessControl();
  await seedDestiny();
  await seedProducts();
  await seedNewsAndGallery();
  await seedSupportAndLegal();
  await seedPartnersAndSettings();
  console.log('[seed] confirmed published events, catalogue, editorial, support, legal and access-control data are ready.');
}

main()
  .catch((error) => {
    console.error('[seed] failed', error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
