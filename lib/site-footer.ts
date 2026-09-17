import type { EventsFooterData } from '@/lib/events/listing-types';

/** Footer data for the support and legal pages. Contact details stay unset until confirmed. */
export const SITE_FOOTER: EventsFooterData = {
  email: null,
  phone: null,
  partners: [
    {
      id: 'mcq',
      name: 'MCQ Supermarket',
      logo: { src: '/assets/logo-mcq.svg', alt: 'MCQ Supermarket', width: 200, height: 64 },
    },
    {
      id: 'bihi',
      name: 'BIHI Entertainment',
      logo: { src: '/assets/logo-bihi.svg', alt: 'BIHI Entertainment', width: 200, height: 64 },
    },
  ],
  socials: [
    { id: 'instagram', platform: 'instagram', url: null },
    { id: 'facebook', platform: 'facebook', url: null },
    { id: 'youtube', platform: 'youtube', url: null },
    { id: 'tiktok', platform: 'tiktok', url: null },
  ],
  legalTermsHref: '/terms',
  legalPrivacyHref: '/privacy',
};
