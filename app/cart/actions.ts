'use server';

// Server Functions for /cart. Like any Server Function these are reachable by
// a direct POST, so every input is validated here, and nothing the browser
// sends is trusted as a price.

import { getApiBaseUrl, getCheckoutMode } from '@/lib/checkout/config';
import { createMockCheckoutSession } from '@/lib/checkout/mock';
import { normalizeMoney } from '@/lib/shop/http';
import type {
  CheckoutLineRequest,
  CheckoutSessionRequest,
  CheckoutSessionResult,
  PromoResult,
} from '@/lib/cart/types';

const MAX_LINES = 50;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseRequest(raw: unknown): CheckoutSessionRequest | null {
  if (!isRecord(raw) || !Array.isArray(raw.lines)) return null;
  if (raw.lines.length === 0 || raw.lines.length > MAX_LINES) return null;
  if (typeof raw.clientReference !== 'string' || !/^[A-Za-z0-9-]{8,64}$/.test(raw.clientReference)) {
    return null;
  }

  const lines: CheckoutLineRequest[] = [];
  for (const line of raw.lines) {
    if (!isRecord(line)) return null;
    const { productId, variantId, quantity } = line;
    if (typeof productId !== 'string' || !/^[A-Za-z0-9-]{1,120}$/.test(productId)) return null;
    if (variantId != null && (typeof variantId !== 'string' || !/^[A-Za-z0-9-]{1,160}$/.test(variantId))) {
      return null;
    }
    // A sanity bound on the request, not a stock limit — the backend owns stock.
    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1 || quantity > 999) {
      return null;
    }
    lines.push({ productId, variantId: variantId ?? null, quantity });
  }

  const promoCode =
    typeof raw.promoCode === 'string' && /^[A-Za-z0-9-]{2,32}$/.test(raw.promoCode)
      ? raw.promoCode.toUpperCase()
      : null;

  return { lines, promoCode, clientReference: raw.clientReference };
}

export async function createCheckoutSession(raw: unknown): Promise<CheckoutSessionResult> {
  const request = parseRequest(raw);
  if (!request) {
    return { status: 'error', message: 'Your cart could not be sent to checkout. Please refresh and try again.' };
  }

  const mode = getCheckoutMode();

  if (mode === 'disabled') {
    return { status: 'unavailable', message: 'Merchandise checkout is not available yet.' };
  }

  if (mode === 'mock') {
    const session = createMockCheckoutSession(request);
    if (!session.ok) return { status: 'error', message: session.message };
    return {
      status: 'ready',
      checkoutUrl: `/checkout/result?session_id=${session.sessionId}`,
    };
  }

  // Live: the backend re-prices every line, creates the Stripe Checkout
  // Session and returns the hosted checkout URL.
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/checkout/session`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(request),
      cache: 'no-store',
    });
    const body: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        isRecord(body) && typeof body.message === 'string' && body.message.length <= 200
          ? body.message
          : 'Checkout could not be started. Please try again.';
      return { status: 'error', message };
    }

    const url = isRecord(body) && typeof body.checkoutUrl === 'string' ? body.checkoutUrl : '';
    // Only ever redirect to an https URL the backend returned.
    if (!/^https:\/\//.test(url)) {
      return { status: 'error', message: 'Checkout could not be started. Please try again.' };
    }
    return { status: 'ready', checkoutUrl: url };
  } catch {
    return { status: 'error', message: 'Checkout could not be reached. Please try again.' };
  }
}

export async function validatePromoCode(raw: unknown): Promise<PromoResult> {
  const code = typeof raw === 'string' ? raw.trim().toUpperCase() : '';
  if (!/^[A-Z0-9-]{2,32}$/.test(code)) {
    return { valid: false, code, message: 'Enter a valid promo code.' };
  }

  // Without a promotions service there is nothing to accept a code against.
  if (getCheckoutMode() !== 'live') {
    return { valid: false, code, message: 'Promo codes are not available yet.' };
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/promotions/validate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ code }),
      cache: 'no-store',
    });
    if (response.status === 404 || response.status === 501) {
      return { valid: false, code, message: 'Promo codes are not available yet.' };
    }
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok || !isRecord(body)) {
      return { valid: false, code, message: 'This code could not be checked. Please try again.' };
    }
    const message = typeof body.message === 'string' ? body.message.slice(0, 200) : undefined;
    if (body.valid !== true) {
      return { valid: false, code, message: message ?? 'This code is not valid.' };
    }
    return { valid: true, code, discount: normalizeMoney(body.discount), message };
  } catch {
    return { valid: false, code, message: 'This code could not be checked. Please try again.' };
  }
}
