import fs from 'node:fs';
import path from 'node:path';
import type { SeedDb } from './context';

interface SponsorSeed {
  slug: string;
  name: string;
  /** Stored as the partner tagline; the public sponsor slots show it as the role line. */
  role: string;
  sortOrder: number;
  logo: { storageKey: string; altText: string; width: number; height: number };
}

/** Sponsor logos redrawn as SVG (public/assets). Admin › Partners stays the source of truth after seeding. */
export const SPONSORS: SponsorSeed[] = [
  { slug: 'mcq', name: 'MCQ Supermarket', role: 'Powered by', sortOrder: 0, logo: { storageKey: 'assets/logo-mcq.svg', altText: 'MCQ Supermarket logo', width: 300, height: 100 } },
  { slug: 'bihi-entertainment', name: 'BIHI Entertainment', role: 'Presented by', sortOrder: 1, logo: { storageKey: 'assets/logo-bihi.svg', altText: 'BIHI Entertainment logo', width: 772, height: 200 } },
  { slug: 'bi-hair', name: 'Bi Hair', role: 'Official Partner', sortOrder: 2, logo: { storageKey: 'assets/logo-bi-hair.svg', altText: 'Bi Hair logo', width: 662, height: 200 } },
  { slug: 'vina9', name: 'VINA9', role: 'Official Partner', sortOrder: 3, logo: { storageKey: 'assets/logo-vina9.svg', altText: 'VINA9 logo', width: 730, height: 390 } },
];

/** Alternative artwork (full lockups, light-background versions) made available in the Media Library. */
export const SPONSOR_EXTRA_MEDIA = [
  { storageKey: 'assets/sponsors/bihi-entertainment-dark.svg', altText: 'BIHI Entertainment logo — full, dark background', width: 1100, height: 920 },
  { storageKey: 'assets/sponsors/bihi-entertainment-light.svg', altText: 'BIHI Entertainment logo — full, light background', width: 1100, height: 920 },
  { storageKey: 'assets/sponsors/bihi-entertainment-horizontal-light.svg', altText: 'BIHI Entertainment logo — light background', width: 772, height: 200 },
  { storageKey: 'assets/sponsors/bi-hair.svg', altText: 'Bi Hair logo — full', width: 640, height: 670 },
  { storageKey: 'assets/sponsors/vina9-light.svg', altText: 'VINA9 logo — light background', width: 730, height: 390 },
] as const;

const LOCALES = ['en', 'vi'] as const;

type Report = string[];

function fileSize(storageKey: string) {
  const filePath = path.join(process.cwd(), 'public', storageKey);
  if (!fs.existsSync(filePath)) throw new Error(`Missing sponsor asset public/${storageKey}`);
  return fs.statSync(filePath).size;
}

/** Creates the media row when missing; an existing row only gets its file size refreshed. */
async function ensureMedia(db: SeedDb, media: { storageKey: string; altText: string; width: number; height: number }, report: Report) {
  const sizeBytes = fileSize(media.storageKey);
  const existing = await db.mediaAsset.findUnique({ where: { storageKey: media.storageKey } });
  if (!existing) {
    report.push(`media + ${media.storageKey}`);
    return db.mediaAsset.create({
      data: { storageDriver: 'LOCAL', storageKey: media.storageKey, publicUrl: `/${media.storageKey}`, mimeType: 'image/svg+xml', sizeBytes, altText: media.altText, width: media.width, height: media.height },
    });
  }
  if (existing.sizeBytes !== sizeBytes) {
    report.push(`media ~ ${media.storageKey} size ${existing.sizeBytes} -> ${sizeBytes}`);
    return db.mediaAsset.update({ where: { id: existing.id }, data: { sizeBytes } });
  }
  return existing;
}

/**
 * Additive and repeatable: creates missing sponsors, media and translations, and fills a
 * partner's logo or a translation's tagline only while they are empty. It never deletes,
 * never changes status, order, names or anything an editor has already set.
 */
export async function seedSponsors(db: SeedDb): Promise<Report> {
  const report: Report = [];
  for (const extra of SPONSOR_EXTRA_MEDIA) await ensureMedia(db, extra, report);

  for (const sponsor of SPONSORS) {
    const media = await ensureMedia(db, sponsor.logo, report);
    const usableMedia = media.deletedAt ? null : media;
    const existing = await db.partner.findUnique({ where: { slug: sponsor.slug }, include: { translations: true } });

    if (!existing) {
      await db.partner.create({
        data: {
          slug: sponsor.slug,
          type: 'sponsor',
          status: 'PUBLISHED',
          sortOrder: sponsor.sortOrder,
          logoMediaId: usableMedia?.id ?? null,
          translations: { create: LOCALES.map((locale) => ({ locale, name: sponsor.name, tagline: sponsor.role })) },
        },
      });
      report.push(`partner + ${sponsor.slug}`);
      continue;
    }

    if (!existing.logoMediaId && usableMedia) {
      await db.partner.update({ where: { id: existing.id }, data: { logoMediaId: usableMedia.id } });
      report.push(`partner ~ ${sponsor.slug} logo -> ${sponsor.logo.storageKey}`);
    }
    for (const locale of LOCALES) {
      const translation = existing.translations.find((row) => row.locale === locale);
      if (!translation) {
        await db.partnerTranslation.create({ data: { partnerId: existing.id, locale, name: sponsor.name, tagline: sponsor.role } });
        report.push(`partner ~ ${sponsor.slug} ${locale} translation +`);
      } else if (!translation.tagline) {
        await db.partnerTranslation.update({ where: { id: translation.id }, data: { tagline: sponsor.role } });
        report.push(`partner ~ ${sponsor.slug} ${locale} tagline -> ${sponsor.role}`);
      }
    }
  }
  return report;
}
