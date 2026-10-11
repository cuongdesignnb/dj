// Explicit isolated DB opt-in. No production URL, seed/reset, upload or media deletion.
// Owns only the `qa-multi-event` event and its own content keys, package, tier and requests.
import { PrismaClient } from '@prisma/client';
const database = new URL(process.env.DATABASE_URL || 'postgresql://localhost/undefined');
if (process.env.GALLERY_QA !== '1' || database.hostname !== 'postgres' || database.pathname !== '/destiny_gallery_qa') throw new Error('Event content fixtures require the isolated QA compose database.');
const db = new PrismaClient();
const action = process.env.QA_FIXTURE_ACTION;
const value = JSON.parse(process.env.QA_FIXTURE_VALUE || '{}');
const slug = 'qa-multi-event';
const keys = (eventId) => ['tickets', 'tables', 'booking'].map((kind) => `${kind}:${eventId}`);
try {
  if (action === 'setup') {
    const event = await db.event.upsert({
      where: { slug },
      update: { status: 'PUBLISHED', deletedAt: null },
      create: { slug, status: 'PUBLISHED', venueName: 'QA Hall', city: 'Perth', country: 'Australia', translations: { create: { locale: 'en', title: 'QA Multi Event' } } },
    });
    // Start every run from "created in Admin after seeding": no content rows and no copy.
    await db.pageContent.deleteMany({ where: { key: { in: keys(event.id) } } });
    await db.eventTranslation.updateMany({ where: { eventId: event.id }, data: { shortDescription: null, description: null } });
    const pkg = await db.vipPackage.findFirst({ where: { eventId: event.id, name: 'QA Multi Package' } })
      ?? await db.vipPackage.create({ data: { eventId: event.id, name: 'QA Multi Package', priceMinor: 150000, currency: 'AUD', capacity: 10, includedBottleCount: 0, minBottleSelection: 0, maxBottleSelection: 0, paymentMode: 'REQUEST_ONLY' } });
    await db.vipPackage.update({ where: { id: pkg.id }, data: { enabled: true, priceMinor: 150000, paymentMode: 'REQUEST_ONLY' } });
    const tier = await db.ticketTier.findFirst({ where: { eventId: event.id, name: 'QA Multi General' } })
      ?? await db.ticketTier.create({ data: { eventId: event.id, name: 'QA Multi General', priceMinor: 4500, currency: 'AUD', availabilityStatus: 'AVAILABLE' } });
    await db.ticketTier.update({ where: { id: tier.id }, data: { enabled: true } });
    await db.event.update({ where: { id: event.id }, data: { vipEnabled: true, vipBookingEnabled: true, vipAvailabilityMode: 'REQUEST_ONLY', vipSquareEnabled: false, vipDefaultPackageId: pkg.id, ticketingEnabled: true, ticketSaleStatus: 'COMING_SOON', ticketSquareEnabled: false, ticketExternalProviderEnabled: false } });
    console.log(JSON.stringify({ eventId: event.id, packageId: pkg.id }));
  } else if (action === 'content') {
    const event = await db.event.findUniqueOrThrow({ where: { slug } });
    const rows = await db.pageContent.findMany({ where: { key: { in: keys(event.id) } }, select: { key: true, status: true, translations: { select: { locale: true, contentJson: true } } } });
    const audits = await db.auditLog.findMany({ where: { entityType: 'page_content', entityId: { in: (await db.pageContent.findMany({ where: { key: { in: keys(event.id) } }, select: { id: true } })).map((row) => row.id) } }, select: { action: true } });
    console.log(JSON.stringify({ rows, audits }));
  } else if (action === 'count-content') {
    console.log(JSON.stringify({ count: await db.pageContent.count({ where: { key: value.key } }) }));
  } else if (action === 'bookings') {
    console.log(JSON.stringify({ requests: await db.bookingRequest.findMany({ where: { email: value.email }, select: { eventId: true, status: true, vipPackageId: true } }) }));
  } else if (action === 'cleanup') {
    const event = await db.event.findUnique({ where: { slug } });
    if (event) {
      await db.bookingRequest.deleteMany({ where: { eventId: event.id, email: { endsWith: '@example.test' } } });
      await db.pageContent.deleteMany({ where: { key: { in: keys(event.id) } } });
      await db.event.update({ where: { id: event.id }, data: { status: 'ARCHIVED', deletedAt: new Date(), vipDefaultPackageId: null } });
    }
    console.log(JSON.stringify({ cleaned: Boolean(event) }));
  } else throw new Error('Specify a QA fixture action');
} finally { await db.$disconnect(); }
