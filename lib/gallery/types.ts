// Canonical gallery model, shared by /gallery and /gallery/[slug].
//
// `status` is the honesty switch. While a collection is 'preview' the UI says
// so: these are visuals that evoke the event, not photographs of a night that
// has happened. A CMS can flip it to 'published' once real photography exists.

export type GalleryMediaType = 'photo' | 'video';

export type GalleryCategory =
  | 'crowd'
  | 'artists'
  | 'venue'
  | 'production'
  | 'video'
  | 'other';

export type GalleryCollectionStatus = 'preview' | 'published' | 'archived';

export interface MediaAsset {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface GalleryVideoSource {
  provider: 'youtube' | 'vimeo' | 'mp4';
  url: string;
}

export interface GalleryMediaItem {
  id: string;

  type: GalleryMediaType;
  category: GalleryCategory;

  thumbnail: MediaAsset;
  /** Larger source for the lightbox. Falls back to the thumbnail. */
  image?: MediaAsset | null;
  /** Null means the clip does not exist yet — no play affordance is shown. */
  video?: GalleryVideoSource | null;

  title?: string | null;
  caption?: string | null;

  featured?: boolean;
  sortOrder: number;
}

export interface GalleryCollection {
  id: string;
  slug: string;

  title: string;
  subtitle?: string | null;
  description?: string | null;

  status: GalleryCollectionStatus;

  cover: MediaAsset;
  hero?: MediaAsset | null;

  venue?: string | null;

  categories: GalleryCategory[];
  media: GalleryMediaItem[];

  eventId?: string | null;
  eventSlug?: string | null;
  eventHref?: string | null;

  featured: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalOverride?: string | null;
  indexable?: boolean;
  followLinks?: boolean;
}

export interface GalleryHeroData {
  eyebrow: string;
  titleLines: string[];
  description: string;
  visual: MediaAsset;
  sideNotes: string[];
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
}

export interface GalleryFinalCta {
  title: string;
  subtitle?: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
  background?: MediaAsset;
}

import type { PublicListingContent } from '@/lib/cms/public-page';

export interface GalleryPageData {
  content?: PublicListingContent;
  hero: GalleryHeroData;
  previewMedia: GalleryMediaItem[];
  featuredCollection?: GalleryCollection | null;
  collections: GalleryCollection[];
  finalCta: GalleryFinalCta;
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

/** Category filter on /gallery. */
export type GalleryCategoryFilter = 'all' | GalleryCategory;

/** Media-type filter on a collection page. */
export type CollectionMediaFilter = 'all' | 'photo' | 'video';
