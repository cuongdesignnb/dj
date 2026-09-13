// Mock fixture for the Destiny event. This is the default data source until
// the backend is hooked up. The fixture must pass the runtime validator and
// carries contentStatus: 'preview' so the page knows no real booking is
// promised and no JSON-LD is emitted.

import type { EventPageData } from './types';

const PORTRAITS = {
  ryal: { src: '/assets/artist-ryal.jpg', alt: 'Ryal performing on stage', width: 720, height: 810, objectPosition: '50% 25%' },
  nicoleChen: { src: '/assets/artist-nicole-chen.jpg', alt: 'Nicole Chen performing', width: 720, height: 810, objectPosition: '50% 30%' },
  kickcheeze: { src: '/assets/artist-kickcheeze.jpg', alt: 'Kickcheeze performing', width: 720, height: 810, objectPosition: '50% 30%' },
  biHi: { src: '/assets/artist-bi-hi.jpg', alt: 'Bi Hi performing', width: 720, height: 810, objectPosition: '50% 25%' },
  rysal: { src: '/assets/artist-rysal.jpg', alt: 'Rysal performing', width: 720, height: 810, objectPosition: '50% 30%' },
  maya: { src: '/assets/artist-maya.jpg', alt: 'Maya performing', width: 720, height: 810, objectPosition: '50% 25%' },
  mico: { src: '/assets/artist-mico.jpg', alt: 'Mico performing', width: 720, height: 810, objectPosition: '50% 30%' },
  ems: { src: '/assets/artist-ems.jpg', alt: 'Ems performing', width: 720, height: 810, objectPosition: '50% 30%' },
};

export const destinyFixture: EventPageData = {
  schemaVersion: 1,
  event: {
    id: 'evt-destiny-2026',
    slug: 'destiny',
    name: 'DESTINY',
    title: 'THE DESTINY EXPERIENCE',
    intro:
      'A high-energy nightlife experience where music, culture and people come together. DESTINY brings together international and local talent for a night of pure connection on the dancefloor.',
    accentLine: 'MUSIC, ENERGY, AND PEOPLE BECOME ONE.',
    aboutParagraphs: [
      'DESTINY is more than just a rave — it\'s a celebration of music, people and cultural connection. We bring together international and local DJs, a diverse crowd and an immersive production to create a night that goes beyond the ordinary.',
      'Whether you come for the music, the atmosphere or the people, DESTINY is a space where everyone belongs.',
    ],
    genres: ['EDM', 'Hardstyle', 'Techno', 'Vinahouse'],
    startsAt: null,
    endsAt: null,
    doorsOpenAt: null,
    timeZone: 'Australia/Perth',
    poster: {
      src: '/assets/event-poster.jpg',
      alt: 'DESTINY event poster — vertical neon design',
      width: 1200,
      height: 1600,
    },
    heroBackground: {
      src: '/assets/hero-crowd.jpg',
      alt: 'Crowd lights at a high-energy rave',
      width: 2400,
      height: 1350,
    },
    experienceImage: {
      src: '/assets/hero-crowd.jpg',
      alt: 'Crowd lights at a high-energy rave',
      width: 2400,
      height: 1350,
    },
    highlights: [
      {
        id: 'highlight-djs',
        icon: 'globe',
        title: 'INTERNATIONAL & LOCAL DJS',
        description: 'A curated lineup of international and local talent across multiple genres.',
      },
      {
        id: 'highlight-crowd',
        icon: 'users',
        title: '1000+ CROWD ENERGY',
        description: 'Be part of a massive community united by a shared love for music.',
      },
      {
        id: 'highlight-culture',
        icon: 'sparkles',
        title: 'MULTI-CULTURAL EXPERIENCE',
        description: 'A diverse crowd, different backgrounds, one dancefloor.',
      },
    ],
    expectations: [
      {
        id: 'expect-music',
        icon: 'music',
        title: 'MUSIC',
        description: 'High-energy sets across EDM, Hardstyle, Techno and Vinahouse.',
      },
      {
        id: 'expect-visuals',
        icon: 'sparkles',
        title: 'VISUALS',
        description: 'Immersive lighting, visuals and production that elevate the experience.',
      },
      {
        id: 'expect-crowd',
        icon: 'users',
        title: 'CROWD',
        description: 'A diverse and passionate community that brings the energy to life.',
      },
      {
        id: 'expect-venue',
        icon: 'map-pin',
        title: 'VENUE',
        description: 'An iconic space in Metro City, Perth transformed for a night to remember.',
      },
    ],
    artists: [
      {
        id: 'ryal',
        slug: 'ryal',
        name: 'RYAL',
        country: 'VIETNAM',
        portrait: PORTRAITS.ryal,
        profileHref: null,
      },
      {
        id: 'nicole-chen',
        slug: 'nicole-chen',
        name: 'NICOLE CHEN',
        country: 'SINGAPORE',
        portrait: PORTRAITS.nicoleChen,
        profileHref: null,
      },
      {
        id: 'kickcheeze',
        slug: 'kickcheeze',
        name: 'KICKCHEEZE',
        country: 'AUSTRALIA',
        portrait: PORTRAITS.kickcheeze,
        profileHref: null,
      },
      {
        id: 'bi-hi',
        slug: 'bi-hi',
        name: 'BI HI',
        country: 'VIETNAM',
        portrait: PORTRAITS.biHi,
        profileHref: null,
      },
      {
        id: 'rysal',
        slug: 'rysal',
        name: 'RYSAL',
        country: 'AUSTRALIA',
        portrait: PORTRAITS.rysal,
        profileHref: null,
      },
      {
        id: 'maya',
        slug: 'maya',
        name: 'MAYA',
        country: 'SINGAPORE',
        portrait: PORTRAITS.maya,
        profileHref: null,
      },
      {
        id: 'mico',
        slug: 'mico',
        name: 'MICO',
        country: 'AUSTRALIA',
        portrait: PORTRAITS.mico,
        profileHref: null,
      },
      {
        id: 'ems',
        slug: 'ems',
        name: 'EMS',
        country: 'AUSTRALIA',
        portrait: PORTRAITS.ems,
        profileHref: null,
      },
    ],
    venue: {
      name: 'Metro City',
      city: 'Perth',
      address: null,
      description:
        'More event details including venue information, entry guidelines and other important updates will be announced soon.',
      image: null,
      mapUrl: null,
    },
    actions: {
      ticketUrl: null,
      vipRequestUrl: null,
    },
    seo: {
      title: 'DESTINY — Event Details | Connection Rave',
      description:
        'DESTINY by Connection Rave — a high-energy nightlife experience at Metro City, Perth. Music, culture and people become one.',
      image: {
        src: '/assets/event-poster.jpg',
        alt: 'DESTINY event poster',
        width: 1200,
        height: 630,
      },
    },
    contentStatus: 'preview',
  },
  site: {
    brandName: 'CONNECTION',
    tagline: 'Sound Meets Soul',
    logo: {
      src: '/assets/logo-connection.svg',
      alt: 'Connection — Sound Meets Soul',
      width: 220,
      height: 64,
    },
    partners: [
      {
        id: 'mcq',
        name: 'MCQ Supermarket',
        logo: {
          src: '/assets/logo-mcq.svg',
          alt: 'MCQ Supermarket',
          width: 160,
          height: 56,
        },
      },
      {
        id: 'bihi',
        name: 'BIHI Entertainment',
        logo: {
          src: '/assets/logo-bihi.svg',
          alt: 'BIHI Entertainment',
          width: 200,
          height: 56,
        },
      },
    ],
    contact: {
      email: null,
      phone: null,
      socials: [],
    },
  },
};

export const FIXTURE_BY_SLUG: Record<string, EventPageData> = {
  destiny: destinyFixture,
};
