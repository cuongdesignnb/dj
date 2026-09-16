'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ShoppingBag, Trash2, X } from 'lucide-react';
import { cartItemCount, sessionCartAdapter, useCartLines } from '@/lib/shop/cart';
import { formatMoney, multiply, sum } from '@/lib/shop/pricing';
import QuantityControl from './QuantityControl';

/**
 * Floating cart pill and the preview cart panel. It only appears once
 * something is in the cart, so it never covers the page for nothing.
 *
 * There is deliberately no checkout button: the panel says plainly that the
 * checkout flow is still to be confirmed.
 */
export default function CartButton() {
  const reduced = useReducedMotion();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const lines = useCartLines();
  const count = cartItemCount(lines);
  const subtotal = sum(lines.map((line) => multiply(line.unitPrice, line.quantity)));

  const close = () => dialogRef.current?.close();

  return (
    <>
      <AnimatePresence>
        {count > 0 && (
          <motion.button
            type="button"
            onClick={() => dialogRef.current?.showModal()}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="fixed bottom-5 right-5 z-40 inline-flex min-h-[52px] items-center gap-2.5 rounded-full border border-rave-red/60 bg-rave-black/90 px-5 font-heading text-sm font-semibold uppercase tracking-wider text-white shadow-[0_10px_40px_rgba(255,23,61,0.35)] backdrop-blur-md transition-colors hover:bg-rave-red/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black"
          >
            <ShoppingBag aria-hidden className="h-5 w-5 text-rave-red" />
            Cart{' '}
            <span className="grid h-6 min-w-6 place-items-center rounded-full bg-rave-red px-1.5 text-xs">
              {count}
            </span>
            <span className="sr-only"> {count === 1 ? 'item' : 'items'} — open cart</span>
          </motion.button>
        )}
      </AnimatePresence>

      <dialog
        ref={dialogRef}
        aria-labelledby="cart-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        className="my-0 ml-auto mr-0 h-dvh max-h-dvh w-[min(100vw,420px)] max-w-none bg-transparent p-0 text-white backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      >
        <div className="flex h-full flex-col border-l border-white/10 bg-rave-deep">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <h2 id="cart-title" className="font-heading text-2xl font-black uppercase tracking-tight">
              Your Cart
            </h2>
            <button
              type="button"
              onClick={close}
              aria-label="Close cart"
              className="grid h-11 w-11 place-items-center rounded-full border border-white/15 transition-colors hover:border-rave-red hover:text-rave-red focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red"
            >
              <X aria-hidden className="h-5 w-5" />
            </button>
          </div>

          {lines.length === 0 ? (
            <p className="px-5 py-10 text-sm text-rave-muted">Your cart is empty.</p>
          ) : (
            <ul className="flex-1 divide-y divide-white/[0.08] overflow-y-auto px-5">
              {lines.map((line) => {
                const quantityLabelId = `cart-qty-${line.id}`;
                return (
                  <li key={line.id} className="flex gap-4 py-4">
                    {line.image && (
                      <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[10px] border border-white/10">
                        <Image src={line.image.src} alt="" fill sizes="80px" className="object-cover" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <Link
                        href={line.href}
                        onClick={close}
                        className="font-heading text-base font-bold uppercase leading-tight hover:text-rave-red focus:outline-none focus-visible:underline"
                      >
                        {line.title}
                      </Link>
                      {line.optionLabel && (
                        <p className="mt-0.5 text-xs text-rave-muted">{line.optionLabel}</p>
                      )}
                      <p className="mt-1 text-sm text-white/90">
                        {formatMoney(multiply(line.unitPrice, line.quantity))}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span id={quantityLabelId} className="sr-only">
                          Quantity of {line.title}
                          {line.optionLabel ? ` (${line.optionLabel})` : ''}
                        </span>
                        <QuantityControl
                          value={line.quantity}
                          onChange={(next) => sessionCartAdapter.updateQuantity(line.id, next)}
                          labelId={quantityLabelId}
                        />
                        <button
                          type="button"
                          onClick={() => sessionCartAdapter.removeItem(line.id)}
                          aria-label={`Remove ${line.title}${line.optionLabel ? ` (${line.optionLabel})` : ''} from cart`}
                          className="grid h-11 w-11 place-items-center rounded-[10px] text-rave-muted transition-colors hover:text-rave-red focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red"
                        >
                          <Trash2 aria-hidden className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="border-t border-white/10 px-5 py-5">
            {subtotal && (
              <p className="flex items-center justify-between font-heading text-lg uppercase">
                <span>Subtotal</span>
                <span>{formatMoney(subtotal)}</span>
              </p>
            )}
            <p className="mt-3 text-xs leading-relaxed text-rave-muted">
              Merchandise preview — checkout flow to be confirmed. Nothing has been ordered or
              charged.
            </p>
            <button
              type="button"
              onClick={close}
              className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center rounded-[12px] border border-white/25 font-heading text-sm font-semibold uppercase tracking-wider transition-colors hover:border-rave-red/60 hover:bg-rave-red/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
