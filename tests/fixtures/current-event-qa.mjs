// Explicit isolated DB opt-in. No production URL, seed/reset, upload or media deletion.
// Owns only the qa-current, qa-past and qa-auto-past events.
import { PrismaClient } from '@prisma/client';
const database = new URL(process.env.DATABASE_URL || 'postgresql://localhost/undefined');
if (process.env.GALLERY_QA !== '1' || database.hostname !== 'postgres' || database.pathname !== '/destiny_gallery_qa') throw new Error('Current event fixtures require the isolated QA compose database.');
const db = new PrismaClient();
const action = process.env.QA_FIXTURE_ACTION;
const day = 24 * 60 * 60 * 1000;
const EVENTS = [
  // Upcoming, sold only through an external provider, no tiers on the site.
  { slug: 'qa-current', title: 'QA Current Event', lifecycleStatus: 'UPCOMING', startAt: new Date(Date.now() + 20 * day), provider: true },
  // Marked Past in Admin.
  { slug: 'qa-past', title: 'QA Past Event', lifecycleStatus: 'PAST', startAt: new Date(Date.now() - 30 * day) },
  // Never marked, but its date is over.
  { slug: 'qa-auto-past', title: 'QA Auto Past Event', lifecycleStatus: 'UPCOMING', startAt: new Date(Date.now() - 3 * day) },
];
try {
  if (action === 'setup') {
    const ids = {};
    for (const e of EVENTS) {
      const data = {
        status: 'PUBLISHED', deletedAt: null, lifecycleStatus: e.lifecycleStatus, startAt: e.startAt, endAt: null, dateStatus: 'CONFIRMED', featured: false,
        ticketingEnabled: true, ticketSquareEnabled: false,
        ticketExternalProviderEnabled: Boolean(e.provider), ticketProviderName: e.provider ? 'TicketsCandy' : null, ticketProviderUrl: e.provider ? 'https://ticketscandy.com/e/qa-current-test' : null,
      };
      const event = await db.event.upsert({ where: { slug: e.slug }, update: data, create: { slug: e.slug, venueName: 'QA Club', city: 'Perth', country: 'Australia', ...data, translations: { create: { locale: 'en', title: e.title } } } });
      await db.eventTranslation.updateMany({ where: { eventId: event.id }, data: { title: e.title } });
      await db.ticketTier.updateMany({ where: { eventId: event.id }, data: { enabled: false } });
      ids[e.slug] = event.id;
    }
    // Tickets page copy, borrowed from DESTINY, so only the tiers/provider differ.
    const destiny = await db.event.findUniqueOrThrow({ where: { slug: 'destiny' } });
    const from = await db.pageContent.findUnique({ where: { key: `tickets:${destiny.id}` }, include: { translations: true } });
    if (from) {
      const key = `tickets:${ids['qa-current']}`;
      await db.pageContent.deleteMany({ where: { key } });
      await db.pageContent.create({ data: { key, status: 'PUBLISHED', translations: { create: from.translations.map((row) => ({ locale: row.locale, contentJson: row.contentJson })) } } });
    }
    console.log(JSON.stringify(ids));
  } else if (action === 'add-direct-tier') {
    // A tier sold on this site (Square checkout) next to the TicketsCandy link.
    const event = await db.event.findUniqueOrThrow({ where: { slug: 'qa-current' } });
    const tier = await db.ticketTier.findFirst({ where: { eventId: event.id, name: 'QA Direct General' } })
      ?? await db.ticketTier.create({ data: { eventId: event.id, name: 'QA Direct General', priceMinor: 5500, currency: 'AUD', availabilityStatus: 'AVAILABLE' } });
    await db.ticketTier.update({ where: { id: tier.id }, data: { enabled: true, purchasableOnline: true, availabilityStatus: 'AVAILABLE' } });
    console.log(JSON.stringify({ tierId: tier.id }));
  } else if (action === 'cleanup') {
    for (const e of EVENTS) {
      const event = await db.event.findUnique({ where: { slug: e.slug } });
      if (!event) continue;
      await db.pageContent.deleteMany({ where: { key: { in: ['tickets', 'tables', 'booking'].map((kind) => `${kind}:${event.id}`) } } });
      await db.event.update({ where: { id: event.id }, data: { status: 'ARCHIVED', deletedAt: new Date() } });
    }
    console.log(JSON.stringify({ cleaned: true }));
  } else throw new Error('Specify a QA fixture action');
} finally { await db.$disconnect(); }
