'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Gem, Shirt, Star } from 'lucide-react';
import { shopReveal, shopStagger } from '@/lib/animations';
import {
  getDefaultProductSelection,
  requiresColor,
  requiresSize,
  resolveVariant,
} from '@/lib/shop/helpers';
import type { ProductSelection } from '@/lib/shop/helpers';
import { formatMoney, unitPrice } from '@/lib/shop/pricing';
import type { Product } from '@/lib/shop/types';
import AddToCartButton from './AddToCartButton';
import QuantityControl from './QuantityControl';
import { ColorSelector, SizeSelector } from './ProductVariantSelector';

// Feature chips cycle through a small set of glyphs; the labels carry meaning.
const CHIP_ICONS = [Gem, Shirt, Star];

/** Title, price, options and Add to Cart for one product. */
export default function ProductInfo({ product }: { product: Product }) {
  const sizeLabelId = useId();
  const colorLabelId = useId();
  const quantityLabelId = useId();

  const [selection, setSelection] = useState<ProductSelection>(() =>
    getDefaultProductSelection(product),
  );
  const [quantity, setQuantity] = useState(1);

  const variant = resolveVariant(product, selection.sizeId, selection.colorId);
  const price = unitPrice(product, variant);
  const selectedColor = product.colors.find((c) => c.id === selection.colorId);

  return (
    <motion.div
      variants={shopStagger}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-6 rounded-[20px] border border-white/[0.08] bg-rave-panel/70 p-5 sm:p-7"
    >
      <motion.div variants={shopReveal} className="flex flex-wrap items-center justify-between gap-3">
        {product.badge ? (
          <span className="rounded-[6px] border border-rave-red px-3 py-1 font-heading text-xs font-semibold uppercase tracking-[0.2em] text-rave-red">
            {product.badge}
          </span>
        ) : (
          <span />
        )}
        <span className="font-heading text-[10px] uppercase tracking-[0.26em] text-rave-muted">
          Same People — A Brighter Tomorrow
        </span>
      </motion.div>

      <div>
        <motion.h1
          variants={shopReveal}
          className="font-heading text-4xl font-black uppercase leading-[1] tracking-tight text-white sm:text-5xl"
        >
          {product.title}
        </motion.h1>
        <motion.p
          variants={shopReveal}
          className="mt-4 text-base leading-relaxed text-rave-muted sm:text-lg"
        >
          {product.excerpt}
        </motion.p>
      </div>

      {product.featureLabels.length > 0 && (
        <motion.ul variants={shopReveal} className="flex flex-wrap gap-x-6 gap-y-3">
          {product.featureLabels.map((label, i) => {
            const Icon = CHIP_ICONS[i % CHIP_ICONS.length];
            return (
              <li key={label} className="inline-flex items-center gap-2 text-sm text-white/90">
                <Icon aria-hidden className="h-5 w-5 text-rave-red" />
                {label}
              </li>
            );
          })}
        </motion.ul>
      )}

      <motion.p variants={shopReveal} className="font-heading text-5xl font-bold text-white">
        <span className="sr-only">Price </span>
        {formatMoney(price)}
      </motion.p>

      {requiresSize(product) && (
        <motion.div variants={shopReveal}>
          <p id={sizeLabelId} className="mb-3 font-heading text-sm font-semibold uppercase tracking-wider text-white">
            Size
            {!selection.sizeId && (
              <span className="ml-2 normal-case tracking-normal text-rave-muted">— select a size</span>
            )}
          </p>
          <SizeSelector
            sizes={product.sizes}
            selectedId={selection.sizeId}
            onSelect={(sizeId) => setSelection((s) => ({ ...s, sizeId }))}
            labelId={sizeLabelId}
          />
        </motion.div>
      )}

      {requiresColor(product) && (
        <motion.div variants={shopReveal}>
          <p id={colorLabelId} className="mb-3 font-heading text-sm font-semibold uppercase tracking-wider text-white">
            Color
            {selectedColor && (
              <span className="sr-only">: {selectedColor.name}</span>
            )}
          </p>
          <ColorSelector
            colors={product.colors}
            selectedId={selection.colorId}
            onSelect={(colorId) => setSelection((s) => ({ ...s, colorId }))}
            labelId={colorLabelId}
          />
        </motion.div>
      )}

      <motion.div variants={shopReveal} className="flex flex-wrap items-center gap-4">
        <p id={quantityLabelId} className="font-heading text-sm font-semibold uppercase tracking-wider text-white">
          Quantity
        </p>
        <QuantityControl
          value={quantity}
          onChange={setQuantity}
          max={typeof variant?.stockQuantity === 'number' ? variant.stockQuantity : null}
          labelId={quantityLabelId}
        />
      </motion.div>

      <motion.div variants={shopReveal} className="flex flex-col gap-3">
        <AddToCartButton product={product} selection={selection} quantity={quantity} />
        <Link
          href="/shop"
          className="group/cta inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[12px] border border-white/25 bg-white/[0.02] px-6 font-heading text-sm font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:border-rave-red/60 hover:bg-rave-red/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black"
        >
          Continue Shopping
          <ArrowRight aria-hidden className="h-4 w-4 transition-transform group-hover/cta:translate-x-1" />
        </Link>
        <p className="text-center text-xs text-rave-muted">
          Merchandise preview — checkout flow to be confirmed.
        </p>
      </motion.div>
    </motion.div>
  );
}
