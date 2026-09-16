import { opts } from '@/lib/admin/common/fields';
import type { ResourceDefinition } from '@/lib/admin/common/resource';
import type { Money } from '@/lib/money';

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
  updatedAt: string;
  [key: string]: unknown;
}

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
  seed: () => [],
  searchFields: ['orderNumber', 'customerName', 'email'],
  matchers: {
    minTotal: (r, v) => r.total.amountMinor >= Number(v) * 100,
    maxTotal: (r, v) => r.total.amountMinor <= Number(v) * 100,
    period: (r, v) => {
      const days = Number(v);
      if (!Number.isFinite(days)) return true;
      return Date.now() - Date.parse(r.createdAt) <= days * 86_400_000;
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
