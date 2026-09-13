export const navItems = [
  { label: "Home", href: "/" },
  { label: "Event", href: "/event" },
  { label: "Ticket", href: "/tickets" },
  { label: "Table", href: "/tables" },
  { label: "Booked Now", href: "/book-now" },
];

export const artists = [
  { name: "RYAL", country: "VIETNAM", year: "2026", href: "/lineup/ryal", image: "/assets/artist-ryal.jpg" },
  { name: "NICOLE CHEN", country: "SINGAPORE", year: "2026", href: "/lineup/nicole-chen", image: "/assets/artist-nicole-chen.jpg" },
  { name: "KICKCHEEZE", country: "AUSTRALIA", year: "2026", href: "/lineup/kickcheeze", image: "/assets/artist-kickcheeze.jpg" },
  { name: "BI HI", country: "VIETNAM", year: "2026", href: "/lineup/bi-hi", image: "/assets/artist-bi-hi.jpg" },
  { name: "RYSAL", country: "AUSTRALIA", year: "2026", href: "/lineup/rysal", image: "/assets/artist-rysal.jpg" },
  { name: "MAYA", country: "SINGAPORE", year: "2026", href: "/lineup/maya", image: "/assets/artist-maya.jpg" },
  { name: "MICO", country: "AUSTRALIA", year: "2026", href: "/lineup/mico", image: "/assets/artist-mico.jpg" },
  { name: "EMS", country: "AUSTRALIA", year: "2026", href: "/lineup/ems", image: "/assets/artist-ems.jpg" },
];

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
  { label: "Gallery", href: "/gallery" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];
export type ArtistType = typeof artists[number];
export type TicketTierType = typeof ticketTiers[number];
export type TrustItemType = typeof trustItems[number];
