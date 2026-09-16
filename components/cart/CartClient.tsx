'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Info, ShoppingBag } from 'lucide-react';
import Container from '@/components/ui/Container';
import RelatedProducts from '@/components/shop/RelatedProducts';
import ShopBenefits from '@/components/shop/ShopBenefits';
import { useCart, useHydrated } from '@/lib/cart/adapter';
import { itemCount, subtotal as cartSubtotal } from '@/lib/cart/pricing';
import { hasBlockingIssue, reviewCart } from '@/lib/cart/validation';
import type { CheckoutMode } from '@/lib/checkout/config';
import { shopReveal } from '@/lib/animations';
import { recommendProducts } from '@/lib/shop/helpers';
import type { Product, ShopBenefit } from '@/lib/shop/types';
import CartItem from './CartItem';
import OrderSummary from './OrderSummary';

function CartSkeleton() {
  return (
    <div aria-hidden className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,68fr)_minmax(0,32fr)]">
      <div className="h-[420px] rounded-[20px] border border-white/[0.06] bg-white/[0.03]" />
      <div className="h-[420px] rounded-[20px] border border-white/[0.06] bg-white/[0.03]" />
    </div>
  );
}

/**
 * Everything on /cart that depends on the saved cart. It waits for hydration
 * before showing anything cart-specific, so the page never flashes "empty"
 * while stored lines are still being read.
 */
export default function CartClient({
  products,
  mode,
  benefits,
}: {
  products: Product[];
  mode: CheckoutMode;
  benefits: ShopBenefit[];
}) {
  const hydrated = useHydrated();
  const { state, status } = useCart();

  const reviewed = useMemo(() => reviewCart(state.lines, products), [state.lines, products]);
  const payable = useMemo(
    () => reviewed.filter((r) => r.issue?.kind !== 'unavailable'),
    [reviewed],
  );
  const subtotal = useMemo(
    () => cartSubtotal(payable.map((r) => ({ unitPrice: r.price, quantity: r.line.quantity }))),
    [payable],
  );
  const count = itemCount(payable.map((r) => r.line));
  const blocked = hasBlockingIssue(reviewed);

  const recommendations = useMemo(() => {
    const anchors = state.lines.flatMap((line) => {
      const product = products.find((p) => p.id === line.productId);
      return product ? [product] : [];
    });
    return recommendProducts(anchors, products, 4);
  }, [state.lines, products]);

  if (!hydrated) {
    return (
      <section aria-label="Cart" aria-busy="true" className="bg-rave-black py-10 md:py-14">
        <Container>
          <CartSkeleton />
        </Container>
      </section>
    );
  }

  const empty = state.lines.length === 0;
  const totalItems = itemCount(state.lines);

  return (
    <>
      <section aria-labelledby="cart-items-title" className="bg-rave-black py-10 md:py-14">
        <Container>
          {status === 'reset' && (
            <p
              role="status"
              className="mb-5 flex items-start gap-2 rounded-[12px] border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white/90"
            >
              <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-rave-red" />
              Some saved cart details could not be read and were removed. Please check your cart.
            </p>
          )}

          {empty ? (
            <motion.div
              variants={shopReveal}
              initial="hidden"
              animate="visible"
              className="rounded-[20px] border border-white/[0.08] bg-rave-panel/70 px-6 py-16 text-center"
            >
              <ShoppingBag aria-hidden className="mx-auto h-12 w-12 text-rave-red" strokeWidth={1.5} />
              <h2
                id="cart-items-title"
                className="mt-5 font-heading text-3xl font-black uppercase tracking-tight text-white sm:text-4xl"
              >
                Your Cart Is Empty
              </h2>
              <p className="mx-auto mt-3 max-w-md text-base text-rave-muted">
                Your Connection merchandise collection starts here.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/shop"
                  className="group/cta inline-flex min-h-[52px] items-center gap-2 rounded-[12px] bg-gradient-to-r from-rave-red to-rave-red2 px-7 font-heading text-base font-semibold uppercase tracking-wider text-white shadow-[0_0_22px_rgba(255,23,61,0.35)] transition-all hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-panel"
                >
                  Browse Merchandise
                  <ArrowRight aria-hidden className="h-4 w-4 transition-transform group-hover/cta:translate-x-1" />
                </Link>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,68fr)_minmax(0,32fr)]">
              <div className="rounded-[20px] border border-white/[0.08] bg-rave-panel/70 p-4 sm:p-6">
                <div className="mb-5 flex items-end justify-between gap-3">
                  <h2
                    id="cart-items-title"
                    className="font-heading text-3xl font-black uppercase tracking-tight text-white sm:text-4xl"
                  >
                    Cart Items
                  </h2>
                  <p className="font-heading text-xs uppercase tracking-[0.3em] text-rave-muted">
                    {totalItems} {totalItems === 1 ? 'item' : 'items'}
                  </p>
                </div>
                <ul className="flex flex-col gap-4">
                  <AnimatePresence>
                    {reviewed.map((r, index) => (
                      <CartItem key={r.line.id} reviewed={r} index={index} />
                    ))}
                  </AnimatePresence>
                </ul>
              </div>

              <OrderSummary
                cart={state}
                reviewed={reviewed}
                subtotal={subtotal}
                count={count}
                blocked={blocked}
                mode={mode}
              />
            </div>
          )}
        </Container>
      </section>

      <ShopBenefits benefits={benefits} label="About your cart" />
      <RelatedProducts products={recommendations} />
    </>
  );
}
