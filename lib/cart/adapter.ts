// The browser cart store and its adapter.
//
// A tiny external store rather than a context: every island that reads the
// cart (the product page button, the drawer, /cart) subscribes to the same
// module state, and no provider has to wrap the tree.

import { useSyncExternalStore } from 'react';
import { readCart, writeCart } from './storage';
import type { CartAdapter, CartLine, CartLineInput, CartLoadStatus, CartState } from './types';

interface Snapshot {
  state: CartState;
  status: CartLoadStatus;
}

const SERVER_SNAPSHOT: Snapshot = { state: { lines: [], promoCode: null }, status: 'empty' };

let snapshot: Snapshot = SERVER_SNAPSHOT;
let loaded = false;
const listeners = new Set<() => void>();

function current(): Snapshot {
  if (!loaded && typeof window !== 'undefined') {
    loaded = true;
    snapshot = readCart();
  }
  return snapshot;
}

function commit(state: CartState) {
  // A cart without lines has nothing a promo code could apply to.
  const next: CartState = state.lines.length ? state : { lines: [], promoCode: null };
  snapshot = { state: next, status: next.lines.length ? 'ok' : 'empty' };
  writeCart(next);
  listeners.forEach((listener) => listener());
}

/** Same product and variant share a line; a different variant gets its own. */
export function lineIdFor(input: Pick<CartLineInput, 'productId' | 'variantId'>): string {
  return `${input.productId}--${input.variantId ?? 'base'}`;
}

function assertQuantity(quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error('Quantity must be a whole number of at least 1.');
  }
}

export const sessionCartAdapter: CartAdapter = {
  getCart() {
    return current().state;
  },

  addItem(input) {
    assertQuantity(input.quantity);
    const { lines, promoCode } = current().state;
    const id = lineIdFor(input);
    const existing = lines.find((line) => line.id === id);

    if (existing) {
      commit({
        lines: lines.map((line) =>
          line.id === id
            ? { ...line, quantity: line.quantity + input.quantity, unitPrice: input.unitPrice }
            : line,
        ),
        promoCode,
      });
      return;
    }

    const line: CartLine = {
      id,
      productId: input.productId,
      productSlug: input.productSlug,
      variantId: input.variantId ?? null,
      title: input.title,
      image: { src: input.image.src, alt: input.image.alt },
      sizeLabel: input.sizeLabel ?? null,
      colorLabel: input.colorLabel ?? null,
      unitPrice: input.unitPrice,
      quantity: input.quantity,
    };
    commit({ lines: [...lines, line], promoCode });
  },

  updateQuantity(lineId, quantity) {
    assertQuantity(quantity);
    const { lines, promoCode } = current().state;
    commit({
      lines: lines.map((line) => (line.id === lineId ? { ...line, quantity } : line)),
      promoCode,
    });
  },

  removeItem(lineId) {
    const { lines, promoCode } = current().state;
    commit({ lines: lines.filter((line) => line.id !== lineId), promoCode });
  },

  setPromoCode(code) {
    const { lines } = current().state;
    commit({ lines, promoCode: code });
  },

  clear() {
    commit({ lines: [], promoCode: null });
  },
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * The cart and how it was loaded. On the server, and during hydration, this is
 * the empty snapshot, so markup matches; saved lines arrive on the first
 * client render.
 */
export function useCart(): Snapshot {
  return useSyncExternalStore(subscribe, current, () => SERVER_SNAPSHOT);
}

export function useCartLines(): CartLine[] {
  return useCart().state.lines;
}

const noop = () => () => {};

/** False on the server and during hydration, true afterwards. */
export function useHydrated(): boolean {
  return useSyncExternalStore(noop, () => true, () => false);
}
