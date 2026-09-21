// Data access for /shop and /shop/[slug].
//
// Listing and detail read the same product records, and archived products are
// filtered here so no page has to remember to.

import type { Product, ShopPageData } from './types';
import { normalizeProduct, normalizeProducts } from './http';
import { sortProducts } from './helpers';
import { publicApiBaseUrl, unwrapApiData } from '@/lib/api/public';
import { PUBLIC_CACHE_TAGS } from '@/lib/cache/public-tags';

export interface ShopRepositoryError {
  kind: 'network' | 'http' | 'invalid' | 'config';
  message: string;
}

export type RepositoryResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ShopRepositoryError };

export interface ShopRepository {
  getShopPage(): Promise<RepositoryResult<ShopPageData>>;
  getProducts(): Promise<RepositoryResult<Product[]>>;
  /** Resolves to null for a slug that does not exist or is archived. */
  getProductBySlug(slug: string): Promise<RepositoryResult<Product | null>>;
}

function isListed(product: Product): boolean {
  return product.status !== 'archived';
}

function pageFor(products: Product[]): ShopPageData {
  const visual = products[0]?.images[0]?.image ?? { src: '', alt: '' };
  const featured = products.find((product) => product.featured) ?? products[0] ?? null;
  return {
    hero: { eyebrow: 'MERCHANDISE', titleLines: ['WEAR THE', 'CONNECTION'], description: 'Published merchandise from the Connection collection.', primaryCta: { label: 'Shop the collection', href: '#catalogue' }, secondaryCta: featured ? { label: 'View featured product', href: `/shop/${featured.slug}` } : { label: 'Explore events', href: '/events' }, visual, composition: products.flatMap((product) => product.images.slice(0, 1).map((item) => item.image)), sideNotes: ['MUSIC', 'PEOPLE', 'CULTURE', 'CONNECTION'] },
    featuredProduct: featured,
    featuredHighlights: featured?.featureLabels.map((label) => ({ label, icon: 'star' as const })) ?? [],
    products,
    benefits: [],
    productBenefits: [],
    finalCta: { title: 'STAY CONNECTED', description: 'Explore the next published event.', primary: { label: 'View events', href: '/events' }, secondary: { label: 'View lineup', href: '/lineup' }, background: visual },
    footer: { email: null, phone: null, socials: [], legalTermsHref: '/terms', legalPrivacyHref: '/privacy' },
  };
}

export class HttpShopRepository implements ShopRepository {
  constructor(
    private readonly baseUrl: string,
    private readonly revalidateSeconds = 300,
  ) {}

  private async fetchJson(
    path: string,
  ): Promise<
    { ok: true; raw: unknown } | { ok: false; error: ShopRepositoryError; notFound?: boolean }
  > {
    const url = `${this.baseUrl.replace(/\/$/, '')}${path}`;

    let response: Response;
    try {
      response = await fetch(url, {
        headers: { accept: 'application/json' },
        next: { revalidate: this.revalidateSeconds, tags: [PUBLIC_CACHE_TAGS.products] },
      });
    } catch {
      return {
        ok: false,
        error: {
          kind: 'network',
          message: 'Could not reach the merchandise service. Please try again shortly.',
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
          message: `The merchandise service returned ${response.status}. Please try again shortly.`,
        },
      };
    }

    try {
      return { ok: true, raw: unwrapApiData(await response.json()) };
    } catch {
      return {
        ok: false,
        error: {
          kind: 'invalid',
          message: 'The merchandise service returned an invalid response.',
        },
      };
    }
  }

  async getProducts(): Promise<RepositoryResult<Product[]>> {
    const result = await this.fetchJson('/api/v1/products');
    if (!result.ok) return { ok: false, error: result.error };
    return { ok: true, data: sortProducts(normalizeProducts(result.raw).filter(isListed)) };
  }

  /**
   * Page copy is not something the products endpoint owns, so the hero, benefits
   * and CTA keep their local wording while products come from the API. An empty
   * API catalogue stays empty — local products are never mixed in.
   */
  async getShopPage(): Promise<RepositoryResult<ShopPageData>> {
    const result = await this.getProducts();
    if (!result.ok) return result;

    const page = pageFor(result.data);
    return {
      ok: true,
      data: {
        ...page,
        hero: {
          ...page.hero,
          secondaryCta: page.featuredProduct
            ? { label: 'View Featured Product', href: `/shop/${page.featuredProduct.slug}` }
            : { label: 'Explore Event', href: '/event' },
        },
      },
    };
  }

  async getProductBySlug(slug: string): Promise<RepositoryResult<Product | null>> {
    const normalized = encodeURIComponent(slug.trim().toLowerCase());
    const result = await this.fetchJson(`/api/v1/products/${normalized}`);

    if (!result.ok) {
      // A 404 is an answer, not a failure: the product does not exist.
      if (result.notFound) return { ok: true, data: null };
      return { ok: false, error: result.error };
    }

    const product = normalizeProduct(result.raw);
    return { ok: true, data: product && isListed(product) ? product : null };
  }
}

export function getShopRepository():
  | { ok: true; repository: ShopRepository }
  | { ok: false; error: ShopRepositoryError } {
  return { ok: true, repository: new HttpShopRepository(publicApiBaseUrl()) };
}
