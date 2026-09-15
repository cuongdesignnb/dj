// Data access for /gallery and /gallery/[slug].
//
//   MockGalleryRepository — canonical local content, the default
//   HttpGalleryRepository — GET {base}/api/v1/gallery
//                           GET {base}/api/v1/gallery/{slug}
//
// Both pages read through this, so the listing and the detail never hold
// separate copies of the same media.

import type { GalleryCollection, GalleryPageData } from './types';
import { GALLERY_COLLECTIONS, GALLERY_MOCK } from './mock';
import { normalizeCollection, normalizeCollections } from './http';

export interface GalleryRepositoryError {
  kind: 'network' | 'http' | 'invalid' | 'config';
  message: string;
}

export type RepositoryResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: GalleryRepositoryError };

export interface GalleryRepository {
  getGalleryPage(): Promise<RepositoryResult<GalleryPageData>>;
  getCollections(): Promise<RepositoryResult<GalleryCollection[]>>;
  /** Resolves to null for a slug that does not exist, so callers can 404. */
  getCollectionBySlug(slug: string): Promise<RepositoryResult<GalleryCollection | null>>;
}

export class MockGalleryRepository implements GalleryRepository {
  async getGalleryPage(): Promise<RepositoryResult<GalleryPageData>> {
    return { ok: true, data: GALLERY_MOCK };
  }

  async getCollections(): Promise<RepositoryResult<GalleryCollection[]>> {
    return { ok: true, data: GALLERY_COLLECTIONS };
  }

  async getCollectionBySlug(slug: string): Promise<RepositoryResult<GalleryCollection | null>> {
    const normalized = slug.trim().toLowerCase();
    return {
      ok: true,
      data: GALLERY_COLLECTIONS.find((collection) => collection.slug === normalized) ?? null,
    };
  }
}

export class HttpGalleryRepository implements GalleryRepository {
  constructor(
    private readonly baseUrl: string,
    private readonly revalidateSeconds = 300,
  ) {}

  private async fetchJson(
    path: string,
  ): Promise<
    | { ok: true; raw: unknown }
    | { ok: false; error: GalleryRepositoryError; notFound?: boolean }
  > {
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
          message: 'Could not reach the gallery service. Please try again shortly.',
        },
      };
    }

    if (response.status === 404) {
      return { ok: false, notFound: true, error: { kind: 'http', message: 'Not found.' } };
    }

    if (!response.ok) {
      return {
        ok: false,
        error: {
          kind: 'http',
          message: `The gallery service returned ${response.status}. Please try again shortly.`,
        },
      };
    }

    try {
      return { ok: true, raw: await response.json() };
    } catch {
      return {
        ok: false,
        error: { kind: 'invalid', message: 'The gallery service returned an invalid response.' },
      };
    }
  }

  async getCollections(): Promise<RepositoryResult<GalleryCollection[]>> {
    const result = await this.fetchJson('/api/v1/gallery');
    if (!result.ok) return { ok: false, error: result.error };
    return { ok: true, data: normalizeCollections(result.raw) };
  }

  /**
   * Page copy is not something the gallery endpoint owns yet, so the hero and
   * CTA keep their local wording while the collections come from the API.
   */
  async getGalleryPage(): Promise<RepositoryResult<GalleryPageData>> {
    const result = await this.getCollections();
    if (!result.ok) return result;

    const collections = result.data;
    const featured = collections.find((c) => c.featured) ?? collections[0] ?? null;

    return {
      ok: true,
      data: {
        ...GALLERY_MOCK,
        collections,
        featuredCollection: featured,
        previewMedia: featured?.media ?? [],
      },
    };
  }

  async getCollectionBySlug(slug: string): Promise<RepositoryResult<GalleryCollection | null>> {
    const normalized = encodeURIComponent(slug.trim().toLowerCase());
    const result = await this.fetchJson(`/api/v1/gallery/${normalized}`);

    if (!result.ok) {
      // A 404 is an answer, not a failure: the collection does not exist.
      if (result.notFound) return { ok: true, data: null };
      return { ok: false, error: result.error };
    }

    const raw =
      typeof result.raw === 'object' && result.raw !== null && 'collection' in result.raw
        ? (result.raw as { collection: unknown }).collection
        : result.raw;

    return { ok: true, data: normalizeCollection(raw) };
  }
}

export interface GalleryDataEnv {
  source: 'mock' | 'api';
  baseUrl: string;
}

export function readGalleryEnv(): GalleryDataEnv {
  const source = (process.env.NEXT_PUBLIC_DATA_SOURCE ?? 'mock').trim().toLowerCase();
  return {
    source: source === 'api' || source === 'http' ? 'api' : 'mock',
    baseUrl: (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').trim(),
  };
}

export function getGalleryRepository():
  | { ok: true; repository: GalleryRepository }
  | { ok: false; error: GalleryRepositoryError } {
  const env = readGalleryEnv();

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
    return { ok: true, repository: new HttpGalleryRepository(env.baseUrl) };
  }

  return { ok: true, repository: new MockGalleryRepository() };
}
