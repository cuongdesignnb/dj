// Cart totals. Integer minor units only; derived values are recomputed from
// lines every time and never stored.

import { multiply, sum } from '@/lib/shop/pricing';
import type { Money } from '@/lib/shop/types';
import type { CartLine } from './types';

export function lineTotal(line: Pick<CartLine, 'unitPrice' | 'quantity'>): Money {
  return multiply(line.unitPrice, line.quantity);
}

export function itemCount(lines: Pick<CartLine, 'quantity'>[]): number {
  return lines.reduce((total, line) => total + line.quantity, 0);
}

/** Null when there is nothing to total or the currencies do not agree. */
export function subtotal(lines: Pick<CartLine, 'unitPrice' | 'quantity'>[]): Money | null {
  return sum(lines.map(lineTotal));
}

/**
 * Subtotal less a service-confirmed discount. Shipping and tax are unknown
 * until checkout, so this is an estimate and is labelled as one.
 */
export function estimatedTotal(sub: Money | null, discount?: Money | null): Money | null {
  if (!sub) return null;
  if (!discount || discount.currency !== sub.currency) return sub;
  return {
    amountMinor: Math.max(0, sub.amountMinor - discount.amountMinor),
    currency: sub.currency,
  };
}
