// Domain types for the Event Details page and its HTTP adapter.
// Keep this file dependency-free so it can be imported from server and client code without
// pulling env or fetch.

export type SocialPlatform = 'facebook' | 'instagram' | 'youtube' | 'tiktok';

export interface MediaAsset {
  src: string;
  alt: string;
  width: number;
  height: number;
  objectPosition?: string;
}

export type FeatureIcon =
  | 'globe'
  | 'users'
  | 'music'
  | 'sparkles'
  | 'map-pin'
  | 'headphones';

export interface FeatureCard {
  id: string;
  icon: FeatureIcon;
  title: string;
  description: string;
}

export interface ArtistSummary {
  id: string;
  slug: string;
  name: string;
  country: string;
  portrait: MediaAsset | null;
  profileHref: string | null;
}

export interface EventVenue {
  name: string;
  city: string;
  address: string | null;
  description: string;
  image: MediaAsset | null;
  mapUrl: string | null;
}

export interface EventSocialLink {
  id: string;
  platform: SocialPlatform;
  url: string;
}

export interface EventContactInfo {
  email: string | null;
  phone: string | null;
  socials: EventSocialLink[];
}

export interface EventFaq {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
}

export interface EventTicketSummary {
  id: string;
  name: string;
  priceMinor: number;
  currency: string;
  badge: string | null;
  purchasableOnline: boolean;
  purchasableAtDoor: boolean;
  availabilityStatus: string;
  providerUrl: string | null;
}

export interface EventVipSummary {
  packages: Array<Record<string, unknown>>;
  booths: Array<Record<string, unknown>>;
}

export interface EventPartner {
  id: string;
  name: string;
  logo: MediaAsset;
}

export interface SiteBrand {
  brandName: string;
  tagline: string;
  logo: MediaAsset;
  partners: EventPartner[];
  contact: EventContactInfo;
}

export interface EventRecord {
  id: string;
  slug: string;
  name: string;
  title: string;
  intro: string;
  accentLine: string;
  aboutParagraphs: string[];
  genres: string[];
  startsAt: string | null;
  endsAt: string | null;
  doorsOpenAt: string | null;
  timeZone: string;
  poster: MediaAsset | null;
  heroBackground: MediaAsset | null;
  experienceImage: MediaAsset | null;
  highlights: FeatureCard[];
  expectations: FeatureCard[];
  artists: ArtistSummary[];
  venue: EventVenue;
  actions: {
    ticketUrl: string | null;
    vipRequestUrl: string | null;
  };
  tickets: EventTicketSummary[];
  vip: EventVipSummary;
  faqs: EventFaq[];
  gallery: Array<{ id: string; slug: string; title: string; cover: MediaAsset | null; hero: MediaAsset | null }>;
  seo: {
    title: string;
    description: string;
    image: MediaAsset | null;
    canonicalOverride: string | null;
    indexable: boolean;
    followLinks: boolean;
  };
  contentStatus: 'preview' | 'published';
}

export interface EventPageData {
  schemaVersion: 1;
  event: EventRecord;
  site: SiteBrand;
}

export interface EventRepository {
  getPage(
    slug: string,
    options?: { signal?: AbortSignal }
  ): Promise<RepositoryResult>;
}

export interface FrontendRoutes {
  tickets?: string | null;
  tables?: string | null;
  lineup?: string | null;
  booking?: string | null;
  legalTerms?: string | null;
  legalPrivacy?: string | null;
}

export interface RepositoryError {
  kind: 'not-found' | 'http-error' | 'network-error' | 'invalid-payload' | 'config-error';
  status?: number;
  message: string;
}

export type RepositoryResult =
  | { ok: true; data: EventPageData }
  | { ok: false; error: RepositoryError };
