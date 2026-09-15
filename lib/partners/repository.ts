// Repository contract for /partners. Mirrors the about-page pattern.
import type { PartnersPageData } from './types';
import { PARTNERS_MOCK } from './mock';

export type PartnersRepositoryResult =
  | { ok: true; data: PartnersPageData }
  | { ok: false; error: { message: string } };

export interface PartnersRepository {
  getPartnersPage(): Promise<PartnersRepositoryResult>;
}

export class MockPartnersRepository implements PartnersRepository {
  async getPartnersPage(): Promise<PartnersRepositoryResult> {
    return { ok: true, data: PARTNERS_MOCK };
  }
}

// ----- HTTP adapter -----
// Toggle via NEXT_PUBLIC_DATA_SOURCE=api + NEXT_PUBLIC_API_BASE_URL.

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
    const url = `${this.baseUrl.replace(/\/$/, '')}/api/v1/pages/partners`;
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

    return { ok: true, data: mergePartners(raw) };
  }
}

// Merge API shape onto mock defaults so partial payloads don't lose sections.
function mergePartners(raw: RawApiShape): PartnersPageDataType {
  const m = PARTNERS_MOCK;
  return {
    ...m,
    hero: { ...m.hero, ...(raw.hero ?? {}) },
    featuredPartners:
      raw.featuredPartners && raw.featuredPartners.length > 0
        ? (raw.featuredPartners as PartnerProfile[])
        : m.featuredPartners,
    partnershipTypes:
      raw.partnershipTypes && raw.partnershipTypes.length > 0
        ? (raw.partnershipTypes as PartnershipType[])
        : m.partnershipTypes,
    benefits: raw.benefits && raw.benefits.length > 0 ? (raw.benefits as PartnerBenefit[]) : m.benefits,
    activationLead: { ...m.activationLead, ...(raw.activationLead ?? {}) },
    activationOpportunities:
      raw.activationOpportunities && raw.activationOpportunities.length > 0
        ? (raw.activationOpportunities as ActivationOpportunity[])
        : m.activationOpportunities,
    trustedPartners:
      raw.trustedPartners && raw.trustedPartners.length > 0
        ? (raw.trustedPartners as PartnerProfile[])
        : m.trustedPartners,
    collaborationSteps:
      raw.collaborationSteps && raw.collaborationSteps.length > 0
        ? (raw.collaborationSteps as CollaborationStep[])
        : m.collaborationSteps,
    finalCta: { ...m.finalCta, ...(raw.finalCta ?? {}) },
    site: { ...m.site, ...(raw.site ?? {}) },
    footer: {
      contact: { ...m.footer.contact, ...(raw.footer?.contact ?? {}) },
      legalTermsHref: raw.footer?.legalTermsHref ?? m.footer.legalTermsHref,
      legalPrivacyHref: raw.footer?.legalPrivacyHref ?? m.footer.legalPrivacyHref,
    },
  };
}

export function getPartnersRepository(): PartnersRepository {
  const source = (process.env.NEXT_PUBLIC_DATA_SOURCE ?? 'mock').toLowerCase();
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  if (source === 'api' && baseUrl) {
    return new HttpPartnersRepository(baseUrl);
  }
  return new MockPartnersRepository();
}
