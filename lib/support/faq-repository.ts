// Data access for /faq.
//
// Published FAQ content is loaded through the API.

import { normalizeFaqItems } from './faq-http';
import type { FaqItem, FaqPageData, FaqRepository, RepositoryResult } from './faq-types';
import { publicApiBaseUrl, unwrapApiData } from '@/lib/api/public';
import { PUBLIC_CACHE_TAGS } from '@/lib/cache/public-tags';

function published(items: FaqItem[]): FaqItem[] {
  return items
    .filter((item) => item.published)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.question.localeCompare(b.question));
}

export class HttpFaqRepository implements FaqRepository {
  constructor(private readonly baseUrl: string) {}

  async getFaqPage(): Promise<RepositoryResult<FaqPageData>> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl.replace(/\/$/, '')}/api/v1/faq`, {
        headers: { accept: 'application/json' },
        next: { revalidate: 300, tags: [PUBLIC_CACHE_TAGS.faq] },
      });
    } catch {
      return { ok: false, error: { kind: 'network', message: 'Could not reach the FAQ service. Please try again shortly.' } };
    }
    if (!response.ok) {
      return { ok: false, error: { kind: 'http', message: `The FAQ service returned ${response.status}.` } };
    }
    try {
      const items = published(normalizeFaqItems(unwrapApiData(await response.json())));
      const categories = [...new Map(items.map((item) => [item.category, item.category])).entries()].map(([id]) => ({ id, label: id.replace(/-/g, ' '), icon: id === 'vip-tables' ? 'crown' as const : id === 'tickets' ? 'ticket' as const : id === 'entry' ? 'entry' as const : 'pin' as const, sortOrder: 0 }));
      return { ok: true, data: { hero: { eyebrow: 'SUPPORT', title: 'FREQUENTLY ASKED QUESTIONS', description: 'Answers from the published event and venue information.', visual: { src: '', alt: '' }, sideNotes: ['MUSIC', 'PEOPLE', 'CULTURE', 'CONNECTION'] }, categories, items, finalCta: { title: 'STILL HAVE QUESTIONS?', description: 'Send a message to the team.', primary: { label: 'Contact us', href: '/contact' }, secondary: { label: 'View events', href: '/events' } } } };
    } catch {
      return { ok: false, error: { kind: 'invalid', message: 'The FAQ service returned an invalid response.' } };
    }
  }
}

export function getFaqRepository():
  | { ok: true; repository: FaqRepository }
  | { ok: false; error: { kind: 'config'; message: string } } {
  return { ok: true, repository: new HttpFaqRepository(publicApiBaseUrl()) };
}
