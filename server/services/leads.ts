import 'server-only';
import { db } from '@/server/db/client';
import { conflict, notFound, validationError } from '@/server/errors';
import type { z } from 'zod';
import { bookingSchema, contactSchema, newsletterSchema } from '@/server/validators/api';

type BookingInput = z.infer<typeof bookingSchema>;
type ContactInput = z.infer<typeof contactSchema>;
type NewsletterInput = z.infer<typeof newsletterSchema>;

export async function createBooking(input: BookingInput) {
  const eventLookup = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.eventId)
    ? { id: input.eventId }
    : { slug: input.eventId };
  const event = await db.event.findFirst({ where: { ...eventLookup, status: 'PUBLISHED', deletedAt: null }, include: { vipPackages: true, vipBooths: true } });
  if (!event) throw notFound('Event not found.');
  if (!event.vipEnabled || !event.vipBookingEnabled) throw conflict('VIP booking requests are not available yet.');

  const vipPackage = event.vipPackages.find((row) => row.id === input.vipPackageId && row.enabled);
  if (!vipPackage) throw validationError({ vipPackageId: 'Select an active VIP package for this event.' });
  const allowBoothlessRequest = event.vipAvailabilityMode === 'REQUEST_ONLY' && vipPackage.paymentMode === 'REQUEST_ONLY';
  if (!input.preferredBoothId && !allowBoothlessRequest) throw validationError({ preferredBoothId: 'Select an available booth for this event.' });
  const booth = input.preferredBoothId ? event.vipBooths.find((row) => row.id === input.preferredBoothId && row.enabled && row.requestable && row.availabilityStatus === 'AVAILABLE') : null;
  if (input.preferredBoothId && !booth) throw validationError({ preferredBoothId: 'Select an available booth for this event.' });
  if (vipPackage && input.groupSize > vipPackage.capacity) throw validationError({ groupSize: `This package supports up to ${vipPackage.capacity} people.` });

  const bottles = input.bottleIds.length
    ? await db.bottleOption.findMany({ where: { id: { in: input.bottleIds }, enabled: true } })
    : [];
  if (bottles.length !== input.bottleIds.length) throw validationError({ bottleIds: 'One or more bottle options are invalid.' });
  if (vipPackage) {
    const allowed = await db.vipPackageBottle.findMany({ where: { vipPackageId: vipPackage.id, bottleOptionId: { in: input.bottleIds } } });
    if (allowed.length !== input.bottleIds.length) throw validationError({ bottleIds: 'One or more bottles are not available for this package.' });
    if (input.bottleIds.length < vipPackage.minBottleSelection || input.bottleIds.length > Math.min(vipPackage.maxBottleSelection, vipPackage.includedBottleCount)) throw validationError({ bottleIds: `Select between ${vipPackage.minBottleSelection} and ${Math.min(vipPackage.maxBottleSelection, vipPackage.includedBottleCount)} bottles.` });
  }

  return db.$transaction(async (tx) => {
    const request = await tx.bookingRequest.create({
      data: {
        eventId: event.id,
        vipPackageId: vipPackage?.id,
        preferredBoothId: booth?.id,
        fullName: input.fullName,
        email: input.email.toLowerCase(),
        phone: input.phone ?? null,
        groupSize: input.groupSize,
        specialRequests: input.specialRequests ?? null,
        status: 'RECEIVED',
        notificationStatus: 'PENDING',
        bottles: input.bottleIds.length ? { create: input.bottleIds.map((bottleOptionId) => ({ bottleOptionId })) } : undefined,
      },
      select: { id: true, status: true, createdAt: true },
    });
    return { id: request.id, status: request.status, receivedAt: request.createdAt.toISOString() };
  });
}

export async function createContact(input: ContactInput) {
  const row = await db.contactMessage.create({ data: { fullName: input.fullName, email: input.email.toLowerCase(), phone: input.phone ?? null, enquiryType: input.enquiryType ?? null, message: input.message, status: 'NEW', notificationStatus: 'PENDING' }, select: { id: true, createdAt: true } });
  return { id: row.id, receivedAt: row.createdAt.toISOString() };
}

export async function subscribeNewsletter(input: NewsletterInput) {
  const email = input.email.toLowerCase();
  const row = await db.newsletterSubscriber.upsert({
    where: { email },
    update: { locale: input.locale, status: 'SUBSCRIBED', source: input.source ?? null, unsubscribedAt: null, providerSyncStatus: 'PENDING' },
    create: { email, locale: input.locale, source: input.source ?? null, status: 'SUBSCRIBED', providerSyncStatus: 'PENDING' },
    select: { id: true, email: true, status: true },
  });
  return row;
}
