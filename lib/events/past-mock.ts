import type { PastEventSummary, PastEventsPageData } from './listing-types';

// Content for /events/past.
//
// The approved design shows four named nights with 2023 dates. Nothing in this
// repository confirms those events happened, so they are treated strictly as
// design placeholders: they are flagged `isPlaceholder`, and they are only
// served when the site is explicitly asked for the design preview. In every
// other configuration the archive renders neutral placeholders that claim
// nothing — no invented dates, venues, line-ups, galleries or attendance.
//
// Replace both of these with CMS/API data via HttpEventsRepository.

const HERO: PastEventsPageData['hero'] = {
  eyebrow: 'PAST EVENTS',
  titleLines: ['THE NIGHTS', 'WE STILL FEEL'],
  description:
    'Relive the Connection Rave moments. Explore event recaps, galleries, unforgettable performances and the community energy that keeps our story alive.',
  primaryCta: { label: 'Browse Archive', href: '#event-archive' },
  secondaryCta: { label: 'View Upcoming Events', href: '/events' },
  visual: {
    src: '/assets/hero-crowd.jpg',
    alt: 'Crowd with raised hands in front of a circular stage light under red lasers',
    width: 1600,
    height: 1000,
  },
  visualAnnotations: {
    side: ['MEMORIES', 'MUSIC', 'PEOPLE', 'CULTURE'],
    note: ['LOOKING BACK.', 'MOVING FORWARD.'],
  },
};

const BENEFITS: PastEventsPageData['benefits'] = [
  {
    id: 'unforgettable-moments',
    title: 'UNFORGETTABLE MOMENTS',
    description: 'More than events — real experiences that stay with you long after the night ends.',
    icon: 'Music2',
  },
  {
    id: 'immersive-production',
    title: 'IMMERSIVE PRODUCTION',
    description: 'Stunning visuals, lighting and sound that transform ordinary spaces.',
    icon: 'Sparkles',
  },
  {
    id: 'artist-energy',
    title: 'ARTIST ENERGY',
    description: 'World-class talent bringing unique sounds and creating unmatched atmosphere.',
    icon: 'Users',
  },
  {
    id: 'community-memory',
    title: 'COMMUNITY MEMORY',
    description: 'A growing community united by music, culture and lifelong connections.',
    icon: 'Heart',
  },
];

const FINAL_CTA: PastEventsPageData['finalCta'] = {
  eyebrow: 'SAME PEOPLE. BRIGHTER TOMORROW',
  title: 'READY FOR THE NEXT NIGHT?',
  description:
    'Explore our upcoming events, new experiences and more ways to be part of the Connection Rave community.',
  primary: { label: 'Explore Upcoming Events', href: '/events' },
  secondary: { label: 'Contact Us', href: '/contact' },
  background: {
    src: '/assets/hero-crowd.jpg',
    alt: '',
    width: 1600,
    height: 1000,
  },
};

const FOOTER: PastEventsPageData['footer'] = {
  email: null,
  phone: null,
  socials: [
    { id: 'instagram', platform: 'instagram', url: null },
    { id: 'facebook', platform: 'facebook', url: null },
    { id: 'youtube', platform: 'youtube', url: null },
    { id: 'tiktok', platform: 'tiktok', url: null },
  ],
  legalTermsHref: null,
  legalPrivacyHref: null,
};

// ---------------------------------------------------------------------------
// DESIGN PLACEHOLDER — replace with CMS/API data.
//
// Every entry below is invented for layout review only. Recap and gallery
// routes do not exist yet, so their hrefs stay null and the CTAs render as
// unavailable rather than linking nowhere.
// ---------------------------------------------------------------------------

const DESIGN_PLACEHOLDER_EVENTS: PastEventSummary[] = [
  {
    id: 'afterglow',
    slug: 'afterglow',
    title: 'AFTERGLOW',
    subtitle: 'MUSIC LIVES ON',
    image: { src: '', alt: '' },
    location: 'Metro City, Perth',
    startDate: '2023-11-12',
    genres: ['EDM', 'Hardstyle', 'Techno', 'Vinahouse'],
    excerpt: 'A night of connection, music and unforgettable energy.',
    featured: true,
    isPlaceholder: true,
    contentTypes: ['recap', 'gallery', 'highlights'],
    recapHref: null,
    galleryHref: null,
    highlightsHref: null,
  },
  {
    id: 'midnight-circuit',
    slug: 'midnight-circuit',
    title: 'MIDNIGHT CIRCUIT',
    subtitle: 'RAVE BEYOND LIMITS',
    image: { src: '', alt: '' },
    location: 'Metro City, Perth',
    startDate: '2023-08-26',
    genres: ['Techno', 'Hardstyle'],
    excerpt: 'High energy. Deeper connections. A night that pushed boundaries.',
    featured: false,
    isPlaceholder: true,
    contentTypes: ['recap', 'gallery'],
    recapHref: null,
    galleryHref: null,
    highlightsHref: null,
  },
  {
    id: 'pulse-theory',
    slug: 'pulse-theory',
    title: 'PULSE THEORY',
    subtitle: 'RHYTHM CONNECTS US',
    image: { src: '', alt: '' },
    location: 'Metro City, Perth',
    startDate: '2023-05-20',
    genres: ['EDM', 'Techno'],
    excerpt: 'Where beats, people and purpose came together on one dancefloor.',
    featured: false,
    isPlaceholder: true,
    contentTypes: ['recap'],
    recapHref: null,
    galleryHref: null,
    highlightsHref: null,
  },
  {
    id: 'neon-echoes',
    slug: 'neon-echoes',
    title: 'NEON ECHOES',
    subtitle: 'SAME SOULS. NEW HORIZONS.',
    image: { src: '', alt: '' },
    location: 'Metro City, Perth',
    startDate: '2023-02-11',
    genres: ['Vinahouse', 'EDM'],
    excerpt: 'Different sounds. Same community. Echoes that still resonate.',
    featured: false,
    isPlaceholder: true,
    contentTypes: ['recap', 'gallery', 'highlights'],
    recapHref: null,
    galleryHref: null,
    highlightsHref: null,
  },
];

// ---------------------------------------------------------------------------
// Neutral placeholders — the default.
//
// These assert nothing: no name, no date, no venue, no line-up. They hold the
// layout until real archive content is published.
// ---------------------------------------------------------------------------

const NEUTRAL_PLACEHOLDER_EVENTS: PastEventSummary[] = [1, 2, 3].map((n) => ({
  id: `archive-slot-${n}`,
  slug: `archive-slot-${n}`,
  title: 'PAST EVENT',
  subtitle: 'ARCHIVE CONTENT TO BE ADDED',
  image: { src: '', alt: '' },
  location: null,
  startDate: null,
  genres: [],
  excerpt: 'Event recap coming soon.',
  featured: false,
  isPlaceholder: true,
  contentTypes: [],
  recapHref: null,
  galleryHref: null,
  highlightsHref: null,
}));

export type ArchivePlaceholderMode = 'design' | 'neutral';

/**
 * Which placeholder set the archive serves.
 *
 * Defaults to the honest one. The design set is opt-in through
 * NEXT_PUBLIC_ARCHIVE_PLACEHOLDERS=design so a layout review can see the
 * approved composition without that invented history reaching a live site.
 */
export function readArchivePlaceholderMode(): ArchivePlaceholderMode {
  const configured = (process.env.NEXT_PUBLIC_ARCHIVE_PLACEHOLDERS ?? '')
    .trim()
    .toLowerCase();
  return configured === 'design' ? 'design' : 'neutral';
}

export function buildPastEventsMock(
  mode: ArchivePlaceholderMode = readArchivePlaceholderMode(),
): PastEventsPageData {
  const design = mode === 'design';
  const events = design ? DESIGN_PLACEHOLDER_EVENTS : NEUTRAL_PLACEHOLDER_EVENTS;

  return {
    hero: HERO,
    featuredRecap: design ? (events.find((e) => e.featured) ?? null) : null,
    events,
    benefits: BENEFITS,
    finalCta: FINAL_CTA,
    footer: FOOTER,
  };
}
