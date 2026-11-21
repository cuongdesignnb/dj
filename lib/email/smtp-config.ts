// Email (SMTP) settings shared by Admin and the server mailer. Pure helpers only,
// so they can be unit-tested; the password never passes through here.

export const SMTP_SECURITY = ['starttls', 'ssl', 'none'] as const;
export type SmtpSecurity = (typeof SMTP_SECURITY)[number];

export const SMTP_SECURITY_LABELS: Record<SmtpSecurity, string> = {
  starttls: 'STARTTLS (usually port 587)',
  ssl: 'SSL/TLS (usually port 465)',
  none: 'None / opportunistic (port 25)',
};

export interface EmailLogo {
  src: string;
  alt: string;
  mediaId: string | null;
}

export interface EmailSettings {
  enabled: boolean;
  host: string;
  port: number;
  security: SmtpSecurity;
  username: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  /** Logo at the top of every email. Empty: the site logo from Settings › Website. */
  emailLogo: EmailLogo | null;
  /** Who receives notifications: one or more addresses, separated by commas or new lines. */
  notifyTo: string;
  notifyContact: boolean;
  notifyBooking: boolean;
  notifyReview: boolean;
  notifyNewsletter: boolean;
  autoReplyContact: boolean;
  autoReplyBooking: boolean;
}

export const MAX_RECIPIENTS = 10;

export function emailSettingsDefaults(): EmailSettings {
  return {
    enabled: false,
    host: '',
    port: 587,
    security: 'starttls',
    username: '',
    fromName: '',
    fromEmail: '',
    replyTo: '',
    emailLogo: null,
    notifyTo: '',
    notifyContact: true,
    notifyBooking: true,
    notifyReview: true,
    notifyNewsletter: false,
    autoReplyContact: false,
    autoReplyBooking: false,
  };
}

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;

export function isEmail(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 254 && EMAIL_RE.test(value);
}

/** Splits a free-typed list ("a@x.com, b@y.com") into unique lowercase addresses. Invalid entries are reported, not dropped silently. */
export function parseRecipients(text: unknown): { valid: string[]; invalid: string[] } {
  const parts = String(text ?? '').split(/[\s,;]+/).map((part) => part.trim()).filter(Boolean);
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const part of parts) {
    const address = part.toLowerCase();
    if (!isEmail(address)) invalid.push(part);
    else if (!valid.includes(address)) valid.push(address);
  }
  return { valid, invalid };
}

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

/** Site paths and https URLs only, like the site logo setting. */
export function safeImageSrc(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const src = value.trim();
  return /^\/(?!\/)/.test(src) || /^https:\/\//i.test(src) ? src.slice(0, 2000) : null;
}

function logo(value: unknown): EmailLogo | null {
  if (!value || typeof value !== 'object') return null;
  const r = value as Record<string, unknown>;
  const src = safeImageSrc(r.src);
  if (!src) return null;
  return { src, alt: text(r.alt, 200), mediaId: typeof r.mediaId === 'string' ? r.mediaId.slice(0, 64) : null };
}

function bool(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

/** Reads stored or submitted values, keeping only known fields with safe types. */
export function normaliseEmailSettings(raw: unknown): EmailSettings {
  const d = emailSettingsDefaults();
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const port = Number(r.port);
  const security = (SMTP_SECURITY as readonly unknown[]).includes(r.security) ? (r.security as SmtpSecurity) : d.security;
  return {
    enabled: bool(r.enabled, d.enabled),
    host: text(r.host, 253).toLowerCase(),
    port: Number.isInteger(port) && port > 0 && port < 65536 ? port : d.port,
    security,
    username: text(r.username, 254),
    fromName: headerText(text(r.fromName, 120)),
    fromEmail: text(r.fromEmail, 254).toLowerCase(),
    replyTo: text(r.replyTo, 254).toLowerCase(),
    emailLogo: logo(r.emailLogo),
    notifyTo: text(r.notifyTo, 2000),
    notifyContact: bool(r.notifyContact, d.notifyContact),
    notifyBooking: bool(r.notifyBooking, d.notifyBooking),
    notifyReview: bool(r.notifyReview, d.notifyReview),
    notifyNewsletter: bool(r.notifyNewsletter, d.notifyNewsletter),
    autoReplyContact: bool(r.autoReplyContact, d.autoReplyContact),
    autoReplyBooking: bool(r.autoReplyBooking, d.autoReplyBooking),
  };
}

/**
 * Field errors for a save. Turned-off email may be saved half-filled; turning
 * it on needs a server, a sender and at least one notification address.
 */
const LOGIN_REQUIRED = /(^|\.)(gmail\.com|googlemail\.com|office365\.com|outlook\.com|zoho\.com|zoho\.com\.au|mail\.yahoo\.com|icloud\.com|sendgrid\.net|mailgun\.org|amazonaws\.com|brevo\.com|sendinblue\.com)$/;

export function validateEmailSettings(settings: EmailSettings, options: { hasPassword: boolean; usesServerEnv: boolean }): Record<string, string> {
  const errors: Record<string, string> = {};
  if (settings.host && !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/.test(settings.host)) errors.host = 'Enter a host name like smtp.gmail.com.';
  if (settings.fromEmail && !isEmail(settings.fromEmail)) errors.fromEmail = 'Enter a valid email address.';
  if (settings.replyTo && !isEmail(settings.replyTo)) errors.replyTo = 'Enter a valid email address.';
  const recipients = parseRecipients(settings.notifyTo);
  if (recipients.invalid.length) errors.notifyTo = `Not a valid email: ${recipients.invalid.slice(0, 3).join(', ')}`;
  else if (recipients.valid.length > MAX_RECIPIENTS) errors.notifyTo = `Use at most ${MAX_RECIPIENTS} addresses.`;
  if (!settings.enabled) return errors;
  if (!settings.host && !options.usesServerEnv) errors.host ??= 'Enter the SMTP server to turn email on.';
  if (!settings.fromEmail && !options.usesServerEnv) errors.fromEmail ??= 'Enter the address emails are sent from.';
  if (settings.username && !options.hasPassword && !options.usesServerEnv) errors.password = 'Enter the SMTP password for this username.';
  // These providers never accept mail without a login.
  if (settings.host && LOGIN_REQUIRED.test(settings.host) && !settings.username && !(options.hasPassword && settings.fromEmail)) errors.username = 'This provider needs a login: enter the full email address you sign in with (and its app password).';
  if (settings.host && LOGIN_REQUIRED.test(settings.host) && settings.security === 'none') errors.security = 'This provider needs an encrypted connection: use STARTTLS (port 587) or SSL/TLS (port 465).';
  if (!recipients.valid.length) errors.notifyTo ??= 'Add at least one address that receives notifications.';
  return errors;
}

/** One line of header-safe text: no line breaks (header injection), trimmed. */
export function headerText(value: string, max = 200): string {
  return value.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim().slice(0, max);
}

export function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
