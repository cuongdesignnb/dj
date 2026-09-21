import 'server-only';

import { revalidatePath, revalidateTag } from 'next/cache';
import { PUBLIC_CACHE_TAGS } from '@/lib/cache/public-tags';

function slugTag(factory: (slug: string) => string, slug?: string | null) {
  return slug ? factory(slug) : null;
}

/**
 * Invalidates the public read models after an admin write. Public repositories
 * use these tags on their fetch calls, while the paths cover page-level data
 * that may have been rendered before the underlying API response changed.
 */
export function revalidatePublicResource(resource: string, slug?: string | null, previousSlug?: string | null) {
  const tags = new Set<string>();
  const paths = new Set<string>();
  const add = (tag: string | null | undefined) => { if (tag) tags.add(tag); };
  const addPath = (path: string) => paths.add(path);

  if (resource === 'events' || resource === 'event') {
    add(PUBLIC_CACHE_TAGS.events);
    add(PUBLIC_CACHE_TAGS.eventsPast);
    add(PUBLIC_CACHE_TAGS.home);
    add(PUBLIC_CACHE_TAGS.bootstrap);
    add(slugTag(PUBLIC_CACHE_TAGS.event, slug));
    add(slugTag(PUBLIC_CACHE_TAGS.event, previousSlug));
    add(slugTag(PUBLIC_CACHE_TAGS.tickets, slug));
    add(slugTag(PUBLIC_CACHE_TAGS.tickets, previousSlug));
    add(slugTag(PUBLIC_CACHE_TAGS.vip, slug));
    add(slugTag(PUBLIC_CACHE_TAGS.vip, previousSlug));
    for (const path of ['/', '/events', '/events/past', '/event', '/tickets', '/tables', '/book-now', '/lineup']) addPath(path);
    if (slug) addPath(`/events/${slug}`);
    if (previousSlug) addPath(`/events/${previousSlug}`);
  } else if (resource === 'artists' || resource === 'artist') {
    add(PUBLIC_CACHE_TAGS.artists);
    add(PUBLIC_CACHE_TAGS.events);
    add(PUBLIC_CACHE_TAGS.home);
    add(slugTag(PUBLIC_CACHE_TAGS.artist, slug));
    add(slugTag(PUBLIC_CACHE_TAGS.artist, previousSlug));
    for (const path of ['/', '/lineup', '/events']) addPath(path);
    if (slug) addPath(`/lineup/${slug}`);
    if (previousSlug) addPath(`/lineup/${previousSlug}`);
  } else if (resource === 'products' || resource === 'product') {
    add(PUBLIC_CACHE_TAGS.products);
    add(slugTag(PUBLIC_CACHE_TAGS.product, slug));
    add(slugTag(PUBLIC_CACHE_TAGS.product, previousSlug));
    addPath('/shop');
    if (slug) addPath(`/shop/${slug}`);
    if (previousSlug) addPath(`/shop/${previousSlug}`);
  } else if (resource === 'news') {
    add(PUBLIC_CACHE_TAGS.news);
    add(slugTag(PUBLIC_CACHE_TAGS.newsArticle, slug));
    add(slugTag(PUBLIC_CACHE_TAGS.newsArticle, previousSlug));
    addPath('/news');
    if (slug) addPath(`/news/${slug}`);
    if (previousSlug) addPath(`/news/${previousSlug}`);
  } else if (resource === 'gallery') {
    add(PUBLIC_CACHE_TAGS.gallery);
    add(slugTag(PUBLIC_CACHE_TAGS.galleryCollection, slug));
    add(slugTag(PUBLIC_CACHE_TAGS.galleryCollection, previousSlug));
    addPath('/gallery');
    if (slug) addPath(`/gallery/${slug}`);
    if (previousSlug) addPath(`/gallery/${previousSlug}`);
  } else if (resource === 'partners') {
    add(PUBLIC_CACHE_TAGS.partners);
    add(PUBLIC_CACHE_TAGS.bootstrap);
    addPath('/partners');
    addPath('/about');
    addPath('/');
  } else if (resource === 'faq') {
    add(PUBLIC_CACHE_TAGS.faq);
    addPath('/faq');
  } else if (resource === 'legal') {
    add(PUBLIC_CACHE_TAGS.legalTerms);
    add(PUBLIC_CACHE_TAGS.legalPrivacy);
    addPath('/terms');
    addPath('/privacy');
  } else if (resource === 'site' || resource === 'settings' || resource === 'content' || resource === 'shipping') {
    add(PUBLIC_CACHE_TAGS.site);
    add(PUBLIC_CACHE_TAGS.bootstrap);
    add(PUBLIC_CACHE_TAGS.home);
    for (const path of ['/', '/about', '/partners', '/events', '/lineup', '/tickets', '/tables', '/shop', '/news', '/gallery', '/faq', '/contact', '/terms', '/privacy']) addPath(path);
  } else if (resource === 'page-content' && slug) {
    add(PUBLIC_CACHE_TAGS.pageContent(slug));
    for (const path of ['/', '/events', '/events/past', '/lineup', '/news', '/gallery', '/shop', '/tickets', '/tables', '/book-now']) addPath(path);
  } else if (resource === 'navigation') {
    add(PUBLIC_CACHE_TAGS.navigation);
    for (const location of ['HEADER_PRIMARY', 'HEADER_CTA', 'MOBILE_PRIMARY', 'FOOTER_QUICK', 'FOOTER_LEGAL', 'FOOTER_SECONDARY']) add(PUBLIC_CACHE_TAGS.navigationLocation(location));
    addPath('/');
  }

  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  for (const path of paths) revalidatePath(path);
}
