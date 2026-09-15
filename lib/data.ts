import { ARTISTS } from './artists/mock';

export const navItems = [
  { label: "Home", href: "/" },
  { label: "Event", href: "/event" },
  { label: "Ticket", href: "/tickets" },
  { label: "Table", href: "/tables" },
  { label: "Booked Now", href: "/book-now" },
];

export const siteNav = {
  brandName: "CONNECTION",
  tagline: "Sound Meets Soul",
  ctaLabel: "Get Tickets",
  ctaHref: "/tickets",
};

// Projection of the canonical artist records in lib/artists/mock.ts, kept in
// the shape the homepage preview already consumes. There is one artist list in
// this codebase; this is a view of it, not a second copy.
export const artists = ARTISTS.map((artist) => ({
  name: artist.name,
  country: artist.country,
  year: artist.year ?? '',
  href: `/lineup/${artist.slug}`,
  image: artist.portrait.src,
}));

export const ticketTiers = [
  {
    name: "Student Concession",
    price: "$35",
    badge: "Best Value",
    icon: "GraduationCap" as const,
    features: ["Limited tickets", "Selling fast", "Last chance"],
    cta: "Lock In Student's Deal",
    href: "/tickets",
    highlighted: true,
  },
  {
    name: "Final Release",
    price: "$66",
    badge: null,
    icon: "Zap" as const,
    features: ["Limited tickets", "Selling fast", "Last chance"],
    cta: "Secure Your Tickets",
    href: "/tickets",
    highlighted: false,
  },
  {
    name: "Ticket At Door",
    price: "$100",
    badge: null,
    icon: "DoorOpen" as const,
    features: ["Limited tickets", "Selling fast", "Last chance"],
    cta: null,
    href: null,
    highlighted: false,
  },
];

export const trustItems = [
  {
    icon: "ShieldCheck" as const,
    title: "Secure Checkout",
    description: "Safe & encrypted payments",
  },
  {
    icon: "BadgeCheck" as const,
    title: "100% Verified Tickets",
    description: "Genuine tickets. No scams.",
  },
  {
    icon: "Users" as const,
    title: "Limited Capacity Event",
    description: "High demand. Limited spots.",
  },
];

export const boothPackage = {
  name: "BOOTH PACKAGE",
  price: "$3,200",
  people: "15 PEOPLE",
  bottles: "INCLUDES 3 BOTTLES",
  choices: [
    "Belvedere Vodka",
    "Hennessy VS",
    "El Jimador Tequila",
    "Moët & Chandon",
    "Jager",
    "WAP Cranberry Peach",
  ],
};

export const footerLinks = [
  { label: "Home", href: "/" },
  { label: "Event", href: "/event" },
  { label: "Ticket", href: "/tickets" },
  { label: "Table", href: "/tables" },
  { label: "Booked Now", href: "/book-now" },
  { label: "Partners", href: "/partners" },
  { label: "Gallery", href: "/gallery" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];
export type ArtistType = typeof artists[number];
export type TicketTierType = typeof ticketTiers[number];
export type TrustItemType = typeof trustItems[number];
