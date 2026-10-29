import 'server-only';

import { publicApiBaseUrl, unwrapApiData } from '@/lib/api/public';
import { validateEventPageData } from './validation';
import { EVENT_WALL_CLOCK_TZ } from './presentation';
import type { EventPageData, EventRepository, RepositoryError } from './types';

export type RepositoryResult =
  | { ok: true; data: EventPageData }
  | { ok: false; error: RepositoryError };

const DEFAULT_TIMEOUT_MS = 8000;

function readDefaultSlug() {
  return (process.env.EVENT_SLUG ?? 'destiny').trim() || 'destiny';
}

export function readEventEnv() {
  return { source: 'http' as const, baseUrl: publicApiBaseUrl(), defaultSlug: readDefaultSlug(), siteUrl: process.env.SITE_URL ?? null };
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function media(value: unknown, fallbackSrc = '') {
  if (!isRecord(value) || typeof value.src !== 'string' || !value.src) return fallbackSrc ? { src: fallbackSrc, alt: '', width: 1200, height: 800 } : null;
  return { src: value.src, alt: typeof value.alt === 'string' ? value.alt : '', width: typeof value.width === 'number' && value.width > 0 ? value.width : 1200, height: typeof value.height === 'number' && value.height > 0 ? value.height : 800 };
}

/** The optional extras that live outside the event record. */
export interface EventPageExtras {
  /** Published `event:<id>` page content. */
  content?: unknown;
  /** Public reviews payload: { summary, reviews }. */
  reviews?: unknown;
  /** Site settings from /site/bootstrap. */
  settings?: unknown;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function httpUrl(value: unknown): string | null {
  const raw = text(value);
  return /^https:\/\//i.test(raw) || /^http:\/\//i.test(raw) ? raw : null;
}

function cards(value: unknown, prefix: string) {
  return (Array.isArray(value) ? value : [])
    .filter((item): item is Record<string, any> => isRecord(item) && item.enabled !== false && text(item.title).length > 0)
    .map((item, index) => ({ id: text(item.id) || `${prefix}-${index}`, icon: text(item.icon) || 'sparkles', title: text(item.title), description: text(item.description) }));
}

function reviewsOf(value: unknown) {
  const payload = isRecord(value) ? value : {};
  const summary = isRecord(payload.summary) ? payload.summary : {};
  const items = (Array.isArray(payload.reviews) ? payload.reviews : [])
    .filter((row): row is Record<string, any> => isRecord(row) && typeof row.id === 'string' && typeof row.comment === 'string' && typeof row.rating === 'number')
    .map((row) => ({ id: row.id, authorName: text(row.authorName) || 'Guest', rating: Math.min(5, Math.max(1, Math.round(row.rating))), comment: row.comment, createdAt: text(row.createdAt), event: isRecord(row.event) && typeof row.event.slug === 'string' ? { slug: row.event.slug, title: text(row.event.title) || row.event.slug } : null }));
  return { summary: { count: typeof summary.count === 'number' ? summary.count : items.length, average: typeof summary.average === 'number' ? summary.average : null }, items };
}

const SOCIALS = ['facebook', 'instagram', 'youtube', 'tiktok'] as const;

export function toPageData(raw: unknown, extras: EventPageExtras = {}): EventPageData | null {
  const event = unwrapApiData<Record<string, any>>(raw);
  if (!isRecord(event) || typeof event.id !== 'string' || typeof event.slug !== 'string') return null;
  const poster = media(event.poster);
  const hero = media(event.hero) ?? poster;
  const lineup = Array.isArray(event.lineup) ? event.lineup : [];
  const content = isRecord(extras.content) ? extras.content : {};
  const experience = isRecord(content.experience) ? content.experience : {};
  const venueContent = isRecord(content.venue) ? content.venue : {};
  const organiserContent = isRecord(content.organiser) ? content.organiser : {};
  const finalCtaContent = isRecord(content.finalCta) ? content.finalCta : {};
  const settings = isRecord(extras.settings) ? extras.settings : {};
  const organiser = text(organiserContent.name)
    ? { name: text(organiserContent.name), description: text(organiserContent.description), website: httpUrl(organiserContent.website), instagram: httpUrl(organiserContent.instagram), facebook: httpUrl(organiserContent.facebook) }
    : null;
  const data: EventPageData = {
    schemaVersion: 1,
    event: {
      id: event.id,
      slug: event.slug,
      name: String(event.title ?? event.slug),
      title: String(event.title ?? event.slug),
      intro: String(event.shortDescription ?? event.description ?? ''),
      accentLine: String(event.eyebrow ?? ''),
      aboutParagraphs: typeof event.description === 'string' && event.description ? [event.description] : [],
      genres: Array.isArray(event.genres) ? event.genres.filter((item): item is string => typeof item === 'string') : [],
      startsAt: typeof event.startAt === 'string' ? event.startAt : null,
      endsAt: typeof event.endAt === 'string' ? event.endAt : null,
      doorsOpenAt: null,
      timeZone: EVENT_WALL_CLOCK_TZ,
      poster,
      heroBackground: hero,
      experienceImage: media(experience.image) ?? hero,
      highlights: cards(content.highlights, 'highlight'),
      expectations: cards(content.expectations, 'expect'),
      experienceCaptions: (Array.isArray(experience.captions) ? experience.captions : []).map(text).filter(Boolean).slice(0, 6),
      goodToKnow: cards(content.goodToKnow, 'good-to-know'),
      organiser,
      finalCta: text(finalCtaContent.title) ? { title: text(finalCtaContent.title), subtitle: text(finalCtaContent.subtitle) } : null,
      reviews: reviewsOf(extras.reviews),
      artists: lineup.map((artist: any) => ({ id: String(artist.id), slug: String(artist.slug), name: String(artist.name), country: String(artist.country ?? ''), portrait: media(artist.portrait), profileHref: `/lineup/${encodeURIComponent(String(artist.slug))}` })),
      venue: { name: String(event.venue?.name ?? ''), city: String(event.venue?.city ?? ''), address: typeof event.venue?.address === 'string' ? event.venue.address : null, description: text(venueContent.description), image: media(venueContent.image), mapUrl: typeof event.venue?.mapUrl === 'string' ? event.venue.mapUrl : null, directions: text(venueContent.directions) },
      // No direct URL: the page's event-scoped routes decide where VIP links go.
      actions: { ticketUrl: null, vipRequestUrl: null },
      tickets: Array.isArray(event.tickets) ? event.tickets : [],
      vip: isRecord(event.vip) ? { packages: Array.isArray(event.vip.packages) ? event.vip.packages : [], booths: Array.isArray(event.vip.booths) ? event.vip.booths : [] } : { packages: [], booths: [] },
      faqs: Array.isArray(event.faqs) ? event.faqs.filter((faq: any) => isRecord(faq) && typeof faq.question === 'string' && typeof faq.answer === 'string').map((faq: any) => ({ id: String(faq.id ?? ''), question: faq.question, answer: faq.answer, sortOrder: typeof faq.sortOrder === 'number' ? faq.sortOrder : 0 })) : [],
      gallery: Array.isArray(event.gallery) ? event.gallery.map((album: any) => ({ id: String(album.id ?? ''), slug: String(album.slug ?? ''), title: String(album.title ?? ''), cover: media(album.cover), hero: media(album.hero) })) : [],
      seo: {
        title: String(event.seoTitle ?? event.title ?? event.slug),
        description: String(event.seoDescription ?? event.shortDescription ?? event.description ?? ''),
        image: poster,
        canonicalOverride: typeof event.canonicalOverride === 'string' ? event.canonicalOverride : null,
        indexable: event.indexable !== false,
        followLinks: event.followLinks !== false,
      },
      contentStatus: 'published',
    },
    site: { brandName: 'CONNECTION', tagline: 'Sound Meets Soul', logo: media(null, '/assets/logo-connection.svg')!, partners: [], contact: {
      email: text(settings['contact.email']) || null,
      phone: text(settings['contact.phone']) || null,
      socials: SOCIALS.flatMap((platform) => { const url = httpUrl(settings[`social.${platform}`]); return url ? [{ id: platform, platform, url }] : []; }),
    } },
  };
  const validated = validateEventPageData(data);
  return validated.ok ? validated.data : null;
}

async function getPageHttp(slug: string, baseUrl: string, signal?: AbortSignal): Promise<RepositoryResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  const combinedSignal = signal ? anySignal([signal, controller.signal]) : controller.signal;
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/v1/events/${encodeURIComponent(slug)}`, { headers: { accept: 'application/json' }, signal: combinedSignal, cache: 'no-store' });
    if (response.status === 404) return { ok: false, error: { kind: 'not-found', status: 404, message: 'Event not found' } };
    if (!response.ok) return { ok: false, error: { kind: 'http-error', status: response.status, message: `Upstream returned ${response.status}` } };
    const raw = await response.json();
    const eventId = unwrapApiData<Record<string, any>>(raw)?.id;
    const base = baseUrl.replace(/\/$/, '');
    // Extras are optional: a missing or failing one never takes the event page down.
    const optional = (path: string) => fetch(`${base}${path}`, { headers: { accept: 'application/json' }, signal: combinedSignal, cache: 'no-store' })
      .then(async (res) => (res.ok ? unwrapApiData<unknown>(await res.json()) : null))
      .catch(() => null);
    const [content, reviews, bootstrap] = await Promise.all([
      typeof eventId === 'string' ? optional(`/api/v1/page-content/event:${encodeURIComponent(eventId)}`) : Promise.resolve(null),
      optional('/api/v1/reviews?limit=12'),
      optional('/api/v1/site/bootstrap'),
    ]);
    const page = toPageData(raw, { content: isRecord(content) ? content.data : null, reviews, settings: isRecord(bootstrap) ? bootstrap.settings : null });
    return page ? { ok: true, data: page } : { ok: false, error: { kind: 'invalid-payload', message: 'Event response failed validation' } };
  } catch (error) {
    return { ok: false, error: { kind: 'network-error', message: error instanceof Error ? error.message : 'Could not reach event service' } };
  } finally {
    clearTimeout(timeout);
  }
}

function anySignal(signals: AbortSignal[]) {
  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) { controller.abort(); break; }
    signal.addEventListener('abort', () => controller.abort(), { once: true });
  }
  return controller.signal;
}

class HttpRepository implements EventRepository {
  constructor(private readonly baseUrl: string) {}
  getPage(slug: string, options?: { signal?: AbortSignal }) { return getPageHttp(slug, this.baseUrl, options?.signal); }
}

let cached: EventRepository | null = null;
let cachedBaseUrl: string | null = null;

export function getEventRepository(): EventRepository {
  const baseUrl = readEventEnv().baseUrl;
  if (!cached || cachedBaseUrl !== baseUrl) { cached = new HttpRepository(baseUrl); cachedBaseUrl = baseUrl; }
  return cached;
}

export function getDefaultEventSlug() { return readDefaultSlug(); }

export { getPageHttp as _getPageHttp };
