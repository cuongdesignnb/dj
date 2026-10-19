import 'server-only';

import { unstable_cache } from 'next/cache';
import { db } from '@/server/db/client';
import { PUBLIC_CACHE_TAGS } from '@/lib/cache/public-tags';
import { DEFAULT_SITE_BRANDING, normaliseBranding, type SiteBranding } from '@/lib/site-branding';

const loadBranding = unstable_cache(
  async (): Promise<SiteBranding> => {
    const rows = await db.siteSetting.findMany({ where: { key: { in: ['site.logo', 'site.favicon', 'site.name'] } }, select: { key: true, valueJson: true } });
    const value = (key: string) => rows.find((row) => row.key === key)?.valueJson ?? null;
    return normaliseBranding({ logo: value('site.logo'), favicon: value('site.favicon'), name: value('site.name') });
  },
  ['site-branding-v1'],
  // Saving Settings › Site revalidates this tag (server/cache/public-revalidation.ts).
  { tags: [PUBLIC_CACHE_TAGS.site], revalidate: 300 },
);

/**
 * Logo, favicon and name chosen in Admin › Settings › Site. Falls back to the
 * bundled brand when the database is unreachable (e.g. during `next build`).
 */
export async function getSiteBranding(): Promise<SiteBranding> {
  try {
    return await loadBranding();
  } catch {
    return DEFAULT_SITE_BRANDING;
  }
}
