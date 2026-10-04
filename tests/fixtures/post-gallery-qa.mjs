// Explicit isolated DB opt-in. No production URL, seed/reset, upload or media deletion.
import { PrismaClient } from '@prisma/client';
const database = new URL(process.env.DATABASE_URL || 'postgresql://localhost/undefined');
if (process.env.GALLERY_QA !== '1' || database.hostname !== 'postgres' || database.pathname !== '/destiny_gallery_qa') throw new Error('Post-Gallery fixtures require the isolated QA compose database.');
const db = new PrismaClient();
const action = process.env.QA_FIXTURE_ACTION;
const value = JSON.parse(process.env.QA_FIXTURE_VALUE || '{}');
const eventFields = { id: true, status: true, vipEnabled: true, vipBookingEnabled: true, vipAvailabilityMode: true, vipSquareEnabled: true, ticketingEnabled: true, ticketSaleStatus: true, ticketSquareEnabled: true };
try {
  const event = await db.event.findUniqueOrThrow({ where: { slug: 'destiny' } });
  if (action === 'snapshot') {
    console.log(JSON.stringify({
      event: await db.event.findUnique({ where: { id: event.id }, select: eventFields }),
      packages: await db.vipPackage.findMany({ where: { eventId: event.id }, select: { id: true, enabled: true, priceMinor: true } }),
      booths: await db.vipBooth.findMany({ where: { eventId: event.id }, select: { id: true, enabled: true, requestable: true, availabilityStatus: true } }),
      tiers: await db.ticketTier.findMany({ where: { eventId: event.id }, select: { id: true, enabled: true } }),
    }));
  } else if (action === 'state') {
    const mode = value.mode;
    if (!['vip-disabled', 'booking-disabled', 'no-active-package', 'no-booths', 'no-availability', 'ready', 'invalid-response', 'service-unavailable'].includes(mode)) throw new Error('Unknown fixture state');
    await db.$transaction(async (tx) => {
      await tx.event.update({ where: { id: event.id }, data: { status: mode === 'service-unavailable' ? 'DRAFT' : 'PUBLISHED', vipEnabled: mode !== 'vip-disabled', vipBookingEnabled: mode !== 'booking-disabled', vipAvailabilityMode: 'REQUEST_ONLY', vipSquareEnabled: false, ticketingEnabled: true, ticketSaleStatus: 'COMING_SOON', ticketSquareEnabled: false } });
      await tx.vipPackage.updateMany({ where: { eventId: event.id }, data: { enabled: !['vip-disabled', 'no-active-package'].includes(mode), priceMinor: mode === 'invalid-response' ? -1 : 320000 } });
      await tx.vipBooth.updateMany({ where: { eventId: event.id }, data: { enabled: !['vip-disabled', 'no-booths'].includes(mode), requestable: true, availabilityStatus: mode === 'no-availability' ? 'NOT_AVAILABLE' : 'AVAILABLE' } });
      await tx.ticketTier.updateMany({ where: { eventId: event.id }, data: { enabled: false } });
    });
    console.log(JSON.stringify({ eventId: event.id, mode }));
  } else if (action === 'restore') {
    await db.$transaction(async (tx) => {
      const { id, ...data } = value.event;
      if (id !== event.id) throw new Error('Snapshot does not match QA event');
      await tx.event.update({ where: { id }, data });
      for (const [model, rows] of [['vipPackage', value.packages], ['vipBooth', value.booths], ['ticketTier', value.tiers]]) {
        for (const { id: rowId, ...fields } of rows) await tx[model].update({ where: { id: rowId }, data: fields });
      }
    });
    console.log(JSON.stringify({ restored: true }));
  } else if (action === 'linked-event') {
    if (!['DRAFT', 'PUBLISHED', 'ARCHIVED', 'DELETED'].includes(value.status)) throw new Error('Invalid linked fixture status');
    const row = await db.event.upsert({
      where: { slug: 'qa-post-gallery-event' },
      update: { status: value.status === 'DELETED' ? 'PUBLISHED' : value.status, deletedAt: value.status === 'DELETED' ? new Date() : null },
      create: { slug: 'qa-post-gallery-event', status: 'PUBLISHED', venueName: 'QA venue', city: 'QA', country: 'QA', translations: { create: { locale: 'en', title: 'QA linked event' } } },
    });
    if (value.status !== 'PUBLISHED') await db.event.update({ where: { id: row.id }, data: { status: value.status === 'DELETED' ? 'PUBLISHED' : value.status, deletedAt: value.status === 'DELETED' ? new Date() : null } });
    console.log(JSON.stringify({ id: row.id }));
  } else if (action === 'booking-count') {
    console.log(JSON.stringify({ count: await db.bookingRequest.count({ where: { email: value.email } }), requests: await db.bookingRequest.findMany({ where: { email: value.email }, select: { status: true, preferredBoothId: true, vipPackageId: true, bottles: { select: { bottleOptionId: true } } } }) }));
  } else throw new Error('Specify a QA fixture action');
} finally { await db.$disconnect(); }
