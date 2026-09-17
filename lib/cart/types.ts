// Cart model, shared by the shop pages, the cart drawer and /cart.
//
// Product, Money and MediaAsset come from lib/shop — the cart holds a
// snapshot of what the shopper picked, never a second product model.

import type { MediaAsset, Money } from '@/lib/shop/types';

export type { MediaAsset, Money };

/** What a caller supplies to add a line. */
export interface CartLineInput {
  productId: string;
  productSlug: string;
  variantId?: string | null;
  quantity: number;

  /** Display snapshot captured at add time. Never an authority on price. */
  title: string;
  image: MediaAsset;
  sizeLabel?: string | null;
  colorLabel?: string | null;
  unitPrice: Money;
}

export interface CartLine {
  id: string;

  productId: string;
  productSlug: string;
  variantId?: string | null;

  title: string;
  image: MediaAsset;

  sizeLabel?: string | null;
  colorLabel?: string | null;

  unitPrice: Money;
  quantity: number;
}

export interface CartState {
  lines: CartLine[];
  /** Only set after the promotions service has accepted the code. */
  promoCode?: string | null;
}

/**
 * How the saved cart was read. 'reset' means stored data existed but could
 * not be trusted, so the cart started empty — the page says so.
 */
export type CartLoadStatus = 'ok' | 'empty' | 'reset';

export interface CartAdapter {
  getCart(): CartState;
  addItem(input: CartLineInput): void | Promise<void>;
  updateQuantity(lineId: string, quantity: number): void | Promise<void>;
  removeItem(lineId: string): void | Promise<void>;
  setPromoCode(code: string | null): void | Promise<void>;
  clear(): void | Promise<void>;
}

// ---------------------------------------------------------------------------
// Checkout boundary
// ---------------------------------------------------------------------------

/** What leaves the browser at checkout: ids and quantities, never prices. */
export interface CheckoutLineRequest {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export interface CheckoutSessionRequest {
  lines: CheckoutLineRequest[];
  promoCode?: string | null;
  /** Opaque browser-generated reference, echoed back on the verified order. */
  clientReference: string;
}

export type CheckoutAvailability = 'ready' | 'unavailable' | 'loading';

export interface CheckoutSessionResult {
  status: 'ready' | 'unavailable' | 'error';
  checkoutId?: string;
  checkoutUrl?: string;
  message?: string;
}

export interface PromoResult {
  valid: boolean;
  code: string;
  discount?: Money | null;
  message?: string;
}
