import type { LegalDocument } from './types';

// DRAFT legal copy, pending client and legal-counsel review.
//
// These are UI placeholders, not legal terms. They describe only what is
// known to be pending and avoid anything that would need counsel to write:
// no refund rules, liability, governing law, age limits, retention periods,
// consent wording, compliance claims or dates.

const CTA_SECONDARY = { label: 'Explore Event', href: '/event' };
const CONTACT = { label: 'Contact Us', href: '/contact' };

export const TERMS_DRAFT: LegalDocument = {
  type: 'terms',
  status: 'draft',
  eyebrow: 'Legal',
  title: 'Terms & Conditions',
  intro:
    'These terms and conditions are being prepared for review and may be updated by the event organizer. Please check back for the latest information.',
  version: null,
  effectiveDate: null,
  updatedAt: null,
  sections: [
    {
      id: 'ticketing',
      navLabel: 'Ticketing',
      title: 'Ticketing',
      paragraphs: [
        'All ticketing information, including ticket types, availability, pricing and purchase processes, is subject to confirmation by the event organizer.',
        'Ticket details may be updated at any time. Please refer to official channels for the latest information.',
      ],
      notice: 'Information subject to organizer confirmation.',
      sortOrder: 1,
    },
    {
      id: 'entry',
      navLabel: 'Entry',
      title: 'Entry',
      paragraphs: [
        'Entry requirements, including identification and other conditions, are to be confirmed by the event organizer.',
      ],
      sortOrder: 2,
    },
    {
      id: 'vip-requests',
      navLabel: 'VIP Requests',
      title: 'VIP Requests',
      paragraphs: [
        'VIP table requests and related services are handled separately and are subject to availability. Details and confirmation will be provided directly by the organizer.',
      ],
      sortOrder: 3,
    },
    {
      id: 'cancellations',
      navLabel: 'Cancellations',
      title: 'Cancellations',
      paragraphs: [
        'Cancellation and change policies are pending organizer confirmation. Please check back for updates or contact the team.',
      ],
      sortOrder: 4,
    },
    {
      id: 'contact',
      navLabel: 'Contact',
      title: 'Contact',
      paragraphs: [
        'For questions regarding these terms and conditions, please get in touch with the team. Contact details will be confirmed by the organizer.',
      ],
      sortOrder: 5,
    },
  ],
  seoTitle: 'Terms & Conditions | Connection Rave',
  seoDescription:
    'Review the current draft terms and conditions for Connection Rave website, tickets, entry and VIP enquiries.',
  finalCta: { title: 'NEED MORE HELP?', primary: CONTACT, secondary: CTA_SECONDARY },
};

export const PRIVACY_DRAFT: LegalDocument = {
  type: 'privacy',
  status: 'draft',
  eyebrow: 'Legal',
  title: 'Privacy Policy',
  intro:
    'This privacy policy is a placeholder for review and will be updated when final data handling details are confirmed.',
  version: null,
  effectiveDate: null,
  updatedAt: null,
  sections: [
    {
      id: 'information-provided',
      navLabel: 'Information Provided',
      title: 'Information Provided',
      paragraphs: [
        'When you use this website, you may choose to provide certain information, such as when you submit an enquiry, request ticket or table information, or contact us directly.',
        'The information you provide may include your name, email address and details you choose to share.',
      ],
      sortOrder: 1,
    },
    {
      id: 'booking-enquiries',
      navLabel: 'Booking Enquiries',
      title: 'Booking Enquiries',
      paragraphs: [
        'If you submit a VIP or booking request, information provided in the form may be used to respond to your enquiry and communicate about availability and next steps.',
      ],
      sortOrder: 2,
    },
    {
      id: 'newsletter',
      navLabel: 'Newsletter',
      title: 'Newsletter',
      paragraphs: [
        'If newsletter subscriptions are enabled, information such as your email address may be used to send event and news updates. Subscription handling will follow the final newsletter provider configuration.',
      ],
      sortOrder: 3,
    },
    {
      id: 'service-providers',
      navLabel: 'Service Providers',
      title: 'Service Providers',
      paragraphs: [
        'The website may use external service providers to support hosting, ticketing, payment, communications or other website functions. Final provider details will be confirmed as integrations are completed.',
      ],
      sortOrder: 4,
    },
    {
      id: 'contact',
      navLabel: 'Contact',
      title: 'Contact',
      paragraphs: [
        'If you have questions about this privacy policy or how information is handled, please contact the team once contact details are finalized.',
      ],
      notice: 'Privacy details are being reviewed and confirmed.',
      sortOrder: 5,
    },
  ],
  seoTitle: 'Privacy Policy | Connection Rave',
  seoDescription:
    'Review the current privacy policy draft for Connection Rave website enquiries, booking requests and communications.',
  finalCta: { title: 'QUESTIONS ABOUT YOUR INFORMATION?', primary: CONTACT, secondary: CTA_SECONDARY },
};
