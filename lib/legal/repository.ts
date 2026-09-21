// Data access for /terms and /privacy.
//
// Published legal documents are loaded through the API.

import { normalizeLegalDocument } from './http';
import type { LegalDocumentType, LegalRepository, LegalResult } from './types';
import { publicApiBaseUrl, unwrapApiData } from '@/lib/api/public';
import { PUBLIC_CACHE_TAGS } from '@/lib/cache/public-tags';

export class HttpLegalRepository implements LegalRepository {
  constructor(private readonly baseUrl: string) {}

  private async get(type: LegalDocumentType): Promise<LegalResult> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl.replace(/\/$/, '')}/api/v1/legal/${type}`, {
        headers: { accept: 'application/json' },
        next: { revalidate: 300, tags: [type === 'terms' ? PUBLIC_CACHE_TAGS.legalTerms : PUBLIC_CACHE_TAGS.legalPrivacy] },
      });
    } catch {
      return { ok: false, message: 'This document could not be loaded. Please try again shortly.' };
    }
    // Not published yet is an answer, not a failure.
    if (response.status === 404) return { ok: true, document: null };
    if (!response.ok) {
      return { ok: false, message: 'This document could not be loaded. Please try again shortly.' };
    }
    try {
      const globalResponse = await fetch(`${this.baseUrl.replace(/\/$/, '')}/api/v1/page-content/global-content`, { headers: { accept: 'application/json' }, next: { revalidate: 300, tags: [PUBLIC_CACHE_TAGS.pageContent('global-content')] } });
      const globalPayload = globalResponse.ok ? unwrapApiData(await globalResponse.json()) : null;
      const globalData = globalPayload && typeof globalPayload === 'object' && 'data' in globalPayload ? (globalPayload as { data?: { genericCtaFallback?: { label?: string; href?: string } } }).data : undefined;
      const generic = globalData?.genericCtaFallback;
      return {
        ok: true,
        document: normalizeLegalDocument(unwrapApiData(await response.json()), type, { title: generic?.label ?? '', primary: { label: generic?.label ?? '', href: generic?.href ?? '' } }),
      };
    } catch {
      return { ok: false, message: 'This document could not be loaded. Please try again shortly.' };
    }
  }

  getTerms() {
    return this.get('terms');
  }
  getPrivacy() {
    return this.get('privacy');
  }
}

export function getLegalRepository(): LegalRepository {
  return new HttpLegalRepository(publicApiBaseUrl());
}
