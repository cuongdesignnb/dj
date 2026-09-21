import type { Prisma } from '@prisma/client';
import type { SeedContext } from './context';

const media = (src: string, alt: string) => ({ src, alt });
const action = (label: string, href: string) => ({ label, href });
const seo = (title: string, description: string) => ({ title, description, ogImage: null, index: true, follow: true });

const ticketContent = {
  hero: { breadcrumb: 'Ticket', eyebrow: 'DESTINY Experience', title: 'CHOOSE YOUR TICKET', description: 'Secure your entry to the DESTINY experience. Music, people and culture come together for a night of pure connection.', image: media('/assets/hero-crowd.jpg', 'Crowd with raised hands in front of a circular stage light under red lasers'), sideNotes: ['MUSIC', 'PEOPLE', 'CULTURE', 'A BRIGHTER TOMORROW'], footNotes: [] },
  selector: { eyebrow: 'Ticket Options', title: 'Ticket Options', description: 'Choose the option that fits your night.', aside: 'Same People — Brighter Tomorrow', emptyTitle: 'Ticket information is being prepared.', emptyDescription: 'Please check back for the latest release details.' },
  trustItems: [], infoItems: [], faq: [],
  provider: { unavailableNote: 'Ticket provider link will be published when confirmed by the organiser.' },
  finalCta: { title: 'STAY CONNECTED', subtitle: 'Ticket release details will be published here.', primary: action('View event', '/event'), secondary: action('Contact us', '/contact'), background: null },
  footer: { email: null, phone: null, legalTermsHref: '/terms', legalPrivacyHref: '/privacy' },
  seo: seo('Tickets | Connection Rave', 'Ticket information for Connection Rave.'),
};

const tablesContent = {
  hero: { breadcrumb: 'Table', eyebrow: 'VIP Tables', titleLine1: 'YOUR NIGHT.', titleLine2: 'YOUR BOOTH.', description: 'An elevated VIP experience with premium booths, bottle service and the best views in the house.', image: media('/assets/hero-crowd.jpg', 'VIP experience at Connection Rave'), sideNotes: ['PEOPLE', 'MUSIC', 'CULTURE', 'FOREVER'], footNotes: ['VIP MUSIC ENERGY', 'A BRIGHTER TOMORROW'] },
  map: { eyebrow: 'Club Map', title: 'Choose your view', description: 'Explore the illustrative club map and tell us which area you prefer.', disclaimer: 'Booth positions are indicative. A request is not a reservation.', stageLabel: 'STAGE', background: null },
  infoTitle: 'VIP Information', infoContext: 'Same People — Brighter Tomorrow', faqContext: 'Get The Answers — VIP Ready',
  infoItems: [], faq: [],
  finalCta: { title: 'BOOK YOUR EXPERIENCE', subtitle: 'Share your preferred setup and the team will confirm availability.', primary: action('Request a booth', '/book-now'), secondary: action('View events', '/events'), background: null },
  seo: seo('VIP Tables | Connection Rave', 'Review VIP table and bottle information.'),
};

const bookingContent = {
  hero: { breadcrumb: 'Booked Now', eyebrow: 'Booking Request', titleLine1: 'BOOK YOUR', titleLine2: 'EXPERIENCE', description: 'Submit your details and preferred VIP setup. Our team will review your request and confirm availability directly.', image: media('/assets/hero-crowd.jpg', 'VIP booking experience at Connection Rave'), sideNotes: ['PEOPLE', 'MUSIC', 'CULTURE', 'FOREVER'], footNotes: ['A BRIGHTER', 'TOMORROW TOGETHER'] },
  tabs: { tickets: 'Tickets', vip: 'VIP Table' },
  form: { heading: 'Tell us about your night', description: 'We will use these details to prepare your VIP booking request.', nameLabel: 'Full name', emailLabel: 'Email', phoneLabel: 'Phone', groupSizeLabel: 'Group size', boothLabel: 'Preferred booth', bottleLabel: 'Bottle options', specialRequestLabel: 'Special requests', submitLabel: 'Send booking request' },
  bookingNotes: [], notesTitle: 'Booking Notes', notesContext: 'Good To Know', processSteps: [], faq: [], faqContext: 'Get The Answers — VIP Ready',
  finalCta: { title: 'STAY CONNECTED', subtitle: 'Explore the latest Connection Rave events.', primary: action('View events', '/events'), secondary: action('Contact us', '/contact'), background: null },
  seo: seo('VIP Booking Request | Connection Rave', 'Send a VIP table booking request.'),
};

const listing = (title: string, description: string, ctaLabel: string, ctaHref: string) => ({
  hero: { breadcrumb: title, eyebrow: title, title, description, image: null, sideNotes: [], footNotes: [], primary: action(ctaLabel, ctaHref), secondary: action('Explore events', '/events') },
  filters: [], sections: [{ key: 'benefits', title: title === 'Past Events' ? 'WHY OUR NIGHTS LAST' : 'WHY ATTEND OUR EVENTS', description: 'Music | People | Culture | A Brighter Tomorrow', enabled: true }], emptyState: { title: 'Nothing to show yet.', description: 'Check back for the latest updates.', cta: action('Back home', '/') },
  finalCta: { title: ctaLabel, subtitle: description, primary: action(ctaLabel, ctaHref), background: null },
  seo: seo(`${title} | Connection Rave`, description),
});

const globalContent = {
  tagline: 'Sound Meets Soul', footerDescription: 'Uniting music, energy and people for unforgettable experiences.', ageNotice: '18+ event. Please bring valid identification.', genericCtaFallback: action('Explore events', '/events'), copyright: '© Connection Rave. All Rights Reserved.', emptyCopy: 'Nothing to show yet.', seo: seo('Connection Rave', 'Sound Meets Soul.'),
};

async function seedPageContent(db: SeedContext['db'], key: string, data: Prisma.InputJsonValue) {
  const existing = await db.pageContent.findUnique({ where: { key } });
  if (existing) return existing;
  return db.pageContent.create({ data: { key, status: 'PUBLISHED', translations: { create: [{ locale: 'en', contentJson: data }, { locale: 'vi', contentJson: data }] } } });
}

export async function seedCms({ db }: SeedContext, eventId: string) {
  await seedPageContent(db, `tickets:${eventId}`, ticketContent as Prisma.InputJsonValue);
  await seedPageContent(db, `tables:${eventId}`, tablesContent as Prisma.InputJsonValue);
  await seedPageContent(db, `booking:${eventId}`, bookingContent as Prisma.InputJsonValue);
  await seedPageContent(db, 'events-list', listing('Events', 'Discover the next Connection Rave experiences.', 'View lineup', '/lineup') as Prisma.InputJsonValue);
  await seedPageContent(db, 'past-events', listing('Past Events', 'Relive previous Connection Rave moments.', 'Explore gallery', '/gallery') as Prisma.InputJsonValue);
  await seedPageContent(db, 'lineup-list', listing('Lineup', 'Meet the artists shaping the night.', 'View events', '/events') as Prisma.InputJsonValue);
  await seedPageContent(db, 'news-list', listing('News', 'Stories, announcements and updates from Connection Rave.', 'Explore events', '/events') as Prisma.InputJsonValue);
  await seedPageContent(db, 'gallery-list', listing('Gallery', 'Moments from the Connection Rave community.', 'View events', '/events') as Prisma.InputJsonValue);
  await seedPageContent(db, 'shop-list', listing('Shop', 'Connection Rave merchandise and collectibles.', 'View events', '/events') as Prisma.InputJsonValue);
  await seedPageContent(db, 'global-content', globalContent as Prisma.InputJsonValue);

  const menus = [
    { name: 'Main Navigation', key: 'main-navigation', locations: ['HEADER_PRIMARY', 'MOBILE_PRIMARY'], items: [['Home', 'home'], ['Events', 'events'], ['Tickets', 'tickets'], ['VIP Tables', 'tables'], ['Book Now', 'book-now']] },
    { name: 'Header CTA', key: 'header-cta', locations: ['HEADER_CTA'], items: [['Get Tickets', 'tickets']] },
    { name: 'Footer Quick Links', key: 'footer-quick', locations: ['FOOTER_QUICK'], items: [['Home', 'home'], ['Events', 'events'], ['Tickets', 'tickets'], ['VIP Tables', 'tables'], ['Book Now', 'book-now'], ['Gallery', 'gallery']] },
    { name: 'Footer Legal Links', key: 'footer-legal', locations: ['FOOTER_LEGAL'], items: [['FAQ', 'faq'], ['Contact', 'contact'], ['Terms', 'terms'], ['Privacy', 'privacy']] },
    { name: 'Footer Secondary', key: 'footer-secondary', locations: ['FOOTER_SECONDARY'], items: [['About', 'about'], ['Partners', 'partners'], ['News', 'news'], ['Shop', 'shop']] },
  ] as const;
  for (const definition of menus) {
    let menu = await db.menu.findUnique({ where: { key: definition.key } });
    if (!menu) {
      menu = await db.menu.create({ data: { name: definition.name, key: definition.key, status: 'PUBLISHED', items: { create: definition.items.map(([labelEn, routeKey], sortOrder) => ({ labelEn, itemType: 'INTERNAL_ROUTE', routeKey, sortOrder, enabled: true })) } } });
    }
    for (const locationKey of definition.locations) {
      const assigned = await db.menuLocation.findUnique({ where: { locationKey: locationKey as any } });
      if (!assigned) await db.menuLocation.create({ data: { locationKey: locationKey as any, menuId: menu.id } });
    }
  }
}
