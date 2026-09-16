// Data access for /terms and /privacy.
//
//   MockLegalRepository — local draft copy, the default
//   HttpLegalRepository — GET {base}/api/v1/legal/terms
//                         GET {base}/api/v1/legal/privacy

import { PRIVACY_DRAFT, TERMS_DRAFT } from './mock';
import { normalizeLegalDocument } from './http';
import type { LegalDocument, LegalDocumentType, LegalRepository, LegalResult } from './types';

export class MockLegalRepository implements LegalRepository {
  async getTerms(): Promise<LegalResult> {
    return { ok: true, document: TERMS_DRAFT };
  }
  async getPrivacy(): Promise<LegalResult> {
    return { ok: true, document: PRIVACY_DRAFT };
  }
}

export class HttpLegalRepository implements LegalRepository {
  constructor(private readonly baseUrl: string) {}

  private async get(type: LegalDocumentType, local: LegalDocument): Promise<LegalResult> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl.replace(/\/$/, '')}/api/v1/legal/${type}`, {
        headers: { accept: 'application/json' },
        next: { revalidate: 300 },
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
      return {
        ok: true,
        document: normalizeLegalDocument(await response.json(), type, local.finalCta),
      };
    } catch {
      return { ok: false, message: 'This document could not be loaded. Please try again shortly.' };
    }
  }

  getTerms() {
    return this.get('terms', TERMS_DRAFT);
  }
  getPrivacy() {
    return this.get('privacy', PRIVACY_DRAFT);
  }
}

export function getLegalRepository(): LegalRepository {
  const source = (process.env.NEXT_PUBLIC_DATA_SOURCE ?? 'mock').trim().toLowerCase();
  const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').trim();
  if (source === 'api' || source === 'http') {
    if (baseUrl) return new HttpLegalRepository(baseUrl);
    // Misconfigured API mode fails visibly instead of quietly showing local copy.
    const failure: LegalResult = {
      ok: false,
      message: 'NEXT_PUBLIC_DATA_SOURCE=api requires NEXT_PUBLIC_API_BASE_URL to be configured.',
    };
    return { getTerms: async () => failure, getPrivacy: async () => failure };
  }
  return new MockLegalRepository();
}
