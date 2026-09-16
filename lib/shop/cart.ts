// Front-end preview cart.
//
// The cart is deliberately separate from the product repository: pages read
// products, the cart only holds what the shopper picked. This implementation
// keeps lines in memory and mirrors them to sessionStorage so they survive a
// reload within the tab and vanish when it closes. No personal or payment data
// is ever stored — only product ids, option labels and display prices.
//
// Stored prices are for display only. A future checkout (Stripe Checkout or
// similar) replaces this adapter and must price lines on the server.

import { useSyncExternalStore } from 'react';
import type { Money } from '@/lib/money';
import type { MediaAsset } from './types';

export interface CartLineInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

/** What the cart shows for a line, captured when the item is added. */
export interface CartProductSnapshot {
  title: string;
  href: string;
  unitPrice: Money;
  image?: MediaAsset | null;
  /** e.g. "M / Black". */
  optionLabel?: string | null;
}

export interface CartLine {
  id: string;
  productId: string;
  variantId?: string | null;
  title: string;
  href: string;
  quantity: number;
  unitPrice: Money;
  image?: MediaAsset | null;
  optionLabel?: string | null;
}

export interface CartAdapter {
  addItem(input: CartLineInput, snapshot: CartProductSnapshot): CartLine;
  removeItem(lineId: string): void;
  updateQuantity(lineId: string, quantity: number): void;
  clear(): void;
}

const STORAGE_KEY = 'connection-rave:preview-cart';
const STORAGE_VERSION = 1;

const EMPTY: CartLine[] = [];

let lines: CartLine[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

/** Same product and variant share a line; a different variant gets its own. */
export function lineIdFor(input: Pick<CartLineInput, 'productId' | 'variantId'>): string {
  return `${input.productId}::${input.variantId ?? 'base'}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseLine(raw: unknown): CartLine | null {
  if (!isRecord(raw)) return null;
  const { id, productId, title, href, quantity, unitPrice } = raw;
  if (typeof id !== 'string' || typeof productId !== 'string') return null;
  if (typeof title !== 'string' || typeof href !== 'string' || !href.startsWith('/shop/')) {
    return null;
  }
  if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1) return null;
  if (
    !isRecord(unitPrice) ||
    typeof unitPrice.amountMinor !== 'number' ||
    !Number.isInteger(unitPrice.amountMinor) ||
    typeof unitPrice.currency !== 'string'
  ) {
    return null;
  }

  const image =
    isRecord(raw.image) && typeof raw.image.src === 'string' && raw.image.src.startsWith('/')
      ? { src: raw.image.src, alt: typeof raw.image.alt === 'string' ? raw.image.alt : '' }
      : null;

  return {
    id,
    productId,
    variantId: typeof raw.variantId === 'string' ? raw.variantId : null,
    title,
    href,
    quantity,
    unitPrice: { amountMinor: unitPrice.amountMinor, currency: unitPrice.currency },
    image,
    optionLabel: typeof raw.optionLabel === 'string' ? raw.optionLabel : null,
  };
}

function read(): CartLine[] {
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return EMPTY;
    const parsed: unknown = JSON.parse(stored);
    if (!isRecord(parsed) || parsed.version !== STORAGE_VERSION || !Array.isArray(parsed.lines)) {
      return EMPTY;
    }
    const valid = parsed.lines.flatMap((line) => {
      const result = parseLine(line);
      return result ? [result] : [];
    });
    return valid.length > 0 ? valid : EMPTY;
  } catch {
    // Storage blocked or corrupt: start empty rather than fail.
    return EMPTY;
  }
}

function write(next: CartLine[]) {
  lines = next.length > 0 ? next : EMPTY;
  try {
    if (lines.length === 0) {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } else {
      window.sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: STORAGE_VERSION, lines }),
      );
    }
  } catch {
    // Storage unavailable: the in-memory cart still works for this page view.
  }
  listeners.forEach((listener) => listener());
}

function current(): CartLine[] {
  if (!loaded && typeof window !== 'undefined') {
    loaded = true;
    lines = read();
  }
  return lines;
}

export const sessionCartAdapter: CartAdapter = {
  addItem(input, snapshot) {
    if (!Number.isInteger(input.quantity) || input.quantity < 1) {
      throw new Error('Quantity must be a whole number of at least 1.');
    }
    const id = lineIdFor(input);
    const existing = current().find((line) => line.id === id);

    const line: CartLine = existing
      ? { ...existing, quantity: existing.quantity + input.quantity }
      : {
          id,
          productId: input.productId,
          variantId: input.variantId ?? null,
          title: snapshot.title,
          href: snapshot.href,
          quantity: input.quantity,
          unitPrice: snapshot.unitPrice,
          image: snapshot.image ? { src: snapshot.image.src, alt: snapshot.image.alt } : null,
          optionLabel: snapshot.optionLabel ?? null,
        };

    write(existing ? current().map((l) => (l.id === id ? line : l)) : [...current(), line]);
    return line;
  },

  removeItem(lineId) {
    write(current().filter((line) => line.id !== lineId));
  },

  updateQuantity(lineId, quantity) {
    if (!Number.isInteger(quantity)) return;
    if (quantity < 1) {
      this.removeItem(lineId);
      return;
    }
    write(current().map((line) => (line.id === lineId ? { ...line, quantity } : line)));
  },

  clear() {
    write(EMPTY);
  },
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * The cart lines. The server snapshot is always empty, so server HTML and the
 * hydrating render agree; stored lines appear on the first client render.
 */
export function useCartLines(): CartLine[] {
  return useSyncExternalStore(subscribe, current, () => EMPTY);
}

export function cartItemCount(cartLines: CartLine[]): number {
  return cartLines.reduce((total, line) => total + line.quantity, 0);
}
