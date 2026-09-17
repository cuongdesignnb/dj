import type { SeedContext } from './context';

const FAQS = [
  ['00000000-0000-0000-0000-000000000101', 'tickets', 'Where can I buy tickets?', 'Ticket release details will be published here when confirmed by the organiser.'],
  ['00000000-0000-0000-0000-000000000102', 'vip-tables', 'How do VIP table requests work?', 'VIP table requests are reviewed by the organiser; confirmed package details will be published here.'],
  ['00000000-0000-0000-0000-000000000103', 'schedule', 'When will the schedule be announced?', 'The schedule will be published here once it is confirmed by the organiser.'],
] as const;

export async function seedFaq({ db }: SeedContext, eventId: string) {
  for (const [sortOrder, [id, categoryKey, question, answer]] of FAQS.entries()) {
    const category = await db.faqCategory.upsert({ where: { key: categoryKey }, update: { sortOrder }, create: { key: categoryKey, sortOrder } });
    const item = await db.faqItem.upsert({
      where: { id },
      update: { categoryId: category.id, eventId, published: true, sortOrder },
      create: { id, categoryId: category.id, eventId, published: true, sortOrder },
    });
    for (const locale of ['en', 'vi'] as const) {
      await db.faqTranslation.upsert({
        where: { faqId_locale: { faqId: item.id, locale } },
        update: { question: locale === 'en' ? question : question, answer: locale === 'en' ? answer : answer, keywordsJson: [categoryKey] },
        create: { faqId: item.id, locale, question: locale === 'en' ? question : question, answer: locale === 'en' ? answer : answer, keywordsJson: [categoryKey] },
      });
    }
  }
}
