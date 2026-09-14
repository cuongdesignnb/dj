// About page domain types — single source of truth.
// Designed for the Connection Land website.
// Adapter-ready: mock + HTTP implementations can populate these without
// changes to the UI layer.

export interface MediaAsset {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface LinkAction {
  label: string;
  href: string;
  external?: boolean;
}

export interface AboutHeroAttribute {
  id: string;
  icon: 'Music' | 'Users' | 'Heart' | 'MapPin' | 'Sparkles' | 'Disc3';
  label: string;
}

export interface AboutHeroData {
  eyebrow: string;
  titleLines: string[];
  description: string;
  primaryCta: LinkAction;
  secondaryCta: LinkAction;
  attributes: AboutHeroAttribute[];
  /** Right-side cinematic visual. */
  visual: MediaAsset;
  /** Sub-typography placed at the edges of the visual panel. */
  visualAnnotations: {
    side: string[];
    bottom: string[];
  };
  /** Center badge overlay (e.g. circular connection logo) — optional. */
  badge?: MediaAsset | null;
}

export interface AboutStoryData {
  eyebrow: string;
  title: string;
  paragraphs: string[];
  image: MediaAsset;
  quote: {
    text: string;
    footer?: string;
  };
  imageOverlayLabels?: string[];
}

export interface AboutValueItem {
  id: string;
  title: string;
  description: string;
  icon: 'Music' | 'Users' | 'Heart' | 'Sparkles' | 'Disc3' | 'Headphones' | 'MapPin' | 'Calendar';
  image?: MediaAsset;
  href?: string;
  /** Card marked as "spotlight" (e.g. neon border, raised). */
  spotlight?: boolean;
}

export interface AboutEcosystemItem {
  id: string;
  title: string;
  subtitle: string;
  image: MediaAsset;
  href: string;
}

export interface AboutConnectionItem {
  id: string;
  title: string;
  description: string;
  icon: 'Music' | 'Users' | 'Heart' | 'Sparkles' | 'Disc3' | 'Headphones' | 'MapPin' | 'Calendar';
}

export interface PartnerItem {
  id: string;
  name: string;
  logo: MediaAsset;
  description?: string;
  href?: string;
}

export interface AboutFinalCta {
  eyebrow?: string;
  title: string;
  primary: LinkAction;
  secondary?: LinkAction;
  background?: MediaAsset;
}

export interface AboutSiteNav {
  brandName: string;
  tagline: string;
}

export interface AboutFooterContact {
  email: string | null;
  phone: string | null;
  /** "Hello@…" or null — fall back to "Contact details to be confirmed" when null. */
  address: string | null;
  socials: Array<{
    id: string;
    platform: 'facebook' | 'instagram' | 'youtube' | 'tiktok';
    url: string | null;
  }>;
}

export interface AboutPageData {
  hero: AboutHeroData;
  story: AboutStoryData;
  values: AboutValueItem[];
  ecosystem: AboutEcosystemItem[];
  connectionReasons: AboutConnectionItem[];
  partners: PartnerItem[];
  finalCta: AboutFinalCta;
  site: AboutSiteNav;
  footer: {
    contact: AboutFooterContact;
    legalTermsHref: string | null;
    legalPrivacyHref: string | null;
  };
}
