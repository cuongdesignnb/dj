import type { SeedContext } from './context';

const PAGES = [
  {
    slug: 'home',
    title: 'Connection Rave',
    seoTitle: 'Connection Rave | Music, Events & Experiences in Perth',
    seoDescription: 'Connection Rave brings published music events, artists and experiences to Perth.',
    content: { sections: ['hero', 'eventOverview', 'lineupPreview', 'tickets', 'vip', 'partners', 'footerCta'] },
  },
  {
    slug: 'about',
    title: 'About Connection Rave',
    seoTitle: 'About Connection Rave | Sound Meets Soul',
    seoDescription: 'Learn about Connection Rave and its published music, event and community programme.',
    content: { sections: ['hero', 'story', 'values', 'ecosystem', 'partners', 'cta'] },
  },
  {
    slug: 'contact',
    title: 'Contact Connection Rave',
    seoTitle: 'Contact Connection Rave | Perth Events',
    seoDescription: 'Contact Connection Rave about events, partnerships, VIP table requests and published updates.',
    content: { sections: ['hero', 'contactForm', 'cta'] },
  },
  {
    slug: 'partners',
    title: 'Partners & Sponsors',
    seoTitle: 'Partners & Sponsors | Connection Rave',
    seoDescription: 'Explore partnership and sponsorship opportunities with Connection Rave.',
    content: { sections: ['hero', 'partners', 'benefits', 'cta'] },
  },
  {
    slug: 'events',
    title: 'Upcoming Events',
    seoTitle: 'Upcoming Events | Connection Rave',
    seoDescription: 'Discover published Connection Rave events and experiences.',
    content: { sections: ['hero', 'events', 'benefits', 'cta'] },
  },
  {
    slug: 'lineup',
    title: 'Artist Lineup',
    seoTitle: 'Artist Lineup | Connection Rave',
    seoDescription: 'Meet the published artists connected to Connection Rave events.',
    content: { sections: ['hero', 'artists', 'story', 'cta'] },
  },
  {
    slug: 'faq',
    title: 'FAQ',
    seoTitle: 'FAQ | Connection Rave',
    seoDescription: 'Find published answers about Connection Rave tickets, entry, VIP table requests, venue information and event updates.',
    content: { sections: ['hero', 'questions', 'cta'] },
  },
  {
    slug: 'news',
    title: 'News & Stories',
    seoTitle: 'News & Stories | Connection Rave',
    seoDescription: 'Read published Connection Rave announcements, event updates, artist stories and community features.',
    content: { sections: ['hero', 'stories', 'cta'] },
  },
  {
    slug: 'gallery',
    title: 'Gallery',
    seoTitle: 'Gallery | Connection Rave',
    seoDescription: 'Explore published Connection Rave visual collections, artist moments, venue visuals and event atmosphere.',
    content: { sections: ['hero', 'collections', 'cta'] },
  },
  {
    slug: 'shop',
    title: 'Merchandise',
    seoTitle: 'Merchandise | Connection Rave',
    seoDescription: 'Explore published Connection Rave merchandise, apparel, accessories, posters and collectibles.',
    content: { sections: ['hero', 'catalog', 'benefits', 'cta'] },
  },
] as const;

export async function seedContentPages({ db }: SeedContext) {
  for (const page of PAGES) {
    const row = await db.contentPage.upsert({
      where: { slug: page.slug },
      update: { indexable: true, followLinks: true },
      create: { slug: page.slug, status: 'PUBLISHED', publishedAt: null, seoTitle: page.seoTitle, seoDescription: page.seoDescription, indexable: true, followLinks: true },
    });
    for (const locale of ['en', 'vi'] as const) {
      const isEnglish = locale === 'en';
      await db.contentPageTranslation.upsert({
        where: { pageId_locale: { pageId: row.id, locale } },
        update: { title: isEnglish ? page.title : page.title, contentJson: page.content, seoTitle: page.seoTitle, seoDescription: page.seoDescription },
        create: { pageId: row.id, locale, title: isEnglish ? page.title : page.title, contentJson: page.content, seoTitle: page.seoTitle, seoDescription: page.seoDescription },
      });
    }
  }
}
