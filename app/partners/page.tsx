import type { Metadata } from 'next';
import Header from '@/components/home/Header';
import PartnersHero from '@/components/partners/PartnersHero';
import FeaturedPartners from '@/components/partners/FeaturedPartners';
import PartnershipTypes from '@/components/partners/PartnershipTypes';
import PartnershipBenefits from '@/components/partners/PartnershipBenefits';
import ActivationOpportunities from '@/components/partners/ActivationOpportunities';
import TrustedPartners from '@/components/partners/TrustedPartners';
import CollaborationProcess from '@/components/partners/CollaborationProcess';
import PartnersCTA from '@/components/partners/PartnersCTA';
import PartnersFooter from '@/components/partners/PartnersFooter';
import { getPartnersRepository } from '@/lib/partners/repository';

export const metadata: Metadata = {
  title: 'Partners & Sponsors | Connection Rave',
  description:
    'Explore partnership and sponsorship opportunities with Connection Rave and discover how brands can connect with music, events and community.',
  openGraph: {
    title: 'Partners & Sponsors | Connection Rave',
    description:
      'Explore partnership and sponsorship opportunities with Connection Rave.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Partners & Sponsors | Connection Rave',
    description:
      'Explore partnership and sponsorship opportunities with Connection Rave.',
  },
};

export default async function PartnersPage() {
  const repo = getPartnersRepository();
  const result = await repo.getPartnersPage();

  if (!result.ok) {
    return (
      <main className="min-h-screen bg-rave-black text-white">
        <Header />
        <div className="container mx-auto max-w-3xl px-6 py-24 text-center">
          <h1 className="font-heading text-3xl sm:text-4xl uppercase font-black">
            We can&apos;t load this page right now
          </h1>
          <p className="text-rave-muted mt-4">{result.error.message}</p>
        </div>
      </main>
    );
  }

  const data = result.data;

  return (
    <main className="min-h-screen bg-rave-black text-white">
      <Header />
      <PartnersHero hero={data.hero} />
      <FeaturedPartners partners={data.featuredPartners} />
      <PartnershipTypes types={data.partnershipTypes} />
      <PartnershipBenefits benefits={data.benefits} />
      <ActivationOpportunities lead={data.activationLead} opportunities={data.activationOpportunities} />
      <TrustedPartners partners={data.trustedPartners} />
      <CollaborationProcess steps={data.collaborationSteps} />
      <PartnersCTA cta={data.finalCta} />
      <PartnersFooter
        contact={data.footer.contact}
        legalTermsHref={data.footer.legalTermsHref}
        legalPrivacyHref={data.footer.legalPrivacyHref}
      />
    </main>
  );
}
