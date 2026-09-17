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
