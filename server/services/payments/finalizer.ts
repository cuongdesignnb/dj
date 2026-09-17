import 'server-only';

import { createHash, randomBytes } from 'node:crypto';
import { db } from '@/server/db/client';
import { env } from '@/server/config';
import { Prisma } from '@prisma/client';

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

/**
 * The only function allowed to move a business aggregate to its paid state.
 * Callers must first persist the provider's authoritative COMPLETED status.
 * Webhooks and the synchronous payment response both use this same function.
 */
export async function finalizeCompletedPayment(paymentId: string): Promise<{ finalized: boolean; reason?: string }> {
  return db.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: {
        checkoutIntent: true,
        order: true,
        ticketPurchase: { include: { items: true, holds: true, issuedTickets: true } },
        vipBooking: { include: { hold: true } },
      },
    });
    if (!payment) return { finalized: false, reason: 'PAYMENT_NOT_FOUND' };
    if (payment.status !== 'COMPLETED') return { finalized: false, reason: 'PAYMENT_NOT_COMPLETED' };
    const intent = payment.checkoutIntent;
    if (!intent) return { finalized: false, reason: 'CHECKOUT_INTENT_NOT_FOUND' };
    if (payment.amountMinor !== intent.amountMinor || payment.currency !== intent.currency) {
      throw new Error('Payment amount or currency does not match the checkout intent.');
    }
    if (intent.status === 'PAID') return { finalized: true, reason: 'ALREADY_FINALIZED' };

    if (intent.kind === 'MERCHANDISE') {
      if (!payment.order || intent.orderId !== payment.order.id) throw new Error('Merchandise payment target is invalid.');
      await tx.order.update({
        where: { id: payment.order.id },
        data: { paymentStatus: 'PAID', fulfillmentStatus: 'PROCESSING' },
      });
      await tx.checkoutIntent.update({ where: { id: intent.id }, data: { status: 'PAID' } });
      await enqueueOnce(tx, intent.id, 'MERCHANDISE_PAYMENT_CONFIRMED', payment.order.id, {
        orderId: payment.order.id,
        email: payment.order.customerEmail,
      });
      return { finalized: true };
    }

    if (intent.kind === 'TICKET') {
      const purchase = payment.ticketPurchase;
      if (!purchase || intent.ticketPurchaseId !== purchase.id) throw new Error('Ticket payment target is invalid.');
      const issuedTickets = [...purchase.issuedTickets];
      if (purchase.status !== 'CONFIRMED') {
        for (const hold of purchase.holds) {
          if (hold.status === 'ACTIVE') {
            await tx.ticketHold.update({ where: { id: hold.id }, data: { status: 'CONSUMED', consumedAt: new Date() } });
            await tx.ticketTier.update({ where: { id: hold.ticketTierId }, data: { soldQuantity: { increment: hold.quantity } } });
          }
        }
        for (const item of purchase.items) {
          const existing = purchase.issuedTickets.filter((ticket) => ticket.ticketTierId === item.ticketTierId).length;
          for (let index = existing; index < item.quantity; index += 1) {
            const token = `tkt_${randomBytes(18).toString('base64url')}`;
            const issued = await tx.issuedTicket.create({
              data: {
                ticketPurchaseId: purchase.id,
                ticketTierId: item.ticketTierId,
                ticketToken: token,
                ticketCodeHash: createHash('sha256').update(token).digest('hex'),
              },
            });
            issuedTickets.push(issued);
          }
        }
        await tx.ticketPurchase.update({ where: { id: purchase.id }, data: { status: 'CONFIRMED' } });
      }
      await tx.checkoutIntent.update({ where: { id: intent.id }, data: { status: 'PAID' } });
      const appUrl = env('APP_URL') ?? 'http://localhost:3000';
      await enqueueOnce(tx, intent.id, 'TICKET_PAYMENT_CONFIRMED', purchase.id, {
        ticketPurchaseId: purchase.id,
        email: purchase.customerEmail,
        tickets: issuedTickets.map((ticket) => ({ ticketId: ticket.id, token: ticket.ticketToken, verifyUrl: `${appUrl}/tickets/verify?token=${encodeURIComponent(ticket.ticketToken)}` })),
      });
      return { finalized: true };
    }

    const booking = payment.vipBooking;
    if (!booking || intent.vipBookingId !== booking.id) throw new Error('VIP payment target is invalid.');
    if (booking.status !== 'CONFIRMED') {
      if (booking.hold?.status === 'ACTIVE') {
        await tx.vipBoothHold.update({ where: { id: booking.hold.id }, data: { status: 'CONSUMED', consumedAt: new Date() } });
      }
      await tx.vipBooking.update({ where: { id: booking.id }, data: { status: 'CONFIRMED' } });
    }
    await tx.checkoutIntent.update({ where: { id: intent.id }, data: { status: 'PAID' } });
    await enqueueOnce(tx, intent.id, 'VIP_PAYMENT_CONFIRMED', booking.id, { vipBookingId: booking.id, email: booking.customerEmail });
    return { finalized: true };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

async function enqueueOnce(
  tx: Prisma.TransactionClient,
  checkoutIntentId: string,
  type: string,
  aggregateId: string,
  payload: Record<string, unknown>,
) {
  const existing = await tx.outboxEvent.findFirst({ where: { checkoutIntentId, type, aggregateId } });
  if (!existing) {
    await tx.outboxEvent.create({ data: { checkoutIntentId, type, aggregateId, payload: json(payload) } });
  }
}
