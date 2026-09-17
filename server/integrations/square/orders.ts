import 'server-only';

import type * as Square from 'square';
import { ApiError } from '@/server/errors';
import { getSquareClient, squareErrorMessage } from './client';
import { squareLocationId } from './config';

export type SquareOrderLine = {
  name: string;
  quantity: number;
  unitPriceMinor: number;
  currency: string;
  referenceId?: string;
};

export async function createSquareOrder(input: {
  idempotencyKey: string;
  referenceId: string;
  lines: SquareOrderLine[];
}): Promise<{ id: string; raw: Square.Order }> {
  const locationId = squareLocationId();
  if (!locationId) throw new ApiError(503, 'SQUARE_NOT_CONFIGURED', 'Square payments are not configured.');
  try {
    const response = await getSquareClient().orders.create({
      idempotencyKey: input.idempotencyKey,
      order: {
        locationId,
        referenceId: input.referenceId,
        lineItems: input.lines.map((line) => ({
          name: line.name,
          quantity: String(line.quantity),
          basePriceMoney: { amount: BigInt(line.unitPriceMinor), currency: line.currency as Square.Currency },
          ...(line.referenceId ? { metadata: { referenceId: line.referenceId } } : {}),
        })),
      },
    });
    if (!response.order?.id) throw new Error('Square did not return an order ID.');
    return { id: response.order.id, raw: response.order };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(502, 'SQUARE_ORDER_FAILED', `Square order creation failed: ${squareErrorMessage(error)}`);
  }
}

export async function getSquareOrder(orderId: string): Promise<Square.Order | null> {
  const response = await getSquareClient().orders.get({ orderId });
  return response.order ?? null;
}
