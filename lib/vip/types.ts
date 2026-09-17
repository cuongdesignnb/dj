// Domain types shared by /tables and /book-now.
//
// Both pages read the same canonical package, booth and bottle data — the
// selection made on /tables travels to /book-now as identifiers only, and the
// booking page rebuilds every label and price from this data rather than
// trusting the URL.

import type { Money } from '../money';

export type { Money };

export interface MediaAsset {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface VipEventContext {
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

export type VipAvailability = 'on-request' | 'available' | 'unavailable' | 'unknown';

export interface VipBooth {
  id: string;
  label: string;
  zone: 'left' | 'right' | 'front';
  /** Percentage coordinates on the illustrative map, 0–100. */
  x: number;
  y: number;
  requestable: boolean;
  /**
   * Only 'available' / 'unavailable' when a backend actually reports it.
   * Local data stays 'on-request' so nothing implies a live floor plan.
   */
  availability: VipAvailability;
}

export interface VipBottle {
  id: string;
  name: string;
  /** Optional product shot. Absent means the drawn placeholder is used. */
  image?: MediaAsset;
  /** Hue used by the drawn bottle so the six read as distinct. */
  tint: string;
  enabled: boolean;
}

export interface VipPackage {
  id: string;
  name: string;
  price: Money;
  paymentMode: 'request-only' | 'full-payment' | 'deposit';
  deposit?: Money | null;
  capacity: number;
  includedBottleCount: number;
  minBottleSelections: number;
  maxBottleSelections: number;
  description: string;
}

export interface VipInfoItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  action?: { label: string; href: string } | null;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface VipBookingNote {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface VipProcessStep {
  id: string;
  title: string;
  description: string;
}

export interface VipFinalCtaData {
  title: string;
  subtitle?: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
  background?: MediaAsset;
}

export interface VipFooterPartner {
  id: string;
  name: string;
  logo: MediaAsset;
}

export interface VipFooterData {
  email?: string | null;
  phone?: string | null;
  partners: VipFooterPartner[];
  socials: Array<{
    id: string;
    platform: 'instagram' | 'facebook' | 'youtube' | 'tiktok';
    url: string | null;
  }>;
  legalTermsHref?: string | null;
  legalPrivacyHref?: string | null;
}

export interface VipPageData {
  event: VipEventContext;
  package: VipPackage;
  booths: VipBooth[];
  bottles: VipBottle[];

  /** Shown on the illustrative club map so it is never read as a floor plan. */
  mapDisclaimer: string;

  infoItems: VipInfoItem[];
  faq: FaqItem[];

  processSteps: VipProcessStep[];
  bookingNotes: VipBookingNote[];
  bookingFaq: FaqItem[];

  tablesCta: VipFinalCtaData;
  bookingCta: VipFinalCtaData;
  footer: VipFooterData;
}

/** What travels between the two pages. Identifiers only — never prices or PII. */
export interface VipSelection {
  boothId?: string | null;
  bottleIds: string[];
}

export interface BookingRequestInput {
  eventId: string;
  packageId: string;
  experienceType: 'vip-table';
  fullName: string;
  email: string;
  phone: string;
  groupSize: number;
  preferredBoothId: string | null;
  bottleIds: string[];
  specialRequests?: string;
}

export interface BookingRequestResult {
  requestId?: string;
  /**
   * 'received' means the request reached a backend that accepted it. It does
   * NOT mean a table is reserved — nothing in this flow confirms a booking.
   */
  status: 'received' | 'validation-error' | 'unavailable' | 'error';
  message?: string;
  /** Field-level messages when status is 'validation-error'. */
  fieldErrors?: Record<string, string>;
}
