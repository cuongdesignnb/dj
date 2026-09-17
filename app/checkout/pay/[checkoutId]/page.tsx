import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/home/Header';
import EventsMotion from '@/components/events/EventsMotion';
import Container from '@/components/ui/Container';
import SquarePaymentForm from '@/components/checkout/SquarePaymentForm';
import { getCheckoutIntentPublic } from '@/server/services/payments/checkout-intent';
import { squarePublicConfig } from '@/server/integrations/square/config';

export const metadata: Metadata = {
  title: 'Secure Checkout | Connection Rave',
  description: 'Secure Square checkout.',
  robots: { index: false, follow: false },
};

export default async function CheckoutPayPage({ params }: { params: Promise<{ checkoutId: string }> }) {
  const { checkoutId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(checkoutId)) notFound();
  let intent;
  try {
    intent = await getCheckoutIntentPublic(checkoutId);
  } catch {
    notFound();
  }
  const config = squarePublicConfig();

  return (
    <EventsMotion>
      <Header />
      <main id="main" className="min-h-screen bg-rave-black py-12 text-white md:py-20">
        <Container>
          <div className="mx-auto max-w-2xl">
            <p className="font-heading text-xs uppercase tracking-[0.3em] text-rave-red">Checkout intent</p>
            <h1 className="mt-3 font-heading text-4xl font-black uppercase tracking-tight sm:text-6xl">Complete your payment</h1>
            <p className="mt-4 text-rave-muted">This payment page is tied to one server-priced checkout intent and expires automatically.</p>
            {intent.expired || intent.status === 'EXPIRED' || intent.status === 'CANCELLED' ? (
              <div className="mt-8 rounded-[20px] border border-white/[0.08] bg-rave-panel/80 p-6 text-rave-muted">This checkout has expired. Please return to the cart and start again.</div>
            ) : intent.status === 'PAID' ? (
              <div className="mt-8 rounded-[20px] border border-rave-red/40 bg-rave-red/[0.08] p-6 text-white">This payment is already confirmed. <a className="underline" href={`/checkout/result?checkout_id=${checkoutId}`}>View result</a>.</div>
            ) : (
              <div className="mt-8">
                <SquarePaymentForm checkoutId={intent.id} amountMinor={intent.amountMinor} currency={intent.currency} applicationId={config.applicationId} locationId={config.locationId} scriptUrl={config.scriptUrl} />
              </div>
            )}
          </div>
        </Container>
      </main>
    </EventsMotion>
  );
}
