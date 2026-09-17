import type { Metadata } from 'next';

export const DEFAULT_TITLE = 'Connection Rave | Music, Events & Experiences';
export const DEFAULT_DESCRIPTION = 'Connection Rave brings published music events, artists and experiences together.';

function rawSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.SITE_URL?.trim() || process.env.APP_URL?.trim() || 'http://localhost:3000';
}

export function siteUrl() {
  const raw = rawSiteUrl();
  try {
    return new URL(raw).toString().replace(/\/$/, '');
  } catch {
    return 'http://localhost:3000';
  }
}

export function isProductionSiteUrl(url = siteUrl()) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && !['localhost', '127.0.0.1', '::1'].includes(parsed.hostname) && !/preview|staging/i.test(parsed.hostname);
  } catch {
    return false;
  }
}

export function isIndexingEnabled() {
  return process.env.SEO_INDEXING_ENABLED === 'true' && isProductionSiteUrl();
}

export type Indexability = {
  indexable?: boolean | null;
  follow?: boolean | null;
};

export function robotsFor(policy: Indexability = {}): NonNullable<Metadata['robots']> {
  const index = isIndexingEnabled() && policy.indexable !== false;
  const follow = policy.follow !== false;
  return {
    index,
    follow,
    googleBot: { index, follow, noarchive: !index },
  };
}

export function hasConfiguredProductionSeo() {
  return isIndexingEnabled() && isProductionSiteUrl();
}
