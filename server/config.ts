import 'server-only';

export function isProduction() {
  return process.env.NODE_ENV === 'production';
}

export function env(name: string, required = false): string | null {
  const value = process.env[name]?.trim();
  if (!value && required) throw new Error(`${name} is required`);
  return value || null;
}

export function runtimeConfig() {
  return {
    appUrl: env('APP_URL') ?? 'http://localhost:3000',
    databaseUrl: env('DATABASE_URL'),
    redisUrl: env('REDIS_URL'),
    sessionSecret: env('SESSION_SECRET'),
    csrfSecret: env('CSRF_SECRET'),
    sessionCookieName: env('SESSION_COOKIE_NAME') ?? 'destiny_admin_session',
    csrfCookieName: env('CSRF_COOKIE_NAME') ?? 'destiny_csrf',
    mediaDriver: (env('MEDIA_DRIVER') ?? 'local').toLowerCase(),
    storageLocalDir: env('STORAGE_LOCAL_DIR') ?? '.data/media',
    mediaPublicBaseUrl: env('MEDIA_PUBLIC_BASE_URL') ?? '/assets',
    paymentProvider: (env('PAYMENT_PROVIDER') ?? 'square').toLowerCase(),
    squareEnvironment: (env('SQUARE_ENVIRONMENT') ?? 'sandbox').toLowerCase(),
    squareAccessToken: env('SQUARE_ACCESS_TOKEN'),
    squareLocationId: env('SQUARE_LOCATION_ID'),
    squareWebhookSignatureKey: env('SQUARE_WEBHOOK_SIGNATURE_KEY'),
    squareWebhookNotificationUrl: env('SQUARE_WEBHOOK_NOTIFICATION_URL'),
    squareApiVersion: env('SQUARE_API_VERSION') ?? '2026-09-16',
    checkoutHoldMinutes: Math.max(5, Number(env('CHECKOUT_HOLD_MINUTES') ?? '15') || 15),
  };
}

export function assertProductionConfig() {
  if (!isProduction()) return;
  const config = runtimeConfig();
  for (const [key, value] of Object.entries({
    DATABASE_URL: config.databaseUrl,
    REDIS_URL: config.redisUrl,
    SESSION_SECRET: config.sessionSecret,
    CSRF_SECRET: config.csrfSecret,
    PAYMENT_PROVIDER: config.paymentProvider === 'square' ? 'square' : null,
    SQUARE_ENVIRONMENT: config.squareEnvironment === 'production' ? 'production' : null,
    SQUARE_ACCESS_TOKEN: config.squareAccessToken,
    SQUARE_LOCATION_ID: config.squareLocationId,
    SQUARE_WEBHOOK_SIGNATURE_KEY: config.squareWebhookSignatureKey,
    NEXT_PUBLIC_SQUARE_APPLICATION_ID: env('NEXT_PUBLIC_SQUARE_APPLICATION_ID'),
  })) {
    if (!value || value.length < 32 && key.endsWith('SECRET')) {
      throw new Error(`${key} is missing or too short for production`);
    }
  }
  if (!config.appUrl.startsWith('https://')) throw new Error('APP_URL must use HTTPS in production');
  if (!config.squareWebhookNotificationUrl?.startsWith('https://')) throw new Error('SQUARE_WEBHOOK_NOTIFICATION_URL must use HTTPS in production');
}
