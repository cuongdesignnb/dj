import type { GalleryCollection, GalleryMediaItem, GalleryPageData } from './types';

// Gallery content.
//
// DESTINY has not been confirmed as having taken place, so this collection is
// `status: 'preview'` throughout: visuals that convey the atmosphere, labelled
// as a preview everywhere they appear. Nothing here is presented as
// photography from a night that happened, and no date is claimed.
//
// Every item points at an asset that already exists in this repository, with
// alt text describing what that asset actually shows. There is no real video
// yet, so the video item carries `video: null` and the UI shows no play button
// for it rather than offering a clip that does not exist.

function photo(
  id: string,
  file: string,
  alt: string,
  category: GalleryMediaItem['category'],
  sortOrder: number,
  extra: Partial<GalleryMediaItem> = {},
): GalleryMediaItem {
  const asset = { src: `/assets/${file}`, alt };
  return {
    id,
    type: 'photo',
    category,
    thumbnail: asset,
    image: asset,
    video: null,
    title: null,
    caption: null,
    sortOrder,
    ...extra,
  };
}

const DESTINY_MEDIA: GalleryMediaItem[] = [
  photo(
    'crowd-main',
    'hero-crowd.jpg',
    'Crowd with raised hands in front of a circular stage light under red lasers',
    'crowd',
    1,
    { featured: true, title: 'Crowd energy' },
  ),
  photo(
    'artist-ryal',
    'artist-ryal.jpg',
    'Artist portrait in sunglasses lit by red stage lasers',
    'artists',
    2,
    { title: 'Artist moment' },
  ),
  photo(
    'artist-nicole-chen',
    'artist-nicole-chen.jpg',
    'Artist portrait with headphones against violet and red stage lighting',
    'artists',
    3,
    { title: 'Artist moment' },
  ),
  photo(
    'venue-booth-service',
    'vip-booth.jpg',
    'VIP booth in a club interior with bottle service and sparklers on the table',
    'venue',
    4,
    { title: 'VIP space' },
  ),
  photo(
    'artist-kickcheeze',
    'artist-kickcheeze.jpg',
    'Artist portrait in a cap under red beams',
    'artists',
    5,
    { title: 'Artist moment' },
  ),
  photo(
    'production-artwork',
    'event-poster.jpg',
    'DESTINY poster artwork: Music Meets Soul',
    'production',
    6,
    { title: 'Artwork' },
  ),
  photo(
    'artist-maya',
    'artist-maya.jpg',
    'Artist portrait with pale hair and headphones in front of a laser-lit crowd',
    'artists',
    7,
    { title: 'Artist moment' },
  ),
  photo(
    'venue-bar',
    'bar-list.jpg',
    'Bar counter lit by a red neon strip above timber panelling',
    'venue',
    8,
    { title: 'Bar' },
  ),

  // A slot for the highlight clip. No file exists yet, so `video` stays null
  // and the UI renders it as a still with a "coming soon" note — never a play
  // button that leads nowhere.
  {
    id: 'video-highlight',
    type: 'video',
    category: 'video',
    thumbnail: {
      src: '/assets/hero-crowd.jpg',
      alt: 'Still frame from the DESTINY visual collection: crowd under red lasers',
    },
    image: null,
    video: null,
    title: 'DESTINY',
    caption: 'Gallery video preview',
    sortOrder: 9,
  },
];

export const DESTINY_COLLECTION: GalleryCollection = {
  id: 'destiny-preview',
  slug: 'destiny',
  title: 'DESTINY',
  subtitle: 'MUSIC MEETS SOUL',
  description:
    'A visual collection inspired by the DESTINY event experience. This is a gallery preview, showcasing the atmosphere, people and energy that make Connection Rave special.',
  status: 'preview',
  cover: {
    src: '/assets/event-poster.jpg',
    alt: 'DESTINY gallery preview cover',
    width: 1200,
    height: 1500,
  },
  hero: {
    src: '/assets/hero-crowd.jpg',
    alt: 'Crowd with raised hands in front of a circular stage light under red lasers',
    width: 1600,
    height: 1000,
  },
  venue: 'Metro City, Perth',
  categories: ['crowd', 'artists', 'venue', 'production', 'video'],
  media: DESTINY_MEDIA,
  eventId: 'destiny',
  eventSlug: 'destiny',
  eventHref: '/event',
  featured: true,
};

// Only collections that actually exist are listed. The reference design shows
// "Artist Moments", "Venue / Production" and "Crowd Energy" as further albums;
// nothing confirms those exist, so they are not invented here. The related
// section hides itself when there is nothing real to link to.
export const GALLERY_COLLECTIONS: GalleryCollection[] = [DESTINY_COLLECTION];

export const GALLERY_MOCK: GalleryPageData = {
  hero: {
    eyebrow: 'GALLERY / MEDIA',
    titleLines: ['FEEL THE', 'CONNECTION'],
    description:
      'Explore the energy, people and atmosphere behind Connection Rave. A visual collection of crowd moments, artists and venue spaces.',
    visual: {
      src: '/assets/hero-crowd.jpg',
      alt: 'Crowd with raised hands in front of a circular stage light under red lasers',
      width: 1600,
      height: 1000,
    },
    sideNotes: ['MUSIC', 'PEOPLE', 'CULTURE', 'A BRIGHTER TOMORROW'],
    primaryCta: { label: 'Explore the Event', href: '/event' },
    secondaryCta: { label: 'View Lineup', href: '/lineup' },
  },

  // The listing shows the same canonical media as the collection — one dataset,
  // two views.
  previewMedia: DESTINY_MEDIA,
  featuredCollection: DESTINY_COLLECTION,
  collections: GALLERY_COLLECTIONS,

  finalCta: {
    title: 'READY TO FEEL THE NIGHT?',
    subtitle: 'Same people. A brighter tomorrow.',
    primary: { label: 'Explore Event', href: '/event' },
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
