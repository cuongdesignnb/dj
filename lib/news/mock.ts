import type { NewsArticle, NewsPageData } from './types';

// News content.
//
// Every article here is `status: 'preview'`: placeholder editorial written to
// stand the pages up, not journalism. That means:
//  - publishedAt is null, so the UI shows "Preview" and no date is invented
//  - nothing quotes a named person or team that is not on record
//  - no artist is described as having given an interview
//
// The reference design shows an "ARTIST SPOTLIGHT: RYDEN" story. There is no
// RYDEN on the lineup — the artists are RYAL and RYSAL — and no interview has
// taken place, so that card is a "spotlights are coming" placeholder instead of
// a fabricated sit-down with an artist who does not exist.

function image(file: string, alt: string, caption?: string) {
  return { src: `/assets/${file}`, alt, caption: caption ?? null };
}

const DESTINY_EVENT = { eventId: 'destiny', eventHref: '/event' };

const FEATURE: NewsArticle = {
  id: 'inside-the-destiny-experience',
  slug: 'inside-the-destiny-experience',
  title: 'Inside the DESTINY Experience',
  excerpt:
    'A deeper look at what makes the DESTINY experience more than just a rave — from the people and music to the atmosphere and the moments that bring us all together.',
  category: 'event-updates',
  status: 'preview',
  heroImage: image(
    'hero-crowd.jpg',
    'Crowd with raised hands in front of a circular stage light under red lasers',
  ),
  cardImage: image('hero-crowd.jpg', 'Crowd under red lasers at a Connection Rave night'),
  publishedAt: null,
  updatedAt: null,
  readingTimeMinutes: null,
  tags: ['DESTINY', 'Community', 'Music', 'Production', 'Rave Culture'],
  quickSummary: [
    'More than just a lineup',
    'Immersive production and atmosphere',
    'A community that makes it special',
    'A movement for a brighter tomorrow',
  ],
  body: [
    { id: 'h-heart', type: 'heading', level: 2, text: 'The Heart of DESTINY' },
    {
      id: 'p-heart-1',
      type: 'paragraph',
      text: 'DESTINY is more than an event — it is a shared journey. It is the moment thousands of strangers become one crowd, moving to the same beat, under the same lights, with the same feeling. From the first drop to the final track, DESTINY is where music, people and purpose come together.',
    },
    {
      id: 'p-heart-2',
      type: 'paragraph',
      text: 'In this article, we take a closer look at what makes the DESTINY experience so special — from the artists and the production to the community that brings it to life.',
    },
    {
      id: 'img-crowd',
      type: 'image',
      image: image(
        'hero-crowd.jpg',
        'Crowd with raised hands in front of a circular stage light under red lasers',
        'People create DESTINY.',
      ),
    },
    {
      id: 'quote-feeling',
      type: 'quote',
      text: 'DESTINY is not just a place you go — it is a feeling you carry with you. It is proof that music can still bring people together.',
      // No one is on record saying this, so it stays unattributed rather than
      // being put in someone's mouth.
      attribution: null,
    },
    { id: 'h-lineup', type: 'heading', level: 2, text: 'More Than a Lineup' },
    {
      id: 'p-lineup',
      type: 'paragraph',
      text: 'The artists are world-class, but DESTINY is about more than names on a poster. It is about curation, flow and a musical journey that takes you higher. Each set is selected to create an unforgettable narrative — building energy, creating moments, and leaving a lasting impression long after the lights come up.',
    },
    { id: 'h-atmosphere', type: 'heading', level: 2, text: 'Building the Atmosphere' },
    {
      id: 'p-atmosphere',
      type: 'paragraph',
      text: 'From immersive visuals and production to lighting and sound, every detail at DESTINY is designed to pull you into another world. The venue transforms into a playground for the senses, where music, light and space unite to create something truly special.',
    },
    { id: 'h-people', type: 'heading', level: 2, text: 'People at the Center' },
    {
      id: 'p-people-1',
      type: 'paragraph',
      text: 'What truly makes DESTINY unforgettable is the community. It is the people who show up with open minds, positive energy and a love for the culture. Whether it is your first rave or your tenth, DESTINY is a place where you belong.',
    },
    {
      id: 'p-people-2',
      type: 'paragraph',
      text: 'Together, we create more than an event. We create a movement.',
    },
  ],
  featured: true,
  ...DESTINY_EVENT,
  seoTitle: null,
  seoDescription: null,
};

function placeholder(
  slug: string,
  title: string,
  excerpt: string,
  category: NewsArticle['category'],
  imageFile: string,
  imageAlt: string,
  tags: string[],
  paragraphs: string[],
): NewsArticle {
  return {
    id: slug,
    slug,
    title,
    excerpt,
    category,
    status: 'preview',
    heroImage: image(imageFile, imageAlt),
    cardImage: image(imageFile, imageAlt),
    publishedAt: null,
    updatedAt: null,
    readingTimeMinutes: null,
    tags,
    quickSummary: [],
    body: paragraphs.map((text, index) => ({
      id: `${slug}-p${index + 1}`,
      type: 'paragraph' as const,
      text,
    })),
    featured: false,
    ...DESTINY_EVENT,
    seoTitle: null,
    seoDescription: null,
  };
}

export const NEWS_ARTICLES: NewsArticle[] = [
  FEATURE,

  placeholder(
    'lineup-announcements-coming-soon',
    'Lineup Announcements Coming Soon',
    'More artists, more energy. Lineup announcements are on the way — stay tuned for fresh names joining DESTINY.',
    'announcements',
    'artist-maya.jpg',
    'Artist portrait with pale hair and headphones in front of a laser-lit crowd',
    ['DESTINY', 'Lineup'],
    [
      'Lineup announcements for DESTINY are still to come. Names will be published here as they are confirmed.',
      'Follow along for the next drop — this page is where new additions will appear first.',
    ],
  ),

  placeholder(
    'venue-preview-metro-city',
    'Venue Preview: Metro City',
    'Get a closer look at Metro City, the home of DESTINY — a venue built for unforgettable moments.',
    'event-updates',
    'vip-booth.jpg',
    'VIP booth in a club interior with bottle service and sparklers on the table',
    ['DESTINY', 'Venue', 'Metro City'],
    [
      'DESTINY takes place at Metro City in Perth. Full venue details, entry information and floor layout will be confirmed by the organiser closer to the event.',
      'What we can say now is what the space is built for: sound, light and a crowd that fills the room.',
    ],
  ),

  placeholder(
    'artist-spotlights-coming-soon',
    'Artist Spotlights Coming Soon',
    'Conversations with the artists behind DESTINY are on the way — music, inspiration and what to expect from their sets.',
    'artist-stories',
    'artist-ryal.jpg',
    'Artist portrait in sunglasses lit by red stage lasers',
    ['DESTINY', 'Artists'],
    [
      'Artist spotlights are being prepared. Each one will cover an artist on the DESTINY lineup in their own words.',
      'Until then, the full lineup is on the lineup page.',
    ],
  ),

  placeholder(
    'the-power-of-our-community',
    'The Power of Our Community',
    'It is more than music. It is the people — a look at the community that makes Connection Rave special.',
    'community',
    'artist-nicole-chen.jpg',
    'Artist portrait with headphones against violet and red stage lighting',
    ['Community', 'Rave Culture'],
    [
      'Connection Rave exists because of the people who show up for it: open minds, positive energy and a shared love for the culture.',
      'That community is what turns a room full of strangers into one crowd.',
    ],
  ),

  placeholder(
    'behind-the-production',
    'Behind the Production',
    'From lights to sound to immersive visuals — a look at the creative vision behind the DESTINY production.',
    'event-updates',
    'artist-kickcheeze.jpg',
    'Artist portrait in a cap under red beams',
    ['DESTINY', 'Production'],
    [
      'Production is the part of the night nobody applauds but everybody feels: the lighting, the sound design, the way a room is shaped around a set.',
      'A closer look at how the DESTINY production comes together will be published here.',
    ],
  ),

  placeholder(
    'more-than-a-rave',
    'More Than a Rave',
    'How Connection Rave is helping to shape a brighter, more connected tomorrow through music and culture.',
    'press',
    'event-poster.jpg',
    'DESTINY poster artwork: Music Meets Soul',
    ['Community', 'Rave Culture', 'Music'],
    [
      'Connection Rave is built on a simple idea: that music, people and culture together are worth more than any one night out.',
      'Press enquiries and further material can be arranged through the organiser.',
    ],
  ),
];

export const NEWS_MOCK: NewsPageData = {
  hero: {
    eyebrow: 'NEWS / STORIES',
    titleLines: ['LATEST NEWS', '& UPDATES'],
    description:
      'Stay up to date with the latest announcements, artist stories, event updates and community news from the Connection Rave experience.',
    visual: {
      src: '/assets/hero-crowd.jpg',
      alt: 'Crowd with raised hands in front of a circular stage light under red lasers',
      width: 1600,
      height: 1000,
    },
    sideNotes: ['MUSIC', 'PEOPLE', 'CULTURE', 'CONNECTION'],
    primaryCta: { label: 'Read Latest Story', href: `/news/${FEATURE.slug}` },
    secondaryCta: { label: 'Explore Event', href: '/event' },
  },

  featuredArticle: FEATURE,
  articles: NEWS_ARTICLES,

  finalCta: {
    title: 'STAY CONNECTED',
    description:
      'Get the latest news, updates and stories from Connection Rave. Be part of what is next.',
    primary: { label: 'Contact Us', href: '/contact' },
    secondary: { label: 'Explore Gallery', href: '/gallery' },
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
