/**
 * Public ticket, VIP table and booking pages are scoped to one event with
 * `?event=<slug>`. Without the parameter they keep serving the default event,
 * so existing menu links and bookmarks behave exactly as before.
 */
export const EVENT_SCOPE_PARAM = 'event';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type EventScopedPath = '/tickets' | '/tables' | '/book-now';

/** Returns a normalised slug, or null when the value cannot be an event slug. */
export function eventSlugFromParam(value: string | string[] | null | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string') return null;
  const slug = raw.trim().toLowerCase();
  return slug.length >= 2 && slug.length <= 160 && SLUG_PATTERN.test(slug) ? slug : null;
}

export type EventScope = { kind: 'default' } | { kind: 'event'; slug: string } | { kind: 'invalid' };

/** Reads the page's search params: absent means the default event, garbage is rejected. */
export function eventScopeFromSearchParams(searchParams: Record<string, string | string[] | undefined>): EventScope {
  const value = searchParams[EVENT_SCOPE_PARAM];
  if (value === undefined || (typeof value === 'string' && value.trim() === '')) return { kind: 'default' };
  const slug = eventSlugFromParam(value);
  return slug ? { kind: 'event', slug } : { kind: 'invalid' };
}

/** Builds a public link that keeps the visitor on the same event. */
export function eventScopedHref(path: EventScopedPath, slug?: string | null): string {
  return slug ? `${path}?${EVENT_SCOPE_PARAM}=${encodeURIComponent(slug)}` : path;
}
