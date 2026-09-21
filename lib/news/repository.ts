// Data access for /news and /news/[slug].
//
// Status filtering lives here, not in the pages: a draft is never public, so no
// component has to remember to check.

import type { NewsArticle, NewsPageData } from './types';
import { normalizeArticle, normalizeArticles } from './http';
import { publicApiBaseUrl, unwrapApiData } from '@/lib/api/public';
import { PUBLIC_CACHE_TAGS } from '@/lib/cache/public-tags';
import { fetchPublicListingContent, listingAction, listingImage, listingTitleLines } from '@/lib/cms/public-page';

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
        next: { revalidate: this.revalidateSeconds, tags: [PUBLIC_CACHE_TAGS.news] },
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
      return { ok: true, raw: unwrapApiData(await response.json()) };
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

  async getNewsPage(): Promise<RepositoryResult<NewsPageData>> {
    const result = await this.getArticles();
    if (!result.ok) return result;
    const content = await fetchPublicListingContent(this.baseUrl, 'news-list', this.revalidateSeconds);
    if (!content) return { ok: false, error: { kind: 'invalid', message: 'The news page content is unavailable.' } };

    const articles = result.data;
    const featured = articles.find((article) => article.featured) ?? articles[0] ?? null;
    const visual = listingImage(content.hero, featured?.heroImage ?? { src: '', alt: '' });

    return {
      ok: true,
      data: {
        content,
        hero: {
          eyebrow: content.hero?.eyebrow ?? '',
          titleLines: listingTitleLines(content.hero, []),
          description: content.hero?.description ?? '',
          visual,
          sideNotes: content.hero?.sideNotes ?? [],
          primaryCta: listingAction(content.hero?.primary, { label: '', href: '' }),
          secondaryCta: listingAction(content.hero?.secondary, { label: '', href: '' }),
        },
        featuredArticle: featured,
        articles,
        finalCta: { title: content.finalCta?.title ?? '', description: content.finalCta?.description ?? content.finalCta?.subtitle ?? '', primary: listingAction(content.finalCta?.primary, { label: '', href: '' }), secondary: content.finalCta?.secondary ? listingAction(content.finalCta.secondary, { label: '', href: '' }) : undefined, background: content.finalCta?.background ?? visual },
        footer: { email: null, phone: null, partners: [], socials: [], legalTermsHref: '/terms', legalPrivacyHref: '/privacy' },
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

    const article = normalizeArticle(result.raw);
    return { ok: true, data: article && isPublic(article) ? article : null };
  }
}

export interface NewsDataEnv {
  source: 'api';
  baseUrl: string;
}

export function readNewsEnv(): NewsDataEnv {
  return { source: 'api', baseUrl: publicApiBaseUrl() };
}

export function getNewsRepository():
  | { ok: true; repository: NewsRepository }
  | { ok: false; error: NewsRepositoryError } {
  return { ok: true, repository: new HttpNewsRepository(readNewsEnv().baseUrl) };
}
