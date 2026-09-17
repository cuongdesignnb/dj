import 'server-only';

import { createHash } from 'node:crypto';
import { db } from '@/server/db/client';

export async function verifyIssuedTicketToken(token: string) {
  if (!/^tkt_[A-Za-z0-9_-]{12,120}$/.test(token)) return null;
  const ticket = await db.issuedTicket.findUnique({
    where: { ticketCodeHash: createHash('sha256').update(token).digest('hex') },
    include: { ticketTier: true, ticketPurchase: { include: { event: true } } },
  });
  if (!ticket || ticket.status !== 'ISSUED') return null;
  return {
    id: ticket.id,
    eventSlug: ticket.ticketPurchase.event.slug,
    eventTitle: ticket.ticketPurchase.event.slug,
    tierName: ticket.ticketTier.name,
    issuedAt: ticket.issuedAt.toISOString(),
  };
}
