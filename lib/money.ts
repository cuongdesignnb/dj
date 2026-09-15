// Shared money model.
//
// Amounts are integer minor units so no float ever touches a price, and the
// formatter is hand-rolled rather than Intl-based: these values render on the
// server and hydrate on the client, and a locale-dependent format would differ
// between the two.

export interface Money {
  /** Integer amount in the currency's smallest unit — 320000 is $3,200.00. */
  amountMinor: number;
  /** ISO 4217 code, used for arithmetic and symbol lookup, not shown as text. */
  currency: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  AUD: '$',
  NZD: '$',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

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
