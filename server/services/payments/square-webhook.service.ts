import 'server-only';

import { createHash } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { db } from '@/server/db/client';
import { ApiError } from '@/server/errors';
import { getSquarePayment } from '@/server/integrations/square/payments';
import { getSquareRefund } from '@/server/integrations/square/refunds';
import { parseSquareWebhook, verifySquareWebhook } from '@/server/integrations/square/webhooks';
import { finalizeCompletedPayment } from './finalizer';

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function localPaymentStatus(value: unknown) {
  const status = String(value ?? '').toUpperCase();
  if (status === 'COMPLETED') return 'COMPLETED' as const;
  if (status === 'APPROVED') return 'APPROVED' as const;
  if (status === 'FAILED') return 'FAILED' as const;
  if (status === 'CANCELED' || status === 'CANCELLED') return 'CANCELLED' as const;
  return 'PENDING' as const;
}

function moneyAmount(value: unknown): number {
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  return 0;
}

export async function receiveSquareWebhook(rawBody: string, signature: string | null) {
  if (!(await verifySquareWebhook(rawBody, signature))) {
    throw new ApiError(403, 'INVALID_SQUARE_SIGNATURE', 'Invalid Square webhook signature.');
  }
  let event: ReturnType<typeof parseSquareWebhook>;
  try {
    event = parseSquareWebhook(rawBody);
  } catch {
    throw new ApiError(400, 'INVALID_SQUARE_PAYLOAD', 'Square webhook payload is invalid.');
  }
  const rawEvent = event as typeof event & { event_id?: string; event_type?: string };
  const eventId = typeof rawEvent.eventId === 'string' ? rawEvent.eventId : rawEvent.event_id ?? '';
  const eventType = typeof rawEvent.type === 'string' ? rawEvent.type : rawEvent.event_type ?? '';
  if (!eventId || !eventType) throw new ApiError(400, 'INVALID_SQUARE_PAYLOAD', 'Square webhook event is missing its identity.');

  const payloadHash = createHash('sha256').update(rawBody).digest('hex');
  const existing = await db.squareWebhookEvent.findUnique({ where: { eventId } });
  if (existing?.status === 'PROCESSED') return { received: true, duplicate: true };
  const record = existing ?? await db.squareWebhookEvent.create({ data: { eventId, eventType, payloadHash, payload: json(event), status: 'PROCESSING' } });
  try {
    if (eventType === 'payment.created' || eventType === 'payment.updated') {
      await syncPaymentEvent(event as { data?: { id?: string; object?: { payment?: { id?: string } } } });
    } else if (eventType === 'refund.created' || eventType === 'refund.updated') {
      await syncRefundEvent(event as { data?: { id?: string; object?: { refund?: { id?: string } } } });
    }
    await db.squareWebhookEvent.update({ where: { id: record.id }, data: { status: 'PROCESSED', processedAt: new Date() } });
  } catch (error) {
    await db.squareWebhookEvent.update({ where: { id: record.id }, data: { status: 'FAILED' } });
    throw error;
  }
  return { received: true };
}

async function syncPaymentEvent(event: { data?: { id?: string; object?: { payment?: { id?: string } } } }) {
  const paymentId = event.data?.id ?? event.data?.object?.payment?.id;
  if (!paymentId) return;
  // Always retrieve the current provider object. This makes an older event
  // harmless when Square delivers notifications out of order.
  const providerPayment = await getSquarePayment(paymentId);
  if (!providerPayment?.id) return;
  const status = localPaymentStatus(providerPayment.status);
  const intentId = providerPayment.referenceId ?? null;
  const intent = intentId ? await db.checkoutIntent.findUnique({ where: { id: intentId } }) : null;
  const existing = await db.payment.findFirst({ where: { provider: 'square', providerPaymentId: providerPayment.id } });
  const amountMinor = moneyAmount(providerPayment.amountMoney?.amount);
  const currency = String(providerPayment.amountMoney?.currency ?? intent?.currency ?? 'AUD');
  const payment = existing
    ? await db.payment.update({ where: { id: existing.id }, data: { status, providerOrderId: providerPayment.orderId, locationId: providerPayment.locationId, amountMinor: amountMinor || existing.amountMinor, currency, paidAt: status === 'COMPLETED' ? new Date() : existing.paidAt } })
    : intent
      ? await db.payment.create({ data: { checkoutIntentId: intent.id, orderId: intent.orderId, ticketPurchaseId: intent.ticketPurchaseId, vipBookingId: intent.vipBookingId, provider: 'square', providerPaymentId: providerPayment.id, providerOrderId: providerPayment.orderId, locationId: providerPayment.locationId, status, amountMinor: amountMinor || intent.amountMinor, currency, paidAt: status === 'COMPLETED' ? new Date() : null } })
      : null;
  if (payment?.status === 'COMPLETED') await finalizeCompletedPayment(payment.id);
}

async function syncRefundEvent(event: { data?: { id?: string; object?: { refund?: { id?: string } } } }) {
  const refundId = event.data?.id ?? event.data?.object?.refund?.id;
  if (!refundId) return;
  const providerRefund = await getSquareRefund(refundId);
  if (!providerRefund?.id) return;
  const payment = providerRefund.paymentId
    ? await db.payment.findFirst({ where: { provider: 'square', providerPaymentId: providerRefund.paymentId } })
    : null;
  if (!payment) return;
  const status = String(providerRefund.status ?? '').toUpperCase();
  const localStatus = status === 'COMPLETED' ? 'COMPLETED' : status === 'FAILED' ? 'FAILED' : status === 'CANCELED' ? 'CANCELLED' : 'PENDING';
  const amountMinor = moneyAmount(providerRefund.amountMoney?.amount);
  await db.refund.upsert({
    where: { providerRefundId: providerRefund.id },
    update: { status: localStatus, amountMinor: amountMinor || 0 },
    create: { paymentId: payment.id, providerRefundId: providerRefund.id, idempotencyKey: `webhook_${providerRefund.id}`.slice(0, 45), amountMinor: amountMinor || 0, currency: String(providerRefund.amountMoney?.currency ?? payment.currency), status: localStatus },
  });
  if (localStatus === 'COMPLETED') {
    const aggregate = await db.refund.aggregate({ _sum: { amountMinor: true }, where: { paymentId: payment.id, status: 'COMPLETED' } });
    const refunded = aggregate._sum.amountMinor ?? 0;
    await db.payment.update({ where: { id: payment.id }, data: { status: refunded >= payment.amountMinor ? 'REFUNDED' : 'PARTIALLY_REFUNDED' } });
  }
}
