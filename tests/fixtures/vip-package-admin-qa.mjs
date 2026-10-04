// Real persistence fixtures, isolated QA compose only. No seed/reset/uploads.
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
const url = new URL(process.env.DATABASE_URL || 'postgresql://localhost/undefined');
if (process.env.GALLERY_QA !== '1' || url.hostname !== 'postgres' || url.pathname !== '/destiny_gallery_qa') throw new Error('VIP package fixtures require the dedicated QA database.');
const db = new PrismaClient();
const action = process.env.QA_FIXTURE_ACTION;
const value = JSON.parse(process.env.QA_FIXTURE_VALUE || '{}');
const packageId = '00000000-0000-0000-0000-000000000001';
const bottleNames = ['Belvedere Vodka', 'Hennessy VS', 'El Jimador Tequila', 'Moët & Chandon', 'Jager', 'WAP Cranberry Peach'];
const eventFields = { id: true, status: true, vipEnabled: true, vipBookingEnabled: true, vipAvailabilityMode: true, vipSquareEnabled: true, vipDefaultPackageId: true };
try {
  const event = await db.event.findUniqueOrThrow({ where: { slug: 'destiny' } });
  const pkg = await db.vipPackage.findUniqueOrThrow({ where: { id: packageId } });
  if (pkg.eventId !== event.id || pkg.name !== 'BOOTH PACKAGE') throw new Error('Stable package must belong to the QA DESTINY event.');
  if (action === 'snapshot') {
    console.log(JSON.stringify({
      event: await db.event.findUnique({ where: { id: event.id }, select: eventFields }),
      packages: await db.vipPackage.findMany({ where: { eventId: event.id }, include: { packageBottles: true } }),
      booths: await db.vipBooth.findMany({ where: { eventId: event.id }, select: { id: true, enabled: true } }),
      bottles: await db.bottleOption.findMany({ select: { id: true, name: true, mediaId: true, enabled: true }, orderBy: { sortOrder: 'asc' } }),
    }));
  } else if (action === 'setup') {
    const bottles = await db.bottleOption.findMany({ where: { name: { in: bottleNames } } });
    if (bottles.length !== 6 || bottles.some((bottle) => !bottle.enabled)) throw new Error('Existing six QA bottle options must be available; no duplicates are seeded.');
    const foreignEventId = randomUUID(), foreignPackageId = randomUUID(), alternativeId = randomUUID();
    await db.$transaction(async (tx) => {
      await tx.event.update({ where: { id: event.id }, data: { status: 'PUBLISHED', vipEnabled: true, vipBookingEnabled: true, vipAvailabilityMode: 'REQUEST_ONLY', vipSquareEnabled: false, vipDefaultPackageId: null } });
      await tx.vipPackage.updateMany({ where: { eventId: event.id }, data: { enabled: false } });
      await tx.vipPackage.update({ where: { id: packageId }, data: { priceMinor: 320000, currency: 'AUD', capacity: 15, includedBottleCount: 3, minBottleSelection: 0, maxBottleSelection: 3, paymentMode: 'REQUEST_ONLY' } });
      await tx.vipBooth.updateMany({ where: { eventId: event.id }, data: { enabled: false } });
      const media = await tx.mediaAsset.findFirst({ where: { deletedAt: null, mimeType: 'image/jpeg', sizeBytes: { gt: 0 } } });
      if (media) await tx.bottleOption.update({ where: { id: bottles[0].id }, data: { mediaId: media.id } });
      // Isolated alternatives prove ownership and no silent fallback. Not production packages.
      const packageData = { name: 'QA HOTFIX ALTERNATIVE', priceMinor: 10000, currency: 'AUD', capacity: 2, includedBottleCount: 0, minBottleSelection: 0, maxBottleSelection: 0, paymentMode: 'REQUEST_ONLY', enabled: false, sortOrder: 999 };
      await tx.vipPackage.create({ data: { ...packageData, id: alternativeId, eventId: event.id } });
      await tx.event.create({ data: { id: foreignEventId, slug: 'qa-vip-owner-' + foreignEventId, status: 'DRAFT', venueName: 'QA', city: 'QA', country: 'QA', translations: { create: { locale: 'en', title: 'QA HOTFIX OWNERSHIP' } } } });
      await tx.vipPackage.create({ data: { ...packageData, id: foreignPackageId, eventId: foreignEventId } });
    });
    console.log(JSON.stringify({ eventId: event.id, packageId, foreignEventId, foreignPackageId, alternativeId, bottleIds: bottles.map((bottle) => bottle.id) }));
  } else if (action === 'inspect') {
    console.log(JSON.stringify({
      pkg: await db.vipPackage.findUnique({ where: { id: packageId }, include: { packageBottles: true } }),
      defaultPackageId: (await db.event.findUnique({ where: { id: event.id } })).vipDefaultPackageId,
      packageCount: await db.vipPackage.count({ where: { eventId: event.id } }),
      bottles: await db.bottleOption.findMany({ select: { id: true, name: true }, orderBy: { sortOrder: 'asc' } }),
      audits: await db.auditLog.findMany({ where: { entityType: 'vip_package', entityId: packageId }, select: { action: true, requestId: true }, orderBy: { createdAt: 'desc' }, take: 10 }),
    }));
  } else if (action === 'restore') {
    if (value.event.id !== event.id || !Array.isArray(value.packages)) throw new Error('Snapshot does not match the QA event.');
    await db.$transaction(async (tx) => {
      const { id, ...data } = value.event;
      await tx.event.update({ where: { id }, data });
      for (const { id: pkgId, eventId: ownerId, packageBottles, ...fields } of value.packages) {
        if (ownerId !== event.id) throw new Error('Wrong snapshot owner.');
        await tx.vipPackage.update({ where: { id: pkgId }, data: fields });
        await tx.vipPackageBottle.deleteMany({ where: { vipPackageId: pkgId } });
        if (packageBottles.length) await tx.vipPackageBottle.createMany({ data: packageBottles });
      }
      for (const booth of value.booths) await tx.vipBooth.update({ where: { id: booth.id }, data: { enabled: booth.enabled } });
      for (const bottle of value.bottles) await tx.bottleOption.update({ where: { id: bottle.id }, data: { enabled: bottle.enabled, mediaId: bottle.mediaId } });
      // Clean only package rows created by this run, never originals/global bottles/media.
      if (value.created) {
        const ids = [value.created.alternativeId, value.created.foreignPackageId];
        const referenced = await tx.bookingRequest.count({ where: { vipPackageId: { in: ids } } }) + await tx.vipBooking.count({ where: { vipPackageId: { in: ids } } });
        if (!referenced) await tx.vipPackage.deleteMany({ where: { id: { in: ids }, name: 'QA HOTFIX ALTERNATIVE', eventId: { in: [event.id, value.created.foreignEventId] } } });
        else await tx.vipPackage.updateMany({ where: { id: { in: ids }, name: 'QA HOTFIX ALTERNATIVE' }, data: { enabled: false } });
        await tx.event.update({ where: { id: value.created.foreignEventId }, data: { status: 'ARCHIVED' } });
      }
    });
    console.log(JSON.stringify({ restored: true }));
  } else throw new Error('Specify snapshot/setup/inspect/restore.');
} finally { await db.$disconnect(); }
