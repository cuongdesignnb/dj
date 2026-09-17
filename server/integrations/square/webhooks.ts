import 'server-only';

import { WebhooksHelper } from 'square';
import type * as Square from 'square';
import { squareWebhookNotificationUrl, squareWebhookSignatureKey } from './config';

export async function verifySquareWebhook(rawBody: string, signature: string | null): Promise<boolean> {
  const signatureKey = squareWebhookSignatureKey();
  if (!signatureKey || !signature) return false;
  return WebhooksHelper.verifySignature({
    requestBody: rawBody,
    signatureHeader: signature,
    signatureKey,
    notificationUrl: squareWebhookNotificationUrl(),
  });
}

export function parseSquareWebhook(rawBody: string): Square.PaymentCreatedEvent | Square.PaymentUpdatedEvent | Square.RefundCreatedEvent | Square.RefundUpdatedEvent {
  return JSON.parse(rawBody) as Square.PaymentCreatedEvent | Square.PaymentUpdatedEvent | Square.RefundCreatedEvent | Square.RefundUpdatedEvent;
}
