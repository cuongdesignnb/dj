import type { VipBooth, VipPageData } from './types';

// Canonical VIP content for /tables and /book-now.
//
// The package matches lib/data.ts: $3,200, 15 people, 3 bottles, and the same
// six bottle choices. Nothing here invents a second package, a deposit, a fee,
// a per-booth capacity or an availability count — every booth is 'on-request'
// because nothing reports live availability.

/**
 * Booth positions on the illustrative map, as percentages.
 *
 * These describe the drawn layout in components/vip/ClubMap, not the venue.
 * The map carries a disclaimer saying exactly that.
 */
const BOOTHS: VipBooth[] = [
  { id: 'b1', label: 'B1', zone: 'left', x: 11, y: 22, requestable: true, availability: 'on-request' },
  { id: 'b2', label: 'B2', zone: 'left', x: 11, y: 37, requestable: true, availability: 'on-request' },
  { id: 'b3', label: 'B3', zone: 'left', x: 11, y: 52, requestable: true, availability: 'on-request' },
  { id: 'b4', label: 'B4', zone: 'left', x: 11, y: 67, requestable: true, availability: 'on-request' },

  { id: 'b5', label: 'B5', zone: 'right', x: 79, y: 22, requestable: true, availability: 'on-request' },
  { id: 'b6', label: 'B6', zone: 'right', x: 79, y: 37, requestable: true, availability: 'on-request' },
  { id: 'b7', label: 'B7', zone: 'right', x: 79, y: 52, requestable: true, availability: 'on-request' },
  { id: 'b8', label: 'B8', zone: 'right', x: 79, y: 67, requestable: true, availability: 'on-request' },

  { id: 'b9', label: 'B9', zone: 'front', x: 30, y: 82, requestable: true, availability: 'on-request' },
  { id: 'b10', label: 'B10', zone: 'front', x: 43, y: 82, requestable: true, availability: 'on-request' },
  { id: 'b11', label: 'B11', zone: 'front', x: 56, y: 82, requestable: true, availability: 'on-request' },
  { id: 'b12', label: 'B12', zone: 'front', x: 69, y: 82, requestable: true, availability: 'on-request' },
];

export const VIP_MOCK: VipPageData = {
  event: {
    id: 'destiny',
    slug: 'destiny',
    title: 'DESTINY',
    subtitle: 'MUSIC MEETS SOUL',
    venue: 'Metro City, Perth',
    date: null,
    dateStatus: 'tba',
    schedule: null,
    scheduleStatus: 'tbc',
    image: {
      src: '/assets/hero-crowd.jpg',
      alt: 'Crowd with raised hands under red lasers at a Connection Rave night',
      width: 1600,
      height: 1000,
    },
  },

  package: {
    id: 'booth-package',
    name: 'Booth Package',
    price: { amountMinor: 320000, currency: 'AUD' },
    capacity: 15,
    includedBottleCount: 3,
    // A request may be sent with fewer than three choices; the package still
    // includes three. Tighten this only if the business says all three are
    // required up front.
    minBottleSelections: 1,
    maxBottleSelections: 3,
    description:
      'Your own private booth with premium bottle service, dedicated space and the best views in the house. Celebrate DESTINY in style with your crew.',
  },

  booths: BOOTHS,

  bottles: [
    { id: 'belvedere', name: 'Belvedere Vodka', tint: '#8FB8E8', enabled: true },
    { id: 'hennessy', name: 'Hennessy VS', tint: '#C87A2E', enabled: true },
    { id: 'el-jimador', name: 'El Jimador Tequila', tint: '#D8D8D0', enabled: true },
    { id: 'moet', name: 'Moët & Chandon', tint: '#D9B45B', enabled: true },
    { id: 'jager', name: 'Jager', tint: '#2E6B3A', enabled: true },
    { id: 'wap', name: 'WAP Cranberry Peach', tint: '#E8557A', enabled: true },
  ],

  mapDisclaimer: 'Illustrative layout — not the venue floor plan.',

  infoItems: [
    {
      id: 'vip-experience',
      icon: 'Crown',
      title: 'VIP Experience',
      description: 'Premium booths, bottle service and dedicated space for you and your crew.',
      action: null,
    },
    {
      id: 'flexible-requests',
      icon: 'Users',
      title: 'Flexible Requests',
      description:
        'Let us know your preferred area, group size or special requests. We will do our best to accommodate.',
      action: null,
    },
    {
      id: 'bar-list',
      icon: 'Wine',
      title: 'Bar List',
      description: 'Explore our full bar selection including spirits, champagne, beer and more.',
      action: { label: 'View Bar List', href: '#bottle-options' },
    },
    {
      id: 'club-map',
      icon: 'Map',
      title: 'Club Map',
      description: 'See the venue layout and available booth areas.',
      action: { label: 'View Club Map', href: '#club-map' },
    },
  ],

  faq: [
    {
      id: 'how-requests-work',
      question: 'How do VIP table requests work?',
      answer:
        'Choose your preferred booth and bottle options, then send a booking request with your contact details.',
    },
    {
      id: 'when-confirmed',
      question: 'When is availability confirmed?',
      answer: 'Booth availability is confirmed by the team after your request is reviewed.',
    },
    {
      id: 'after-enquiry',
      question: 'What happens after I enquire?',
      answer: 'The team will contact you with availability and next steps.',
    },
  ],

  processSteps: [
    {
      id: 'submit',
      title: 'Submit your request',
      description: 'Tell us your details and preferred setup.',
    },
    {
      id: 'review',
      title: 'Team review and availability check',
      description: 'Our team will review your request and check availability.',
    },
    {
      id: 'confirm',
      title: 'Confirmation by contact',
      description: 'We will be in touch with next steps.',
    },
  ],

  bookingNotes: [
    {
      id: 'flexible-requests',
      icon: 'Users',
      title: 'Flexible Requests',
      description: 'Tell us your preferred area and bottle choices.',
    },
    {
      id: 'response-time',
      icon: 'Clock',
      title: 'Response Time',
      description: 'The team will review your request and respond when possible.',
    },
    {
      id: 'event-access',
      icon: 'Ticket',
      title: 'Event Access',
      description: 'Booking and entry details are confirmed directly by the team.',
    },
    {
      id: 'vip-support',
      icon: 'Headset',
      title: 'VIP Support',
      description: 'Need assistance? Contact the team before the event.',
    },
  ],

  bookingFaq: [
    {
      id: 'instant-booking',
      question: 'Is this an instant booking?',
      answer:
        'No. This form sends a booking request. Your reservation is only confirmed after the team contacts you.',
    },
    {
      id: 'specific-booth',
      question: 'Can I request a specific booth?',
      answer: 'Yes. You can select a preferred booth, subject to availability.',
    },
    {
      id: 'confirmation',
      question: 'How will I receive confirmation?',
      answer:
        'The team will use the contact details you provide to confirm availability and next steps.',
    },
  ],

  tablesCta: {
    title: 'READY FOR THE NIGHT?',
    subtitle: 'Same people. A brighter tomorrow.',
    primary: { label: 'Send Booking Request', href: '/book-now' },
    secondary: { label: 'Contact Us', href: '/contact' },
    background: { src: '/assets/hero-crowd.jpg', alt: '', width: 1600, height: 1000 },
  },

  bookingCta: {
    title: 'READY TO LOCK IN YOUR NIGHT?',
    subtitle: 'Same people. A brighter tomorrow.',
    primary: { label: 'View VIP Tables', href: '/tables' },
    secondary: { label: 'Contact Us', href: '/contact' },
    background: { src: '/assets/hero-crowd.jpg', alt: '', width: 1600, height: 1000 },
  },

  footer: {
    email: null,
    phone: null,
    partners: [
      {
        id: 'mcq',
        name: 'MCQ Supermarket',
        logo: { src: '/assets/logo-mcq.png', alt: 'MCQ Supermarket', width: 200, height: 64 },
      },
      {
        id: 'bihi',
        name: 'BIHI Entertainment',
        logo: { src: '/assets/logo-bihi.png', alt: 'BIHI Entertainment', width: 200, height: 64 },
      },
    ],
    socials: [
      { id: 'instagram', platform: 'instagram', url: null },
      { id: 'facebook', platform: 'facebook', url: null },
      { id: 'youtube', platform: 'youtube', url: null },
      { id: 'tiktok', platform: 'tiktok', url: null },
    ],
    legalTermsHref: '/terms',
    legalPrivacyHref: '/privacy',
  },
};
