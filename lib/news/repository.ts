// Data access for /news and /news/[slug].
//
//   MockNewsRepository — canonical local content, the default
//   HttpNewsRepository — GET {base}/api/v1/news
//                        GET {base}/api/v1/news/{slug}
//
// Status filtering lives here, not in the pages: a draft is never public, so no
// component has to remember to check.

import type { NewsArticle, NewsPageData } from './types';
import { NEWS_ARTICLES, NEWS_MOCK } from './mock';
import { normalizeArticle, normalizeArticles } from './http';

export interface NewsRepositoryError {
  kind: 'network' | 'http' | 'invalid' | 'config';
  message: string;
}

export type RepositoryResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: NewsRepositoryError };

export interface NewsRepository {
  getNewsPage(): Promise<RepositoryResult<NewsPageData>>;
  getArticles(): Promise<RepositoryResult<NewsArticle[]>>;
  /** Resolves to null for a slug that does not exist or is not public. */
  getArticleBySlug(slug: string): Promise<RepositoryResult<NewsArticle | null>>;
}

/** Drafts never reach a reader, whatever the source says. */
function isPublic(article: NewsArticle): boolean {
  return article.status !== 'draft';
}

export class MockNewsRepository implements NewsRepository {
  async getNewsPage(): Promise<RepositoryResult<NewsPageData>> {
    const articles = NEWS_MOCK.articles.filter(isPublic);
    return {
      ok: true,
      data: {
        ...NEWS_MOCK,
        articles,
        featuredArticle:
          NEWS_MOCK.featuredArticle && isPublic(NEWS_MOCK.featuredArticle)
            ? NEWS_MOCK.featuredArticle
            : (articles.find((article) => article.featured) ?? null),
      },
    };
  }

  async getArticles(): Promise<RepositoryResult<NewsArticle[]>> {
    return { ok: true, data: NEWS_ARTICLES.filter(isPublic) };
  }

  async getArticleBySlug(slug: string): Promise<RepositoryResult<NewsArticle | null>> {
    const normalized = slug.trim().toLowerCase();
    const found = NEWS_ARTICLES.find((article) => article.slug === normalized);
    return { ok: true, data: found && isPublic(found) ? found : null };
  }
}

export class HttpNewsRepository implements NewsRepository {
  constructor(
    private readonly baseUrl: string,
    private readonly revalidateSeconds = 300,
  ) {}

  private async fetchJson(
    path: string,
  ): Promise<
    { ok: true; raw: unknown } | { ok: false; error: NewsRepositoryError; notFound?: boolean }
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
          message: 'Could not reach the news service. Please try again shortly.',
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
          message: `The news service returned ${response.status}. Please try again shortly.`,
        },
      };
    }

    try {
      return { ok: true, raw: await response.json() };
    } catch {
      return {
        ok: false,
        error: { kind: 'invalid', message: 'The news service returned an invalid response.' },
      };
    }
  }

  async getArticles(): Promise<RepositoryResult<NewsArticle[]>> {
    const result = await this.fetchJson('/api/v1/news');
    if (!result.ok) return { ok: false, error: result.error };
    return { ok: true, data: normalizeArticles(result.raw).filter(isPublic) };
  }

  /**
   * Page copy is not something the news endpoint owns yet, so the hero and CTA
   * keep their local wording while the articles come from the API.
   */
  async getNewsPage(): Promise<RepositoryResult<NewsPageData>> {
    const result = await this.getArticles();
    if (!result.ok) return result;

    const articles = result.data;
    const featured = articles.find((article) => article.featured) ?? articles[0] ?? null;

    return {
      ok: true,
      data: {
        ...NEWS_MOCK,
        articles,
        featuredArticle: featured,
        hero: {
          ...NEWS_MOCK.hero,
          primaryCta: featured
            ? { label: 'Read Latest Story', href: `/news/${featured.slug}` }
            : NEWS_MOCK.hero.primaryCta,
        },
      },
    };
  }

  async getArticleBySlug(slug: string): Promise<RepositoryResult<NewsArticle | null>> {
    const normalized = encodeURIComponent(slug.trim().toLowerCase());
    const result = await this.fetchJson(`/api/v1/news/${normalized}`);

    if (!result.ok) {
      // A 404 is an answer, not a failure: the article does not exist.
      if (result.notFound) return { ok: true, data: null };
      return { ok: false, error: result.error };
    }

    const raw =
      typeof result.raw === 'object' && result.raw !== null && 'article' in result.raw
        ? (result.raw as { article: unknown }).article
        : result.raw;

    const article = normalizeArticle(raw);
    return { ok: true, data: article && isPublic(article) ? article : null };
  }
}

export interface NewsDataEnv {
  source: 'mock' | 'api';
  baseUrl: string;
}

export function readNewsEnv(): NewsDataEnv {
  const source = (process.env.NEXT_PUBLIC_DATA_SOURCE ?? 'mock').trim().toLowerCase();
  return {
    source: source === 'api' || source === 'http' ? 'api' : 'mock',
    baseUrl: (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').trim(),
  };
}

export function getNewsRepository():
  | { ok: true; repository: NewsRepository }
  | { ok: false; error: NewsRepositoryError } {
  const env = readNewsEnv();

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
    return { ok: true, repository: new HttpNewsRepository(env.baseUrl) };
  }

  return { ok: true, repository: new MockNewsRepository() };
}
