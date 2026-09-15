// Data access for /lineup and /lineup/[slug].
//
//   MockArtistRepository  — canonical local content, the default
//   HttpArtistRepository  — GET {base}/api/v1/artists
//                           GET {base}/api/v1/artists/{slug}
//
// Selected by NEXT_PUBLIC_DATA_SOURCE / NEXT_PUBLIC_API_BASE_URL.

import type { Artist, LineupPageData } from './types';
import { ARTISTS, LINEUP_MOCK } from './mock';
import { normalizeArtist, normalizeArtists } from './http';

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

export class MockArtistRepository implements ArtistRepository {
  async getLineupPage(): Promise<RepositoryResult<LineupPageData>> {
    return { ok: true, data: LINEUP_MOCK };
  }

  async getArtists(): Promise<RepositoryResult<Artist[]>> {
    return { ok: true, data: ARTISTS };
  }

  async getArtistBySlug(slug: string): Promise<RepositoryResult<Artist | null>> {
    const normalized = slug.trim().toLowerCase();
    return { ok: true, data: ARTISTS.find((a) => a.slug === normalized) ?? null };
  }
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
        next: { revalidate: this.revalidateSeconds },
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
    return { ok: true, data: { ...LINEUP_MOCK, artists: result.data } };
  }

  async getArtistBySlug(slug: string): Promise<RepositoryResult<Artist | null>> {
    const normalized = encodeURIComponent(slug.trim().toLowerCase());
    const result = await this.fetchJson(`/api/v1/artists/${normalized}`);

    if (!result.ok) {
      // A 404 is an answer, not a failure: the artist does not exist.
      if (result.notFound) return { ok: true, data: null };
      return { ok: false, error: result.error };
    }

    return { ok: true, data: normalizeArtist(result.raw) };
  }
}

export interface ArtistDataEnv {
  source: 'mock' | 'api';
  baseUrl: string;
}

export function readArtistEnv(): ArtistDataEnv {
  const source = (process.env.NEXT_PUBLIC_DATA_SOURCE ?? 'mock').trim().toLowerCase();
  return {
    source: source === 'api' || source === 'http' ? 'api' : 'mock',
    baseUrl: (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').trim(),
  };
}

export function getArtistRepository():
  | { ok: true; repository: ArtistRepository }
  | { ok: false; error: ArtistRepositoryError } {
  const env = readArtistEnv();

  if (env.source === 'api') {
    if (!env.baseUrl) {
      return {
        ok: false,
        error: {
          kind: 'config',
          message:
            'NEXT_PUBLIC_DATA_SOURCE=api requires NEXT_PUBLIC_API_BASE_URL to be configured.',
        },
      };
    }
    return { ok: true, repository: new HttpArtistRepository(env.baseUrl) };
  }

  return { ok: true, repository: new MockArtistRepository() };
}
