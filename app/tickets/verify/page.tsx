import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/home/Header';
import EventsMotion from '@/components/events/EventsMotion';
import Container from '@/components/ui/Container';
import { verifyIssuedTicketToken } from '@/server/services/tickets/verify';

export const metadata: Metadata = {
  title: 'Ticket Verification | Connection Rave',
  description: 'Verify a Connection Rave ticket QR code.',
  robots: { index: false, follow: false },
};

export default async function TicketVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.token) ? params.token[0] : params.token;
  const ticket = raw ? await verifyIssuedTicketToken(raw.trim()) : null;

  return (
    <EventsMotion>
      <Header />
      <main id="main" className="min-h-screen bg-rave-black py-20 text-white">
        <Container>
          <div className="mx-auto max-w-xl rounded-[22px] border border-white/[0.08] bg-rave-panel/80 p-8 text-center">
            <p className="font-heading text-xs uppercase tracking-[0.3em] text-rave-red">Ticket verification</p>
            <h1 className="mt-4 font-heading text-4xl font-black uppercase tracking-tight">
              {ticket ? 'Valid ticket' : 'Ticket not found'}
            </h1>
            {ticket ? (
              <dl className="mx-auto mt-8 grid max-w-sm gap-4 text-left text-sm">
                <div className="flex justify-between gap-4 border-b border-white/[0.08] pb-3"><dt className="text-rave-muted">Event</dt><dd className="font-semibold text-white">{ticket.eventTitle}</dd></div>
                <div className="flex justify-between gap-4 border-b border-white/[0.08] pb-3"><dt className="text-rave-muted">Ticket</dt><dd className="font-semibold text-white">{ticket.tierName}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-rave-muted">Issued</dt><dd className="font-semibold text-white">{new Date(ticket.issuedAt).toLocaleString('en-AU')}</dd></div>
              </dl>
            ) : (
              <p className="mt-4 text-rave-muted">This QR code is invalid, expired, or has already been voided.</p>
            )}
            <Link href="/" className="mt-8 inline-flex rounded-[12px] border border-white/[0.15] px-5 py-3 font-heading text-sm uppercase tracking-wider text-white hover:border-rave-red/60">Back home</Link>
          </div>
        </Container>
      </main>
    </EventsMotion>
  );
}
