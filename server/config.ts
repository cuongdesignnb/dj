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
  })) {
    if (!value || value.length < 32 && key.endsWith('SECRET')) {
      throw new Error(`${key} is missing or too short for production`);
    }
  }
}

