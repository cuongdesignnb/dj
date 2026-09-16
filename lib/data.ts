// Shared navigation and presentation types for legacy home components.
// Public business records are loaded from the API repositories; these arrays
// intentionally stay empty so a disconnected database can never look real.

export const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Event', href: '/event' },
  { label: 'Ticket', href: '/tickets' },
  { label: 'Table', href: '/tables' },
  { label: 'Booked Now', href: '/book-now' },
];

export const siteNav = {
  brandName: 'CONNECTION',
  tagline: 'Sound Meets Soul',
  ctaLabel: 'Get Tickets',
  ctaHref: '/tickets',
};

export type HomeArtist = {
  name: string;
  country: string;
  year: string;
  href: string;
  image: string;
};

export const artists: HomeArtist[] = [];

export type HomeTicketTier = {
  name: string;
  price: string;
  badge: string | null;
  icon: 'GraduationCap' | 'Zap' | 'DoorOpen';
  features: string[];
  cta: string | null;
  href: string | null;
  highlighted: boolean;
};

export const ticketTiers: HomeTicketTier[] = [];

export type HomeTrustItem = {
  icon: 'ShieldCheck' | 'BadgeCheck' | 'Users';
  title: string;
  description: string;
};

export const trustItems: HomeTrustItem[] = [];

export const boothPackage = {
  name: '',
  price: '',
  people: '',
  bottles: '',
  choices: [] as string[],
};

export const footerLinks = [
  { label: 'Home', href: '/' },
  { label: 'Event', href: '/event' },
  { label: 'Ticket', href: '/tickets' },
  { label: 'Table', href: '/tables' },
  { label: 'Booked Now', href: '/book-now' },
  { label: 'Partners', href: '/partners' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
];

export type ArtistType = HomeArtist;
export type TicketTierType = HomeTicketTier;
export type TrustItemType = HomeTrustItem;
