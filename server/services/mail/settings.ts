import 'server-only';
import { Prisma } from '@prisma/client';
import { db } from '@/server/db/client';
import { env } from '@/server/config';
import { validationError } from '@/server/errors';
import { openSecret, sealSecret } from '@/server/security/secret-box';
import { emailSettingsDefaults, normaliseEmailSettings, parseRecipients, validateEmailSettings, type EmailSettings } from '@/lib/email/smtp-config';

export const EMAIL_SETTING_KEY = 'email.smtp';
const SECRET_PURPOSE = 'smtp-password';
export const SMTP_PROVIDER = 'smtp';

interface Stored {
  settings: EmailSettings;
  passwordSealed: string | null;
}

async function readStored(): Promise<Stored> {
  const row = await db.siteSetting.findUnique({ where: { key: EMAIL_SETTING_KEY } });
  const raw = row?.valueJson && typeof row.valueJson === 'object' ? (row.valueJson as Record<string, unknown>) : {};
  return { settings: normaliseEmailSettings({ ...emailSettingsDefaults(), ...raw }), passwordSealed: typeof raw.passwordSealed === 'string' ? raw.passwordSealed : null };
}

/** SMTP_* in the server .env, used only while Admin has no server of its own. */
function serverEnv() {
  const host = env('SMTP_HOST');
  if (!host) return null;
  const port = Number(env('SMTP_PORT') ?? '587') || 587;
  return { host, port, security: port === 465 ? ('ssl' as const) : ('starttls' as const), username: env('SMTP_USER') ?? '', password: env('SMTP_PASSWORD') ?? '', from: env('SMTP_FROM') ?? '' };
}

export interface ResolvedSmtp {
  settings: EmailSettings;
  transport: { host: string; port: number; secure: boolean; requireTLS: boolean; auth?: { user: string; pass: string } };
  from: string | { name: string; address: string };
  replyTo: string | null;
  recipients: string[];
  source: 'admin' | 'env';
}

/** Everything needed to send, or why sending is off. Never logs or returns the password to callers outside the server. */
export async function resolveSmtp(): Promise<{ ok: true; smtp: ResolvedSmtp } | { ok: false; reason: string; settings: EmailSettings }> {
  const { settings, passwordSealed } = await readStored();
  if (!settings.enabled) return { ok: false, reason: 'Email is turned off in Admin › Settings › Email (SMTP).', settings };
  const fallback = settings.host ? null : serverEnv();
  const host = settings.host || fallback?.host || '';
  if (!host) return { ok: false, reason: 'No SMTP server is set.', settings };
  const port = settings.host ? settings.port : fallback!.port;
  const security = settings.host ? settings.security : fallback!.security;
  const username = settings.host ? settings.username : fallback!.username;
  let password = '';
  if (username) {
    password = settings.host ? openSecret(passwordSealed, SECRET_PURPOSE) ?? '' : fallback!.password;
    if (!password) return { ok: false, reason: 'The stored SMTP password cannot be read. Enter it again in Admin.', settings };
  }
  const fromAddress = settings.fromEmail || (settings.host ? '' : fallback?.from ?? '');
  if (!fromAddress) return { ok: false, reason: 'No sender address is set.', settings };
  return {
    ok: true,
    smtp: {
      settings,
      transport: { host, port, secure: security === 'ssl', requireTLS: security === 'starttls', ...(username ? { auth: { user: username, pass: password } } : {}) },
      from: settings.fromEmail && settings.fromName ? { name: settings.fromName, address: settings.fromEmail } : fromAddress,
      replyTo: settings.replyTo || null,
      recipients: parseRecipients(settings.notifyTo).valid,
      source: settings.host ? 'admin' : 'env',
    },
  };
}

function iso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

/** What Admin sees: settings, whether a password is stored (never the password), and the last connection check. */
export async function readEmailSettingsForAdmin() {
  const [{ settings, passwordSealed }, status] = await Promise.all([readStored(), db.integrationSetting.findUnique({ where: { provider: SMTP_PROVIDER } })]);
  const fallback = serverEnv();
  const readable = passwordSealed ? openSecret(passwordSealed, SECRET_PURPOSE) !== null : false;
  const passwordStatus = passwordSealed
    ? readable ? 'Stored (encrypted)' : 'Stored but unreadable — enter it again'
    : !settings.host && fallback?.password ? 'Using SMTP_PASSWORD from the server .env' : 'Not set';
  const source = settings.host ? 'This form' : fallback ? `Server .env (${fallback.host}:${fallback.port})` : 'Not configured';
  const checkedAt = iso(status?.lastCheckedAt);
  const lastCheck = !status || !checkedAt
    ? 'Not tested yet'
    : status.status === 'CONNECTED'
      ? `Test email sent ${checkedAt.slice(0, 16).replace('T', ' ')} UTC`
      : `Failed ${checkedAt.slice(0, 16).replace('T', ' ')} UTC — ${status.lastErrorCode ?? 'unknown error'}`;
  return { ...settings, password: '', passwordStatus, source, lastCheck };
}

/** Saves the form. A new password is encrypted; an empty one keeps the stored password. */
export async function saveEmailSettings(values: Record<string, unknown>) {
  const current = await readStored();
  const settings = normaliseEmailSettings({ ...current.settings, ...values });
  const newPassword = typeof values.password === 'string' ? values.password.slice(0, 500) : '';
  // A different server or username means the old password no longer applies.
  const keepOld = !newPassword && current.settings.host === settings.host && current.settings.username === settings.username;
  const passwordSealed = newPassword ? sealSecret(newPassword, SECRET_PURPOSE) : keepOld ? current.passwordSealed : null;
  const hasPassword = Boolean(passwordSealed && openSecret(passwordSealed, SECRET_PURPOSE));
  const errors = validateEmailSettings(settings, { hasPassword, usesServerEnv: !settings.host && Boolean(serverEnv()) });
  if (Object.keys(errors).length) throw validationError(errors);
  const valueJson = { ...settings, passwordSealed } as unknown as Prisma.InputJsonValue;
  await db.siteSetting.upsert({ where: { key: EMAIL_SETTING_KEY }, update: { valueJson, isPublic: false }, create: { key: EMAIL_SETTING_KEY, valueJson, isPublic: false } });
  const changedServer = current.settings.host !== settings.host || current.settings.port !== settings.port || current.settings.security !== settings.security || current.settings.username !== settings.username || Boolean(newPassword);
  if (changedServer) await db.integrationSetting.deleteMany({ where: { provider: SMTP_PROVIDER } });
  return readEmailSettingsForAdmin();
}

/** Remembers the last send result so Admin can show whether email works. */
export async function recordSmtpCheck(ok: boolean, error?: string) {
  const data = { status: ok ? ('CONNECTED' as const) : ('ERROR' as const), lastCheckedAt: new Date(), lastErrorCode: ok ? null : (error ?? 'unknown error').slice(0, 180) };
  await db.integrationSetting.upsert({ where: { provider: SMTP_PROVIDER }, update: data, create: { provider: SMTP_PROVIDER, ...data } });
}
