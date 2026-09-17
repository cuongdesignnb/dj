import 'server-only';

import { db } from '@/server/db/client';
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE } from './config';

export async function getContentSeo(slug: string, fallback: { title: string; description: string }) {
  if (!process.env.DATABASE_URL) {
    return { title: fallback.title || DEFAULT_TITLE, description: fallback.description || DEFAULT_DESCRIPTION, canonicalOverride: null, indexable: false, follow: true };
  }
  try {
    const page = await db.contentPage.findUnique({ where: { slug }, include: { translations: true } });
    const translation = page?.translations.find((row) => row.locale === 'en') ?? page?.translations[0];
    return {
      title: page?.seoTitle ?? translation?.seoTitle ?? fallback.title ?? DEFAULT_TITLE,
      description: page?.seoDescription ?? translation?.seoDescription ?? fallback.description ?? DEFAULT_DESCRIPTION,
      canonicalOverride: page?.canonicalOverride ?? null,
      indexable: page?.status === 'PUBLISHED' && page.indexable,
      follow: page?.followLinks !== false,
    };
  } catch {
    return { title: fallback.title || DEFAULT_TITLE, description: fallback.description || DEFAULT_DESCRIPTION, canonicalOverride: null, indexable: false, follow: true };
  }
}

export async function getGlobalSeoDefaults() {
  const rows = await db.siteSetting.findMany({ where: { key: { in: ['seo.default_title', 'seo.default_description', 'seo.default_og_image'] } } });
  const values = Object.fromEntries(rows.map((row) => [row.key, row.valueJson]));
  return {
    title: typeof values['seo.default_title'] === 'string' ? values['seo.default_title'] : DEFAULT_TITLE,
    description: typeof values['seo.default_description'] === 'string' ? values['seo.default_description'] : DEFAULT_DESCRIPTION,
    image: typeof values['seo.default_og_image'] === 'string' ? values['seo.default_og_image'] : '/assets/event-poster.jpg',
  };
}
