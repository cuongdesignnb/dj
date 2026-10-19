import type { EventsFooterData } from '@/lib/events/listing-types';

/**
 * Footer data for the support and legal pages. Contact details stay unset until confirmed;
 * partner logos come from Admin › Partners via the sponsors context.
 */
export const SITE_FOOTER: EventsFooterData = {
  email: null,
  phone: null,
  socials: [
    { id: 'instagram', platform: 'instagram', url: null },
    { id: 'facebook', platform: 'facebook', url: null },
    { id: 'youtube', platform: 'youtube', url: null },
    { id: 'tiktok', platform: 'tiktok', url: null },
  ],
  legalTermsHref: '/terms',
  legalPrivacyHref: '/privacy',
};
