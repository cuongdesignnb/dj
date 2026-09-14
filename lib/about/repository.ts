// Repository contract for the /about page. Two adapters (Mock, Http) share
// this surface. Components only see the returned AboutPageData.

import type { AboutPageData } from './types';
import { ABOUT_MOCK } from './mock';

export type AboutRepositoryResult =
  | { ok: true; data: AboutPageData }
  | { ok: false; error: { message: string } };

export interface AboutRepository {
  getAboutPage(): Promise<AboutRepositoryResult>;
}

// ----- Mock adapter -----

export class MockAboutRepository implements AboutRepository {
  async getAboutPage(): Promise<AboutRepositoryResult> {
    return { ok: true, data: ABOUT_MOCK };
  }
}

// ----- HTTP adapter -----
// Backend integration is forward-looking. When DATA_SOURCE=api and
// NEXT_PUBLIC_API_BASE_URL is set, the adapter fetches from
// `{baseUrl}/api/v1/pages/about`.

import type {
  AboutHeroData,
  AboutHeroAttribute,
  AboutStoryData,
  AboutValueItem,
  AboutEcosystemItem,
  AboutConnectionItem,
  PartnerItem,
  AboutFinalCta,
  AboutPageData as AboutPageDataType,
  AboutFooterContact,
} from './types';

interface RawApiShape {
  hero?: Partial<AboutHeroData> & {
    attributes?: Array<Partial<AboutHeroAttribute>>;
  };
  story?: Partial<AboutStoryData>;
  values?: Array<Partial<AboutValueItem>>;
  ecosystem?: Array<Partial<AboutEcosystemItem>>;
  connectionReasons?: Array<Partial<AboutConnectionItem>>;
  partners?: Array<Partial<PartnerItem>>;
  finalCta?: Partial<AboutFinalCta>;
  site?: { brandName?: string; tagline?: string };
  footer?: {
    contact?: Partial<AboutFooterContact>;
    legalTermsHref?: string | null;
    legalPrivacyHref?: string | null;
  };
}

export class HttpAboutRepository implements AboutRepository {
  constructor(private readonly baseUrl: string) {}

  async getAboutPage(): Promise<AboutRepositoryResult> {
    const url = `${this.baseUrl.replace(/\/$/, '')}/api/v1/pages/about`;
    let response: Response;
    try {
      // Next.js exposes the standard fetch on the server with same defaults
      // as the browser; we don't need `cache: 'no-store'` for the static
      // about page — Next will infer.
      response = await fetch(url, { next: { revalidate: 300 } });
    } catch {
      return {
        ok: false,
        error: {
          message: 'Could not reach the about service. Please try again shortly.',
        },
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        error: {
          message: `The about service returned ${response.status}. Please try again shortly.`,
        },
      };
    }

    let raw: RawApiShape;
    try {
      raw = (await response.json()) as RawApiShape;
    } catch {
      return {
        ok: false,
        error: { message: 'The about service returned an invalid response.' },
      };
    }

    return { ok: true, data: mergeAboutPage(raw) };
  }
}

// The page that the UI consumes is built by merging the API shape onto the
// mock defaults. This means backend teams can ship partial payloads — e.g.
// update only `hero` — without missing sections dropping to "Soon" copy.
function mergeAboutPage(raw: RawApiShape): AboutPageDataType {
  const m = ABOUT_MOCK;
  return {
    ...m,
    hero: { ...m.hero, ...(raw.hero ?? {}) },
    story: { ...m.story, ...(raw.story ?? {}) },
    values: raw.values && raw.values.length > 0 ? (raw.values as AboutValueItem[]) : m.values,
    ecosystem:
      raw.ecosystem && raw.ecosystem.length > 0
        ? (raw.ecosystem as AboutEcosystemItem[])
        : m.ecosystem,
    connectionReasons:
      raw.connectionReasons && raw.connectionReasons.length > 0
        ? (raw.connectionReasons as AboutConnectionItem[])
        : m.connectionReasons,
    partners:
      raw.partners && raw.partners.length > 0 ? (raw.partners as PartnerItem[]) : m.partners,
    finalCta: { ...m.finalCta, ...(raw.finalCta ?? {}) },
    site: { ...m.site, ...(raw.site ?? {}) },
    footer: {
      contact: { ...m.footer.contact, ...(raw.footer?.contact ?? {}) },
      legalTermsHref: raw.footer?.legalTermsHref ?? m.footer.legalTermsHref,
      legalPrivacyHref: raw.footer?.legalPrivacyHref ?? m.footer.legalPrivacyHref,
    },
  };
}

// ----- Selector -----

export function getAboutRepository(): AboutRepository {
  const source = (process.env.NEXT_PUBLIC_DATA_SOURCE ?? 'mock').toLowerCase();
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  if (source === 'api' && baseUrl) {
    return new HttpAboutRepository(baseUrl);
  }
  return new MockAboutRepository();
}
