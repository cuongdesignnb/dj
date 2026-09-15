import type { Artist, ArtistEventReference, LineupPageData } from './types';

// Canonical lineup content.
//
// The eight artists, their countries and their portraits come from the existing
// source in lib/data.ts. Nothing else about them is known, so bio is null,
// genres are empty, set times are TBA and there are no socials, media or past
// shows. The UI is built to show a fallback or hide those sections — none of it
// is filled in here.
//
// RYAL and RYSAL are two different artists. Keep them distinct.

/** The one event these artists are currently attached to. Date is not known. */
const DESTINY_EVENT: ArtistEventReference = {
  eventId: 'destiny',
  eventSlug: 'destiny',
  eventTitle: 'DESTINY',
  href: '/event',
  venue: 'Metro City, Perth',
  date: null,
  dateStatus: 'tba',
  schedule: null,
  scheduleStatus: 'tbc',
};

function artist(
  slug: string,
  name: string,
  country: string,
  portraitFile: string,
): Artist {
  return {
    id: slug,
    slug,
    name,
    country,
    year: '2026',
    portrait: {
      src: `/assets/${portraitFile}`,
      alt: `${name}, ${country.toLowerCase()} artist on the DESTINY lineup`,
      width: 900,
      height: 1200,
    },
    heroImage: null,
    bio: null,
    genres: [],
    setTime: null,
    setTimeStatus: 'tba',
    externalLinks: [],
    media: [],
    upcomingEvents: [DESTINY_EVENT],
    pastEvents: [],
    featured: false,
  };
}

export const ARTISTS: Artist[] = [
  artist('ryal', 'RYAL', 'VIETNAM', 'artist-ryal.jpg'),
  artist('nicole-chen', 'NICOLE CHEN', 'SINGAPORE', 'artist-nicole-chen.jpg'),
  artist('kickcheeze', 'KICKCHEEZE', 'AUSTRALIA', 'artist-kickcheeze.jpg'),
  artist('bi-hi', 'BI HI', 'VIETNAM', 'artist-bi-hi.jpg'),
  artist('rysal', 'RYSAL', 'AUSTRALIA', 'artist-rysal.jpg'),
  artist('maya', 'MAYA', 'SINGAPORE', 'artist-maya.jpg'),
  artist('mico', 'MICO', 'AUSTRALIA', 'artist-mico.jpg'),
  artist('ems', 'EMS', 'AUSTRALIA', 'artist-ems.jpg'),
];

export const LINEUP_MOCK: LineupPageData = {
  hero: {
    eyebrow: 'ARTIST LINEUP',
    titleLines: ['MEET THE', 'ARTISTS'],
    description:
      'Discover the DJs and performers behind DESTINY. A diverse collective of international and local talent, uniting through music, people and culture.',
    primaryCta: { label: 'Get Tickets', href: '/tickets' },
    secondaryCta: { label: 'View Event', href: '/event' },
    visual: {
      src: '/assets/hero-crowd.jpg',
      alt: 'Crowd with raised hands in front of a circular stage light under red lasers',
      width: 1600,
      height: 1000,
    },
    sideNotes: ['MUSIC', 'PEOPLE', 'CULTURE', 'A BRIGHTER TOMORROW'],
    // The badge names the lineup, not a date — nothing here schedules the event.
    badge: ['DESTINY', '2026 LINEUP'],
    location: 'Metro City, Perth',
  },

  artists: ARTISTS,

  story: {
    eyebrow: 'SOUND MEETS SOUL',
    title: 'MORE THAN MUSIC',
    description:
      'Music, people and culture come together at DESTINY. A shared love for sound that connects us all.',
    image: {
      src: '/assets/hero-crowd.jpg',
      alt: '',
      width: 1600,
      height: 1000,
    },
  },

  finalCta: {
    title: 'READY FOR THE NIGHT?',
    subtitle: 'Same people. A brighter tomorrow.',
    primary: { label: 'Get Tickets', href: '/tickets' },
    secondary: { label: 'Explore VIP Tables', href: '/tables' },
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
    legalTermsHref: null,
    legalPrivacyHref: null,
  },
};
