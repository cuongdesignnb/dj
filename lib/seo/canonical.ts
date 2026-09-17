import { siteUrl } from './config';

const TRACKING_KEYS = /^(utm_|fbclid$|gclid$|search$|sort$|filter$|pagesize$)/i;

export function canonicalPath(pathname: string) {
  const path = pathname.split('?')[0].split('#')[0] || '/';
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return normalized === '/' ? '/' : normalized.replace(/\/+$/, '');
}

export function canonicalUrl(pathname: string, override?: string | null) {
  const candidate = override?.trim();
  if (candidate) {
    try {
      const parsed = new URL(candidate, siteUrl());
      parsed.search = '';
      parsed.hash = '';
      return parsed.toString().replace(/\/$/, parsed.pathname === '/' ? '/' : '');
    } catch {
      // Invalid editor input falls back to the route-derived canonical.
    }
  }
  return `${siteUrl()}${canonicalPath(pathname)}`;
}

export function stripSeoQuery(input: string) {
  const url = new URL(input, siteUrl());
  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_KEYS.test(key)) url.searchParams.delete(key);
  }
  url.search = '';
  url.hash = '';
  return url.toString();
}
