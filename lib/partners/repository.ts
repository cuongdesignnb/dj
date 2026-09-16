// Repository contract for /partners. Mirrors the about-page pattern.
import type { PartnersPageData } from './types';
import { publicApiBaseUrl, unwrapApiData } from '@/lib/api/public';

export type PartnersRepositoryResult =
  | { ok: true; data: PartnersPageData }
  | { ok: false; error: { message: string } };

export interface PartnersRepository {
  getPartnersPage(): Promise<PartnersRepositoryResult>;
}

// ----- HTTP adapter -----

import type {
  PartnersHeroData,
  PartnerProfile,
  PartnershipType,
  PartnerBenefit,
  ActivationOpportunity,
  ActivationLead,
  CollaborationStep,
  PartnersFinalCta,
  PartnersPageData as PartnersPageDataType,
  PartnersFooterContact,
} from './types';

interface RawApiShape {
  hero?: Partial<PartnersHeroData>;
  featuredPartners?: Array<Partial<PartnerProfile>>;
  partnershipTypes?: Array<Partial<PartnershipType>>;
  benefits?: Array<Partial<PartnerBenefit>>;
  activationLead?: Partial<ActivationLead>;
  activationOpportunities?: Array<Partial<ActivationOpportunity>>;
  trustedPartners?: Array<Partial<PartnerProfile>>;
  collaborationSteps?: Array<Partial<CollaborationStep>>;
  finalCta?: Partial<PartnersFinalCta>;
  site?: { brandName?: string; tagline?: string };
  footer?: {
    contact?: Partial<PartnersFooterContact>;
    legalTermsHref?: string | null;
    legalPrivacyHref?: string | null;
  };
}

export class HttpPartnersRepository implements PartnersRepository {
  constructor(private readonly baseUrl: string) {}

  async getPartnersPage(): Promise<PartnersRepositoryResult> {
    const url = `${this.baseUrl.replace(/\/$/, '')}/api/v1/partners`;
    let response: Response;
    try {
      response = await fetch(url, { next: { revalidate: 300 } });
    } catch {
      return {
        ok: false,
        error: { message: 'Could not reach the partners service. Please try again shortly.' },
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        error: {
          message: `The partners service returned ${response.status}. Please try again shortly.`,
        },
      };
    }

    let raw: RawApiShape;
    try {
      raw = (await response.json()) as RawApiShape;
    } catch {
      return {
        ok: false,
        error: { message: 'The partners service returned an invalid response.' },
      };
    }

    const rows = unwrapApiData<Array<Record<string, unknown>>>(raw);
    const partners = rows.map((row) => ({ id: String(row.id ?? ''), name: String(row.name ?? row.slug ?? ''), logo: (row.logo as PartnersPageData['featuredPartners'][number]['logo']) ?? { src: '', alt: '' }, image: (row.image as PartnersPageData['featuredPartners'][number]['image']) ?? undefined, description: String(row.description ?? ''), href: typeof row.websiteUrl === 'string' ? row.websiteUrl : null, featured: row.featured === true })).filter((partner) => partner.id && partner.name);
    const visual = partners[0]?.image ?? partners[0]?.logo ?? { src: '', alt: '' };
    return { ok: true, data: { hero: { eyebrow: 'PARTNERS', titleLines: ['BUILDING', 'TOGETHER'], description: 'Meet the published partners connected to our events.', primaryCta: { label: 'Start a conversation', href: '/contact' }, secondaryCta: { label: 'Explore events', href: '/events' }, attributes: [], visual, visualAnnotations: { side: ['MUSIC', 'PEOPLE', 'CULTURE', 'CONNECTION'] } }, featuredPartners: partners, partnershipTypes: [], benefits: [], activationLead: { title: 'PARTNER WITH CONNECTION', description: 'Talk to the team about a future collaboration.', image: visual }, activationOpportunities: [], trustedPartners: partners, collaborationSteps: [], finalCta: { title: 'LET\'S BUILD WHAT\'S NEXT', description: 'Contact the team to discuss a partnership.', primary: { label: 'Contact us', href: '/contact' }, secondary: { label: 'View events', href: '/events' } }, site: { brandName: 'CONNECTION', tagline: 'Sound Meets Soul' }, footer: { contact: { email: null, phone: null, address: null, socials: [] }, legalTermsHref: '/terms', legalPrivacyHref: '/privacy' } } };
  }
}

export function getPartnersRepository(): PartnersRepository {
  return new HttpPartnersRepository(publicApiBaseUrl());
}
