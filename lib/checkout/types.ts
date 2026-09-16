// Verified checkout results.
//
// Everything here describes what the server confirmed about a checkout, and
// only the server produces it. Query-string values such as ?status=paid are
// never read: the only thing taken from the URL is the session reference.

import type { MediaAsset, Money } from '@/lib/shop/types';

export type CheckoutResultStatus =
  | 'verifying'
  | 'paid'
  | 'processing'
  | 'pending'
  | 'failed'
  | 'cancelled'
  | 'not-found'
  | 'network-error';

export type OrderStatus = 'paid' | 'processing' | 'pending' | 'failed' | 'cancelled';

export interface OrderProgressStep {
  id: string;
  title: string;
  description: string;
  state: 'done' | 'active' | 'pending';
}

/** A line as it was sold — independent of today's catalogue. */
export interface OrderLineSnapshot {
  id: string;
  productId: string;
  variantId?: string | null;
  /** Only used to link back to the product when it still exists. */
  productSlug?: string | null;

  title: string;
  image?: MediaAsset | null;

  sizeLabel?: string | null;
  colorLabel?: string | null;

  quantity: number;
  unitPrice: Money;
  lineTotal: Money;
}

export interface VerifiedOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  /** ISO 8601 from the order record. */
  createdAt: string;

  /** Kept server-side; the page says whether an email went out, not where. */
  customerEmail?: string | null;

  lines: OrderLineSnapshot[];

  subtotal: Money;
  discount?: Money | null;
  /** null means shipping is not confirmed yet. */
  shipping?: Money | null;
  tax?: Money | null;
  total: Money;

  confirmationEmailSent?: boolean;
  progress: OrderProgressStep[];

  /** Echo of the browser's checkout reference, used to clear the right cart. */
  clientReference?: string | null;
}

export interface CheckoutResult {
  status: CheckoutResultStatus;
  order?: VerifiedOrder | null;
  message?: string;
}

export interface CheckoutRepository {
  getResultBySessionId(sessionId: string): Promise<CheckoutResult>;
}
