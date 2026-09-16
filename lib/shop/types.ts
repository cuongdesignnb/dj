// Canonical merchandise model, shared by /shop and /shop/[slug].
//
// `status` is the honesty switch. Every product is 'preview' until a real
// catalogue exists: the pages can show the design and a local cart, but
// nothing claims stock, shipping or a sale.

import type { Money } from '@/lib/money';
import type { EventsFooterData } from '@/lib/events/listing-types';

export type { Money };

export type ProductCategory = 'apparel' | 'accessories' | 'posters' | 'collectibles';

export type ProductFilter = 'all' | ProductCategory;

export type ProductStatus = 'preview' | 'active' | 'sold-out' | 'archived';

export interface MediaAsset {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface ProductImage {
  id: string;
  image: MediaAsset;
  /** Short name for the thumbnail button, e.g. "Front". */
  label?: string | null;
  sortOrder: number;
}

export interface ProductOptionValue {
  id: string;
  label: string;
  /** null or undefined means availability is unknown — never shown as a claim. */
  available?: boolean | null;
}

export interface ProductColor {
  id: string;
  name: string;
  hex?: string | null;
}

export type StockStatus = 'unknown' | 'available' | 'sold-out';

export interface ProductVariant {
  id: string;
  sizeId?: string | null;
  colorId?: string | null;
  /** Overrides the product price when set. */
  price?: Money | null;
  stockStatus: StockStatus;
  /** Only ever populated from a real inventory source. */
  stockQuantity?: number | null;
}

export type ShopIcon =
  | 'gem'
  | 'box'
  | 'music'
  | 'globe'
  | 'shirt'
  | 'star'
  | 'heart'
  | 'users'
  | 'file'
  | 'droplet'
  | 'sparkles'
  | 'card'
  | 'timer';

export interface ProductDetailSection {
  title: string;
  body: string;
  icon?: ShopIcon | null;
}

export interface ProductHighlight {
  title: string;
  description: string;
  icon?: ShopIcon | null;
}

export interface Product {
  id: string;
  slug: string;

  title: string;
  category: ProductCategory;
  status: ProductStatus;

  price: Money;
  badge?: string | null;

  excerpt: string;
  description?: string | null;

  images: ProductImage[];

  sizes: ProductOptionValue[];
  colors: ProductColor[];
  variants: ProductVariant[];
  /** Size preselected on the product page; null makes the shopper choose. */
  defaultSizeId?: string | null;

  featureLabels: string[];

  detailSections: ProductDetailSection[];
  collectionHighlights: ProductHighlight[];

  featured: boolean;
  sortOrder: number;

  seoTitle?: string | null;
  seoDescription?: string | null;
}

export interface LinkAction {
  label: string;
  href: string;
}

export interface ShopBenefit {
  id: string;
  title: string;
  description: string;
  icon: ShopIcon;
}

export interface ShopPageData {
  hero: {
    eyebrow: string;
    titleLines: string[];
    description: string;
    primaryCta: LinkAction;
    secondaryCta: LinkAction;
    /** Backdrop behind the product composition. */
    visual: MediaAsset;
    /** Transparent product cut-outs layered over the backdrop. */
    composition: MediaAsset[];
    sideNotes: string[];
  };

  featuredProduct?: Product | null;
  /** Chips shown on the featured drop. */
  featuredHighlights: { label: string; icon: ShopIcon }[];
  products: Product[];

  benefits: ShopBenefit[];
  /** The four-card row on each product page. */
  productBenefits: ShopBenefit[];

  finalCta: {
    title: string;
    description?: string;
    primary: LinkAction;
    secondary?: LinkAction;
    background?: MediaAsset;
  };

  footer: EventsFooterData;
}
