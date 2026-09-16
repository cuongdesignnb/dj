// Repository contract for the /about page. The page is backed by the public
// bootstrap endpoint; missing CMS sections remain empty until editorial data
// is published.

import type { AboutPageData } from './types';
import { publicApiBaseUrl, unwrapApiData } from '@/lib/api/public';

export type AboutRepositoryResult =
  | { ok: true; data: AboutPageData }
  | { ok: false; error: { message: string } };

export interface AboutRepository {
  getAboutPage(): Promise<AboutRepositoryResult>;
}

// ----- HTTP adapter -----

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
    const url = `${this.baseUrl.replace(/\/$/, '')}/api/v1/site/bootstrap`;
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

    const bootstrap = unwrapApiData<{ partners?: Array<Record<string, unknown>>; settings?: Record<string, unknown> }>(raw);
    const partners = (bootstrap.partners ?? []).map((partner) => ({ id: String(partner.id ?? ''), name: String(partner.name ?? partner.slug ?? ''), logo: (partner.logo as AboutPageData['partners'][number]['logo']) ?? { src: '', alt: '' }, description: String(partner.description ?? ''), href: typeof partner.websiteUrl === 'string' ? partner.websiteUrl : undefined })).filter((partner) => partner.id && partner.name);
    const visual = partners[0]?.logo ?? { src: '', alt: '' };
    return { ok: true, data: { hero: { eyebrow: 'ABOUT CONNECTION', titleLines: ['MUSIC, PEOPLE,', 'CONNECTION'], description: 'A platform for published events, artists and community stories.', primaryCta: { label: 'Explore events', href: '/events' }, secondaryCta: { label: 'Meet the partners', href: '/partners' }, attributes: [], visual, visualAnnotations: { side: ['MUSIC', 'PEOPLE'], bottom: ['CONNECTION'] }, badge: null }, story: { eyebrow: 'OUR STORY', title: 'Built around connection', paragraphs: [], image: visual, quote: { text: '' } }, values: [], ecosystem: [], connectionReasons: [], partners, finalCta: { title: 'FIND YOUR CONNECTION', primary: { label: 'View events', href: '/events' }, secondary: { label: 'Contact us', href: '/contact' } }, site: { brandName: 'CONNECTION', tagline: 'Sound Meets Soul' }, footer: { contact: { email: null, phone: null, address: null, socials: [] }, legalTermsHref: '/terms', legalPrivacyHref: '/privacy' } } };
  }
}

export function getAboutRepository(): AboutRepository {
  return new HttpAboutRepository(publicApiBaseUrl());
}
