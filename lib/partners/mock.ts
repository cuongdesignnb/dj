import type { PartnersPageData } from './types';

// Mock data for /partners. All copy + media references flow through here
// so the UI never hardcodes marketing content.
//
// IMPORTANT: only real, source-trusted partner identities are used.
// Spec: "Không ship các brand placeholder trong ảnh như đối tác thật."

export const PARTNERS_MOCK: PartnersPageData = {
  hero: {
    eyebrow: 'PARTNERS & SPONSORS',
    titleLines: ['WE BUILD STRONGER', 'NIGHTS TOGETHER'],
    description:
      'We collaborate with sponsors, cultural partners, venues and brands to create unforgettable music experiences and real community impact across Perth and beyond.',
    primaryCta: { label: 'Become a Partner', href: '/contact?type=partnership' },
    secondaryCta: { label: 'Partner Enquiry', href: '/contact?type=partnership' },
    attributes: [
      { id: 'visibility', label: 'Brand Visibility', icon: 'BarChart3' },
      { id: 'activations', label: 'Event Activations', icon: 'Users' },
      { id: 'community', label: 'Community Reach', icon: 'Heart' },
      { id: 'perth', label: 'Perth, WA', icon: 'MapPin' },
    ],
    visual: {
      src: '/assets/hero-crowd.jpg',
      alt: 'Crowd silhouettes under red lasers with circular stage light',
      width: 1600,
      height: 1000,
    },
    visualAnnotations: { side: ['SHARED', 'VISION', 'STRONGER', 'TOGETHER'] },
  },

  featuredPartners: [
    {
      id: 'mcq',
      name: 'MCQ',
      logo: { src: '/assets/logo-mcq.svg', alt: 'MCQ', width: 280, height: 100 },
      description:
        'MCQ is a key partner, helping us bring unforgettable music experiences to Western Australia through shared creative vision and community impact.',
      tagline: 'MUSIC BRINGS PEOPLE TOGETHER',
      image: { src: '/assets/event-poster.jpg', alt: 'Event atmosphere', width: 1200, height: 800 },
      href: null,
      featured: true,
    },
    {
      id: 'bihi',
      name: 'BIHI ENTERTAINMENT',
      logo: { src: '/assets/logo-bihi.svg', alt: 'BIHI Entertainment', width: 280, height: 100 },
      description:
        'BIHI Entertainment collaborates with us to create a brighter tomorrow through music, culture and meaningful community connection.',
      tagline: 'A BRIGHTER TOMORROW',
      image: { src: '/assets/hero-crowd.jpg', alt: 'Crowd celebration', width: 1200, height: 800 },
      href: null,
      featured: true,
    },
  ],

  partnershipTypes: [
    {
      id: 'title-sponsor',
      title: 'TITLE SPONSOR',
      icon: 'Crown',
      highlights: [
        'Maximum brand exposure',
        'Event naming opportunities',
        'Exclusive activations & VIP access',
      ],
    },
    {
      id: 'event-sponsor',
      title: 'EVENT SPONSOR',
      icon: 'Star',
      highlights: [
        'On-site brand activations',
        'Product showcases',
        'Direct audience engagement',
      ],
    },
    {
      id: 'media-partner',
      title: 'MEDIA PARTNER',
      icon: 'Megaphone',
      highlights: [
        'Content collaboration',
        'Cross-channel promotion',
        'Expanded reach & visibility',
      ],
    },
    {
      id: 'community-partner',
      title: 'COMMUNITY PARTNER',
      icon: 'Users',
      highlights: [
        'Support local music & culture',
        'Community program alignment',
        'Create positive social impact',
      ],
    },
  ],

  benefits: [
    {
      id: 'immersive-audience',
      title: 'IMMERSIVE AUDIENCE',
      description: 'A passionate and diverse community of music lovers.',
      icon: 'Users',
    },
    {
      id: 'premium-production',
      title: 'PREMIUM PRODUCTION',
      description: 'World-class production, lighting and audiovisual experiences.',
      icon: 'AudioWaveform',
    },
    {
      id: 'cultural-relevance',
      title: 'CULTURAL RELEVANCE',
      description: "Authentic connection to Perth's music culture and creative community.",
      icon: 'Heart',
    },
    {
      id: 'multi-channel',
      title: 'MULTI-CHANNEL EXPOSURE',
      description: 'Brand visibility across events, digital content and media partnerships.',
      icon: 'Radio',
    },
  ],

  activationLead: {
    title: 'BRING YOUR BRAND INTO THE NIGHT',
    description:
      'Create meaningful connections through immersive activations, experiences and unforgettable moments.',
    image: {
      src: '/assets/event-poster.jpg',
      alt: 'Atmospheric venue with red lighting',
      width: 1400,
      height: 900,
    },
  },

  activationOpportunities: [
    { id: 'on-site-branding', title: 'On-site Branding', description: 'Branded spaces, signage and visual presence.', icon: 'Monitor' },
    { id: 'stage-takeovers', title: 'Stage Takeovers', description: 'Co-branded moments and special set features.', icon: 'AudioLines' },
    { id: 'artist-collaborations', title: 'Artist Collaborations', description: 'Work with artists on unique brand experiences.', icon: 'Users' },
    { id: 'vip-experiences', title: 'VIP Experiences', description: 'Exclusive access, hospitality and custom experiences.', icon: 'Sparkles' },
    { id: 'digital-promotion', title: 'Digital Promotion', description: 'Featured across our digital channels and content.', icon: 'Globe' },
    { id: 'content-capture', title: 'Content Capture', description: 'Professional photo & video content for your brand.', icon: 'Camera' },
  ],

  trustedPartners: [
    {
      id: 'mcq-trusted',
      name: 'MCQ',
      logo: { src: '/assets/logo-mcq.svg', alt: 'MCQ', width: 200, height: 60 },
      description: '',
    },
    {
      id: 'bihi-trusted',
      name: 'BIHI Entertainment',
      logo: { src: '/assets/logo-bihi.svg', alt: 'BIHI Entertainment', width: 200, height: 60 },
      description: '',
    },
  ],

  collaborationSteps: [
    {
      id: 'discover',
      number: '01',
      title: 'DISCOVER',
      description: 'Understand your goals, values and opportunities.',
      icon: 'Search',
    },
    {
      id: 'plan',
      number: '02',
      title: 'PLAN',
      description: 'Create a tailored partnership approach that delivers value.',
      icon: 'ClipboardList',
    },
    {
      id: 'activate',
      number: '03',
      title: 'ACTIVATE',
      description: 'Bring the partnership to life at our events and channels.',
      icon: 'Zap',
    },
    {
      id: 'measure',
      number: '04',
      title: 'MEASURE',
      description: 'Track impact and explore future opportunities together.',
      icon: 'BarChart3',
    },
  ],

  finalCta: {
    title: 'READY TO PARTNER WITH CONNECTION?',
    description:
      "Let's create unforgettable experiences together. Sponsorships, collaborations and creative partnerships for a brighter tomorrow.",
    primary: { label: 'Start the Conversation', href: '/contact?type=partnership' },
    secondary: { label: 'Contact Us', href: '/contact' },
    background: { src: '/assets/hero-crowd.jpg', alt: 'Connection crowd', width: 1600, height: 1000 },
  },

  site: {
    brandName: 'CONNECTION',
    tagline: 'SOUND MEETS SOUL',
  },

  footer: {
    contact: {
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
    legalTermsHref: null,
    legalPrivacyHref: null,
  },
};
