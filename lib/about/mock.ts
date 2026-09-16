import type { AboutPageData } from './types';

// Mock data for the /about page. All copy, links and media references come
// from here so the UI layer never has to hard-code marketing content.
// Routes referenced here (events, artists, merch, partners, contact) may not
// exist yet; the components handle "Soon" states via the route registry.

export const ABOUT_MOCK: AboutPageData = {
  hero: {
    eyebrow: 'ABOUT CONNECTION LAND',
    titleLines: ['WE CREATE NIGHTS', 'PEOPLE REMEMBER'],
    description:
      'Connection Land is a nightlife and entertainment brand creating immersive music experiences that bring together sound, people, and culture. We believe in the power of music to create real connection — on the dancefloor and beyond.',
    primaryCta: {
      label: 'View Upcoming Events',
      href: '/events',
      external: false,
    },
    secondaryCta: {
      label: 'Meet The Artists',
      href: '/artists',
      external: false,
    },
    attributes: [
      { id: 'music', icon: 'Music', label: 'Music' },
      { id: 'culture', icon: 'Users', label: 'Culture' },
      { id: 'community', icon: 'Heart', label: 'Community' },
      { id: 'perth', icon: 'MapPin', label: 'Perth' },
    ],
    visual: {
      src: '/assets/hero-crowd.jpg',
      alt: 'Crowd with raised hands under red and pink stage lasers',
      width: 1600,
      height: 1000,
    },
    visualAnnotations: {
      side: ['MORE THAN MUSIC', 'A BRIGHTER TOMORROW'],
      bottom: ['PEOPLE', 'CULTURE', 'MUSIC', 'A BRIGHTER TOMORROW'],
    },
    badge: {
      src: '/assets/logo-connection.svg',
      alt: 'Connection circle logo',
      width: 240,
      height: 240,
    },
  },

  story: {
    eyebrow: 'OUR STORY',
    title: 'A DEEPER CONNECTION',
    paragraphs: [
      'Connection Land was founded with a simple belief — music brings people together. What started in Perth as a passion for underground music and unforgettable nights has grown into a thriving community and a platform for world-class events, artists and experiences.',
      'We create spaces where everyone belongs, where the music moves you, and where moments turn into memories that last a lifetime.',
    ],
    image: {
      src: '/assets/event-poster.jpg',
      alt: 'Atmospheric crowd silhouetted against a red skyline',
      width: 1600,
      height: 1000,
    },
    quote: {
      text: 'Sound meets soul. People become part of the story.',
      footer: 'MORE THAN EVENTS. A STRONGER TOMORROW.',
    },
    imageOverlayLabels: ['NIGHTS', 'PEOPLE', 'BELONG'],
  },

  values: [
    {
      id: 'curated-events',
      title: 'CURATED EVENTS',
      description:
        'Carefully crafted lineups, unique venues and unforgettable experiences that go beyond the ordinary.',
      icon: 'Calendar',
      image: {
        src: '/assets/event-poster.jpg',
        alt: 'Event lineup poster',
        width: 800,
        height: 600,
      },
      href: '/events',
    },
    {
      id: 'artist-experiences',
      title: 'ARTIST EXPERIENCES',
      description:
        'A platform for local and international talent to connect, create and inspire through music.',
      icon: 'Headphones',
      image: {
        src: '/assets/artist-kickcheeze.jpg',
        alt: 'Performing artist in the moment',
        width: 800,
        height: 600,
      },
      href: '/artists',
      spotlight: true,
    },
    {
      id: 'community-energy',
      title: 'COMMUNITY ENERGY',
      description:
        'A diverse crowd united by a shared love for music, culture and positive energy.',
      icon: 'Heart',
      image: {
        src: '/assets/hero-crowd.jpg',
        alt: 'Crowd celebrating together',
        width: 800,
        height: 600,
      },
    },
    {
      id: 'immersive-production',
      title: 'IMMERSIVE PRODUCTION',
      description:
        'Stunning visual design, lighting and sound that transform venues into other worlds.',
      icon: 'Sparkles',
      image: {
        src: '/assets/vip-booth.jpg',
        alt: 'Immersive lighting and stage production',
        width: 800,
        height: 600,
      },
      href: '/partners',
    },
  ],

  ecosystem: [
    {
      id: 'events',
      title: 'EVENTS',
      subtitle: 'Iconic nights. Real connections.',
      image: {
        src: '/assets/event-poster.jpg',
        alt: 'Stage lasers over packed venue',
        width: 1200,
        height: 900,
      },
      href: '/events',
    },
    {
      id: 'artists',
      title: 'ARTISTS',
      subtitle: 'Talent drives culture forward.',
      image: {
        src: '/assets/artist-ryal.jpg',
        alt: 'Featured artist Ryal performing',
        width: 1200,
        height: 900,
      },
      href: '/artists',
    },
    {
      id: 'merchandise',
      title: 'MERCHANDISE',
      subtitle: 'Wear the movement.',
      image: {
        src: '/assets/destiny-wordmark.svg',
        alt: 'Connection Land merchandise tee',
        width: 1200,
        height: 900,
      },
      href: '/shop',
    },
    {
      id: 'partnerships',
      title: 'PARTNERSHIPS',
      subtitle: 'Stronger together. A brighter tomorrow.',
      image: {
        src: '/assets/club-map.jpg',
        alt: 'Perth skyline representing the city we serve',
        width: 1200,
        height: 900,
      },
      href: '/partners',
    },
  ],

  connectionReasons: [
    {
      id: 'music-first',
      title: 'MUSIC FIRST',
      description:
        'Great music is at the heart of everything we do. From underground sounds to global talent, we champion the music that moves people.',
      icon: 'Music',
    },
    {
      id: 'built-for-atmosphere',
      title: 'BUILT FOR ATMOSPHERE',
      description:
        'Every detail matters. We design immersive environments that stimulate the senses and create moments you can feel.',
      icon: 'Sparkles',
    },
    {
      id: 'designed-for-community',
      title: 'DESIGNED FOR COMMUNITY',
      description:
        'Connection Land is more than events — it’s a community. A place where different people, cultures and stories come together on the dancefloor.',
      icon: 'Users',
    },
  ],

  partners: [
    {
      id: 'mcq',
      name: 'MCQ',
      logo: {
        src: '/assets/logo-mcq.svg',
        alt: 'MCQ Supermarket',
        width: 300,
        height: 100,
      },
      description:
        'In partnership with MCQ, helping to shape unforgettable music experiences in Western Australia and beyond.',
      href: '/partners/mcq',
    },
    {
      id: 'bihi',
      name: 'BIHI ENTERTAINMENT',
      logo: {
        src: '/assets/logo-bihi.svg',
        alt: 'BIHI Entertainment',
        width: 300,
        height: 100,
      },
      description:
        'In collaboration with BIHI Entertainment, uniting talent, culture and community to create a brighter tomorrow.',
      href: '/partners/bihi',
    },
  ],

  finalCta: {
    eyebrow: 'A BRIGHTER TOMORROW AWAITS',
    title: 'READY TO EXPERIENCE CONNECTION LAND?',
    primary: { label: 'Explore Events', href: '/events' },
    secondary: { label: 'Contact Us', href: '/contact' },
    background: {
      src: '/assets/hero-crowd.jpg',
      alt: 'Connection Land crowd',
      width: 1600,
      height: 1000,
    },
  },

  site: {
    brandName: 'CONNECTION',
    tagline: 'SOUND MEETS SOUL',
  },

  footer: {
    contact: {
      // Backend/CMS will populate these. Until then, render "to be confirmed"
      // copy so we don't make up data.
      email: null,
      phone: null,
      address: 'Perth, Western Australia',
      socials: [
        { id: 'instagram', platform: 'instagram', url: null },
        { id: 'facebook', platform: 'facebook', url: null },
        { id: 'youtube', platform: 'youtube', url: null },
        { id: 'tiktok', platform: 'tiktok', url: null },
      ],
    },
    legalTermsHref: '/terms',
    legalPrivacyHref: '/privacy',
  },
};
