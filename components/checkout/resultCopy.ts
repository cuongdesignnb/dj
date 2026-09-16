import type { CheckoutResultStatus, OrderStatus, VerifiedOrder } from '@/lib/checkout/types';

export type ResultTone = 'success' | 'waiting' | 'problem';

export interface ResultCopy {
  title: string;
  body: string;
  tone: ResultTone;
}

/**
 * Hero copy per verified status. Success wording is only reachable from a
 * status the checkout service returned; nothing here reads the URL.
 */
export function resultCopy(status: CheckoutResultStatus, order?: VerifiedOrder | null): ResultCopy {
  switch (status) {
    case 'paid':
      return {
        title: 'Order Received',
        body: `Thank you for your order. Your merchandise order has been received successfully. ${
          order?.confirmationEmailSent
            ? 'A confirmation email has been sent with your order details.'
            : 'A confirmation email will be sent with your order details.'
        }`,
        tone: 'success',
      };
    case 'processing':
      return {
        title: 'Order Processing',
        body: 'Your payment has been received and your order is being prepared.',
        tone: 'success',
      };
    case 'pending':
      return {
        title: 'Payment Pending',
        body: 'Your payment is still being confirmed. Check back shortly for the latest status.',
        tone: 'waiting',
      };
    case 'verifying':
      return {
        title: 'Verifying Your Order',
        body: 'We’re confirming the latest checkout status.',
        tone: 'waiting',
      };
    case 'failed':
      return {
        title: 'Payment Not Completed',
        body: 'We could not confirm the payment. Your cart has been kept so you can try again.',
        tone: 'problem',
      };
    case 'cancelled':
      return {
        title: 'Checkout Cancelled',
        body: 'Your checkout was cancelled and you have not been charged. Your cart has been kept.',
        tone: 'problem',
      };
    case 'network-error':
      return {
        title: 'Status Unavailable',
        body: 'We couldn’t verify the latest order status. Please try again.',
        tone: 'waiting',
      };
    default:
      return {
        title: 'Order Not Found',
        body: 'We could not find a verified order for this checkout reference.',
        tone: 'problem',
      };
  }
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  paid: 'Paid',
  processing: 'Processing',
  pending: 'Payment pending',
  failed: 'Payment failed',
  cancelled: 'Cancelled',
};

/** Payment has been confirmed for these statuses. */
export function isPaidStatus(status: CheckoutResultStatus): boolean {
  return status === 'paid' || status === 'processing';
}
