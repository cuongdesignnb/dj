import { SHOP_PRODUCTS } from '@/lib/shop/mock';
import { opts } from '@/lib/admin/common/fields';
import type { ResourceDefinition } from '@/lib/admin/common/resource';
import type { Money } from '@/lib/money';

// DEMO ORDERS. Checkout is not live, so there are no real orders. These
// records exist only in mock mode, carry DEMO- numbers and example.com
// customers, and the orders screen says they are demo data.

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled';
export type FulfillmentStatus = 'unfulfilled' | 'processing' | 'shipped' | 'completed' | 'cancelled';

export interface AdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  currency: string;
  lines: { title: string; variant: string; unitPrice: Money; quantity: number; lineTotal: Money }[];
  itemCount: number;
  subtotal: Money;
  shipping: Money | null;
  tax: Money | null;
  discount: Money | null;
  total: Money;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  createdAt: string;
  timeline: { at: string; label: string }[];
  notes: { at: string; author: string; body: string }[];
  demo: boolean;
  updatedAt: string;
  [key: string]: unknown;
}

const byId = (id: string) => SHOP_PRODUCTS.find((p) => p.id === id)!;

function demoOrder(
  n: number,
  customer: string,
  picks: [string, string, number][],
  payment: PaymentStatus,
  fulfillment: FulfillmentStatus,
  createdAt: string,
): AdminOrder {
  const lines = picks.map(([productId, variant, quantity]) => {
    const product = byId(productId);
    return {
      title: product.title,
      variant,
      unitPrice: product.price,
      quantity,
      lineTotal: { amountMinor: product.price.amountMinor * quantity, currency: 'AUD' },
    };
  });
  const subtotal = { amountMinor: lines.reduce((t, l) => t + l.lineTotal.amountMinor, 0), currency: 'AUD' };
  const timeline = [{ at: createdAt, label: 'Order created (demo)' }];
  if (payment === 'paid') timeline.push({ at: createdAt, label: 'Payment confirmed (demo)' });
  if (fulfillment === 'shipped' || fulfillment === 'completed') timeline.push({ at: createdAt, label: 'Marked shipped (demo)' });
  return {
    id: `order_demo_${n}`,
    orderNumber: `DEMO-${1000 + n}`,
    customerName: customer,
    email: `${customer.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`,
    currency: 'AUD',
    lines,
    itemCount: lines.reduce((t, l) => t + l.quantity, 0),
    subtotal,
    shipping: null,
    tax: null,
    discount: null,
    total: subtotal,
    paymentStatus: payment,
    fulfillmentStatus: fulfillment,
    createdAt,
    timeline,
    notes: [],
    demo: true,
    updatedAt: createdAt,
  };
}

const TEE = 'prod-destiny-oversized-tee';
const HOODIE = 'prod-connection-hoodie';
const POSTER = 'prod-metro-city-poster';
const CAP = 'prod-sound-meets-soul-cap';
const TOTE = 'prod-connection-tote';
const STICKERS = 'prod-rave-sticker-pack';

export const PAYMENT_OPTIONS = opts(['pending', 'Pending'], ['paid', 'Paid'], ['failed', 'Failed'], ['cancelled', 'Cancelled']);
export const FULFILLMENT_OPTIONS = opts(
  ['unfulfilled', 'Unfulfilled'],
  ['processing', 'Processing'],
  ['shipped', 'Shipped'],
  ['completed', 'Completed'],
  ['cancelled', 'Cancelled'],
);

export const ordersDefinition: ResourceDefinition<AdminOrder> = {
  key: 'orders',
  label: 'Orders',
  singular: 'Order',
  description: 'Merchandise orders and fulfilment.',
  group: 'Merchandise',
  basePath: '/admin/orders',
  apiPath: 'orders',
  permission: 'orders',
  titleKey: 'orderNumber',
  idPrefix: 'order',
  seed: () => [
    demoOrder(8, 'Demo Customer H', [[TEE, 'L / Black', 1], [HOODIE, 'XL / Black', 1]], 'paid', 'unfulfilled', '2026-09-12T10:15:00.000Z'),
    demoOrder(7, 'Demo Customer G', [[CAP, 'Black', 1]], 'paid', 'processing', '2026-09-11T08:40:00.000Z'),
    demoOrder(6, 'Demo Customer F', [[POSTER, '—', 2], [STICKERS, '—', 1]], 'paid', 'shipped', '2026-09-10T14:05:00.000Z'),
    demoOrder(5, 'Demo Customer E', [[TOTE, 'Black', 1]], 'pending', 'unfulfilled', '2026-09-09T19:20:00.000Z'),
    demoOrder(4, 'Demo Customer D', [[TEE, 'M / Black', 2]], 'paid', 'completed', '2026-09-07T11:00:00.000Z'),
    demoOrder(3, 'Demo Customer C', [[HOODIE, 'L / Black', 1]], 'failed', 'cancelled', '2026-09-06T16:30:00.000Z'),
    demoOrder(2, 'Demo Customer B', [[STICKERS, '—', 3]], 'cancelled', 'cancelled', '2026-09-04T09:10:00.000Z'),
    demoOrder(1, 'Demo Customer A', [[TEE, 'S / Black', 1], [CAP, 'Black', 1]], 'paid', 'completed', '2026-09-02T12:45:00.000Z'),
  ],
  searchFields: ['orderNumber', 'customerName', 'email'],
  matchers: {
    minTotal: (r, v) => r.total.amountMinor >= Number(v) * 100,
    maxTotal: (r, v) => r.total.amountMinor <= Number(v) * 100,
    period: (r, v) => {
      const days = Number(v);
      if (!Number.isFinite(days)) return true;
      // Relative to the newest demo order, so the demo stays deterministic.
      return Date.parse('2026-09-12T23:59:59Z') - Date.parse(r.createdAt) <= days * 86_400_000;
    },
  },
  defaultSort: { key: 'createdAt', direction: 'desc' },
  filters: [
    { key: 'paymentStatus', label: 'Payment', options: PAYMENT_OPTIONS },
    { key: 'fulfillmentStatus', label: 'Fulfilment', options: FULFILLMENT_OPTIONS },
    { key: 'period', label: 'Date', options: opts(['3', 'Last 3 days'], ['7', 'Last 7 days'], ['30', 'Last 30 days']) },
    { key: 'minTotal', label: 'Min total', options: opts(['30', '$30+'], ['60', '$60+'], ['100', '$100+']) },
    { key: 'maxTotal', label: 'Max total', options: opts(['50', 'Up to $50'], ['100', 'Up to $100']) },
  ],
  columns: [
    { key: 'orderNumber', label: 'Order #', type: 'title', sortable: true },
    { key: 'customerName', label: 'Customer', type: 'text', sortable: true },
    { key: 'email', label: 'Email', type: 'text', hideOnMobile: true },
    { key: 'itemCount', label: 'Items', type: 'text', align: 'center' },
    { key: 'subtotal', label: 'Subtotal', type: 'money', align: 'right', hideOnMobile: true },
    { key: 'total', label: 'Total', type: 'money', sortable: true, align: 'right' },
    { key: 'paymentStatus', label: 'Payment', type: 'status' },
    { key: 'fulfillmentStatus', label: 'Fulfilment', type: 'status' },
    { key: 'createdAt', label: 'Created', type: 'datetime', sortable: true },
  ],
  actions: ['view'],
  hasDetail: true,
  empty: {
    title: 'No orders yet.',
    description: 'Orders appear here once checkout is connected.',
  },
};
