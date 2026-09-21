import 'server-only';

import { publicApiBaseUrl, unwrapApiData } from '@/lib/api/public';
import { validateEventPageData } from './validation';
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

export function toPageData(raw: unknown): EventPageData | null {
  const event = unwrapApiData<Record<string, any>>(raw);
  if (!isRecord(event) || typeof event.id !== 'string' || typeof event.slug !== 'string') return null;
  const poster = media(event.poster);
  const hero = media(event.hero) ?? poster;
  const lineup = Array.isArray(event.lineup) ? event.lineup : [];
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
      timeZone: typeof event.timeZone === 'string' && event.timeZone ? event.timeZone : process.env.EVENT_TIME_ZONE?.trim() || 'UTC',
      poster,
      heroBackground: hero,
      experienceImage: hero,
      highlights: [],
      expectations: [],
      artists: lineup.map((artist: any) => ({ id: String(artist.id), slug: String(artist.slug), name: String(artist.name), country: String(artist.country ?? ''), portrait: media(artist.portrait), profileHref: `/lineup/${encodeURIComponent(String(artist.slug))}` })),
      venue: { name: String(event.venue?.name ?? ''), city: String(event.venue?.city ?? ''), address: typeof event.venue?.address === 'string' ? event.venue.address : null, description: String(event.description ?? ''), image: null, mapUrl: typeof event.venue?.mapUrl === 'string' ? event.venue.mapUrl : null },
      actions: { ticketUrl: null, vipRequestUrl: '/tables' },
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
    site: { brandName: 'CONNECTION', tagline: 'Sound Meets Soul', logo: media(null, '/assets/logo-connection.svg')!, partners: [], contact: { email: null, phone: null, socials: [] } },
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
    const page = toPageData(await response.json());
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
