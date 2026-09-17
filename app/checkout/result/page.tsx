
import Header from '@/components/home/Header';
import EventsMotion from '@/components/events/EventsMotion';
import EventsFooter from '@/components/events/EventsFooter';
import FinalCtaSection from '@/components/shared/FinalCtaSection';
import Container from '@/components/ui/Container';
import RelatedProducts from '@/components/shop/RelatedProducts';
import CheckoutResultHero from '@/components/checkout/CheckoutResultHero';
import type { HeroStep } from '@/components/checkout/CheckoutResultHero';
import OrderDetails from '@/components/checkout/OrderDetails';
import ResultSummary from '@/components/checkout/ResultSummary';
import { ClearCartOnPaid } from '@/components/checkout/ResultActions';
import { isPaidStatus, resultCopy } from '@/components/checkout/resultCopy';

import { RESULT_CONTENT } from '@/lib/cart/content';
import { parseSessionId } from '@/lib/checkout/config';
import { getCheckoutRepository } from '@/lib/checkout/repository';
import type { CheckoutResult, CheckoutResultStatus, VerifiedOrder } from '@/lib/checkout/types';
import { recommendProducts } from '@/lib/shop/helpers';
import { getShopRepository } from '@/lib/shop/repository';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({ title: 'Order Status | Connection Rave Merchandise', description: 'Check the status of a Connection Rave merchandise order.', path: '/checkout/result', indexable: false, follow: false });

function heroSteps(status: CheckoutResultStatus, order?: VerifiedOrder | null): HeroStep[] {
  if (!order || !['paid', 'processing', 'pending'].includes(status)) return [];
  const paid = isPaidStatus(status);
  return [
    { id: 'payment', label: 'Payment Received', state: paid ? 'done' : 'active' },
    {
      id: 'processing',
      label: 'Order Processing',
      state: status === 'processing' ? 'done' : paid ? 'active' : 'pending',
    },
    {
      id: 'confirmation',
      label: 'Confirmation Sent',
      state: order.confirmationEmailSent ? 'done' : 'pending',
    },
  ];
}

async function verify(sessionId: string | null): Promise<CheckoutResult> {
  // A missing or malformed reference never reaches the checkout service.
  if (!sessionId) return { status: 'not-found' };
  try {
    return await getCheckoutRepository().getResultBySessionId(sessionId);
  } catch {
    return {
      status: 'network-error',
      message: 'We couldn’t verify the latest order status. Please try again.',
    };
  }
}

/**
 * Server Component. The status shown is whatever the checkout service
 * verified for `session_id` — the only value read from the URL. Parameters
 * such as ?status=paid or ?total=1 are ignored entirely.
 */
export default async function CheckoutResultPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const [result, shopPage] = await Promise.all([
    verify(parseSessionId(params.session_id)),
    (async () => {
      const selection = getShopRepository();
      return selection.ok ? selection.repository.getShopPage() : null;
    })(),
  ]);

  const { status } = result;
  const order = result.order ?? null;
  const copy = resultCopy(status, order);
  const shop = shopPage?.ok ? shopPage.data : null;

  const anchors = (order?.lines ?? []).flatMap((line) => {
    const product = shop?.products.find((p) => p.id === line.productId);
    return product ? [product] : [];
  });
  const recommendations = shop ? recommendProducts(anchors, shop.products, 3) : [];

  return (
    <EventsMotion>
      <Header />
      <main id="main" className="min-h-screen bg-rave-black text-white">
        <CheckoutResultHero
          status={status}
          tone={copy.tone}
          title={copy.title}
          body={result.message ?? copy.body}
          steps={heroSteps(status, order)}
          sideNotes={RESULT_CONTENT.sideNotes}
        />

        {isPaidStatus(status) && order && (
          <ClearCartOnPaid clientReference={order.clientReference ?? null} />
        )}

        <section aria-label="Order information" className="bg-rave-black py-10 md:py-14">
          <Container>
            {order ? (
              <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,68fr)_minmax(0,32fr)]">
                {/* On small screens the summary comes first. */}
                <div className="order-2 lg:order-1">
                  <OrderDetails order={order} />
                </div>
                <div className="order-1 lg:order-2">
                  <ResultSummary status={status} order={order} />
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-md">
                <ResultSummary status={status} />
              </div>
            )}
          </Container>
        </section>

        <RelatedProducts products={recommendations} columns={3} />

        <FinalCtaSection cta={{ ...RESULT_CONTENT.finalCta, subtitle: RESULT_CONTENT.finalCta.description }} titleId="result-cta-title" />
      </main>
      {shop && <EventsFooter footer={shop.footer} />}
    </EventsMotion>
  );
}
