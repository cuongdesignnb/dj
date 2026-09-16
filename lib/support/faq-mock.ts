import type { FaqPageData } from './faq-types';

// Local FAQ content — the default data source.
//
// Every answer states only what the rest of the site already establishes
// (the venue, the request-not-reservation VIP flow) or says plainly that a
// detail is still to be confirmed. No refund terms, age limits, prices or
// dates are stated.

export const FAQ_MOCK: FaqPageData = {
  hero: {
    eyebrow: 'FAQ',
    title: 'BEFORE THE NIGHT',
    description:
      'Find answers to the most common questions about the DESTINY experience, tickets, entry, venue and VIP tables.',
    visual: { src: '/assets/hero-crowd.jpg', alt: '', width: 1600, height: 1000 },
    sideNotes: ['MUSIC', 'PEOPLE', 'CULTURE', 'CONNECTION'],
  },

  categories: [
    { id: 'tickets', label: 'Tickets', icon: 'ticket', sortOrder: 1 },
    { id: 'entry', label: 'Entry', icon: 'entry', sortOrder: 2 },
    { id: 'vip-tables', label: 'VIP Tables', icon: 'crown', sortOrder: 3 },
    { id: 'venue', label: 'Venue', icon: 'pin', sortOrder: 4 },
  ],

  items: [
    {
      id: 'buy-tickets',
      category: 'tickets',
      question: 'Where can I buy tickets?',
      answer:
        'Online ticket purchases are completed through the official ticket provider.',
      keywords: ['purchase', 'buy', 'ticket provider', 'online'],
      sortOrder: 1,
      published: true,
    },
    {
      id: 'ticket-details',
      category: 'tickets',
      question: 'Are ticket types and prices confirmed?',
      answer:
        'Ticket types, pricing and release details are subject to confirmation by the event organizer. The Tickets page shows the latest information.',
      keywords: ['price', 'cost', 'release', 'general admission'],
      sortOrder: 2,
      published: true,
    },
    {
      id: 'schedule',
      category: 'entry',
      question: 'When will the schedule be announced?',
      answer:
        'The event schedule is still to be confirmed. Updates will be published once available.',
      keywords: ['set times', 'timetable', 'doors', 'start time', 'lineup'],
      sortOrder: 1,
      published: true,
    },
    {
      id: 'entry-requirements',
      category: 'entry',
      question: 'What do I need to bring for entry?',
      answer:
        'Entry requirements, including identification and any other conditions, are still to be confirmed by the event organizer. They will be published before the event.',
      keywords: ['id', 'identification', 'requirements', 'door'],
      sortOrder: 2,
      published: true,
    },
    {
      id: 'vip-requests',
      category: 'vip-tables',
      question: 'How do VIP table requests work?',
      answer:
        'Submit your preferred booth and contact details. The team will review the request and confirm availability with you directly.',
      keywords: ['booth', 'table', 'booking', 'request'],
      sortOrder: 1,
      published: true,
    },
    {
      id: 'vip-confirmation',
      category: 'vip-tables',
      question: 'Is my table confirmed once I submit a request?',
      answer:
        'No. Submitting a request does not reserve a booth. The team will confirm availability and details with you directly.',
      keywords: ['reservation', 'confirmed', 'booth', 'booking'],
      sortOrder: 2,
      published: true,
    },
    {
      id: 'venue-location',
      category: 'venue',
      question: 'Where is DESTINY being held?',
      answer:
        'DESTINY is being held at Metro City, Perth. Arrival and access details will be shared closer to the event.',
      keywords: ['location', 'address', 'metro city', 'perth'],
      sortOrder: 1,
      published: true,
    },
    {
      id: 'venue-layout',
      category: 'venue',
      question: 'Is the table map the actual venue floor plan?',
      answer:
        'No. The layout on the Tables page is illustrative and is not the venue floor plan.',
      keywords: ['map', 'floor plan', 'layout', 'booths'],
      sortOrder: 2,
      published: true,
    },
  ],

  finalCta: {
    title: 'STILL NEED HELP?',
    description:
      'Can’t find the answer you’re looking for? Our team is here to help. Get in touch or explore more about the event.',
    primary: { label: 'Contact Us', href: '/contact' },
    secondary: { label: 'Explore Event', href: '/event' },
    background: { src: '/assets/hero-crowd.jpg', alt: '' },
  },
};
