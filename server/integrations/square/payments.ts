import 'server-only';

import type * as Square from 'square';
import { ApiError } from '@/server/errors';
import { getSquareClient, squareErrorCode, squareErrorMessage } from './client';
import { squareLocationId } from './config';
import { squarePaymentStatus } from './status';

export { squarePaymentStatus } from './status';

export type SquarePaymentResult = {
  payment: Square.Payment;
  status: string;
  id: string;
};

export async function createSquarePayment(input: {
  sourceId: string;
  verificationToken?: string | null;
  idempotencyKey: string;
  amountMinor: number;
  currency: string;
  orderId?: string | null;
  referenceId: string;
  buyerEmailAddress?: string | null;
}): Promise<SquarePaymentResult> {
  const locationId = squareLocationId();
  if (!locationId) throw new ApiError(503, 'SQUARE_NOT_CONFIGURED', 'Square payments are not configured.');
  try {
    const response = await getSquareClient().payments.create({
      sourceId: input.sourceId,
      idempotencyKey: input.idempotencyKey,
      amountMoney: { amount: BigInt(input.amountMinor), currency: input.currency as Square.Currency },
      autocomplete: true,
      locationId,
      referenceId: input.referenceId,
      ...(input.orderId ? { orderId: input.orderId } : {}),
      ...(input.verificationToken ? { verificationToken: input.verificationToken } : {}),
      ...(input.buyerEmailAddress ? { buyerEmailAddress: input.buyerEmailAddress } : {}),
    });
    const payment = response.payment;
    if (!payment?.id) {
      const code = response.errors?.[0]?.code ?? 'PAYMENT_NOT_CREATED';
      throw new Error(`Square payment was not created (${code}).`);
    }
    return { payment, status: squarePaymentStatus(payment.status), id: payment.id };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const code = squareErrorCode(error);
    throw new ApiError(502, 'SQUARE_PAYMENT_FAILED', `Square payment failed [${code}]: ${squareErrorMessage(error)}`);
  }
}

export async function getSquarePayment(paymentId: string): Promise<Square.Payment | null> {
  const response = await getSquareClient().payments.get({ paymentId });
  return response.payment ?? null;
}
