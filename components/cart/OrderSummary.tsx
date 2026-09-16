'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { createCheckoutSession } from '@/app/cart/actions';
import type { CheckoutMode } from '@/lib/checkout/config';
import { writeCheckoutRef } from '@/lib/cart/storage';
import { estimatedTotal } from '@/lib/cart/pricing';
import type { CartState, CheckoutAvailability, Money } from '@/lib/cart/types';
import type { ReviewedLine } from '@/lib/cart/validation';
import { formatMoney } from '@/lib/shop/pricing';
import PromoCodeForm from './PromoCodeForm';

function Amount({ value }: { value: string }) {
  const reduced = useReducedMotion();
  return (
    <span className="relative inline-block overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ opacity: 0, y: reduced ? 0 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="inline-block"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/**
 * Totals, promo code and the checkout button. The browser sends ids and
 * quantities only; the checkout service prices the order.
 */
export default function OrderSummary({
  cart,
  reviewed,
  subtotal,
  count,
  blocked,
  mode,
}: {
  cart: CartState;
  reviewed: ReviewedLine[];
  subtotal: Money | null;
  count: number;
  blocked: boolean;
  mode: CheckoutMode;
}) {
  const [discount, setDiscount] = useState<Money | null>(null);
  const [availability, setAvailability] = useState<CheckoutAvailability>(
    mode === 'disabled' ? 'unavailable' : 'ready',
  );
  const [message, setMessage] = useState('');
  // A discount only counts while the code it came with is still applied.
  const activeDiscount = cart.promoCode ? discount : null;
  const total = estimatedTotal(subtotal, activeDiscount);

  const checkout = async () => {
    if (availability !== 'ready' || blocked) return;
    setAvailability('loading');
    setMessage('');

    // getRandomValues works outside secure contexts, unlike randomUUID.
    const clientReference = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
      b.toString(16).padStart(2, '0'),
    ).join('');
    let result: Awaited<ReturnType<typeof createCheckoutSession>>;
    try {
      result = await createCheckoutSession({
        lines: reviewed
          .filter((r) => r.issue?.kind !== 'unavailable')
          .map((r) => ({
            productId: r.line.productId,
            variantId: r.line.variantId ?? null,
            quantity: r.line.quantity,
          })),
        promoCode: cart.promoCode ?? null,
        clientReference,
      });
    } catch {
      result = { status: 'error', message: 'Checkout could not be reached. Please try again.' };
    }

    if (result.status === 'ready' && result.checkoutUrl) {
      // Remembered so the result page can clear this cart once payment is verified.
      writeCheckoutRef(clientReference);
      window.location.assign(result.checkoutUrl);
      return;
    }

    setAvailability(result.status === 'unavailable' ? 'unavailable' : 'ready');
    setMessage(result.message ?? 'Checkout could not be started. Please try again.');
  };

  const loading = availability === 'loading';
  const unavailable = availability === 'unavailable';

  return (
    <section
      aria-labelledby="order-summary-title"
      className="rounded-[20px] border border-white/[0.08] bg-rave-panel/80 p-5 sm:p-7 lg:sticky lg:top-[104px]"
    >
      <h2
        id="order-summary-title"
        className="font-heading text-3xl font-black uppercase tracking-tight text-white sm:text-4xl"
      >
        Order Summary
      </h2>

      <dl className="mt-6 flex flex-col gap-3 text-base">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-white/85">
            Subtotal ({count} {count === 1 ? 'item' : 'items'})
          </dt>
          <dd className="font-heading text-xl font-bold text-white">
            {subtotal ? <Amount value={formatMoney(subtotal)} /> : '—'}
          </dd>
        </div>
        {activeDiscount && (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-white/85">Discount ({cart.promoCode})</dt>
            <dd className="font-heading text-xl font-bold text-white">
              -{formatMoney(activeDiscount)}
            </dd>
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <dt className="text-white/85">Shipping</dt>
          <dd className="text-white/85">To be confirmed</dd>
        </div>
      </dl>

      <div className="my-5 h-px bg-white/10" />

      <div className="flex items-end justify-between gap-3">
        <p className="font-heading text-2xl font-bold uppercase text-white">Estimated Total</p>
        <p className="font-heading text-4xl font-black text-white">
          {total ? <Amount value={formatMoney(total)} /> : '—'}
        </p>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-rave-muted">
        Shipping and final charges are confirmed during checkout.
      </p>

      <div className="my-5 h-px bg-white/10" />

      <PromoCodeForm appliedCode={cart.promoCode ?? null} onDiscount={setDiscount} />

      <div className="mt-5 flex flex-col gap-3">
        <motion.button
          type="button"
          onClick={checkout}
          disabled={unavailable || loading || blocked}
          aria-busy={loading || undefined}
          aria-describedby="checkout-status"
          whileTap={unavailable || loading || blocked ? undefined : { scale: 0.97 }}
          className="group/checkout relative inline-flex min-h-[56px] w-full items-center justify-center gap-2 overflow-hidden rounded-[12px] bg-gradient-to-r from-rave-red to-rave-red2 px-6 font-heading text-lg font-semibold uppercase tracking-wider text-white shadow-[0_0_24px_rgba(255,23,61,0.35)] transition-all duration-300 hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-panel disabled:cursor-not-allowed disabled:from-white/10 disabled:to-white/10 disabled:text-white/60 disabled:shadow-none"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition-[left,opacity] duration-700 group-hover/checkout:left-[120%] group-hover/checkout:opacity-100 group-disabled/checkout:hidden motion-reduce:hidden"
          />
          {loading ? (
            <>
              <LoaderCircle aria-hidden className="h-5 w-5 animate-spin motion-reduce:animate-none" />
              {mode === 'live' ? 'Creating secure checkout…' : 'Creating checkout…'}
            </>
          ) : unavailable ? (
            'Checkout Coming Soon'
          ) : (
            <>
              Proceed to Checkout
              <ArrowRight aria-hidden className="h-5 w-5 transition-transform group-hover/checkout:translate-x-1" />
            </>
          )}
        </motion.button>

        <p id="checkout-status" role="status" aria-live="polite" className="text-sm text-rave-muted">
          {message ||
            (blocked
              ? 'Remove unavailable items or adjust quantities to continue.'
              : unavailable
                ? 'Merchandise checkout is not available yet. Your cart stays saved in this browser tab.'
                : '')}
        </p>

        <Link
          href="/shop"
          className="inline-flex min-h-[52px] items-center justify-center rounded-[12px] border border-white/30 px-6 font-heading text-base font-semibold uppercase tracking-wider text-white transition-colors hover:border-rave-red/60 hover:bg-rave-red/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red"
        >
          Continue Shopping
        </Link>
      </div>
    </section>
  );
}
