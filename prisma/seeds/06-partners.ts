import type { SeedContext } from './context';

const PARTNERS = [
  ['mcq', 'MCQ'],
  ['bihi-entertainment', 'BIHI Entertainment'],
] as const;

export async function seedPartners({ db }: SeedContext) {
  for (const [slug, name] of PARTNERS) {
    const partner = await db.partner.upsert({
      where: { slug },
      update: { type: 'PARTNER', status: 'PUBLISHED' },
      create: { slug, type: 'PARTNER', status: 'PUBLISHED' },
    });
    for (const locale of ['en', 'vi'] as const) {
      await db.partnerTranslation.upsert({
        where: { partnerId_locale: { partnerId: partner.id, locale } },
        update: { name },
        create: { partnerId: partner.id, locale, name },
      });
    }
  }
}
