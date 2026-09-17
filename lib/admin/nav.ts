import type { Permission } from './auth/permissions';

export type NavIcon =
  | 'dashboard'
  | 'events'
  | 'artists'
  | 'merch'
  | 'content'
  | 'partners'
  | 'team'
  | 'settings';

export interface NavItem {
  label: string;
  href: string;
  permission: Permission;
  /** Extra path prefixes that should highlight this item. */
  match?: string[];
}

export interface NavGroup {
  id: string;
  label: string;
  icon: NavIcon;
  items: NavItem[];
}

export const ADMIN_NAV: NavGroup[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    items: [{ label: 'Dashboard', href: '/admin', permission: 'dashboard.view' }],
  },
  {
    id: 'events',
    label: 'Event Management',
    icon: 'events',
    items: [
      { label: 'All Events', href: '/admin/events', permission: 'events.view' },
      { label: 'Create Event', href: '/admin/events/new', permission: 'events.create' },
    ],
  },
  {
    id: 'artists',
    label: 'Artist Management',
    icon: 'artists',
    items: [
      { label: 'All Artists', href: '/admin/artists', permission: 'artists.view' },
      { label: 'Add Artist', href: '/admin/artists/new', permission: 'artists.create' },
    ],
  },
  {
    id: 'merch',
    label: 'Merchandise',
    icon: 'merch',
    items: [
      { label: 'Products', href: '/admin/products', permission: 'products.view' },
      { label: 'Add Product', href: '/admin/products/new', permission: 'products.create' },
      { label: 'Orders', href: '/admin/orders', permission: 'orders.view' },
      { label: 'Payments', href: '/admin/payments', permission: 'orders.view' },
      { label: 'Ticket Purchases', href: '/admin/ticket-purchases', permission: 'orders.view' },
      { label: 'VIP Bookings', href: '/admin/vip-bookings', permission: 'orders.view' },
      { label: 'Discount Codes', href: '/admin/discounts', permission: 'products.view' },
      { label: 'Shipping Settings', href: '/admin/shipping', permission: 'products.edit' },
    ],
  },
  {
    id: 'content',
    label: 'Content',
    icon: 'content',
    items: [
      { label: 'News', href: '/admin/news', permission: 'news.view' },
      { label: 'Add Article', href: '/admin/news/new', permission: 'news.create' },
      { label: 'Gallery Albums', href: '/admin/gallery', permission: 'gallery.view' },
      { label: 'Add Album', href: '/admin/gallery/new', permission: 'gallery.create' },
      { label: 'Media Library', href: '/admin/media', permission: 'media.view' },
      { label: 'Homepage Content', href: '/admin/content/home', permission: 'content.view' },
      { label: 'About / Contact', href: '/admin/content/about', permission: 'content.view', match: ['/admin/content/contact'] },
      { label: 'FAQ', href: '/admin/content/faq', permission: 'content.view' },
      { label: 'Legal Documents', href: '/admin/content/legal', permission: 'content.view' },
    ],
  },
  {
    id: 'partners',
    label: 'Partners',
    icon: 'partners',
    items: [{ label: 'Sponsors / Partners', href: '/admin/partners', permission: 'partners.view' }],
  },
  {
    id: 'team',
    label: 'Team & Access',
    icon: 'team',
    items: [
      { label: 'Staff Management', href: '/admin/staff', permission: 'staff.view' },
      { label: 'Roles & Permissions', href: '/admin/roles', permission: 'roles.view' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'settings',
    items: [
      { label: 'Website Settings', href: '/admin/settings/site', permission: 'settings.view' },
      { label: 'Social / Contact', href: '/admin/settings/social', permission: 'settings.view' },
      { label: 'Languages EN / VI', href: '/admin/settings/languages', permission: 'settings.view' },
      { label: 'Newsletter / Integrations', href: '/admin/settings/integrations', permission: 'settings.view' },
    ],
  },
];

/**
 * The nav item for a path: the longest matching href wins, so
 * /admin/events/new highlights "Create Event" and /admin/events/evt_1/edit
 * highlights "All Events".
 */
export function activeNavHref(pathname: string): string | null {
  let best: { href: string; length: number } | null = null;
  for (const group of ADMIN_NAV) {
    for (const item of group.items) {
      const candidates = [item.href, ...(item.match ?? [])];
      for (const candidate of candidates) {
        const exact = pathname === candidate;
        const nested = candidate !== '/admin' && pathname.startsWith(`${candidate}/`);
        if ((exact || nested) && (!best || candidate.length > best.length)) {
          best = { href: item.href, length: candidate.length };
        }
      }
    }
  }
  // "new" pages are their own items; other nested pages belong to the list.
  return best?.href ?? null;
}
