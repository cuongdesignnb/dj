// Explicit isolated DB opt-in. No production URL, seed/reset, upload or media deletion.
// Owns only the `qa-setup-status` event, its content keys and its tiers.
import { PrismaClient } from '@prisma/client';
const database = new URL(process.env.DATABASE_URL || 'postgresql://localhost/undefined');
if (process.env.GALLERY_QA !== '1' || database.hostname !== 'postgres' || database.pathname !== '/destiny_gallery_qa') throw new Error('Setup status fixtures require the isolated QA compose database.');
const db = new PrismaClient();
const action = process.env.QA_FIXTURE_ACTION;
const slug = 'qa-setup-status';
const kinds = ['tickets', 'tables', 'booking'];
try {
  if (action === 'setup') {
    // A published event with published page copy but no tiers and no packages:
    // the "being prepared" state owners see after creating an event.
    const event = await db.event.upsert({
      where: { slug },
      update: { status: 'PUBLISHED', deletedAt: null },
      create: { slug, status: 'PUBLISHED', venueName: 'QA Hall', city: 'Perth', country: 'Australia', translations: { create: { locale: 'en', title: 'QA Setup Status' } } },
    });
    await db.ticketTier.deleteMany({ where: { eventId: event.id, purchaseItems: { none: {} } } });
    await db.ticketTier.updateMany({ where: { eventId: event.id }, data: { enabled: false } });
    await db.vipPackage.updateMany({ where: { eventId: event.id }, data: { enabled: false } });
    await db.event.update({ where: { id: event.id }, data: { vipEnabled: true, vipBookingEnabled: true, vipAvailabilityMode: 'REQUEST_ONLY', vipSquareEnabled: false, vipDefaultPackageId: null, ticketingEnabled: true, ticketSquareEnabled: false, ticketExternalProviderEnabled: false } });
    // Copy the DESTINY event's published page copy so only tiers/packages are missing.
    const source = await db.event.findUniqueOrThrow({ where: { slug: 'destiny' } });
    for (const kind of kinds) {
      const from = await db.pageContent.findUniqueOrThrow({ where: { key: `${kind}:${source.id}` }, include: { translations: true } });
      const key = `${kind}:${event.id}`;
      await db.pageContent.deleteMany({ where: { key } });
      await db.pageContent.create({ data: { key, status: 'PUBLISHED', translations: { create: from.translations.map((row) => ({ locale: row.locale, contentJson: row.contentJson })) } } });
    }
    console.log(JSON.stringify({ eventId: event.id }));
  } else if (action === 'add-tier') {
    const event = await db.event.findUniqueOrThrow({ where: { slug } });
    await db.ticketTier.create({ data: { eventId: event.id, name: 'QA Setup General', priceMinor: 4500, currency: 'AUD', availabilityStatus: 'AVAILABLE', enabled: true } });
    console.log(JSON.stringify({ ok: true }));
  } else if (action === 'cleanup') {
    const event = await db.event.findUnique({ where: { slug } });
    if (event) {
      await db.pageContent.deleteMany({ where: { key: { in: kinds.map((kind) => `${kind}:${event.id}`) } } });
      await db.event.update({ where: { id: event.id }, data: { status: 'ARCHIVED', deletedAt: new Date(), vipDefaultPackageId: null } });
    }
    console.log(JSON.stringify({ cleaned: Boolean(event) }));
  } else throw new Error('Specify a QA fixture action');
} finally { await db.$disconnect(); }
