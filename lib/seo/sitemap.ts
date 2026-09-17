import 'server-only';

import type { MetadataRoute } from 'next';
import { db } from '@/server/db/client';
import { canonicalUrl } from './canonical';
import { isIndexingEnabled } from './config';

export async function getSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  if (!isIndexingEnabled()) return [];

  const [events, artists, articles, albums, products, pages] = await Promise.all([
    db.event.findMany({ where: { status: 'PUBLISHED', deletedAt: null, indexable: true }, select: { slug: true, updatedAt: true, publishedAt: true } }),
    db.artist.findMany({ where: { status: 'PUBLISHED', deletedAt: null, indexable: true }, select: { slug: true, updatedAt: true } }),
    db.newsArticle.findMany({ where: { status: 'PUBLISHED', deletedAt: null, indexable: true, publishedAt: { not: null } }, select: { slug: true, updatedAt: true, publishedAt: true } }),
    db.galleryAlbum.findMany({ where: { status: 'PUBLISHED', deletedAt: null, indexable: true, publishedAt: { not: null } }, select: { slug: true, updatedAt: true, publishedAt: true } }),
    db.product.findMany({ where: { status: 'PUBLISHED', deletedAt: null, indexable: true, publishedAt: { not: null } }, select: { slug: true, updatedAt: true, publishedAt: true } }),
    db.contentPage.findMany({ where: { status: 'PUBLISHED', indexable: true }, select: { slug: true, updatedAt: true, publishedAt: true } }),
  ]);

  const contentPaths = new Set(pages.map((page) => `/${page.slug}`));
  const staticPaths = [
    ...['/partners', '/events', '/lineup', '/faq'].filter((path) => contentPaths.has(path)),
    ...(events.length ? ['/tickets', '/tables'] : []),
    ...(articles.length ? ['/news'] : []),
    ...(albums.length ? ['/gallery'] : []),
    ...(products.length ? ['/shop'] : []),
  ];
  const staticPageEntries = pages.filter((page) => page.slug === 'home' || staticPaths.includes(`/${page.slug}`));
  const entries: MetadataRoute.Sitemap = [
    ...staticPageEntries.filter((page) => page.slug === 'home').map((page) => ({ url: canonicalUrl('/'), lastModified: page.updatedAt, changeFrequency: 'weekly' as const, priority: 1 })),
    ...staticPageEntries.filter((page) => page.slug !== 'home').map((page) => ({ url: canonicalUrl(`/${page.slug}`), lastModified: page.updatedAt, changeFrequency: 'monthly' as const, priority: 0.7 })),
    ...staticPaths.map((path) => ({ url: canonicalUrl(path), changeFrequency: 'weekly' as const, priority: 0.6 })),
    ...events.map((row) => ({ url: canonicalUrl(`/events/${row.slug}`), lastModified: row.updatedAt, changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...artists.map((row) => ({ url: canonicalUrl(`/lineup/${row.slug}`), lastModified: row.updatedAt, changeFrequency: 'monthly' as const, priority: 0.5 })),
    ...articles.map((row) => ({ url: canonicalUrl(`/news/${row.slug}`), lastModified: row.updatedAt, changeFrequency: 'monthly' as const, priority: 0.5 })),
    ...albums.map((row) => ({ url: canonicalUrl(`/gallery/${row.slug}`), lastModified: row.updatedAt, changeFrequency: 'monthly' as const, priority: 0.4 })),
    ...products.map((row) => ({ url: canonicalUrl(`/shop/${row.slug}`), lastModified: row.updatedAt, changeFrequency: 'monthly' as const, priority: 0.4 })),
  ];
  return entries.filter((entry, index, all) => all.findIndex((candidate) => candidate.url === entry.url) === index);
}
