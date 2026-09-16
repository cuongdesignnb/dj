import 'server-only';
import { createHash, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { runtimeConfig } from '@/server/config';
import { forbidden } from '@/server/errors';

function hash(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export function hashCsrf(value: string) {
  return hash(value);
}

export async function requestCsrfToken(request: Request) {
  const config = runtimeConfig();
  const cookieToken = request.headers.get('x-csrf-token')?.trim();
  const cookieValue = request.headers.get('cookie') ?? '';
  const match = cookieValue.match(new RegExp(`(?:^|;\\s*)${config.csrfCookieName}=([^;]+)`));
  const stored = match?.[1] ? decodeURIComponent(match[1]) : null;
  if (!cookieToken || !stored || cookieToken.length !== stored.length) throw forbidden('Invalid CSRF token.');
  const left = Buffer.from(cookieToken);
  const right = Buffer.from(stored);
  if (!timingSafeEqual(left, right)) throw forbidden('Invalid CSRF token.');
  return cookieToken;
}

export async function readCsrfCookie() {
  return (await cookies()).get(runtimeConfig().csrfCookieName)?.value ?? null;
}

