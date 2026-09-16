import { Info } from 'lucide-react';
import type { CheckoutResultStatus, VerifiedOrder } from '@/lib/checkout/types';
import { formatMoney } from '@/lib/shop/pricing';
import { ResultActions } from './ResultActions';
import type { ResultAction } from './ResultActions';
import { isPaidStatus } from './resultCopy';

function actionsFor(status: CheckoutResultStatus): ResultAction[] {
  switch (status) {
    case 'paid':
    case 'processing':
      return [
        { kind: 'link', label: 'Continue Shopping', href: '/shop', tone: 'primary' },
        { kind: 'link', label: 'Explore Event', href: '/event', tone: 'secondary' },
      ];
    case 'pending':
    case 'verifying':
    case 'network-error':
      return [
        { kind: 'refresh', label: 'Refresh Status', tone: 'primary' },
        { kind: 'link', label: 'Continue Shopping', href: '/shop', tone: 'secondary' },
      ];
    default:
      return [
        { kind: 'link', label: 'Return to Cart', href: '/cart', tone: 'primary' },
        { kind: 'link', label: 'Continue Shopping', href: '/shop', tone: 'secondary' },
      ];
  }
}

const NOTES: Partial<Record<CheckoutResultStatus, string>> = {
  paid: 'Your order has been received and payment has been confirmed. Fulfilment and delivery details will be communicated separately.',
  processing:
    'Payment has been confirmed and your order is being prepared. Delivery details will be communicated separately.',
  pending: 'Payment has not been confirmed yet. This page shows the latest status when refreshed.',
  failed: 'No payment was confirmed for this checkout.',
  cancelled: 'This checkout was cancelled before payment.',
  verifying: 'The checkout status is still being confirmed.',
  'network-error': 'The order status could not be checked just now.',
  'not-found': 'If you completed a payment, keep your confirmation email and contact us.',
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-white/85">{label}</dt>
      <dd className="text-right text-white">{value}</dd>
    </div>
  );
}

/** Server totals for a verified order, plus what to do next. */
export default function ResultSummary({
  status,
  order,
}: {
  status: CheckoutResultStatus;
  order?: VerifiedOrder | null;
}) {
  const paid = isPaidStatus(status);

  return (
    <section
      aria-labelledby="result-summary-title"
      className="rounded-[20px] border border-white/[0.08] bg-rave-panel/80 p-5 sm:p-6 lg:sticky lg:top-[104px]"
    >
      <h2
        id="result-summary-title"
        className="font-heading text-3xl font-black uppercase tracking-tight text-white"
      >
        {order ? 'Summary' : 'What’s Next'}
      </h2>

      {order && (
        <>
          <dl className="mt-5 flex flex-col gap-3 text-sm">
            <Row label="Subtotal" value={formatMoney(order.subtotal)} />
            {order.discount && <Row label="Discount" value={`-${formatMoney(order.discount)}`} />}
            <Row
              label="Shipping"
              value={order.shipping ? formatMoney(order.shipping) : 'To be confirmed'}
            />
            {order.tax && <Row label="Tax" value={formatMoney(order.tax)} />}
          </dl>
          <div className="mt-5 flex items-center justify-between gap-3 rounded-[12px] border border-white/[0.08] bg-rave-deep/80 px-4 py-4">
            <p className="font-heading text-xl font-semibold text-white">
              {paid ? 'Total Paid' : 'Order Total'}
            </p>
            <p className="font-heading text-4xl font-black text-white">{formatMoney(order.total)}</p>
          </div>
        </>
      )}

      {NOTES[status] && (
        <p className="mt-5 flex items-start gap-3 rounded-[12px] border border-white/[0.08] p-4 text-sm leading-relaxed text-white/85">
          <Info aria-hidden className="mt-0.5 h-5 w-5 shrink-0" />
          {NOTES[status]}
        </p>
      )}

      <div className="mt-5">
        <ResultActions actions={actionsFor(status)} />
      </div>

      <p
        aria-hidden
        className="mt-8 text-center font-heading text-[10px] uppercase tracking-[0.35em] text-white/50"
      >
        Music Connects Us All
      </p>
    </section>
  );
}
