import type { TicketsPageData } from './types';

// Content for /tickets.
//
// Prices match the tiers already in lib/data.ts ($35 / $66 / $100), stored in
// minor units. No ticket provider has been configured, so provider.mode is
// 'unavailable' and the checkout CTA renders as not-yet-live rather than
// linking somewhere that cannot complete a purchase.
//
// Nothing here claims a date, an inventory level, a payment guarantee or a
// verification process that has not been confirmed.

export const TICKETS_MOCK: TicketsPageData = {
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
      src: '/assets/event-poster.jpg',
      alt: 'DESTINY poster: Music Meets Soul',
      width: 1200,
      height: 1500,
    },
  },

  tiers: [
    {
      id: 'student-concession',
      name: 'Student Concession',
      description:
        'Affordable entry for students. Bring your student ID and be part of the DESTINY experience at a reduced price.',
      price: { amountMinor: 3500, currency: 'AUD' },
      badge: 'Best Value',
      icon: 'GraduationCap',
      features: ['Valid student ID required', 'Same full experience'],
      purchasableOnline: true,
      purchasableAtDoor: false,
      minQuantity: 0,
      // No provider-confirmed cap, so none is invented.
      maxQuantity: null,
      defaultQuantity: 0,
      highlighted: false,
    },
    {
      id: 'final-release',
      name: 'Final Release',
      description:
        'Secure your spot at the DESTINY experience with our final release tickets. Join thousands for a night of music, energy and connection.',
      price: { amountMinor: 6600, currency: 'AUD' },
      badge: null,
      icon: 'Ticket',
      features: ['Full event access', 'Limited quantity'],
      purchasableOnline: true,
      purchasableAtDoor: false,
      minQuantity: 0,
      maxQuantity: null,
      defaultQuantity: 2,
      highlighted: true,
      // Nothing reports stock levels yet, so availability stays unknown
      // instead of implying a live count.
      availability: { status: 'unknown', remaining: null },
    },
    {
      id: 'ticket-at-door',
      name: 'Ticket At Door',
      description:
        'Tickets available at the venue on the night. Subject to capacity. We recommend securing your ticket in advance.',
      price: { amountMinor: 10000, currency: 'AUD' },
      badge: 'At The Entrance',
      icon: 'DoorOpen',
      features: ['Cash / Card at venue', 'No online checkout'],
      purchasableOnline: false,
      purchasableAtDoor: true,
      minQuantity: 0,
      maxQuantity: null,
      highlighted: false,
    },
  ],

  provider: {
    // No ticket provider has been set up. Until one is, the CTA says so.
    providerName: undefined,
    checkoutUrl: null,
    eventExternalId: null,
    mode: 'unavailable',
    unavailableNote: 'Ticket link will be available soon.',
  },

  trustItems: [
    {
      id: 'secure-checkout',
      icon: 'ShieldCheck',
      title: 'Secure Checkout',
      description: 'Payment is completed on the official ticket provider, not on this site.',
      verificationState: 'marketing-copy',
    },
    {
      id: 'official-tickets',
      icon: 'BadgeCheck',
      title: 'Official Tickets',
      description: 'Tickets are issued by the official ticket provider for this event.',
      verificationState: 'marketing-copy',
    },
    {
      id: 'limited-capacity',
      icon: 'Users',
      title: 'Limited Capacity',
      description: 'Capacity is limited and will be confirmed by the organiser.',
      verificationState: 'marketing-copy',
    },
  ],

  infoItems: [
    {
      id: 'how-ticketing-works',
      icon: 'ShoppingCart',
      title: 'How Ticketing Works',
      description:
        'Select your ticket type and quantity. You will be redirected to the official ticket provider to complete your purchase.',
    },
    {
      id: 'entry-information',
      icon: 'DoorOpen',
      title: 'Entry Information',
      description:
        'Entry requirements and final event instructions will be confirmed by the organiser before the event.',
    },
    {
      id: 'ticket-delivery',
      icon: 'Ticket',
      title: 'Ticket Delivery',
      description:
        'Ticket delivery and confirmation are handled by the official ticket provider according to their process.',
    },
    {
      id: 'questions',
      icon: 'CircleHelp',
      title: 'Questions Before You Go',
      description:
        'Need help? Check the FAQ below or contact the organiser for ticket and event information.',
    },
  ],

  faq: [
    {
      id: 'payment',
      question: 'Where do I complete payment?',
      answer:
        'Online ticket purchases are completed through the official ticket provider. This page collects your selection and hands it over; no payment details are entered here.',
    },
    {
      id: 'door',
      question: 'Can I buy at the door?',
      answer:
        'Door tickets are shown as an event option and may be subject to venue capacity. Final availability will be confirmed by the organiser.',
    },
    {
      id: 'schedule',
      question: 'When will the schedule be announced?',
      answer:
        'The schedule is still to be confirmed. Event updates will be published once available.',
    },
  ],

  finalCta: {
    title: 'READY FOR THE NIGHT?',
    subtitle: 'Same people. A brighter tomorrow.',
    primary: { label: 'Explore VIP Tables', href: '/tables' },
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
