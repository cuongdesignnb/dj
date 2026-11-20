import 'server-only';
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto';
import { env, isProduction } from '@/server/config';

// Small at-rest encryption for credentials typed into Admin (e.g. the SMTP
// password). The key is derived from SESSION_SECRET, so nothing new has to be
// added to the server's .env. Rotating SESSION_SECRET makes stored values
// unreadable; Admin then asks for the password again.

const VERSION = 'v1';

function keyFor(purpose: string) {
  const secret = env('SESSION_SECRET') ?? (isProduction() ? null : 'local-development-secret-box');
  if (!secret) throw new Error('SESSION_SECRET is required to store credentials.');
  return Buffer.from(hkdfSync('sha256', secret, 'destiny-secret-box', purpose, 32));
}

export function sealSecret(plain: string, purpose: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyFor(purpose), iv);
  const body = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return `${VERSION}:${Buffer.concat([iv, cipher.getAuthTag(), body]).toString('base64')}`;
}

/** The plain value, or null when it is missing or cannot be decrypted. */
export function openSecret(sealed: unknown, purpose: string): string | null {
  if (typeof sealed !== 'string' || !sealed.startsWith(`${VERSION}:`)) return null;
  try {
    const raw = Buffer.from(sealed.slice(VERSION.length + 1), 'base64');
    if (raw.length < 29) return null;
    const decipher = createDecipheriv('aes-256-gcm', keyFor(purpose), raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}
