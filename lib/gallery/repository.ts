// Data access for /gallery and /gallery/[slug].
//
// Both pages read through the API, so the listing and detail never hold
// separate copies of the same media.

import type { GalleryCollection, GalleryPageData } from './types';
import { normalizeCollection, normalizeCollections } from './http';
import { publicApiBaseUrl, unwrapApiData } from '@/lib/api/public';

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
      return { ok: true, raw: unwrapApiData(await response.json()) };
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
   * Page chrome is presentation; collections and media always come from the API.
   */
  async getGalleryPage(): Promise<RepositoryResult<GalleryPageData>> {
    const result = await this.getCollections();
    if (!result.ok) return result;

    const collections = result.data;
    const featured = collections.find((c) => c.featured) ?? collections[0] ?? null;

    const visual = featured?.hero ?? featured?.cover ?? { src: '', alt: '' };
    return {
      ok: true,
      data: {
        hero: { eyebrow: 'GALLERY', titleLines: ['MUSIC IN', 'MOTION'], description: 'Published visual collections from Connection Rave.', visual, sideNotes: ['MUSIC', 'PEOPLE', 'CULTURE', 'CONNECTION'], primaryCta: { label: 'Explore collections', href: '#collections' }, secondaryCta: { label: 'View events', href: '/events' } },
        previewMedia: featured?.media ?? [],
        featuredCollection: featured,
        collections,
        finalCta: { title: 'KEEP THE CONNECTION GOING', subtitle: 'Explore the next published event.', primary: { label: 'View events', href: '/events' }, secondary: { label: 'View lineup', href: '/lineup' }, background: visual },
        footer: { email: null, phone: null, partners: [], socials: [], legalTermsHref: '/terms', legalPrivacyHref: '/privacy' },
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

    return { ok: true, data: normalizeCollection(result.raw) };
  }
}

export interface GalleryDataEnv {
  source: 'api';
  baseUrl: string;
}

export function readGalleryEnv(): GalleryDataEnv {
  return { source: 'api', baseUrl: publicApiBaseUrl() };
}

export function getGalleryRepository():
  | { ok: true; repository: GalleryRepository }
  | { ok: false; error: GalleryRepositoryError } {
  return { ok: true, repository: new HttpGalleryRepository(readGalleryEnv().baseUrl) };
}
