import 'server-only';

import { env } from '@/server/config';

export type SquareEnvironmentName = 'sandbox' | 'production';

export const SQUARE_API_VERSION = '2026-09-16' as const;

export function squareEnvironment(): SquareEnvironmentName {
  return env('SQUARE_ENVIRONMENT')?.toLowerCase() === 'production' ? 'production' : 'sandbox';
}

export function squareEnvironmentLabel(): string {
  return squareEnvironment();
}

export function squareAccessToken(): string | null {
  return env('SQUARE_ACCESS_TOKEN');
}

export function squareLocationId(): string | null {
  return env('SQUARE_LOCATION_ID');
}

export function squareApplicationId(): string | null {
  return env('NEXT_PUBLIC_SQUARE_APPLICATION_ID');
}

export function squareWebhookSignatureKey(): string | null {
  return env('SQUARE_WEBHOOK_SIGNATURE_KEY');
}

export function squareWebhookNotificationUrl(): string {
  return env('SQUARE_WEBHOOK_NOTIFICATION_URL') ?? `${env('APP_URL') ?? 'http://localhost:3000'}/api/v1/webhooks/square`;
}

export function squareScriptUrl(): string {
  return squareEnvironment() === 'production'
    ? 'https://web.squarecdn.com/v1/square.js'
    : 'https://sandbox.web.squarecdn.com/v1/square.js';
}

export function squareConnectOrigin(): string {
  return squareEnvironment() === 'production'
    ? 'https://connect.squareup.com'
    : 'https://connect.squareupsandbox.com';
}

export function squarePublicConfig() {
  return {
    environment: squareEnvironmentLabel(),
    apiVersion: SQUARE_API_VERSION,
    applicationId: squareApplicationId(),
    locationId: env('NEXT_PUBLIC_SQUARE_LOCATION_ID') ?? squareLocationId(),
    scriptUrl: squareScriptUrl(),
  };
}
export function squareConfiguration() {
  const token = squareAccessToken();
  const locationId = squareLocationId();
  return {
    token,
    locationId,
    webhookSignatureKey: squareWebhookSignatureKey(),
    webhookNotificationUrl: squareWebhookNotificationUrl(),
    environment: squareEnvironment(),
    apiVersion: SQUARE_API_VERSION,
    configured: Boolean(token && locationId),
  };
}
