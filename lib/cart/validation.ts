// Checks saved cart lines against the current catalogue.
//
// The saved price is a display snapshot. If the catalogue now says something
// different, the current price is shown and the change is called out — the
// shopper is never shown, or sent to checkout with, a stale price silently.

import { validateAddToCart } from '@/lib/shop/helpers';
import { unitPrice } from '@/lib/shop/pricing';
import type { Money, Product, ProductVariant } from '@/lib/shop/types';
import type { CartLine } from './types';

export type LineIssue =
  | { kind: 'unavailable'; message: string }
  | { kind: 'price-changed'; previous: Money; current: Money };

export interface ReviewedLine {
  line: CartLine;
  product: Product | null;
  variant: ProductVariant | null;
  /** The price that applies now: the catalogue's when known. */
  price: Money;
  issue: LineIssue | null;
  /** Only set when real inventory supplies a limit. */
  maxQuantity: number | null;
}

function sameMoney(a: Money, b: Money) {
  return a.amountMinor === b.amountMinor && a.currency === b.currency;
}

export function reviewLine(line: CartLine, products: Product[]): ReviewedLine {
  const unavailable = (message: string): ReviewedLine => ({
    line,
    product: null,
    variant: null,
    price: line.unitPrice,
    issue: { kind: 'unavailable', message },
    maxQuantity: null,
  });

  const product = products.find((p) => p.id === line.productId) ?? null;
  if (!product) return unavailable('This item is no longer available.');

  let variant: ProductVariant | null = null;
  if (product.variants.length > 0) {
    variant = product.variants.find((v) => v.id === line.variantId) ?? null;
    if (!variant) return { ...unavailable('This option is no longer available.'), product };
  }

  // Reuse the product page's rules so the cart and the page never disagree.
  const check = validateAddToCart(
    product,
    { sizeId: variant?.sizeId ?? null, colorId: variant?.colorId ?? null },
    1,
  );
  if (!check.ok) return { ...unavailable(check.reason), product, variant };

  const current = unitPrice(product, variant);
  const maxQuantity = typeof variant?.stockQuantity === 'number' ? variant.stockQuantity : null;

  return {
    line,
    product,
    variant,
    price: current,
    issue: sameMoney(current, line.unitPrice)
      ? null
      : { kind: 'price-changed', previous: line.unitPrice, current },
    maxQuantity,
  };
}

export function reviewCart(lines: CartLine[], products: Product[]): ReviewedLine[] {
  return lines.map((line) => reviewLine(line, products));
}

export function hasBlockingIssue(reviewed: ReviewedLine[]): boolean {
  return reviewed.some(
    (r) =>
      r.issue?.kind === 'unavailable' ||
      (r.maxQuantity !== null && r.line.quantity > r.maxQuantity),
  );
}
