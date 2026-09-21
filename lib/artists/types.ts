// Canonical artist model.
//
// One source for the homepage preview, /lineup and /lineup/[slug]. Fields the
// source does not actually have — bio, genres, set times, socials, media, past
// shows — are nullable or empty here, and the UI renders a fallback or hides
// the section rather than inventing content for them.

export interface MediaAsset {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export type ArtistLinkType =
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'youtube'
  | 'spotify'
  | 'soundcloud'
  | 'website';

export interface ArtistExternalLink {
  type: ArtistLinkType;
  url: string;
  label?: string;
}

export interface ArtistMediaItem {
  id: string;
  type: 'image' | 'video';
  thumbnail: MediaAsset;
  url?: string | null;
  title?: string | null;
}

export interface ArtistEventReference {
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  href: string;
  venue?: string | null;
  date?: string | null;
  dateStatus: 'confirmed' | 'tba';
  schedule?: string | null;
  scheduleStatus: 'confirmed' | 'tbc';
}

export interface Artist {
  id: string;
  slug: string;
  name: string;
  /** Upper-case country as it appears on the card, e.g. "VIETNAM". */
  country: string;
  year?: string | null;

  portrait: MediaAsset;
  heroImage?: MediaAsset | null;

  /** Null until a real biography is supplied. Never auto-written. */
  bio?: string | null;
  genres: string[];

  setTime?: string | null;
  setTimeStatus?: 'confirmed' | 'tba';

  externalLinks: ArtistExternalLink[];
  media: ArtistMediaItem[];

  upcomingEvents: ArtistEventReference[];
  pastEvents: ArtistEventReference[];

  featured?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalOverride?: string | null;
  indexable?: boolean;
  followLinks?: boolean;
}

export interface LineupHeroData {
  eyebrow: string;
  titleLines: string[];
  description: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  visual: MediaAsset;
  sideNotes: string[];
  badge: string[];
  location: string;
}

export interface LineupStoryData {
  eyebrow: string;
  title: string;
  description: string;
  image: MediaAsset;
}

export interface LineupFinalCta {
  title: string;
  subtitle?: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
  background?: MediaAsset;
}

import type { PublicListingContent } from '@/lib/cms/public-page';

export interface LineupPageData {
  content?: PublicListingContent;
  hero: LineupHeroData;
  artists: Artist[];
  story: LineupStoryData;
  finalCta: LineupFinalCta;
  footer: {
    email?: string | null;
    phone?: string | null;
    partners: Array<{ id: string; name: string; logo: MediaAsset }>;
    socials: Array<{
      id: string;
      platform: 'instagram' | 'facebook' | 'youtube' | 'tiktok';
      url: string | null;
    }>;
    legalTermsHref?: string | null;
    legalPrivacyHref?: string | null;
  };
}

export type ArtistCountryFilter = 'all' | 'VIETNAM' | 'SINGAPORE' | 'AUSTRALIA';
