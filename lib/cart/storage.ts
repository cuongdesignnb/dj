// Versioned, validated persistence for the preview cart.
//
// sessionStorage: the cart survives a reload in the same tab and disappears
// when the tab closes. Only product ids, option labels, display prices and a
// promo code the service accepted are stored — no customer, payment or
// checkout-session data. Anything that fails validation is dropped.

import type { CartLine, CartLoadStatus, CartState } from './types';

export const CART_STORAGE_KEY = 'connection-rave:cart';
export const CART_STORAGE_VERSION = 2;

/** Older keys from earlier builds; cleared so they never linger. */
const LEGACY_KEYS = ['connection-rave:preview-cart'];

/** Opaque reference for the checkout currently in flight. */
const CHECKOUT_REF_KEY = 'connection-rave:checkout-ref';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 && value.length <= 80 ? value : null;
}

export function parseLine(raw: unknown): CartLine | null {
  if (!isRecord(raw)) return null;
  const { id, productId, productSlug, title, quantity, unitPrice, image } = raw;

  if (typeof id !== 'string' || typeof productId !== 'string') return null;
  if (typeof productSlug !== 'string' || !/^[a-z0-9-]{1,120}$/.test(productSlug)) return null;
  if (typeof title !== 'string' || title.length === 0 || title.length > 160) return null;
  if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1) return null;

  if (
    !isRecord(unitPrice) ||
    typeof unitPrice.amountMinor !== 'number' ||
    !Number.isInteger(unitPrice.amountMinor) ||
    unitPrice.amountMinor < 0 ||
    typeof unitPrice.currency !== 'string' ||
    !/^[A-Z]{3}$/.test(unitPrice.currency)
  ) {
    return null;
  }

  // Only same-origin image paths are accepted from storage.
  if (!isRecord(image) || typeof image.src !== 'string' || !image.src.startsWith('/')) {
    return null;
  }

  return {
    id,
    productId,
    productSlug,
    variantId: optionalString(raw.variantId),
    title,
    image: { src: image.src, alt: typeof image.alt === 'string' ? image.alt : '' },
    sizeLabel: optionalString(raw.sizeLabel),
    colorLabel: optionalString(raw.colorLabel),
    unitPrice: { amountMinor: unitPrice.amountMinor, currency: unitPrice.currency },
    quantity,
  };
}

export function readCart(): { state: CartState; status: CartLoadStatus } {
  const empty: CartState = { lines: [], promoCode: null };
  try {
    const legacy = LEGACY_KEYS.some((key) => window.sessionStorage.getItem(key) !== null);
    LEGACY_KEYS.forEach((key) => window.sessionStorage.removeItem(key));

    const stored = window.sessionStorage.getItem(CART_STORAGE_KEY);
    if (!stored) return { state: empty, status: legacy ? 'reset' : 'empty' };

    const parsed: unknown = JSON.parse(stored);
    if (
      !isRecord(parsed) ||
      parsed.version !== CART_STORAGE_VERSION ||
      !Array.isArray(parsed.lines)
    ) {
      window.sessionStorage.removeItem(CART_STORAGE_KEY);
      return { state: empty, status: 'reset' };
    }

    const lines = parsed.lines.flatMap((line) => {
      const valid = parseLine(line);
      return valid ? [valid] : [];
    });
    // Duplicate ids would make quantity updates ambiguous; keep the first.
    const unique = lines.filter((line, i) => lines.findIndex((l) => l.id === line.id) === i);

    return {
      state: { lines: unique, promoCode: optionalString(parsed.promoCode) },
      status: unique.length < parsed.lines.length ? 'reset' : unique.length ? 'ok' : 'empty',
    };
  } catch {
    try {
      window.sessionStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      // Storage unavailable entirely.
    }
    return { state: empty, status: 'reset' };
  }
}

export function writeCart(state: CartState) {
  try {
    if (state.lines.length === 0) {
      window.sessionStorage.removeItem(CART_STORAGE_KEY);
      return;
    }
    window.sessionStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({
        version: CART_STORAGE_VERSION,
        lines: state.lines,
        promoCode: state.promoCode ?? null,
      }),
    );
  } catch {
    // Storage unavailable: the in-memory cart still works for this page view.
  }
}

export function readCheckoutRef(): string | null {
  try {
    return window.sessionStorage.getItem(CHECKOUT_REF_KEY);
  } catch {
    return null;
  }
}

export function writeCheckoutRef(ref: string | null) {
  try {
    if (ref) window.sessionStorage.setItem(CHECKOUT_REF_KEY, ref);
    else window.sessionStorage.removeItem(CHECKOUT_REF_KEY);
  } catch {
    // Without storage the cart simply is not cleared automatically.
  }
}
