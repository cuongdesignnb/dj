import 'server-only';

import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import type * as Square from 'square';
import { db } from '@/server/db/client';
import { runtimeConfig } from '@/server/config';
import { ApiError, conflict, notFound, validationError } from '@/server/errors';
import { createSquareOrder } from '@/server/integrations/square/orders';
import { createSquarePayment, getSquarePayment, squarePaymentStatus } from '@/server/integrations/square/payments';
import { squareLocationId } from '@/server/integrations/square/config';
import { finalizeCompletedPayment } from './finalizer';

type CheckoutLineInput = { productId: string; variantId?: string | null; quantity: number };

export type MerchandiseCheckoutInput = {
  items: CheckoutLineInput[];
  promoCode?: string | null;
  customerEmail?: string | null;
  clientReference?: string;
};

export type TicketCheckoutInput = {
  eventId: string;
  customerName: string;
  customerEmail: string;
  items: Array<{ ticketTierId: string; quantity: number }>;
  clientReference?: string;
};

export type VipCheckoutInput = {
  eventId: string;
  vipPackageId: string;
  boothId?: string | null;
  customerName: string;
  customerEmail: string;
  phone?: string | null;
  groupSize: number;
  clientReference?: string;
};

function holdUntil() {
  const minutes = runtimeConfig().checkoutHoldMinutes;
  return new Date(Date.now() + minutes * 60_000);
}

function cleanKey(value: string) {
  return value.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 45) || randomUUID().replaceAll('-', '').slice(0, 45);
}

function paymentStatusToLocal(status: string) {
  if (status === 'COMPLETED') return 'COMPLETED' as const;
  if (status === 'APPROVED') return 'APPROVED' as const;
  if (status === 'FAILED') return 'FAILED' as const;
  if (status === 'CANCELLED') return 'CANCELLED' as const;
  return 'PENDING' as const;
}

export async function createMerchandiseCheckoutIntent(input: MerchandiseCheckoutInput) {
  const existing = input.clientReference
    ? await db.order.findUnique({ where: { clientReference: input.clientReference }, include: { checkoutIntent: true } })
    : null;
  if (existing?.checkoutIntent) return publicIntent(existing.checkoutIntent.id);

  const products = await db.product.findMany({
    where: { id: { in: input.items.map((item) => item.productId) }, status: 'PUBLISHED', deletedAt: null },
    include: { translations: true, variants: true, images: { orderBy: { sortOrder: 'asc' }, include: { media: true } } },
  });
  const byId = new Map(products.map((product) => [product.id, product]));
  const lineItems: Array<{ productId: string; variantId: string | null; title: string; image: string | null; unitPrice: number; quantity: number; lineTotal: number }> = [];
  for (const item of input.items) {
    const product = byId.get(item.productId);
    if (!product) throw validationError({ items: 'A product is unavailable.' });
    const variant = item.variantId ? product.variants.find((row) => row.id === item.variantId && row.enabled) : null;
    if (item.variantId && !variant) throw validationError({ items: 'A selected variant is unavailable.' });
    if (product.stockTracking === 'TRACKED' && variant?.stockQuantity != null && variant.stockQuantity < item.quantity) {
      throw validationError({ items: 'A selected item is out of stock.' });
    }
    const price = variant?.priceMinor ?? product.basePriceMinor;
    const title = product.translations.find((row) => row.locale === 'en')?.title ?? product.slug;
    lineItems.push({ productId: product.id, variantId: variant?.id ?? null, title, image: product.images[0]?.media?.publicUrl ?? null, unitPrice: price, quantity: item.quantity, lineTotal: price * item.quantity });
  }
  const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const now = new Date();
  const discount = input.promoCode
    ? await db.discount.findFirst({ where: { code: input.promoCode.toUpperCase(), active: true, OR: [{ startsAt: null }, { startsAt: { lte: now } }], AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }] } })
    : null;
  const discountMinor = discount && (!discount.minimumSubtotalMinor || subtotal >= discount.minimumSubtotalMinor)
    ? discount.type === 'PERCENTAGE' && discount.percentage
      ? Math.floor(subtotal * Number(discount.percentage) / 100)
      : Math.min(subtotal, discount.valueMinor ?? 0)
    : 0;
  const total = subtotal - discountMinor;
  const intent = await db.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        orderNumber: `DR-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}`,
        clientReference: input.clientReference ?? null,
        customerEmail: input.customerEmail?.toLowerCase() ?? null,
        subtotalMinor: subtotal,
        discountMinor,
        totalMinor: total,
        currency: 'AUD',
        discountId: discount?.id ?? null,
        items: { create: lineItems.map((item) => ({ productId: item.productId, variantId: item.variantId, titleSnapshot: item.title, imageUrlSnapshot: item.image, unitPriceMinor: item.unitPrice, quantity: item.quantity, lineTotalMinor: item.lineTotal })) },
      },
    });
    return tx.checkoutIntent.create({ data: { kind: 'MERCHANDISE', amountMinor: total, currency: 'AUD', customerEmail: input.customerEmail?.toLowerCase() ?? null, clientReference: input.clientReference ?? null, expiresAt: holdUntil(), orderId: order.id } });
  });
  return publicIntent(intent.id);
}

export async function createTicketCheckoutIntent(input: TicketCheckoutInput) {
  const event = await db.event.findUnique({ where: { id: input.eventId }, include: { ticketTiers: true } });
  if (!event) throw notFound('Event not found.');
  const tierById = new Map(event.ticketTiers.map((tier) => [tier.id, tier]));
  const priced = input.items.map((item) => {
    const tier = tierById.get(item.ticketTierId);
    if (!tier || !tier.enabled || !tier.purchasableOnline || tier.availabilityStatus !== 'AVAILABLE') throw validationError({ items: 'A selected ticket tier is unavailable.' });
    return { tier, quantity: item.quantity, lineTotal: tier.priceMinor * item.quantity };
  });
  const total = priced.reduce((sum, row) => sum + row.lineTotal, 0);
  const expiresAt = holdUntil();
  const purchase = await db.$transaction(async (tx) => {
    for (const row of priced) {
      if (row.tier.capacity != null) {
        const held = await tx.ticketHold.aggregate({ _sum: { quantity: true }, where: { ticketTierId: row.tier.id, status: 'ACTIVE', expiresAt: { gt: new Date() } } });
        if (row.tier.soldQuantity + (held._sum.quantity ?? 0) + row.quantity > row.tier.capacity) throw conflict('The selected ticket tier no longer has enough availability.');
      }
    }
    const created = await tx.ticketPurchase.create({ data: { eventId: input.eventId, customerName: input.customerName, customerEmail: input.customerEmail.toLowerCase(), totalMinor: total, currency: priced[0]?.tier.currency ?? 'AUD', expiresAt, items: { create: priced.map((row) => ({ ticketTierId: row.tier.id, quantity: row.quantity, unitPriceMinor: row.tier.priceMinor, lineTotalMinor: row.lineTotal })) }, holds: { create: priced.map((row) => ({ ticketTierId: row.tier.id, quantity: row.quantity, expiresAt })) } } });
    return tx.checkoutIntent.create({ data: { kind: 'TICKET', amountMinor: total, currency: priced[0]?.tier.currency ?? 'AUD', customerEmail: input.customerEmail.toLowerCase(), clientReference: input.clientReference ?? null, expiresAt, ticketPurchaseId: created.id } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  return publicIntent(purchase.id);
}

export async function createVipCheckoutIntent(input: VipCheckoutInput) {
  const pkg = await db.vipPackage.findFirst({ where: { id: input.vipPackageId, eventId: input.eventId, enabled: true } });
  if (!pkg) throw notFound('VIP package not found.');
  if (pkg.paymentMode === 'REQUEST_ONLY') throw conflict('This VIP package is request-only.');
  if (input.groupSize > pkg.capacity) throw validationError({ groupSize: 'Group size exceeds package capacity.' });
  const amountDue = pkg.paymentMode === 'DEPOSIT' ? pkg.depositAmountMinor : pkg.priceMinor;
  if (!amountDue || amountDue <= 0) throw conflict('This VIP package has no payable amount configured.');
  const expiresAt = holdUntil();
  const booking = await db.$transaction(async (tx) => {
    if (input.boothId) {
      const booth = await tx.vipBooth.findFirst({ where: { id: input.boothId, eventId: input.eventId, requestable: true, availabilityStatus: 'AVAILABLE' } });
      if (!booth) throw conflict('The selected VIP booth is not available.');
      const held = await tx.vipBoothHold.findFirst({ where: { boothId: booth.id, status: 'ACTIVE', expiresAt: { gt: new Date() } } });
      if (held) throw conflict('The selected VIP booth is temporarily held by another guest.');
    }
    const created = await tx.vipBooking.create({ data: { eventId: input.eventId, vipPackageId: input.vipPackageId, boothId: input.boothId ?? null, customerName: input.customerName, customerEmail: input.customerEmail.toLowerCase(), phone: input.phone ?? null, groupSize: input.groupSize, totalMinor: pkg.priceMinor, amountDueMinor: amountDue, currency: pkg.currency, expiresAt, ...(input.boothId ? { hold: { create: { boothId: input.boothId, expiresAt } } } : {}) } });
    return tx.checkoutIntent.create({ data: { kind: 'VIP', amountMinor: amountDue, currency: pkg.currency, customerEmail: input.customerEmail.toLowerCase(), clientReference: input.clientReference ?? null, expiresAt, vipBookingId: created.id } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  return publicIntent(booking.id);
}

export async function getCheckoutIntentPublic(id: string) {
  const intent = await db.checkoutIntent.findUnique({ where: { id }, include: { order: { include: { items: true } }, ticketPurchase: { include: { items: true } }, vipBooking: true } });
  if (!intent) throw notFound('Checkout intent not found.');
  return {
    id: intent.id,
    kind: intent.kind,
    status: intent.status,
    expired: intent.expiresAt <= new Date(),
    amountMinor: intent.amountMinor,
    currency: intent.currency,
    expiresAt: intent.expiresAt.toISOString(),
    providerOrderId: intent.providerOrderId,
    order: intent.order ? { orderNumber: intent.order.orderNumber, lines: intent.order.items.map((item) => ({ title: item.titleSnapshot, quantity: item.quantity, unitPriceMinor: item.unitPriceMinor, lineTotalMinor: item.lineTotalMinor })) } : null,
    ticketPurchase: intent.ticketPurchase ? { id: intent.ticketPurchase.id, items: intent.ticketPurchase.items.map((item) => ({ ticketTierId: item.ticketTierId, quantity: item.quantity })) } : null,
    vipBooking: intent.vipBooking ? { id: intent.vipBooking.id } : null,
  };
}

export async function getCheckoutResult(id: string) {
  const intent = await db.checkoutIntent.findUnique({
    where: { id },
    include: {
      order: { include: { items: true } },
      ticketPurchase: { include: { items: { include: { ticketTier: true } } } },
      vipBooking: { include: { vipPackage: true } },
    },
  });
  if (!intent) throw notFound('Checkout intent not found.');
  const status = intent.status === 'PAID'
    ? 'paid'
    : intent.status === 'FAILED'
      ? 'failed'
      : intent.status === 'EXPIRED' || intent.status === 'CANCELLED'
        ? 'cancelled'
        : intent.status === 'PROCESSING'
          ? 'processing'
          : 'pending';
  const resultOrder = intent.order
    ? {
        id: intent.order.id,
        orderNumber: intent.order.orderNumber,
        status,
        createdAt: intent.order.createdAt.toISOString(),
        customerEmail: intent.order.customerEmail,
        clientReference: intent.order.clientReference,
        lines: intent.order.items.map((item) => ({ id: item.id, productId: item.productId ?? '', variantId: item.variantId, productSlug: null, title: item.titleSnapshot, image: item.imageUrlSnapshot ? { src: item.imageUrlSnapshot, alt: item.titleSnapshot } : null, sizeLabel: null, colorLabel: null, quantity: item.quantity, unitPrice: { amountMinor: item.unitPriceMinor, currency: intent.order?.currency ?? 'AUD' }, lineTotal: { amountMinor: item.lineTotalMinor, currency: intent.order?.currency ?? 'AUD' } })),
        subtotal: { amountMinor: intent.order.subtotalMinor, currency: intent.order.currency },
        discount: intent.order.discountMinor ? { amountMinor: intent.order.discountMinor, currency: intent.order.currency } : null,
        shipping: intent.order.shippingMinor ? { amountMinor: intent.order.shippingMinor, currency: intent.order.currency } : null,
        tax: intent.order.taxMinor ? { amountMinor: intent.order.taxMinor, currency: intent.order.currency } : null,
        total: { amountMinor: intent.order.totalMinor, currency: intent.order.currency },
        confirmationEmailSent: false,
        progress: [],
      }
    : intent.ticketPurchase
      ? {
          id: intent.ticketPurchase.id,
          orderNumber: `TICKET-${intent.ticketPurchase.id.slice(0, 8).toUpperCase()}`,
          status,
          createdAt: intent.ticketPurchase.createdAt.toISOString(),
          customerEmail: intent.ticketPurchase.customerEmail,
          clientReference: intent.clientReference,
          lines: intent.ticketPurchase.items.map((item) => ({ id: item.id, productId: item.ticketTierId, variantId: null, productSlug: null, title: item.ticketTier.name, image: null, sizeLabel: null, colorLabel: null, quantity: item.quantity, unitPrice: { amountMinor: item.unitPriceMinor, currency: intent.ticketPurchase?.currency ?? intent.currency }, lineTotal: { amountMinor: item.lineTotalMinor, currency: intent.ticketPurchase?.currency ?? intent.currency } })),
          subtotal: { amountMinor: intent.ticketPurchase.totalMinor, currency: intent.ticketPurchase.currency },
          discount: null,
          shipping: null,
          tax: null,
          total: { amountMinor: intent.ticketPurchase.totalMinor, currency: intent.ticketPurchase.currency },
          confirmationEmailSent: false,
          progress: [],
        }
      : intent.vipBooking
        ? {
            id: intent.vipBooking.id,
            orderNumber: `VIP-${intent.vipBooking.id.slice(0, 8).toUpperCase()}`,
            status,
            createdAt: intent.vipBooking.createdAt.toISOString(),
            customerEmail: intent.vipBooking.customerEmail,
            clientReference: intent.clientReference,
            lines: [{ id: intent.vipBooking.id, productId: intent.vipBooking.vipPackageId, variantId: null, productSlug: null, title: intent.vipBooking.vipPackage.name, image: null, sizeLabel: null, colorLabel: null, quantity: 1, unitPrice: { amountMinor: intent.vipBooking.amountDueMinor, currency: intent.vipBooking.currency }, lineTotal: { amountMinor: intent.vipBooking.amountDueMinor, currency: intent.vipBooking.currency } }],
            subtotal: { amountMinor: intent.vipBooking.amountDueMinor, currency: intent.vipBooking.currency },
            discount: null,
            shipping: null,
            tax: null,
            total: { amountMinor: intent.vipBooking.amountDueMinor, currency: intent.vipBooking.currency },
            confirmationEmailSent: false,
            progress: [],
          }
        : null;
  return { status, order: resultOrder };
}

export async function payCheckoutIntent(input: { checkoutId: string; sourceId: string; verificationToken?: string | null; idempotencyKey: string }) {
  const intent = await db.checkoutIntent.findUnique({ where: { id: input.checkoutId }, include: { order: { include: { items: true } }, ticketPurchase: { include: { items: true } }, vipBooking: true } });
  if (!intent) throw notFound('Checkout intent not found.');
  if (intent.expiresAt <= new Date()) {
    await expireCheckoutIntent(intent.id);
    throw conflict('This checkout has expired. Please start again.');
  }
  if (intent.status === 'PAID') return { checkoutId: intent.id, status: 'COMPLETED', paymentId: null };
  const idempotencyKey = cleanKey(input.idempotencyKey);
  let attempt = await db.paymentAttempt.findUnique({ where: { idempotencyKey } });
  if (attempt?.providerPaymentId) {
    const providerPayment = await getSquarePayment(attempt.providerPaymentId);
    if (providerPayment) await syncSquarePayment(attempt.id, providerPayment);
    const latest = await db.paymentAttempt.findUnique({ where: { id: attempt.id } });
    return { checkoutId: intent.id, status: latest?.status ?? 'PENDING', paymentId: latest?.providerPaymentId ?? null };
  }
  if (!attempt) {
    attempt = await db.paymentAttempt.create({ data: { checkoutIntentId: intent.id, idempotencyKey, provider: 'square', status: 'CREATED' } });
  }

  let providerOrderId = intent.providerOrderId;
  if (!providerOrderId) {
    const lines = intent.order?.items.map((item) => ({ name: item.titleSnapshot, quantity: item.quantity, unitPriceMinor: item.unitPriceMinor, currency: intent.currency, referenceId: item.productId ?? undefined })) ?? [{ name: intent.kind, quantity: 1, unitPriceMinor: intent.amountMinor, currency: intent.currency }];
    const order = await createSquareOrder({ idempotencyKey: `ord_${intent.id.replaceAll('-', '')}`.slice(0, 45), referenceId: intent.id, lines });
    providerOrderId = order.id;
    await db.checkoutIntent.update({ where: { id: intent.id }, data: { providerOrderId } });
    await db.paymentAttempt.update({ where: { id: attempt.id }, data: { providerOrderId } });
  }
  await db.checkoutIntent.update({ where: { id: intent.id }, data: { status: 'PROCESSING' } });
  try {
    const result = await createSquarePayment({ sourceId: input.sourceId, verificationToken: input.verificationToken, idempotencyKey, amountMinor: intent.amountMinor, currency: intent.currency, orderId: providerOrderId, referenceId: intent.id, buyerEmailAddress: intent.customerEmail });
    await db.paymentAttempt.update({ where: { id: attempt.id }, data: { status: paymentStatusToLocal(result.status), providerPaymentId: result.id, providerOrderId } });
    const payment = await db.payment.upsert({
      where: { idempotencyKey },
      update: { providerPaymentId: result.id, providerOrderId, locationId: squareLocationId(), status: paymentStatusToLocal(result.status), amountMinor: intent.amountMinor, currency: intent.currency, paidAt: result.status === 'COMPLETED' ? new Date() : null },
      create: { checkoutIntentId: intent.id, orderId: intent.order?.id, ticketPurchaseId: intent.ticketPurchase?.id, vipBookingId: intent.vipBooking?.id, provider: 'square', providerPaymentId: result.id, providerOrderId, idempotencyKey, locationId: squareLocationId(), status: paymentStatusToLocal(result.status), amountMinor: intent.amountMinor, currency: intent.currency, paidAt: result.status === 'COMPLETED' ? new Date() : null },
    });
    if (result.status === 'COMPLETED') await finalizeCompletedPayment(payment.id);
    return { checkoutId: intent.id, status: result.status, paymentId: result.id };
  } catch (error) {
    await db.paymentAttempt.update({ where: { id: attempt.id }, data: { status: 'FAILED', errorCode: 'SQUARE_PAYMENT_FAILED', errorMessage: error instanceof Error ? error.message.slice(0, 240) : 'Payment failed' } });
    await db.checkoutIntent.update({ where: { id: intent.id }, data: { status: 'FAILED' } });
    if (error instanceof ApiError) throw error;
    throw new ApiError(502, 'SQUARE_PAYMENT_FAILED', 'The payment provider could not complete this payment.');
  }
}

async function syncSquarePayment(attemptId: string, providerPayment: Square.Payment) {
  const status = squarePaymentStatus(providerPayment.status);
  const attempt = await db.paymentAttempt.update({ where: { id: attemptId }, data: { status: paymentStatusToLocal(status), providerPaymentId: providerPayment.id } });
  if (!providerPayment.id) return;
  const payment = await db.payment.findFirst({ where: { provider: 'square', providerPaymentId: providerPayment.id } });
  if (!payment) return;
  const updated = await db.payment.update({ where: { id: payment.id }, data: { status: paymentStatusToLocal(status), paidAt: status === 'COMPLETED' ? new Date() : payment.paidAt } });
  if (updated.status === 'COMPLETED') await finalizeCompletedPayment(updated.id);
  void attempt;
}

export async function expireCheckoutIntent(id: string) {
  const result = await db.checkoutIntent.updateMany({ where: { id, status: { in: ['OPEN', 'FAILED', 'PROCESSING'] }, expiresAt: { lte: new Date() } }, data: { status: 'EXPIRED' } });
  if (!result.count) return false;
  await db.ticketPurchase.updateMany({ where: { checkoutIntent: { id } }, data: { status: 'EXPIRED' } });
  await db.ticketHold.updateMany({ where: { ticketPurchase: { checkoutIntent: { id } }, status: 'ACTIVE' }, data: { status: 'EXPIRED', releasedAt: new Date() } });
  await db.vipBooking.updateMany({ where: { checkoutIntent: { id } }, data: { status: 'EXPIRED' } });
  await db.vipBoothHold.updateMany({ where: { booking: { checkoutIntent: { id } }, status: 'ACTIVE' }, data: { status: 'EXPIRED', releasedAt: new Date() } });
  return true;
}

export async function expireExpiredCheckoutIntents() {
  const rows = await db.checkoutIntent.findMany({ where: { status: { in: ['OPEN', 'FAILED', 'PROCESSING'] }, expiresAt: { lte: new Date() } }, select: { id: true } });
  let expired = 0;
  for (const row of rows) if (await expireCheckoutIntent(row.id)) expired += 1;
  return { expired };
}

function publicIntent(id: string) {
  return { checkoutId: id, checkoutUrl: `/checkout/pay/${id}` };
}
