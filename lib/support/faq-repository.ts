// Data access for /faq.
//
//   MockFaqRepository — local content, the default
//   HttpFaqRepository — GET {base}/api/v1/faq

import { FAQ_MOCK } from './faq-mock';
import { normalizeFaqItems } from './faq-http';
import type { FaqItem, FaqPageData, FaqRepository, RepositoryResult } from './faq-types';

function published(items: FaqItem[]): FaqItem[] {
  return items
    .filter((item) => item.published)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.question.localeCompare(b.question));
}

export class MockFaqRepository implements FaqRepository {
  async getFaqPage(): Promise<RepositoryResult<FaqPageData>> {
    return { ok: true, data: { ...FAQ_MOCK, items: published(FAQ_MOCK.items) } };
  }
}

export class HttpFaqRepository implements FaqRepository {
  constructor(private readonly baseUrl: string) {}

  async getFaqPage(): Promise<RepositoryResult<FaqPageData>> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl.replace(/\/$/, '')}/api/v1/faq`, {
        headers: { accept: 'application/json' },
        next: { revalidate: 300 },
      });
    } catch {
      return { ok: false, error: { kind: 'network', message: 'Could not reach the FAQ service. Please try again shortly.' } };
    }
    if (!response.ok) {
      return { ok: false, error: { kind: 'http', message: `The FAQ service returned ${response.status}.` } };
    }
    try {
      // Page copy stays local; questions come from the service. An empty list
      // stays empty — local questions are never mixed in.
      const items = published(normalizeFaqItems(await response.json()));
      return { ok: true, data: { ...FAQ_MOCK, items } };
    } catch {
      return { ok: false, error: { kind: 'invalid', message: 'The FAQ service returned an invalid response.' } };
    }
  }
}

export function getFaqRepository():
  | { ok: true; repository: FaqRepository }
  | { ok: false; error: { kind: 'config'; message: string } } {
  const source = (process.env.NEXT_PUBLIC_DATA_SOURCE ?? 'mock').trim().toLowerCase();
  const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').trim();
  if (source === 'api' || source === 'http') {
    if (!baseUrl) {
      return {
        ok: false,
        error: { kind: 'config', message: 'NEXT_PUBLIC_DATA_SOURCE=api requires NEXT_PUBLIC_API_BASE_URL to be configured.' },
      };
    }
    return { ok: true, repository: new HttpFaqRepository(baseUrl) };
  }
  return { ok: true, repository: new MockFaqRepository() };
}
