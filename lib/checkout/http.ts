// Normalizes checkout-result payloads from the backend.
//
// A payload that does not describe a complete, consistent order is not shown
// as one: the page falls back to "we couldn't verify" rather than filling gaps.

import { normalizeMoney } from '@/lib/shop/http';
import type {
  CheckoutRepository,
  CheckoutResult,
  CheckoutResultStatus,
  OrderLineSnapshot,
  OrderProgressStep,
  OrderStatus,
  VerifiedOrder,
} from './types';

const RESULT_STATUSES: CheckoutResultStatus[] = [
  'verifying',
  'paid',
  'processing',
  'pending',
  'failed',
  'cancelled',
  'not-found',
];
const ORDER_STATUSES: OrderStatus[] = ['paid', 'processing', 'pending', 'failed', 'cancelled'];
const STEP_STATES: OrderProgressStep['state'][] = ['done', 'active', 'pending'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function nullableStr(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function line(raw: unknown, index: number): OrderLineSnapshot | null {
  if (!isRecord(raw)) return null;
  const title = str(raw.title);
  const productId = str(raw.productId);
  const unitPrice = normalizeMoney(raw.unitPrice);
  const lineTotal = normalizeMoney(raw.lineTotal);
  const quantity = raw.quantity;
  if (!title || !productId || !unitPrice || !lineTotal) return null;
  if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1) return null;

  const image =
    isRecord(raw.image) && typeof raw.image.src === 'string' && raw.image.src
      ? { src: raw.image.src, alt: str(raw.image.alt) }
      : null;

  return {
    id: str(raw.id) || `line-${index}`,
    productId,
    variantId: nullableStr(raw.variantId),
    productSlug: nullableStr(raw.productSlug),
    title,
    image,
    sizeLabel: nullableStr(raw.sizeLabel),
    colorLabel: nullableStr(raw.colorLabel),
    quantity,
    unitPrice,
    lineTotal,
  };
}

function step(raw: unknown): OrderProgressStep | null {
  if (!isRecord(raw)) return null;
  const state = STEP_STATES.find((s) => s === raw.state);
  const title = str(raw.title);
  if (!state || !title) return null;
  return { id: str(raw.id) || title, title, description: str(raw.description), state };
}

export function normalizeOrder(raw: unknown): VerifiedOrder | null {
  if (!isRecord(raw)) return null;

  const status = ORDER_STATUSES.find((s) => s === raw.status);
  const orderNumber = str(raw.orderNumber);
  const createdAt = str(raw.createdAt);
  const subtotal = normalizeMoney(raw.subtotal);
  const total = normalizeMoney(raw.total);
  if (!status || !orderNumber || !subtotal || !total) return null;
  if (!createdAt || Number.isNaN(Date.parse(createdAt))) return null;

  const rawLines = Array.isArray(raw.lines) ? raw.lines : [];
  const lines = rawLines.flatMap((l, i) => {
    const parsed = line(l, i);
    return parsed ? [parsed] : [];
  });
  // A partially readable order is not presented as the order.
  if (lines.length === 0 || lines.length !== rawLines.length) return null;

  return {
    id: str(raw.id) || orderNumber,
    orderNumber,
    status,
    createdAt,
    customerEmail: nullableStr(raw.customerEmail),
    lines,
    subtotal,
    discount: normalizeMoney(raw.discount),
    shipping: normalizeMoney(raw.shipping),
    tax: normalizeMoney(raw.tax),
    total,
    confirmationEmailSent: raw.confirmationEmailSent === true,
    progress: (Array.isArray(raw.progress) ? raw.progress : []).flatMap((s) => {
      const parsed = step(s);
      return parsed ? [parsed] : [];
    }),
    clientReference: nullableStr(raw.clientReference),
  };
}

const UNVERIFIED: CheckoutResult = {
  status: 'network-error',
  message: 'We couldn’t verify the latest order status. Please try again.',
};

export function normalizeResult(raw: unknown): CheckoutResult {
  if (!isRecord(raw)) return UNVERIFIED;
  const status = RESULT_STATUSES.find((s) => s === raw.status);
  if (!status) return UNVERIFIED;

  if (status === 'verifying' || status === 'not-found') return { status };

  const order = normalizeOrder(raw.order);
  // Every other state describes an order; without a readable one, say so.
  if (!order) return UNVERIFIED;
  // The page status and the order status must agree.
  if (order.status !== status) return UNVERIFIED;

  return { status, order };
}

export class HttpCheckoutRepository implements CheckoutRepository {
  constructor(private readonly baseUrl: string) {}

  async getResultBySessionId(sessionId: string): Promise<CheckoutResult> {
    const url = `${this.baseUrl}/api/v1/checkout/result?checkout_id=${encodeURIComponent(sessionId)}`;

    let response: Response;
    try {
      // Payment state changes; never serve it from a cache.
      response = await fetch(url, { headers: { accept: 'application/json' }, cache: 'no-store' });
    } catch {
      return UNVERIFIED;
    }

    if (response.status === 404) return { status: 'not-found' };
    if (!response.ok) return UNVERIFIED;

    try {
      return normalizeResult(await response.json());
    } catch {
      return UNVERIFIED;
    }
  }
}
