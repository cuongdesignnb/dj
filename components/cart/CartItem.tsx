'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { TriangleAlert, X } from 'lucide-react';
import QuantityControl from '@/components/shop/QuantityControl';
import { sessionCartAdapter } from '@/lib/cart/adapter';
import { optionLabel } from '@/lib/cart/input';
import { lineTotal } from '@/lib/cart/pricing';
import type { ReviewedLine } from '@/lib/cart/validation';
import { categoryLabel } from '@/lib/shop/helpers';
import { formatMoney } from '@/lib/shop/pricing';

/** Links only to products that still exist, so nothing points at a 404. */
function MaybeLink({
  href,
  children,
  ...rest
}: {
  href: string | null;
  children: React.ReactNode;
  className?: string;
  tabIndex?: number;
  'aria-hidden'?: boolean;
}) {
  if (!href) return <span {...rest}>{children}</span>;
  return (
    <Link href={href} {...rest}>
      {children}
    </Link>
  );
}

/** One cart line: image, options, quantity, line total and remove. */
export default function CartItem({
  reviewed,
  index = 0,
}: {
  reviewed: ReviewedLine;
  index?: number;
}) {
  const reduced = useReducedMotion();
  const { line, product, issue, price, maxQuantity } = reviewed;
  const unavailable = issue?.kind === 'unavailable';
  const total = formatMoney(lineTotal({ unitPrice: price, quantity: line.quantity }));
  const options = optionLabel(line);
  const labelBase = `${line.title}${options ? ` (${options})` : ''}`;
  const quantityLabelId = `qty-${line.id}`;
  const href = `/shop/${line.productSlug}`;
  const color = product?.colors.find((c) => c.name === line.colorLabel);

  return (
    <motion.li
      layout={reduced ? false : 'position'}
      initial={{ opacity: 0, y: reduced ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index, 5) * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="overflow-hidden"
    >
      <article
        aria-label={labelBase}
        className={`relative flex flex-col gap-4 rounded-[16px] border bg-rave-deep/80 p-3 sm:flex-row sm:gap-5 ${
          unavailable ? 'border-rave-red/50' : 'border-white/[0.08]'
        }`}
      >
        <MaybeLink
          href={product ? href : null}
          tabIndex={-1}
          aria-hidden
          className="relative block aspect-[4/3] w-full shrink-0 overflow-hidden rounded-[12px] border border-rave-red/30 sm:aspect-[4/5] sm:w-[150px] md:w-[170px]"
        >
          <Image
            src={line.image.src}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 170px"
            className={`object-cover object-[center_40%] ${unavailable ? 'opacity-40 grayscale' : ''}`}
          />
          {product && (
            <span className="absolute left-2 top-2 rounded-[6px] border border-rave-red/60 bg-black/70 px-2 py-0.5 font-heading text-[10px] font-semibold uppercase tracking-[0.16em] text-rave-red">
              {categoryLabel(product.category)}
            </span>
          )}
        </MaybeLink>

        <div className="flex min-w-0 flex-1 flex-col gap-3 pr-10 sm:py-1">
          <h3 className="font-heading text-xl font-bold uppercase leading-tight tracking-[0.02em] text-white sm:text-2xl">
            <MaybeLink
              href={product ? href : null}
              className="hover:text-rave-red focus:outline-none focus-visible:underline"
            >
              {line.title}
            </MaybeLink>
          </h3>
          {product?.excerpt && (
            <p className="line-clamp-3 max-w-md text-sm leading-relaxed text-rave-muted">
              {product.excerpt}
            </p>
          )}

          {issue && (
            <p
              className={`flex items-start gap-2 rounded-[10px] border px-3 py-2 text-sm ${
                unavailable
                  ? 'border-rave-red/50 bg-rave-red/10 text-white'
                  : 'border-white/15 bg-white/[0.04] text-white/90'
              }`}
            >
              <TriangleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-rave-red" />
              {issue.kind === 'unavailable'
                ? `${issue.message} Remove it to continue to checkout.`
                : `Price updated from ${formatMoney(issue.previous)} to ${formatMoney(issue.current)}. The current price applies.`}
            </p>
          )}

          {(line.sizeLabel || line.colorLabel) && (
            <dl className="flex flex-wrap gap-x-8 gap-y-3">
              {line.sizeLabel && (
                <div>
                  <dt className="text-xs text-rave-muted">Size</dt>
                  <dd className="mt-1 grid min-h-[40px] min-w-[64px] place-items-center rounded-[8px] border border-white/20 px-3 font-heading text-sm font-semibold text-white">
                    {line.sizeLabel}
                  </dd>
                </div>
              )}
              {line.colorLabel && (
                <div>
                  <dt className="text-xs text-rave-muted">Color</dt>
                  <dd className="mt-1 flex min-h-[40px] items-center gap-2.5 text-sm text-white">
                    <span
                      aria-hidden
                      className="grid h-8 w-8 place-items-center rounded-full border-2 border-rave-red"
                    >
                      <span
                        className="h-5 w-5 rounded-full border border-white/20"
                        style={{ backgroundColor: color?.hex ?? '#1a1a1f' }}
                      />
                    </span>
                    {line.colorLabel}
                  </dd>
                </div>
              )}
            </dl>
          )}

          <div className="mt-auto flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-center gap-3">
              <span id={quantityLabelId} className="text-sm text-white">
                Quantity<span className="sr-only"> of {labelBase}</span>
              </span>
              {unavailable ? (
                <span className="font-heading text-lg text-white/60">{line.quantity}</span>
              ) : (
                <QuantityControl
                  value={line.quantity}
                  onChange={(next) => sessionCartAdapter.updateQuantity(line.id, next)}
                  max={maxQuantity}
                  labelId={quantityLabelId}
                />
              )}
            </div>

            <div className="text-right">
              <div className="relative h-9 overflow-hidden">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.p
                    key={total}
                    initial={{ opacity: 0, scale: reduced ? 1 : 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`font-heading text-3xl font-bold leading-9 ${unavailable ? 'text-white/40 line-through' : 'text-white'}`}
                  >
                    {total}
                  </motion.p>
                </AnimatePresence>
              </div>
              <p className="text-xs text-rave-muted">
                {unavailable ? 'Not included' : 'Line Total'}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => sessionCartAdapter.removeItem(line.id)}
          aria-label={`Remove ${labelBase} from cart`}
          className="absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-full bg-black/60 text-white/80 sm:bg-transparent transition-colors hover:bg-rave-red/10 hover:text-rave-red focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red"
        >
          <X aria-hidden className="h-5 w-5" />
        </button>
      </article>
    </motion.li>
  );
}
