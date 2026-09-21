import type { Permission } from './auth/permissions';

export type NavIcon = 'dashboard' | 'events' | 'artists' | 'merch' | 'content' | 'partners' | 'navigation' | 'team' | 'settings';

export interface NavItem { label: string; href: string; permission: Permission; match?: string[]; }
export interface NavGroup { id: string; label: string; icon: NavIcon; items: NavItem[]; }

export const ADMIN_NAV: NavGroup[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', items: [{ label: 'Dashboard', href: '/admin', permission: 'dashboard.view' }] },
  { id: 'events', label: 'Event Management', icon: 'events', items: [{ label: 'All Events', href: '/admin/events', permission: 'events.view' }, { label: 'Create Event', href: '/admin/events/new', permission: 'events.create' }] },
  { id: 'ticketing', label: 'Ticketing', icon: 'events', items: [{ label: 'Ticket Settings', href: '/admin/ticketing', permission: 'events.view' }, { label: 'Ticket Tiers', href: '/admin/ticketing/tiers', permission: 'events.view' }, { label: 'Ticket Page Content', href: '/admin/ticketing/content', permission: 'content.view' }, { label: 'Ticket Purchases', href: '/admin/ticket-purchases', permission: 'orders.view' }] },
  { id: 'vip', label: 'VIP / Tables', icon: 'content', items: [{ label: 'VIP Packages', href: '/admin/vip', permission: 'events.view' }, { label: 'Booth / Club Map', href: '/admin/vip/booths', permission: 'events.view' }, { label: 'Bottle Options', href: '/admin/vip/bottles', permission: 'events.view' }, { label: 'Tables Page Content', href: '/admin/vip/tables-content', permission: 'content.view' }, { label: 'Booking Page Content', href: '/admin/vip/booking-content', permission: 'content.view' }, { label: 'VIP Bookings', href: '/admin/vip-bookings', permission: 'orders.view' }] },
  { id: 'artists', label: 'Artists', icon: 'artists', items: [{ label: 'All Artists', href: '/admin/artists', permission: 'artists.view' }, { label: 'Add Artist', href: '/admin/artists/new', permission: 'artists.create' }] },
  { id: 'merch', label: 'Merchandise', icon: 'merch', items: [{ label: 'Products', href: '/admin/products', permission: 'products.view' }, { label: 'Add Product', href: '/admin/products/new', permission: 'products.create' }, { label: 'Merchandise Orders', href: '/admin/orders', permission: 'orders.view' }, { label: 'Payments', href: '/admin/payments', permission: 'orders.view' }, { label: 'Discount Codes', href: '/admin/discounts', permission: 'products.view' }, { label: 'Shipping Settings', href: '/admin/shipping', permission: 'products.edit' }] },
  { id: 'content', label: 'Content', icon: 'content', items: [
    { label: 'Homepage', href: '/admin/content/home', permission: 'content.view' }, { label: 'About', href: '/admin/content/about', permission: 'content.view' },
    { label: 'Events Page', href: '/admin/content/events', permission: 'content.view' }, { label: 'Past Events Page', href: '/admin/content/past-events', permission: 'content.view' }, { label: 'Lineup Page', href: '/admin/content/lineup', permission: 'content.view' }, { label: 'News Page', href: '/admin/content/news', permission: 'content.view' }, { label: 'Gallery Page', href: '/admin/content/gallery', permission: 'content.view' }, { label: 'Shop Page', href: '/admin/content/shop', permission: 'content.view' },
    { label: 'News', href: '/admin/news', permission: 'news.view' }, { label: 'Add Article', href: '/admin/news/new', permission: 'news.create' }, { label: 'Gallery Albums', href: '/admin/gallery', permission: 'gallery.view' }, { label: 'Add Album', href: '/admin/gallery/new', permission: 'gallery.create' }, { label: 'FAQ', href: '/admin/content/faq', permission: 'content.view' }, { label: 'Contact', href: '/admin/content/contact', permission: 'content.view' }, { label: 'Legal Documents', href: '/admin/content/legal', permission: 'content.view' }, { label: 'Partners', href: '/admin/partners', permission: 'partners.view' }, { label: 'Media Library', href: '/admin/media', permission: 'media.view' },
  ] },
  { id: 'navigation', label: 'Navigation', icon: 'navigation', items: [{ label: 'Menu Builder', href: '/admin/navigation', permission: 'navigation.view' }, { label: 'Menu Locations', href: '/admin/navigation/locations', permission: 'navigation.view' }] },
  { id: 'team', label: 'Team & Access', icon: 'team', items: [{ label: 'Staff', href: '/admin/staff', permission: 'staff.view' }, { label: 'Roles & Permissions', href: '/admin/roles', permission: 'roles.view' }] },
  { id: 'settings', label: 'Settings', icon: 'settings', items: [{ label: 'Website', href: '/admin/settings/site', permission: 'settings.view' }, { label: 'Social / Contact', href: '/admin/settings/social', permission: 'settings.view' }, { label: 'Languages EN / VI', href: '/admin/settings/languages', permission: 'settings.view' }, { label: 'Global Content', href: '/admin/settings/global-content', permission: 'settings.view' }, { label: 'Integrations', href: '/admin/settings/integrations', permission: 'settings.view' }] },
];

export function activeNavHref(pathname: string): string | null {
  let best: { href: string; length: number } | null = null;
  for (const group of ADMIN_NAV) for (const item of group.items) for (const candidate of [item.href, ...(item.match ?? [])]) {
    const exact = pathname === candidate;
    const nested = candidate !== '/admin' && pathname.startsWith(`${candidate}/`);
    if ((exact || nested) && (!best || candidate.length > best.length)) best = { href: item.href, length: candidate.length };
  }
  return best?.href ?? null;
}
