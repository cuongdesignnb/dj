// Domain types for /tickets.
//
// The page sells nothing itself: it collects a selection and hands off to an
// external ticket provider. Money is therefore modelled in minor units so the
// subtotal shown here is exact, and provider availability is explicit so the
// UI can say "not live yet" rather than pretending a checkout exists.

export interface MediaAsset {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface Money {
  /** Integer amount in the currency's smallest unit — 6600 is $66.00. */
  amountMinor: number;
  /** ISO 4217 code, used for arithmetic and formatting, not shown as text. */
  currency: string;
}

export interface TicketTier {
  id: string;
  name: string;
  description: string;
  price: Money;

  badge?: string | null;
  icon: string;

  features: string[];

  purchasableOnline: boolean;
  purchasableAtDoor: boolean;

  minQuantity: number;
  /** Null means no provider-confirmed maximum — do not invent one. */
  maxQuantity?: number | null;

  /** Starting quantity, so the initial selection stays configurable. */
  defaultQuantity?: number;

  highlighted?: boolean;

  /** Only ever set from provider/API data. Absent means genuinely unknown. */
  availability?: {
    status: 'available' | 'low' | 'sold-out' | 'unknown';
    remaining?: number | null;
  };
}

export interface TicketEventInfo {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  venue: string;

  date?: string | null;
  dateStatus: 'confirmed' | 'tba';

  schedule?: string | null;
  scheduleStatus: 'confirmed' | 'tbc';

  image: MediaAsset;
}

export interface TicketProviderAction {
  providerName?: string;
  /** Absolute https URL from trusted config only. Null when not configured. */
  checkoutUrl?: string | null;
  eventExternalId?: string | null;
  mode: 'external-link' | 'unavailable';
  /** Shown when mode is 'unavailable'. */
  unavailableNote?: string;
}

export interface TicketTrustItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  /**
   * 'marketing-copy' means nothing about this has been confirmed by a
   * provider, so the wording must stay a claim about intent, not a guarantee.
   */
  verificationState?: 'provider-confirmed' | 'marketing-copy';
}

export interface TicketInfoItem {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface TicketFaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface TicketsFinalCta {
  title: string;
  subtitle?: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
  background?: MediaAsset;
}

export interface TicketsHeroContent {
  breadcrumb: string;
  eyebrow: string;
  title: string;
  description: string;
  image?: MediaAsset | null;
  sideNotes: string[];
  footNotes: string[];
}

export interface TicketSelectorContent {
  eyebrow: string;
  title: string;
  description: string;
  aside?: string;
  emptyTitle: string;
  emptyDescription: string;
}

export interface TicketsFooterPartner {
  id: string;
  name: string;
  logo: MediaAsset;
}

export interface TicketsFooterData {
  email?: string | null;
  phone?: string | null;
  partners: TicketsFooterPartner[];
  socials: Array<{
    id: string;
    platform: 'instagram' | 'facebook' | 'youtube' | 'tiktok';
    url: string | null;
  }>;
  legalTermsHref?: string | null;
  legalPrivacyHref?: string | null;
}

export interface TicketsPageData {
  event: TicketEventInfo;
  hero: TicketsHeroContent;
  selector: TicketSelectorContent;
  tiers: TicketTier[];
  provider: TicketProviderAction;
  trustItems: TicketTrustItem[];
  infoItems: TicketInfoItem[];
  faq: TicketFaqItem[];
  finalCta: TicketsFinalCta;
  footer: TicketsFooterData;
}

/** Quantity per tier id. Tiers absent from the map count as zero. */
export type TicketSelection = Record<string, number>;
