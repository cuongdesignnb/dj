import type { MetadataRoute } from 'next';
import { getSitemapEntries } from '@/lib/seo/sitemap';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getSitemapEntries();
}
