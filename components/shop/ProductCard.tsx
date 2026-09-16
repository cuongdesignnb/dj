'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { shopReveal } from '@/lib/animations';
import { categoryLabel, primaryImage } from '@/lib/shop/helpers';
import { formatMoney } from '@/lib/shop/pricing';
import type { Product } from '@/lib/shop/types';

/**
 * One product in a grid. The whole card is a single link to the product page;
 * hover is CSS so a grid of cards costs nothing to animate.
 */
export default function ProductCard({
  product,
  priority = false,
  headingLevel = 'h3',
}: {
  product: Product;
  priority?: boolean;
  headingLevel?: 'h2' | 'h3';
}) {
  const image = primaryImage(product)?.image;
  const Heading = headingLevel;

  return (
    <motion.article variants={shopReveal} className="h-full">
      <Link
        href={`/shop/${product.slug}`}
        className={`group/card flex h-full flex-col overflow-hidden rounded-[18px] border bg-rave-panel/70 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1.5 hover:border-rave-red/70 hover:shadow-[0_22px_60px_rgba(255,23,61,0.22)] focus:outline-none focus-visible:-translate-y-1.5 focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black motion-reduce:transform-none ${
          product.featured ? 'border-rave-red/45' : 'border-white/[0.08]'
        }`}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-rave-deep">
          {image && (
            <Image
              src={image.src}
              alt={image.alt}
              fill
              priority={priority}
              loading={priority ? undefined : 'lazy'}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover object-[center_40%] transition-transform duration-500 ease-out group-hover/card:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover/card:scale-100"
            />
          )}
          <span className="absolute left-3 top-3 rounded-[6px] border border-rave-red/60 bg-black/70 px-2 py-1 font-heading text-[10px] font-semibold uppercase tracking-[0.16em] text-rave-red backdrop-blur-sm">
            {categoryLabel(product.category)}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
          <Heading className="font-heading text-lg font-bold uppercase leading-tight tracking-[0.02em] text-white sm:text-xl">
            {product.title}
          </Heading>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
            <p className="font-heading text-2xl font-bold text-white">
              <span className="sr-only">Price </span>
              {formatMoney(product.price)}
            </p>
            <span className="inline-flex min-h-[40px] items-center gap-2 rounded-[10px] border border-white/20 px-4 font-heading text-xs font-semibold uppercase tracking-wider text-white transition-colors duration-300 group-hover/card:border-rave-red group-hover/card:bg-rave-red/10">
              View Product
              <ArrowRight
                aria-hidden
                className="h-3.5 w-3.5 transition-transform duration-300 group-hover/card:translate-x-[3px]"
              />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
