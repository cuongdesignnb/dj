// DEVELOPMENT-ONLY checkout simulation. Active only with CHECKOUT_MOCK=true.
//
// Nothing here is a real order. Order numbers carry a DEV- prefix, no email is
// sent, and sessions live in this server process's memory only.
//
// Fixed references for testing each result state:
//   mock_paid  mock_processing  mock_pending  mock_failed
//   mock_cancelled  mock_verifying  mock_network_error
// Any other reference is "not found" unless this process created it.

import { randomUUID } from 'node:crypto';
import { SHOP_PRODUCTS } from '@/lib/shop/mock';
import { primaryImage, validateAddToCart } from '@/lib/shop/helpers';
import { multiply, sum, unitPrice } from '@/lib/shop/pricing';
import type { Money, Product } from '@/lib/shop/types';
import type { CheckoutLineRequest, CheckoutSessionRequest } from '@/lib/cart/types';
import type {
  CheckoutRepository,
  CheckoutResult,
  OrderLineSnapshot,
  OrderProgressStep,
  OrderStatus,
  VerifiedOrder,
} from './types';

function progressFor(status: OrderStatus, emailSent: boolean): OrderProgressStep[] {
  const paid = status === 'paid' || status === 'processing';
  return [
    {
      id: 'received',
      title: 'Order Received',
      description: paid
        ? 'Your order and payment have been confirmed.'
        : 'Waiting for payment confirmation.',
      state: paid ? 'done' : 'active',
    },
    {
      id: 'preparing',
      title: 'Preparing Your Order',
      description: 'Fulfilment details will be confirmed separately.',
      state: status === 'processing' ? 'active' : 'pending',
    },
    {
      id: 'updates',
      title: 'Updates by Email',
      description: emailSent
        ? 'A confirmation email has been sent.'
        : 'Delivery details will be shared by email once confirmed.',
      state: emailSent ? 'done' : 'pending',
    },
  ];
}

/** Prices each requested line from the catalogue — the client's price is never used. */
function priceLines(
  requested: CheckoutLineRequest[],
  products: Product[],
): OrderLineSnapshot[] | null {
  const lines: OrderLineSnapshot[] = [];
  for (const [index, request] of requested.entries()) {
    const product = products.find((p) => p.id === request.productId);
    if (!product) return null;
    const variant = product.variants.find((v) => v.id === request.variantId) ?? null;
    if (product.variants.length > 0 && !variant) return null;

    const check = validateAddToCart(
      product,
      { sizeId: variant?.sizeId ?? null, colorId: variant?.colorId ?? null },
      request.quantity,
    );
    if (!check.ok) return null;

    const price = unitPrice(product, variant);
    lines.push({
      id: `line-${index + 1}`,
      productId: product.id,
      productSlug: product.slug,
      variantId: variant?.id ?? null,
      title: product.title,
      image: primaryImage(product)?.image ?? null,
      sizeLabel: product.sizes.find((s) => s.id === variant?.sizeId)?.label ?? null,
      colorLabel: product.colors.find((c) => c.id === variant?.colorId)?.name ?? null,
      quantity: request.quantity,
      unitPrice: price,
      lineTotal: multiply(price, request.quantity),
    });
  }
  return lines;
}

function orderFrom(
  id: string,
  status: OrderStatus,
  lines: OrderLineSnapshot[],
  options: { emailSent: boolean; clientReference: string | null; createdAt: string },
): VerifiedOrder {
  const subtotal = sum(lines.map((l) => l.lineTotal)) as Money;
  return {
    id,
    orderNumber: `DEV-${id.replace(/^mock_/, '').slice(0, 8).toUpperCase()}`,
    status,
    createdAt: options.createdAt,
    customerEmail: null,
    lines,
    subtotal,
    discount: null,
    // Shipping is not modelled: it stays "to be confirmed".
    shipping: null,
    tax: null,
    total: subtotal,
    confirmationEmailSent: options.emailSent,
    progress: progressFor(status, options.emailSent),
    clientReference: options.clientReference,
  };
}

// Sessions created through the mock checkout, kept for this process only.
type Store = Map<string, VerifiedOrder>;
const globalStore = globalThis as typeof globalThis & { __mockCheckoutSessions?: Store };
const sessions: Store = (globalStore.__mockCheckoutSessions ??= new Map());

/** Simulates the backend creating a session and the shopper paying. */
export function createMockCheckoutSession(
  request: CheckoutSessionRequest,
): { ok: true; sessionId: string } | { ok: false; message: string } {
  const lines = priceLines(request.lines, SHOP_PRODUCTS);
  if (!lines || lines.length === 0) {
    return { ok: false, message: 'Some items in your cart are no longer available.' };
  }
  const sessionId = `mock_${randomUUID().replace(/-/g, '')}`;
  sessions.set(
    sessionId,
    orderFrom(sessionId, 'paid', lines, {
      // Nothing is actually emailed in development.
      emailSent: false,
      clientReference: request.clientReference,
      createdAt: new Date().toISOString(),
    }),
  );
  return { ok: true, sessionId };
}

const FIXTURE_LINES = priceLines(
  [
    { productId: 'prod-destiny-oversized-tee', variantId: 'destiny-oversized-tee-l-black', quantity: 1 },
    { productId: 'prod-connection-hoodie', variantId: 'connection-hoodie-xl-black', quantity: 1 },
  ],
  SHOP_PRODUCTS,
) as OrderLineSnapshot[];

export class MockCheckoutRepository implements CheckoutRepository {
  async getResultBySessionId(sessionId: string): Promise<CheckoutResult> {
    const created = sessions.get(sessionId);
    if (created) return { status: created.status, order: created };

    const fixture = (status: OrderStatus, emailSent = false): CheckoutResult => ({
      status,
      order: orderFrom(sessionId, status, FIXTURE_LINES, {
        emailSent,
        clientReference: null,
        createdAt: new Date().toISOString(),
      }),
    });

    switch (sessionId) {
      case 'mock_paid':
        return fixture('paid', true);
      case 'mock_processing':
        return fixture('processing', true);
      case 'mock_pending':
        return fixture('pending');
      case 'mock_failed':
        return fixture('failed');
      case 'mock_cancelled':
        return fixture('cancelled');
      case 'mock_verifying':
        return { status: 'verifying' };
      case 'mock_network_error':
        return {
          status: 'network-error',
          message: 'We couldn’t verify the latest order status. Please try again.',
        };
      default:
        return { status: 'not-found' };
    }
  }
}
