'use client';

import { useEffect, useId, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, ShoppingCart } from 'lucide-react';
import { sessionCartAdapter } from '@/lib/shop/cart';
import type { CartAdapter } from '@/lib/shop/cart';
import {
  primaryImage,
  selectionLabel,
  validateAddToCart,
} from '@/lib/shop/helpers';
import type { ProductSelection } from '@/lib/shop/helpers';
import { unitPrice } from '@/lib/shop/pricing';
import type { Product } from '@/lib/shop/types';

type Status = { kind: 'idle' } | { kind: 'added' | 'error'; message: string };

/**
 * Adds the current selection to the preview cart and says what happened.
 *
 * "Added to cart" only appears after the cart adapter has accepted the line.
 * There is no checkout behind this button, and nothing it says implies one.
 */
export default function AddToCartButton({
  product,
  selection,
  quantity,
  tone = 'primary',
  size = 'lg',
  adapter = sessionCartAdapter,
}: {
  product: Product;
  selection: ProductSelection;
  quantity: number;
  tone?: 'primary' | 'secondary';
  size?: 'md' | 'lg';
  adapter?: CartAdapter;
}) {
  const reduced = useReducedMotion();
  const statusId = useId();
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const check = validateAddToCart(product, selection, quantity);
  // Only a product that can never be added is disabled; a missing option is
  // explained on click instead, so the button never looks mysteriously dead.
  const blocked =
    !check.ok && (product.status === 'sold-out' || product.status === 'archived');

  useEffect(() => {
    if (status.kind === 'idle') return;
    const timer = window.setTimeout(() => setStatus({ kind: 'idle' }), 5000);
    return () => window.clearTimeout(timer);
  }, [status]);

  const add = () => {
    if (!check.ok) {
      setStatus({ kind: 'error', message: check.reason });
      return;
    }

    const options = selectionLabel(product, selection);
    try {
      adapter.addItem(
        { productId: product.id, variantId: check.variant?.id ?? null, quantity },
        {
          title: product.title,
          href: `/shop/${product.slug}`,
          unitPrice: unitPrice(product, check.variant),
          image: primaryImage(product)?.image ?? null,
          optionLabel: options || null,
        },
      );
      setStatus({
        kind: 'added',
        message: `Added to cart: ${quantity} × ${product.title}${options ? ` (${options})` : ''}.`,
      });
    } catch {
      setStatus({ kind: 'error', message: 'Could not add this item. Please try again.' });
    }
  };

  const added = status.kind === 'added';
  const base =
    tone === 'primary'
      ? 'bg-gradient-to-r from-rave-red to-rave-red2 text-white shadow-[0_0_24px_rgba(255,23,61,0.35)] hover:brightness-110'
      : 'border border-white/25 bg-white/[0.02] text-white hover:border-rave-red/60 hover:bg-rave-red/10';

  return (
    <div className="w-full">
      <motion.button
        type="button"
        onClick={add}
        disabled={blocked}
        aria-describedby={statusId}
        whileTap={reduced || blocked ? undefined : { scale: 0.97 }}
        className={`group/add relative inline-flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-[12px] font-heading font-semibold uppercase tracking-wider transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black disabled:cursor-not-allowed disabled:opacity-50 ${
          size === 'lg' ? 'min-h-[52px] px-6 text-base' : 'min-h-[48px] px-5 text-sm'
        } ${base}`}
      >
        {/* One pass of light on hover; skipped when motion is reduced. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition-[left,opacity] duration-700 group-hover/add:left-[120%] group-hover/add:opacity-100 motion-reduce:hidden"
        />
        {added ? (
          <Check aria-hidden className="h-5 w-5" />
        ) : (
          <ShoppingCart aria-hidden className="h-5 w-5" />
        )}
        {product.status === 'sold-out' ? 'Sold Out' : added ? 'Added to Cart' : 'Add to Cart'}
      </motion.button>

      <p
        id={statusId}
        role="status"
        aria-live="polite"
        className={`mt-2 min-h-[1.25rem] text-xs ${
          status.kind === 'error' ? 'text-rave-red' : 'text-rave-muted'
        }`}
      >
        {status.kind === 'idle' ? '' : status.message}
      </p>
    </div>
  );
}
