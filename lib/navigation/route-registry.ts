export interface InternalRoute {
  key: string;
  label: string;
  href: string;
  group: string;
  dynamic: boolean;
  entityType?: string;
  indexable?: boolean;
  available?: boolean;
  reason?: string;
}

export const STATIC_ROUTES: InternalRoute[] = [
  ['home', 'Home', '/', 'Static Pages'],
  ['about', 'About', '/about', 'Static Pages'],
  ['partners', 'Partners', '/partners', 'Static Pages'],
  ['events', 'Events', '/events', 'Events'],
  ['past-events', 'Past Events', '/events/past', 'Events'],
  ['tickets', 'Tickets', '/tickets', 'Event Management'],
  ['tables', 'VIP Tables', '/tables', 'Event Management'],
  ['book-now', 'Book Now', '/book-now', 'Event Management'],
  ['lineup', 'Lineup', '/lineup', 'Artists'],
  ['gallery', 'Gallery', '/gallery', 'Gallery'],
  ['news', 'News', '/news', 'News'],
  ['shop', 'Shop', '/shop', 'Shop'],
  ['faq', 'FAQ', '/faq', 'Static Pages'],
  ['contact', 'Contact', '/contact', 'Static Pages'],
  ['terms', 'Terms', '/terms', 'Legal'],
  ['privacy', 'Privacy', '/privacy', 'Legal'],
].map(([key, label, href, group]) => ({ key, label, href, group, dynamic: false, indexable: true }));

export function staticRoute(key: string): InternalRoute | null {
  return STATIC_ROUTES.find((route) => route.key === key) ?? null;
}

export function routeHref(routeKey: string): string | null {
  return staticRoute(routeKey)?.href ?? null;
}

export function isSafeCustomUrl(value: string): boolean {
  const raw = value.trim();
  if (!raw || /^(javascript|data|vbscript):/i.test(raw)) return false;
  if (raw.startsWith('/')) return true;
  return /^(https?:\/\/|mailto:|tel:)/i.test(raw);
}

export function isValidAnchor(value: string): boolean {
  return /^#[a-zA-Z][a-zA-Z0-9_-]{0,80}$/.test(value.trim());
}

export function isValidRouteAnchor(route: string, anchor: string): boolean {
  return isSafeCustomUrl(route) && isValidAnchor(anchor);
}
