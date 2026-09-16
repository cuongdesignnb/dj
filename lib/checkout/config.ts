// Which checkout backend is in use. Read on the server only.
//
//   live     — NEXT_PUBLIC_CHECKOUT_ENABLED=true and NEXT_PUBLIC_API_BASE_URL set.
//              The backend creates the Stripe Checkout Session and verifies it.
//   mock     — CHECKOUT_MOCK=true (server-only, never set in production).
//              Simulated sessions for local development and testing.
//   disabled — anything else. Checkout is shown as not yet available.
//
// No Stripe secret is read here or anywhere in this app: session creation
// and verification belong to the backend.

export type CheckoutMode = 'live' | 'mock' | 'disabled';

export function getCheckoutMode(): CheckoutMode {
  if (process.env.CHECKOUT_MOCK === 'true') return 'mock';

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
