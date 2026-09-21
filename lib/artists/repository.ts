// Data access for /lineup and /lineup/[slug].
//
// Published artist records are loaded through the API.

import type { Artist, LineupPageData } from './types';
import { normalizeArtist, normalizeArtists } from './http';
import { publicApiBaseUrl, unwrapApiData } from '@/lib/api/public';
import { PUBLIC_CACHE_TAGS } from '@/lib/cache/public-tags';
import { fetchPublicListingContent, listingAction, listingImage, listingTitleLines } from '@/lib/cms/public-page';

export interface ArtistRepositoryError {
  kind: 'network' | 'http' | 'invalid' | 'config';
  message: string;
}

export type RepositoryResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ArtistRepositoryError };

export interface ArtistRepository {
  getLineupPage(): Promise<RepositoryResult<LineupPageData>>;
  getArtists(): Promise<RepositoryResult<Artist[]>>;
  /** Resolves to null for a slug that does not exist, so callers can 404. */
  getArtistBySlug(slug: string): Promise<RepositoryResult<Artist | null>>;
}

export class HttpArtistRepository implements ArtistRepository {
  constructor(
    private readonly baseUrl: string,
    private readonly revalidateSeconds = 300,
  ) {}

  private async fetchJson(
    path: string,
  ): Promise<{ ok: true; raw: unknown } | { ok: false; error: ArtistRepositoryError; notFound?: boolean }> {
    const url = `${this.baseUrl.replace(/\/$/, '')}${path}`;

    let response: Response;
    try {
      response = await fetch(url, {
        headers: { accept: 'application/json' },
        next: { revalidate: this.revalidateSeconds, tags: [PUBLIC_CACHE_TAGS.artists, PUBLIC_CACHE_TAGS.events] },
      });
    } catch {
      return {
        ok: false,
        error: {
          kind: 'network',
          message: 'Could not reach the lineup service. Please try again shortly.',
        },
      };
    }

    if (response.status === 404) {
      return {
        ok: false,
        notFound: true,
        error: { kind: 'http', message: 'Not found.' },
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        error: {
          kind: 'http',
          message: `The lineup service returned ${response.status}. Please try again shortly.`,
        },
      };
    }

    try {
      return { ok: true, raw: await response.json() };
    } catch {
      return {
        ok: false,
        error: { kind: 'invalid', message: 'The lineup service returned an invalid response.' },
      };
    }
  }

  async getArtists(): Promise<RepositoryResult<Artist[]>> {
    const result = await this.fetchJson('/api/v1/artists');
    if (!result.ok) return { ok: false, error: result.error };

    const artists = normalizeArtists(result.raw);
    if (artists.length === 0) {
      return {
        ok: false,
        error: {
          kind: 'invalid',
          message: 'The lineup service returned no artists this page can display.',
        },
      };
    }
    return { ok: true, data: artists };
  }

  /**
   * Page copy is not something the artists endpoint owns, so the hero, story
   * and CTA keep their local wording while the artists themselves come from the
   * API. When a page endpoint exists this should read that instead.
   */
  async getLineupPage(): Promise<RepositoryResult<LineupPageData>> {
    const result = await this.getArtists();
    if (!result.ok) return result;
    const content = await fetchPublicListingContent(this.baseUrl, 'lineup-list', this.revalidateSeconds);
    if (!content) return { ok: false, error: { kind: 'invalid', message: 'The lineup page content is unavailable.' } };
    const fallbackVisual = result.data[0]?.heroImage ?? result.data[0]?.portrait ?? { src: '', alt: '' };
    const story = (content.sections ?? []).find((section) => section.key === 'story' || section.key === 'info');
    return {
      ok: true,
      data: {
        content,
        hero: {
          eyebrow: content.hero?.eyebrow ?? '',
          titleLines: listingTitleLines(content.hero, []),
          description: content.hero?.description ?? '',
          primaryCta: listingAction(content.hero?.primary, { label: '', href: '' }),
          secondaryCta: listingAction(content.hero?.secondary, { label: '', href: '' }),
          visual: listingImage(content.hero, fallbackVisual),
          sideNotes: content.hero?.sideNotes ?? [],
          badge: [],
          location: process.env.EVENT_CITY?.trim() ?? '',
        },
        artists: result.data,
        story: { eyebrow: story?.eyebrow ?? '', title: story?.title ?? '', description: story?.description ?? '', image: listingImage(content.hero, fallbackVisual) },
        finalCta: { title: content.finalCta?.title ?? '', subtitle: content.finalCta?.description ?? content.finalCta?.subtitle, primary: listingAction(content.finalCta?.primary, { label: '', href: '' }), secondary: listingAction(content.finalCta?.secondary, { label: '', href: '' }) },
        footer: { email: null, phone: null, partners: [], socials: [], legalTermsHref: '/terms', legalPrivacyHref: '/privacy' },
      },
    };
  }

  async getArtistBySlug(slug: string): Promise<RepositoryResult<Artist | null>> {
    const normalized = encodeURIComponent(slug.trim().toLowerCase());
    const result = await this.fetchJson(`/api/v1/artists/${normalized}`);

    if (!result.ok) {
      // A 404 is an answer, not a failure: the artist does not exist.
      if (result.notFound) return { ok: true, data: null };
      return { ok: false, error: result.error };
    }

    return { ok: true, data: normalizeArtist(unwrapApiData(result.raw)) };
  }
}

export interface ArtistDataEnv {
  source: 'api';
  baseUrl: string;
}

export function readArtistEnv(): ArtistDataEnv {
  return { source: 'api', baseUrl: publicApiBaseUrl() };
}

export function getArtistRepository():
  | { ok: true; repository: ArtistRepository }
  | { ok: false; error: ArtistRepositoryError } {
  return { ok: true, repository: new HttpArtistRepository(readArtistEnv().baseUrl) };
}
