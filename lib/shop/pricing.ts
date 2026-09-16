// Price arithmetic for merchandise. Integer minor units throughout, so no
// float ever touches a price.

import { formatMoney } from '@/lib/money';
import type { Money } from '@/lib/money';
import type { Product, ProductVariant } from './types';

export { formatMoney };

/** A variant's own price wins over the product price. */
export function unitPrice(product: Product, variant: ProductVariant | null): Money {
  return variant?.price ?? product.price;
}

export function multiply(money: Money, quantity: number): Money {
  return { amountMinor: money.amountMinor * quantity, currency: money.currency };
}

/**
 * Sums lines that share a currency. Mixed currencies have no honest total, so
 * the answer is null rather than a number that means nothing.
 */
export function sum(amounts: Money[]): Money | null {
  if (amounts.length === 0) return null;
  const currency = amounts[0].currency;
  if (amounts.some((m) => m.currency !== currency)) return null;
  return {
    amountMinor: amounts.reduce((total, m) => total + m.amountMinor, 0),
    currency,
  };
}
