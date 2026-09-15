import type { Money, TicketSelection, TicketTier } from './types';

// All ticket arithmetic lives here so no component computes a total of its own.
// Everything is integer minor units — no floating point touches money.

export interface TicketLineItem {
  tier: TicketTier;
  quantity: number;
  lineTotal: Money;
}

export function zeroMoney(currency: string): Money {
  return { amountMinor: 0, currency };
}

export function multiplyMoney(price: Money, quantity: number): Money {
  return { amountMinor: price.amountMinor * Math.max(0, Math.trunc(quantity)), currency: price.currency };
}

/**
 * Builds the selected line items in the order the tiers are declared, skipping
 * anything at zero. Tiers that cannot be bought online are never included: a
 * door ticket is information, not something this page can add to a total.
 */
export function buildSelectedLineItems(
  tiers: TicketTier[],
  selection: TicketSelection,
): TicketLineItem[] {
  return tiers.flatMap((tier) => {
    if (!tier.purchasableOnline) return [];
    const quantity = Math.max(0, Math.trunc(selection[tier.id] ?? 0));
    if (quantity === 0) return [];
    return [{ tier, quantity, lineTotal: multiplyMoney(tier.price, quantity) }];
  });
}

/**
 * Sums the selection. Falls back to the first tier's currency when nothing is
 * selected so the empty subtotal still formats.
 */
export function calculateTicketSubtotal(
  tiers: TicketTier[],
  selection: TicketSelection,
): Money {
  const items = buildSelectedLineItems(tiers, selection);
  const currency = items[0]?.lineTotal.currency ?? tiers[0]?.price.currency ?? 'AUD';

  const mixed = items.some((item) => item.lineTotal.currency !== currency);
  if (mixed) {
    // Currencies cannot be added. Callers should never produce this; failing
    // loudly beats showing a number that means nothing.
    throw new Error('Cannot total a selection that mixes currencies');
  }

  return {
    amountMinor: items.reduce((sum, item) => sum + item.lineTotal.amountMinor, 0),
    currency,
  };
}

export function totalTicketCount(tiers: TicketTier[], selection: TicketSelection): number {
  return buildSelectedLineItems(tiers, selection).reduce((sum, item) => sum + item.quantity, 0);
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  AUD: '$',
  NZD: '$',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

/**
 * Formats money for display.
 *
 * Hand-rolled rather than Intl-based on purpose: this renders on the server and
 * again on the client, and a locale-dependent format would differ between them.
 * The currency code is deliberately not shown — no code has been confirmed for
 * public copy, so only the symbol appears.
 */
export function formatMoney(money: Money): string {
  const symbol = CURRENCY_SYMBOLS[money.currency] ?? '';
  const negative = money.amountMinor < 0;
  const absolute = Math.abs(money.amountMinor);
  const units = Math.trunc(absolute / 100);
  const cents = absolute % 100;

  const grouped = String(units).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const body = cents === 0 ? grouped : `${grouped}.${String(cents).padStart(2, '0')}`;

  return `${negative ? '-' : ''}${symbol}${body}`;
}

/** Clamps a requested quantity to the tier's own bounds. */
export function clampQuantity(tier: TicketTier, requested: number): number {
  const min = Math.max(0, Math.trunc(tier.minQuantity));
  const value = Math.trunc(Number.isFinite(requested) ? requested : min);
  if (value < min) return min;
  if (typeof tier.maxQuantity === 'number' && value > tier.maxQuantity) {
    return tier.maxQuantity;
  }
  return value;
}

/** The starting selection, taken from the tiers rather than hardcoded in the UI. */
export function initialSelection(tiers: TicketTier[]): TicketSelection {
  const selection: TicketSelection = {};
  for (const tier of tiers) {
    if (!tier.purchasableOnline) continue;
    selection[tier.id] = clampQuantity(tier, tier.defaultQuantity ?? tier.minQuantity);
  }
  return selection;
}
