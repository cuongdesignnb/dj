// Data access for /shop and /shop/[slug].
//
//   MockShopRepository — the local preview catalogue, the default
//   HttpShopRepository — GET {base}/api/v1/products
//                        GET {base}/api/v1/products/{slug}
//
// Listing and detail read the same product records, and archived products are
// filtered here so no page has to remember to.

import type { Product, ShopPageData } from './types';
import { SHOP_MOCK, SHOP_PRODUCTS } from './mock';
import { normalizeProduct, normalizeProducts } from './http';
import { sortProducts } from './helpers';

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
  return {
    ...SHOP_MOCK,
    products,
    featuredProduct: products.find((product) => product.featured) ?? null,
  };
}

export class MockShopRepository implements ShopRepository {
  async getShopPage(): Promise<RepositoryResult<ShopPageData>> {
    const products = await this.getProducts();
    return products.ok ? { ok: true, data: pageFor(products.data) } : products;
  }

  async getProducts(): Promise<RepositoryResult<Product[]>> {
    return { ok: true, data: sortProducts(SHOP_PRODUCTS.filter(isListed)) };
  }

  async getProductBySlug(slug: string): Promise<RepositoryResult<Product | null>> {
    const normalized = slug.trim().toLowerCase();
    const found = SHOP_PRODUCTS.find((product) => product.slug === normalized);
    return { ok: true, data: found && isListed(found) ? found : null };
  }
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
        next: { revalidate: this.revalidateSeconds },
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
      return { ok: true, raw: await response.json() };
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

    const raw =
      typeof result.raw === 'object' && result.raw !== null && 'product' in result.raw
        ? (result.raw as { product: unknown }).product
        : result.raw;

    const product = normalizeProduct(raw);
    return { ok: true, data: product && isListed(product) ? product : null };
  }
}

export function getShopRepository():
  | { ok: true; repository: ShopRepository }
  | { ok: false; error: ShopRepositoryError } {
  const source = (process.env.NEXT_PUBLIC_DATA_SOURCE ?? 'mock').trim().toLowerCase();
  const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').trim();

  if (source === 'api' || source === 'http') {
    if (!baseUrl) {
      return {
        ok: false,
        error: {
          kind: 'config',
          message:
            'NEXT_PUBLIC_DATA_SOURCE=api requires NEXT_PUBLIC_API_BASE_URL to be configured.',
        },
      };
    }
    return { ok: true, repository: new HttpShopRepository(baseUrl) };
  }

  return { ok: true, repository: new MockShopRepository() };
}
