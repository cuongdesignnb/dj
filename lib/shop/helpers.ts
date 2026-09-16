import type {
  Product,
  ProductCategory,
  ProductFilter,
  ProductImage,
  ProductVariant,
} from './types';

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  apparel: 'Apparel',
  accessories: 'Accessories',
  posters: 'Posters',
  collectibles: 'Collectibles',
};

export const PRODUCT_FILTERS: ProductFilter[] = [
  'all',
  'apparel',
  'accessories',
  'posters',
  'collectibles',
];

export function categoryLabel(category: ProductCategory): string {
  return CATEGORY_LABELS[category];
}

export function filterLabel(filter: ProductFilter): string {
  return filter === 'all' ? 'All' : CATEGORY_LABELS[filter];
}

export function parseProductFilter(value: string | string[] | undefined): ProductFilter {
  const raw = (Array.isArray(value) ? value[0] : value)?.trim().toLowerCase();
  return PRODUCT_FILTERS.find((filter) => filter === raw) ?? 'all';
}

export function matchesFilter(product: Product, filter: ProductFilter): boolean {
  return filter === 'all' || product.category === filter;
}

/** Catalogue order: explicit sort order, then title, so it never shuffles. */
export function sortProducts(products: Product[]): Product[] {
  return [...products].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title),
  );
}

export function sortedImages(product: Product): ProductImage[] {
  return [...product.images].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function primaryImage(product: Product): ProductImage | null {
  return sortedImages(product)[0] ?? null;
}

// ---------------------------------------------------------------------------
// Selection and variants
// ---------------------------------------------------------------------------

export interface ProductSelection {
  sizeId: string | null;
  colorId: string | null;
}

/**
 * The product page's initial selection. A size is only preselected when the
 * product names one; a single colour is selected because there is no choice.
 */
export function getDefaultProductSelection(product: Product): ProductSelection {
  const size =
    product.defaultSizeId && product.sizes.some((s) => s.id === product.defaultSizeId)
      ? product.defaultSizeId
      : null;
  const color = product.colors.length === 1 ? product.colors[0].id : null;
  return { sizeId: size, colorId: color };
}

export function requiresSize(product: Product): boolean {
  return product.sizes.length > 0;
}

export function requiresColor(product: Product): boolean {
  return product.colors.length > 0;
}

/**
 * The variant for a selection, or null. A product without variants has
 * nothing to resolve; a product with variants only resolves once every
 * required option is chosen.
 */
export function resolveVariant(
  product: Product,
  sizeId: string | null,
  colorId: string | null,
): ProductVariant | null {
  if (product.variants.length === 0) return null;
  if (requiresSize(product) && !sizeId) return null;
  if (requiresColor(product) && !colorId) return null;

  return (
    product.variants.find(
      (variant) =>
        (variant.sizeId ?? null) === (requiresSize(product) ? sizeId : null) &&
        (variant.colorId ?? null) === (requiresColor(product) ? colorId : null),
    ) ?? null
  );
}

export function isPurchasableStatus(product: Product): boolean {
  // Preview products go into the local preview cart; nothing is sold.
  return product.status === 'preview' || product.status === 'active';
}

export type AddToCartCheck =
  | { ok: true; variant: ProductVariant | null }
  | { ok: false; reason: string };

/** Everything the Add to Cart button needs to know, in one place. */
export function validateAddToCart(
  product: Product | null | undefined,
  selection: ProductSelection,
  quantity: number,
): AddToCartCheck {
  if (!product) return { ok: false, reason: 'This product is not available.' };

  if (product.status === 'sold-out') return { ok: false, reason: 'Sold out.' };
  if (!isPurchasableStatus(product)) {
    return { ok: false, reason: 'This product is not available.' };
  }

  if (requiresSize(product)) {
    if (!selection.sizeId) return { ok: false, reason: 'Select a size.' };
    const size = product.sizes.find((s) => s.id === selection.sizeId);
    if (!size) return { ok: false, reason: 'Select a valid size.' };
    if (size.available === false) return { ok: false, reason: 'That size is unavailable.' };
  }

  if (requiresColor(product)) {
    if (!selection.colorId) return { ok: false, reason: 'Select a colour.' };
    if (!product.colors.some((c) => c.id === selection.colorId)) {
      return { ok: false, reason: 'Select a valid colour.' };
    }
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    return { ok: false, reason: 'Quantity must be at least 1.' };
  }

  const variant = resolveVariant(product, selection.sizeId, selection.colorId);
  if (product.variants.length > 0) {
    if (!variant) return { ok: false, reason: 'That combination is unavailable.' };
    if (variant.stockStatus === 'sold-out') {
      return { ok: false, reason: 'That option is sold out.' };
    }
    // A max only exists when real inventory supplies one.
    if (typeof variant.stockQuantity === 'number' && quantity > variant.stockQuantity) {
      return { ok: false, reason: 'That quantity is not available.' };
    }
  }

  return { ok: true, variant };
}

/** "M / Black" — the chosen options, for the cart and announcements. */
export function selectionLabel(product: Product, selection: ProductSelection): string {
  const parts: string[] = [];
  const size = product.sizes.find((s) => s.id === selection.sizeId);
  const color = product.colors.find((c) => c.id === selection.colorId);
  if (size) parts.push(size.label);
  if (color) parts.push(color.name);
  return parts.join(' / ');
}

// ---------------------------------------------------------------------------
// Related products
// ---------------------------------------------------------------------------

/** Which categories sit closest to each other, nearest first. */
const RELATED_CATEGORIES: Record<ProductCategory, ProductCategory[]> = {
  apparel: ['accessories', 'posters', 'collectibles'],
  accessories: ['apparel', 'collectibles', 'posters'],
  posters: ['collectibles', 'apparel', 'accessories'],
  collectibles: ['posters', 'accessories', 'apparel'],
};

/**
 * Recommendations for a set of anchor products (the product being viewed, the
 * cart, an order). Anchors are excluded; candidates rank by how close their
 * category sits to any anchor's, then by catalogue order. Fully deterministic.
 * With no anchors, featured products lead, then catalogue order.
 */
export function recommendProducts(
  anchors: Pick<Product, 'id' | 'category'>[],
  allProducts: Product[],
  limit = 4,
): Product[] {
  const excluded = new Set(anchors.map((a) => a.id));
  const rank = (candidate: Product) => {
    if (anchors.length === 0) return candidate.featured ? 0 : 1;
    return Math.min(
      ...anchors.map((anchor) => {
        const order = [anchor.category, ...RELATED_CATEGORIES[anchor.category]];
        const index = order.indexOf(candidate.category);
        return index === -1 ? order.length : index;
      }),
    );
  };

  return sortProducts(allProducts.filter((candidate) => !excluded.has(candidate.id)))
    .map((candidate, position) => ({ candidate, position }))
    .sort((a, b) => rank(a.candidate) - rank(b.candidate) || a.position - b.position)
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}

/** Same category first, then the nearest related categories, then catalogue order. */
export function getRelatedProducts(
  product: Product,
  allProducts: Product[],
  limit = 4,
): Product[] {
  return recommendProducts([product], allProducts, limit);
}
