// Partners page domain types.
// The API adapter populates these types without coupling the UI to persistence.

export interface MediaAsset {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface LinkAction {
  label: string;
  href: string;
  external?: boolean;
}

export interface PartnerProfile {
  id: string;
  name: string;
  logo: MediaAsset;
  description: string;
  tagline?: string;
  image?: MediaAsset;
  /** Detail page; null until a real route exists. */
  href?: string | null;
  featured?: boolean;
}

export interface PartnershipType {
  id: string;
  title: string;
  icon: string;
  description?: string;
  highlights: string[];
}

export interface PartnerBenefit {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface ActivationOpportunity {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface CollaborationStep {
  id: string;
  number: string;
  title: string;
  description: string;
  icon: string;
}

export interface PartnersHeroData {
  eyebrow: string;
  titleLines: string[];
  description: string;
  primaryCta: LinkAction;
  secondaryCta?: LinkAction;
  attributes: { id: string; label: string; icon: string }[];
  visual: MediaAsset;
  visualAnnotations: { side: string[] };
}

export interface ActivationLead {
  title: string;
  description: string;
  image: MediaAsset;
}

export interface PartnersFinalCta {
  title: string;
  description?: string;
  primary: LinkAction;
  secondary?: LinkAction;
  background?: MediaAsset;
}

export interface PartnersSiteNav {
  brandName: string;
  tagline: string;
}

export interface PartnersFooterContact {
  email: string | null;
  phone: string | null;
  address: string | null;
  socials: Array<{
    id: string;
    platform: 'facebook' | 'instagram' | 'youtube' | 'tiktok';
    url: string | null;
  }>;
}

export interface PartnersPageData {
  hero: PartnersHeroData;
  featuredPartners: PartnerProfile[];
  partnershipTypes: PartnershipType[];
  benefits: PartnerBenefit[];
  activationLead: ActivationLead;
  activationOpportunities: ActivationOpportunity[];
  trustedPartners: PartnerProfile[];
  collaborationSteps: CollaborationStep[];
  finalCta: PartnersFinalCta;
  site: PartnersSiteNav;
  footer: {
    contact: PartnersFooterContact;
    legalTermsHref: string | null;
    legalPrivacyHref: string | null;
  };
}
