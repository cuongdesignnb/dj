// Which checkout backend is in use. Read on the server only.
// The browser is always sent to the backend for pricing and the hosted
// payment session; there is no local checkout simulation.
//
// No Stripe secret is read here or anywhere in this app: session creation
// and verification belong to the backend.

export type CheckoutMode = 'live' | 'disabled';

export function getCheckoutMode(): CheckoutMode {
  const enabled = process.env.NEXT_PUBLIC_CHECKOUT_ENABLED === 'true';
  const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').trim();
  return enabled && baseUrl ? 'live' : 'disabled';
}

export function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').trim().replace(/\/$/, '');
}

/**
 * A checkout session reference as returned by the payment provider. Anything
 * else is refused before it reaches a repository.
 */
export function parseSessionId(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return /^[A-Za-z0-9_]{8,255}$/.test(trimmed) ? trimmed : null;
}
