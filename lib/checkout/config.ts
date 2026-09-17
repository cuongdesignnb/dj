// Which checkout backend is in use. The browser only receives a relative
// checkout-intent URL; Square credentials never enter this module.
// The browser is always sent to the backend for pricing and the hosted
// payment session; there is no local checkout simulation.
//
export type CheckoutMode = 'live' | 'disabled';

export function getCheckoutMode(): CheckoutMode {
  const enabled = process.env.NEXT_PUBLIC_CHECKOUT_ENABLED === 'true';
  const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.INTERNAL_API_BASE_URL ?? '').trim();
  return enabled && baseUrl ? 'live' : 'disabled';
}

export function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.INTERNAL_API_BASE_URL ?? process.env.APP_URL ?? '').trim().replace(/\/$/, '');
}

/**
 * A checkout session reference as returned by the payment provider. Anything
 * else is refused before it reaches a repository.
 */
export function parseCheckoutId(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)
    ? trimmed
    : null;
}

/** @deprecated Kept as a source-compatible alias for older result components. */
export const parseSessionId = parseCheckoutId;
