import type { EventsPageData } from './listing-types';

// Mock content for the /events listing.
//
// Ground rules this file has to hold to:
//  - DESTINY at Metro City, Perth is the only real, announced event.
//  - No date is claimed. Date is TBA, schedule is TBC.
//  - Every other card is placeholder: true, with copy that reads as
//    "not announced yet" rather than as a real event.
//  - No invented ticket links, waitlist endpoints, socials or contact
//    details. Where a destination does not exist, href is null and the UI
//    renders the action as unavailable.

/**
 * DESTINY currently lives at /event. The listing is built for /events/[slug],
 * so the slug travels with the data and only detailHref points at today's
 * route — migrating later is a one-line data change, not a component change.
 */
const DESTINY_DETAIL_HREF = '/event';

export const EVENTS_MOCK: EventsPageData = {
  hero: {
    eyebrow: 'UPCOMING EVENTS',
    titleLines: ['THE NIGHTS', "WE'RE BUILDING"],
    description:
      'Discover upcoming Connection Rave experiences in Perth. From massive lineups to immersive productions, each event brings people, music and culture together.',
    primaryCta: { label: 'Explore Destiny', href: DESTINY_DETAIL_HREF },
    secondaryCta: {
      label: 'Join The Waitlist',
      href: null,
      unavailableNote: 'Waitlist opens soon',
    },
    visual: {
      src: '/assets/hero-crowd.jpg',
      alt: 'Crowd with raised hands in front of a circular stage light under red lasers',
      width: 1600,
      height: 1000,
    },
    visualAnnotations: { side: ['MUSIC', 'PEOPLE', 'ENERGY', 'CONNECTION'] },
  },

  featuredEvent: {
    id: 'destiny',
    slug: 'destiny',
    title: 'DESTINY',
    subtitle: 'MUSIC MEETS SOUL',
    location: 'Metro City, Perth',
    image: {
      src: '/assets/event-poster.jpg',
      alt: 'DESTINY poster: Music Meets Soul, a night beyond reality',
      width: 1200,
      height: 1500,
    },
    status: 'announced',
    featured: true,
    date: null,
    dateStatus: 'tba',
    schedule: null,
    scheduleStatus: 'tbc',
    genres: ['EDM', 'Hardstyle', 'Techno', 'Vinahouse'],
    description:
      'A high-energy nightlife experience where music, culture and people come together. DESTINY brings together international and local talent for a night of pure connection on the dancefloor.',
    detailHref: DESTINY_DETAIL_HREF,
    // Ticketing is not live. Left null so the CTA renders as unavailable
    // instead of implying tickets are on sale.
    ticketHref: null,
    notificationAction: null,
  },

  events: [
    {
      id: 'destiny',
      slug: 'destiny',
      title: 'DESTINY',
      subtitle: 'MUSIC MEETS SOUL',
      location: 'Metro City, Perth',
      image: {
        src: '/assets/event-poster.jpg',
        alt: 'DESTINY poster: Music Meets Soul',
        width: 1200,
        height: 1500,
      },
      status: 'announced',
      featured: true,
      date: null,
      dateStatus: 'tba',
      schedule: null,
      scheduleStatus: 'tbc',
      genres: ['EDM', 'Hardstyle', 'Techno'],
      detailHref: DESTINY_DETAIL_HREF,
      ticketHref: null,
      notificationAction: null,
    },
    {
      id: 'next-event',
      slug: 'next-event',
      title: 'NEXT EVENT\nCOMING SOON',
      location: null,
      image: { src: '', alt: '' },
      status: 'coming-soon',
      featured: false,
      placeholder: true,
      date: null,
      dateStatus: 'tba',
      schedule: null,
      scheduleStatus: 'tbc',
      genres: ['Various Genres'],
      description: 'Stay tuned for the next drop',
      detailHref: null,
      ticketHref: null,
      notificationAction: {
        label: 'Notify Me',
        href: null,
        unavailableNote: 'Announcement channel to be confirmed',
      },
    },
    {
      id: 'lineup-reveal',
      slug: 'lineup-reveal',
      title: 'LINEUP REVEAL\nCOMING SOON',
      location: null,
      image: { src: '', alt: '' },
      status: 'coming-soon',
      featured: false,
      placeholder: true,
      date: null,
      dateStatus: 'tba',
      schedule: null,
      scheduleStatus: 'tbc',
      genres: ['Various Genres'],
      description: 'Stay tuned for the next drop',
      detailHref: null,
      ticketHref: null,
      notificationAction: {
        label: 'Notify Me',
        href: null,
        unavailableNote: 'Announcement channel to be confirmed',
      },
    },
    {
      id: 'special-experience',
      slug: 'special-experience',
      title: 'SPECIAL EXPERIENCE\nCOMING SOON',
      location: null,
      image: { src: '', alt: '' },
      status: 'coming-soon',
      featured: false,
      placeholder: true,
      date: null,
      dateStatus: 'tba',
      schedule: null,
      scheduleStatus: 'tbc',
      genres: ['Various Genres'],
      description: 'A new kind of night awaits',
      detailHref: null,
      ticketHref: null,
      notificationAction: {
        label: 'Learn More',
        href: null,
        unavailableNote: 'Details to be announced',
      },
    },
  ],

  benefits: [
    {
      id: 'curated-lineups',
      title: 'CURATED LINEUPS',
      description: 'International and local talent across multiple genres.',
      icon: 'Music',
    },
    {
      id: 'immersive-production',
      title: 'IMMERSIVE PRODUCTION',
      description: 'Stunning visuals, lighting and sound that transform ordinary spaces.',
      icon: 'Sparkles',
    },
    {
      id: 'community-energy',
      title: 'COMMUNITY ENERGY',
      description: 'A diverse crowd united by music, culture and positive energy.',
      icon: 'Users',
    },
    {
      id: 'limited-capacity',
      title: 'LIMITED CAPACITY',
      description: 'Exclusive experiences with a focus on quality, not quantity.',
      icon: 'Ticket',
    },
  ],

  finalCta: {
    eyebrow: 'SAME PEOPLE  BRIGHTER TOMORROW',
    title: 'READY FOR THE NEXT NIGHT?',
    description:
      'Be the first to know about upcoming events, lineup announcements and exclusive experiences in Perth.',
    primary: {
      label: 'Get Tickets',
      href: null,
      unavailableNote: 'Ticket release to be announced',
    },
    secondary: { label: 'Contact Us', href: '/contact' },
    background: {
      src: '/assets/hero-crowd.jpg',
      alt: '',
      width: 1600,
      height: 1000,
    },
  },

  footer: {
    // No contact details have been confirmed, so the UI shows the fallback
    // copy rather than an invented address or phone number.
    email: null,
    phone: null,
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
