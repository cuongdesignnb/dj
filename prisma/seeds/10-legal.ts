import type { SeedContext } from './context';

export async function seedLegal({ db }: SeedContext) {
  for (const [type, title] of [['terms', 'Terms & Conditions'], ['privacy', 'Privacy Policy']] as const) {
    const document = await db.legalDocument.upsert({
      where: { type },
      update: { status: 'DRAFT', effectiveAt: null, publishedAt: null, indexable: false, followLinks: true },
      create: { type, status: 'DRAFT', version: '1.0', effectiveAt: null, publishedAt: null, indexable: false, followLinks: true },
    });
    for (const locale of ['en', 'vi'] as const) {
      await db.legalTranslation.upsert({
        where: { documentId_locale: { documentId: document.id, locale } },
        update: { title, intro: null, sectionsJson: [], seoTitle: null, seoDescription: null },
        create: { documentId: document.id, locale, title, intro: null, sectionsJson: [], seoTitle: null, seoDescription: null },
      });
    }
  }
}
