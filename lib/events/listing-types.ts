// Domain types for the /events LISTING page.
//
// Kept separate from ./types.ts, which holds the richer detail-page model
// used by /event. Same folder, two shapes: a listing card needs far less
// than a full event record, and the two evolve independently.

export interface MediaAsset {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface LinkAction {
  label: string;
  /**
   * Null means "no destination configured yet". Components must render the
   * action as clearly unavailable rather than linking somewhere misleading.
   */
  href: string | null;
  external?: boolean;
  /** Shown next to a disabled action to explain why it is not live. */
  unavailableNote?: string;
}

export type EventStatus =
  | 'announced'
  | 'coming-soon'
  | 'tickets-available'
  | 'sold-out'
  | 'completed';

export type DateStatus = 'confirmed' | 'tba';
export type ScheduleStatus = 'confirmed' | 'tbc';

export interface EventSummary {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  location?: string | null;
  image: MediaAsset;
  status: EventStatus;
  featured: boolean;
  /** Marked true for cards whose content is not yet announced. */
  placeholder?: boolean;
  date?: string | null;
  dateStatus: DateStatus;
  schedule?: string | null;
  scheduleStatus: ScheduleStatus;
  genres: string[];
  description?: string;
  detailHref?: string | null;
  ticketHref?: string | null;
  notificationAction?: LinkAction | null;
}

export interface EventsHeroData {
  breadcrumb?: string;
  eyebrow: string;
  titleLines: string[];
  description: string;
  primaryCta: LinkAction;
  secondaryCta?: LinkAction;
  visual: MediaAsset;
  visualAnnotations?: { side: string[]; note?: string[] };
}

export type EventFilter = 'all' | 'featured' | 'tickets-available' | 'coming-soon';

export interface EventBenefit {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface EventsFinalCta {
  eyebrow?: string;
  title: string;
  description?: string;
  primary: LinkAction;
  secondary?: LinkAction;
  background?: MediaAsset;
}

export type SocialPlatform = 'instagram' | 'facebook' | 'youtube' | 'tiktok';

export interface EventsSocialLink {
  id: string;
  platform: SocialPlatform;
  /** Null until a real profile URL is configured. Never invented. */
  url: string | null;
}

export interface FooterPartner {
  id: string;
  name: string;
  logo: MediaAsset;
}

export interface EventsFooterData {
  /** Null renders the "to be confirmed" fallback rather than a fake address. */
  email?: string | null;
  phone?: string | null;
  socials: EventsSocialLink[];
  /** Optional "in partnership with" strip; omitted when there are none. */
  partners?: FooterPartner[];
  legalTermsHref?: string | null;
  legalPrivacyHref?: string | null;
}

import type { PublicListingContent } from '@/lib/cms/public-page';

export interface EventsPageData {
  content?: PublicListingContent;
  hero: EventsHeroData;
  featuredEvent?: EventSummary | null;
  events: EventSummary[];
  benefits: EventBenefit[];
  finalCta: EventsFinalCta;
  footer: EventsFooterData;
}

/** True when the card has no announced content and must not imply one. */
export function isPlaceholder(event: EventSummary): boolean {
  return event.placeholder === true;
}

/** Filter predicate shared by the grid and any future server-side filtering. */
export function matchesFilter(event: EventSummary, filter: EventFilter): boolean {
  switch (filter) {
    case 'featured':
      return event.featured;
    case 'tickets-available':
      return event.status === 'tickets-available';
    case 'coming-soon':
      return event.status === 'coming-soon';
    case 'all':
    default:
      return true;
  }
}

export const EVENT_FILTERS: EventFilter[] = [
  'all',
  'featured',
  'tickets-available',
  'coming-soon',
];

export function parseFilter(value: string | string[] | undefined): EventFilter {
  const raw = Array.isArray(value) ? value[0] : value;
  return EVENT_FILTERS.includes(raw as EventFilter) ? (raw as EventFilter) : 'all';
}

// ---------------------------------------------------------------------------
// Past events / archive (/events/past)
//
// Shares MediaAsset, LinkAction, EventBenefit and the footer/CTA shapes above.
// A past event is described by what archive content exists for it, not by
// ticketing or scheduling, so it gets its own summary type.
// ---------------------------------------------------------------------------

export type ArchiveContentType = 'recap' | 'gallery' | 'highlights';

export interface PastEventSummary {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  image: MediaAsset;
  location?: string | null;
  /**
   * ISO 8601 date, never a pre-formatted string: the display format belongs to
   * the presentation layer so a backend can send plain dates.
   */
  startDate?: string | null;
  genres?: string[];
  excerpt?: string;
  featured: boolean;
  /**
   * True for entries that exist to fill out the design rather than to record a
   * real night. Placeholder entries must never be presented as history.
   */
  isPlaceholder?: boolean;
  contentTypes: ArchiveContentType[];
  recapHref?: string | null;
  galleryHref?: string | null;
  highlightsHref?: string | null;
}

export interface PastEventsHeroData {
  breadcrumb?: string;
  eyebrow: string;
  titleLines: string[];
  description: string;
  primaryCta: LinkAction;
  secondaryCta?: LinkAction;
  visual: MediaAsset;
  visualAnnotations?: { side: string[]; note?: string[] };
}

export type ArchiveBenefit = EventBenefit;

export interface PastEventsPageData {
  content?: PublicListingContent;
  hero: PastEventsHeroData;
  featuredRecap?: PastEventSummary | null;
  events: PastEventSummary[];
  benefits: ArchiveBenefit[];
  finalCta: EventsFinalCta;
  footer: EventsFooterData;
}

export type PastEventFilter = 'all' | 'featured' | 'gallery' | 'highlights';

export const PAST_EVENT_FILTERS: PastEventFilter[] = [
  'all',
  'featured',
  'gallery',
  'highlights',
];

export function matchesPastFilter(
  event: PastEventSummary,
  filter: PastEventFilter,
): boolean {
  switch (filter) {
    case 'featured':
      return event.featured;
    case 'gallery':
      return event.contentTypes.includes('gallery');
    case 'highlights':
      return event.contentTypes.includes('highlights');
    case 'all':
    default:
      return true;
  }
}

export function parsePastFilter(
  value: string | string[] | undefined,
): PastEventFilter {
  const raw = Array.isArray(value) ? value[0] : value;
  return PAST_EVENT_FILTERS.includes(raw as PastEventFilter)
    ? (raw as PastEventFilter)
    : 'all';
}
