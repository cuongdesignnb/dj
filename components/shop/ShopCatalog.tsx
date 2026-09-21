'use client';

import { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
  ArrowRight,
  Check,
  Image as ImageIcon,
  LayoutGrid,
  Package,
  Shirt,
  Sticker,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Container from '@/components/ui/Container';
import { articleImageReveal, shopReveal, shopStagger } from '@/lib/animations';
import {
  PRODUCT_FILTERS,
  filterLabel,
  getDefaultProductSelection,
  matchesFilter,
  primaryImage,
} from '@/lib/shop/helpers';
import { formatMoney } from '@/lib/shop/pricing';
import type { Product, ProductFilter, ShopPageData } from '@/lib/shop/types';
import type { PublicListingEmptyState, PublicListingSection } from '@/lib/cms/public-page';
import ListingEmptyState from '@/components/shared/ListingEmptyState';
import AddToCartButton from './AddToCartButton';
import ProductCard from './ProductCard';
import SectionHeading from './SectionHeading';
import { SHOP_ICONS } from './icons';

const GRID_ID = 'merchandise-grid';

const FILTER_ICONS: Record<ProductFilter, LucideIcon> = {
  all: LayoutGrid,
  apparel: Shirt,
  accessories: Package,
  posters: ImageIcon,
  collectibles: Sticker,
};

function FeaturedProduct({
  product,
  highlights,
  animate,
}: {
  product: Product;
  highlights: ShopPageData['featuredHighlights'];
  animate: boolean;
}) {
  const image = primaryImage(product)?.image;
  const selection = getDefaultProductSelection(product);
  // Straight-to-cart only works when the product page's defaults are complete.
  const canQuickAdd =
    (product.sizes.length === 0 || !!selection.sizeId) &&
    (product.colors.length === 0 || !!selection.colorId);

  return (
    <motion.div
      variants={shopStagger}
      initial="hidden"
      animate={animate ? 'visible' : 'hidden'}
      className="relative mt-6 overflow-hidden rounded-[20px] border border-rave-red/40 bg-rave-panel/70 shadow-[0_0_40px_rgba(255,23,61,0.12)]"
    >
      <div className="grid grid-cols-1 items-stretch lg:grid-cols-2">
        <motion.div
          variants={articleImageReveal}
          className="relative aspect-[4/3] w-full bg-rave-deep lg:aspect-auto lg:min-h-[340px]"
        >
          {image && (
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-[center_40%]"
            />
          )}
          {product.badge && (
            <span className="absolute left-4 top-4 rounded-[6px] border border-rave-red bg-black/70 px-3 py-1 font-heading text-xs font-semibold uppercase tracking-[0.2em] text-rave-red backdrop-blur-sm">
              {product.badge}
            </span>
          )}
        </motion.div>

        <div className="flex flex-col justify-center gap-4 p-6 sm:p-8">
          <motion.p
            variants={shopReveal}
            className="font-heading text-xs font-semibold uppercase tracking-[0.26em] text-rave-red"
          >
            Featured Product
          </motion.p>
          <motion.h3
            variants={shopReveal}
            className="font-heading text-3xl font-black uppercase leading-[1.02] tracking-tight text-white sm:text-4xl"
          >
            {product.title}
          </motion.h3>
          <motion.p variants={shopReveal} className="max-w-xl text-sm leading-relaxed text-rave-muted sm:text-base">
            {product.excerpt}
          </motion.p>

          {highlights.length > 0 && (
            <motion.ul variants={shopReveal} className="flex flex-wrap gap-x-5 gap-y-2">
              {highlights.map(({ label, icon }) => {
                const Icon = SHOP_ICONS[icon];
                return (
                  <li key={label} className="inline-flex items-center gap-2 text-sm text-white/90">
                    <Icon aria-hidden className="h-4 w-4 text-rave-red" />
                    {label}
                  </li>
                );
              })}
            </motion.ul>
          )}

          <motion.p variants={shopReveal} className="font-heading text-4xl font-bold text-white">
            <span className="sr-only">Price </span>
            {formatMoney(product.price)}
          </motion.p>

          <motion.div variants={shopReveal} className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2">
            <Link
              href={`/shop/${product.slug}`}
              className="group/cta inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[12px] bg-gradient-to-r from-rave-red to-rave-red2 px-5 font-heading text-sm font-semibold uppercase tracking-wider text-white shadow-[0_0_22px_rgba(255,23,61,0.35)] transition-all duration-300 hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black"
            >
              View Product
              <ArrowRight aria-hidden className="h-4 w-4 transition-transform group-hover/cta:translate-x-1" />
            </Link>
            {canQuickAdd ? (
              <AddToCartButton
                product={product}
                selection={selection}
                quantity={1}
                tone="secondary"
                size="md"
              />
            ) : (
              <Link
                href={`/shop/${product.slug}`}
                className="inline-flex min-h-[48px] items-center justify-center rounded-[12px] border border-white/25 px-5 font-heading text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:border-rave-red/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red"
              >
                Choose Options
              </Link>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Category filter, featured drop and the product grid. Filtering is local; the
 * URL mirrors the choice so a filtered view can be shared or reloaded.
 */
export default function ShopCatalog({
  products,
  featured,
  featuredHighlights,
  initialFilter = 'all',
  browseSection,
  featuredSection,
  catalogSection,
  filterLabel: filterAriaLabel = 'Filter merchandise by category',
  filterOptions,
  emptyState,
}: {
  products: Product[];
  featured: Product | null | undefined;
  featuredHighlights: ShopPageData['featuredHighlights'];
  initialFilter?: ProductFilter;
  browseSection?: PublicListingSection;
  featuredSection?: PublicListingSection;
  catalogSection?: PublicListingSection;
  filterLabel?: string;
  filterOptions?: string[];
  emptyState?: PublicListingEmptyState;
}) {
  const browseRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLElement>(null);
  const browseInView = useInView(browseRef, { once: true, margin: '-80px' });
  const gridInView = useInView(gridRef, { once: true, margin: '-80px' });

  const [filter, setFilter] = useState<ProductFilter>(initialFilter);
  const visible = useMemo(
    () => products.filter((product) => matchesFilter(product, filter)),
    [products, filter],
  );
  const showFeatured = !!featured && featuredSection?.enabled !== false && matchesFilter(featured, filter);

  const select = (next: ProductFilter) => {
    setFilter(next);
    const params = new URLSearchParams(window.location.search);
    if (next === 'all') params.delete('category');
    else params.set('category', next);
    const query = params.toString();
    window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname);
  };

  return (
    <>
      {browseSection?.enabled !== false && (
        <section
          ref={browseRef}
          id="browse-merchandise"
          aria-labelledby="browse-merchandise-title"
          className="relative scroll-mt-[100px] bg-rave-black pt-4 pb-10 md:pb-14"
        >
          <Container>
            <SectionHeading
              id="browse-merchandise-title"
              title={browseSection?.title ?? 'Browse Merchandise'}
              context={browseSection?.description ?? 'Same People — A Brighter Tomorrow'}
            />

          <div
            role="group"
            aria-label={filterAriaLabel}
            className="mt-6 flex flex-wrap gap-2.5 sm:gap-3"
          >
            {PRODUCT_FILTERS.map((option) => {
              const active = option === filter;
              const Icon = FILTER_ICONS[option];
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={active}
                  aria-controls={GRID_ID}
                  onClick={() => select(option)}
                  className={`relative inline-flex min-h-[48px] items-center gap-2.5 rounded-[12px] border px-5 font-heading text-sm font-semibold uppercase tracking-wider transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black ${
                    active
                      ? 'border-rave-red bg-rave-red text-white shadow-[0_0_20px_rgba(255,23,61,0.35)]'
                      : 'border-white/[0.14] bg-white/[0.02] text-white/85 hover:border-white/35 hover:text-white'
                  }`}
                >
                  {active ? (
                    <Check aria-hidden className="h-4 w-4" />
                  ) : (
                    <Icon aria-hidden className="h-4 w-4 text-rave-red" />
                  )}
                  {filterOptions?.[PRODUCT_FILTERS.indexOf(option)] || filterLabel(option)}
                </button>
              );
            })}
          </div>
          </Container>
        </section>
      )}

      {showFeatured && featured && (
        <section aria-labelledby="featured-drop-title" className="bg-rave-black pb-14 md:pb-20">
          <Container>
            <SectionHeading
              id="featured-drop-title"
              title={featuredSection?.title ?? 'Featured Drop'}
              context={featuredSection?.description ?? 'Limited Quantities — Exclusive Designs'}
            />
            <FeaturedProduct
              product={featured}
              highlights={featuredHighlights}
              animate={browseInView}
            />
          </Container>
        </section>
      )}

      {catalogSection?.enabled !== false && (
        <section
          ref={gridRef}
          aria-labelledby="all-merchandise-title"
          className="bg-rave-black pb-16 md:pb-24"
        >
          <Container>
            <SectionHeading
              id="all-merchandise-title"
              title={
                filter === 'all'
                  ? catalogSection?.title ?? 'All Merchandise'
                  : filterOptions?.[PRODUCT_FILTERS.indexOf(filter)] || filterLabel(filter)
              }
              context={catalogSection?.description ?? 'Wear the Movement'}
            />

          <p role="status" aria-live="polite" className="sr-only">
            {visible.length === 1 ? '1 product shown' : `${visible.length} products shown`}
          </p>

          {visible.length > 0 ? (
            <motion.div
              id={GRID_ID}
              key={filter}
              variants={shopStagger}
              initial="hidden"
              animate={gridInView ? 'visible' : 'hidden'}
              className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
            >
              {visible.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 3} />
              ))}
            </motion.div>
          ) : (
            <div
              id={GRID_ID}
              className="mt-6 rounded-[18px] border border-white/[0.08] bg-rave-panel/60 px-6 py-14 text-center"
            >
              <ListingEmptyState
                state={emptyState}
                fallbackTitle={
                  products.length === 0
                    ? 'The merchandise collection is being prepared.'
                    : 'Nothing in this category yet.'
                }
                fallbackDescription="New products will appear here."
              />
            </div>
          )}
          </Container>
        </section>
      )}
    </>
  );
}
