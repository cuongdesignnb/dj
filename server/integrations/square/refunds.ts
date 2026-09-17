import 'server-only';

import type * as Square from 'square';
import { getSquareClient, squareErrorMessage } from './client';

export async function refundSquarePayment(input: {
  paymentId: string;
  idempotencyKey: string;
  amountMinor: number;
  currency: string;
  reason?: string | null;
}): Promise<Square.PaymentRefund> {
  try {
    const response = await getSquareClient().refunds.refundPayment({
      paymentId: input.paymentId,
      idempotencyKey: input.idempotencyKey,
      amountMoney: { amount: BigInt(input.amountMinor), currency: input.currency as Square.Currency },
      reason: input.reason ?? undefined,
    });
    if (!response.refund) throw new Error('Square did not return a refund.');
    return response.refund;
  } catch (error) {
    throw new Error(`Square refund failed: ${squareErrorMessage(error)}`);
  }
}

export async function getSquareRefund(refundId: string): Promise<Square.PaymentRefund | null> {
  const response = await getSquareClient().refunds.get({ refundId });
  return response.refund ?? null;
}
