import 'server-only';

import { unstable_cache } from 'next/cache';
import { db } from '@/server/db/client';
import { PUBLIC_CACHE_TAGS } from '@/lib/cache/public-tags';
import { FALLBACK_SPONSORS, normaliseSponsors, type Sponsor } from '@/lib/sponsors';

const loadSponsors = unstable_cache(
  async (): Promise<Sponsor[]> => {
    const rows = await db.partner.findMany({
      where: { status: 'PUBLISHED', logoMedia: { is: { deletedAt: null } } },
      orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: { translations: true, logoMedia: true },
    });
    return normaliseSponsors(rows.map((row) => {
      const translation = row.translations.find((item) => item.locale === 'en') ?? row.translations[0] ?? null;
      return {
        id: row.id,
        slug: row.slug,
        name: translation?.name ?? row.slug,
        tagline: translation?.tagline ?? null,
        websiteUrl: row.websiteUrl,
        logo: row.logoMedia ? { src: row.logoMedia.publicUrl, alt: row.logoMedia.altText, width: row.logoMedia.width, height: row.logoMedia.height } : null,
      };
    }));
  },
  ['site-sponsors-v1'],
  // Saving a partner in Admin revalidates this tag (server/cache/public-revalidation.ts).
  { tags: [PUBLIC_CACHE_TAGS.partners], revalidate: 300 },
);

/** Published partners with a logo, in Admin order. Falls back to the bundled pair when the database is unreachable. */
export async function getSponsors(): Promise<Sponsor[]> {
  try {
    return await loadSponsors();
  } catch {
    return FALLBACK_SPONSORS;
  }
}
