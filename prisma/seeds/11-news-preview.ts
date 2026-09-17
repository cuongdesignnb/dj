import type { SeedContext } from './context';

export async function seedNewsPreview({ db, preview }: SeedContext, eventId: string) {
  const slug = 'welcome-to-connection';
  if (!preview) {
    await db.newsArticle.updateMany({ where: { slug }, data: { status: 'PREVIEW', publishedAt: null, indexable: false, followLinks: true } });
    return;
  }
  const hero = await db.mediaAsset.findUnique({ where: { storageKey: 'assets/hero-crowd.jpg' } });
  const card = await db.mediaAsset.findUnique({ where: { storageKey: 'assets/event-poster.jpg' } });
  const article = await db.newsArticle.upsert({
    where: { slug },
    update: { status: 'PREVIEW', featured: false, heroMediaId: hero?.id ?? undefined, cardMediaId: card?.id ?? undefined, relatedEventId: eventId, publishedAt: null, indexable: false, followLinks: true },
    create: { slug, category: 'announcements', status: 'PREVIEW', featured: false, heroMediaId: hero?.id, cardMediaId: card?.id, relatedEventId: eventId, publishedAt: null, indexable: false, followLinks: true },
  });
  const body = [{ id: 'preview', type: 'paragraph', text: 'Editorial preview. Published news will appear here when confirmed.' }];
  for (const locale of ['en', 'vi'] as const) {
    await db.newsTranslation.upsert({
      where: { articleId_locale: { articleId: article.id, locale } },
      update: { title: locale === 'en' ? 'Welcome to Connection' : 'Chào mừng đến với Connection', excerpt: locale === 'en' ? 'Editorial preview — publication details to be confirmed.' : 'Bản xem trước biên tập — thông tin xuất bản sẽ được xác nhận.', bodyBlocksJson: body, quickSummaryJson: [], readingTimeOverride: null, seoTitle: null, seoDescription: null },
      create: { articleId: article.id, locale, title: locale === 'en' ? 'Welcome to Connection' : 'Chào mừng đến với Connection', excerpt: locale === 'en' ? 'Editorial preview — publication details to be confirmed.' : 'Bản xem trước biên tập — thông tin xuất bản sẽ được xác nhận.', bodyBlocksJson: body, quickSummaryJson: [], readingTimeOverride: null, seoTitle: null, seoDescription: null },
    });
  }
}
