import 'server-only';
import nodemailer from 'nodemailer';
import { headerText, isEmail } from '@/lib/email/smtp-config';
import type { EmailBrand, RenderedEmail } from '@/lib/email/templates';
import { loadEmailBrand, type InlineAttachment } from './brand';
import { recordSmtpCheck, resolveSmtp, type ResolvedSmtp } from './settings';

export interface OutgoingMail extends RenderedEmail {
  to: string | string[];
  replyTo?: string | null;
}

export type SendResult = { status: 'sent' } | { status: 'skipped'; reason: string } | { status: 'failed'; error: string };

/** Context a template needs: the saved settings and the site's brand (logo, name, links). */
export interface MailContext {
  smtp: ResolvedSmtp;
  brand: EmailBrand;
}

type SmtpError = { code?: string; command?: string; responseCode?: number; response?: string; message?: string; rejectedErrors?: SmtpError[] };

function serverSaid(e: SmtpError) {
  const said = headerText(e.response || e.message || '', 160);
  return said ? ` The server said: “${said}”.` : '';
}

/** A short, password-free description of an SMTP failure for Admin, with what to change. */
export function describeSmtpError(error: unknown): string {
  const e = (error ?? {}) as SmtpError;
  const first = e.rejectedErrors?.[0];
  if (first && e.code !== 'EENVELOPE') return describeSmtpError(first);
  if (e.code === 'EAUTH') return `Login rejected — check the username and password (Gmail and Outlook need an app password).${serverSaid(e)}`;
  if (e.code === 'ESOCKET' || e.code === 'ECONNECTION' || e.code === 'ETIMEDOUT' || e.code === 'ECONNREFUSED') return `Cannot reach the SMTP server (${e.code}) — check host, port and security.`;
  if (e.code === 'ETLS' || e.code === 'EREQUIRETLS') return `Secure connection failed — try the other Security option (STARTTLS for 587, SSL/TLS for 465).${serverSaid(e)}`;
  if (e.code === 'EDNS' || e.code === 'ENOTFOUND') return 'SMTP server name not found — check the host.';
  if (e.code === 'ENOAUTH') return 'The server needs a login — enter the username and password.';
  if (e.code === 'EENVELOPE') {
    const said = serverSaid(first ?? e);
    if (e.command === 'MAIL FROM') return `The server refused the sender address.${said} Set “From email” to the address you log in with, or one your provider lets you send from.`;
    if (e.command === 'RCPT TO' || first) return `The server refused the recipient.${said} If it mentions relay or authentication, the server wants a username and password (or the From email must be on the same account).`;
    if (e.command === 'DATA') return `The server refused the message.${said}`;
    return `An address is not valid.${said}`;
  }
  return headerText(`${e.responseCode ? `${e.responseCode} ` : ''}${e.response || e.message || String(error)}`, 220);
}

/**
 * Sends one message. The envelope sender is the login address when that is an
 * email: most mail servers refuse to relay for any other MAIL FROM, while the
 * visible From still shows the configured sender.
 */
async function deliver(smtp: ResolvedSmtp, mail: OutgoingMail, attachments: InlineAttachment[]) {
  const transport = nodemailer.createTransport({
    ...smtp.transport,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    // Never let message content pull in local files or remote URLs.
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  const recipients = (Array.isArray(mail.to) ? mail.to : [mail.to]).filter(Boolean);
  const login = smtp.transport.auth?.user ?? '';
  const fromAddress = typeof smtp.from === 'string' ? smtp.from : smtp.from.address;
  const envelopeFrom = isEmail(login) && login.toLowerCase() !== fromAddress.toLowerCase() ? login : null;
  try {
    const info = await transport.sendMail({
      from: smtp.from,
      to: recipients,
      subject: headerText(mail.subject),
      text: mail.text,
      html: mail.html,
      replyTo: mail.replyTo ?? smtp.replyTo ?? undefined,
      attachments: attachments.map((a) => ({ ...a, contentDisposition: 'inline' as const })),
      ...(envelopeFrom ? { envelope: { from: envelopeFrom, to: recipients } } : {}),
    });
    const rejected = (info as { rejected?: unknown[]; rejectedErrors?: SmtpError[] }).rejected ?? [];
    if (rejected.length) throw Object.assign(new Error('Some recipients were refused.'), { code: 'EENVELOPE', command: 'RCPT TO', rejectedErrors: (info as { rejectedErrors?: SmtpError[] }).rejectedErrors });
  } finally {
    transport.close();
  }
}

async function context() {
  const resolved = await resolveSmtp().catch((error: unknown) => ({ ok: false as const, reason: describeSmtpError(error) }));
  if (!resolved.ok) return resolved;
  const { brand, attachments } = await loadEmailBrand(resolved.smtp.settings);
  return { ok: true as const, ctx: { smtp: resolved.smtp, brand }, attachments };
}

/** Sends one email with the saved SMTP settings. Never throws: the caller gets a result to store. */
export async function sendMail(build: (ctx: MailContext) => OutgoingMail | null): Promise<SendResult> {
  const ready = await context();
  if (!ready.ok) return { status: 'skipped', reason: ready.reason };
  const message = build(ready.ctx);
  if (!message) return { status: 'skipped', reason: 'Nothing to send.' };
  if (Array.isArray(message.to) ? message.to.length === 0 : !message.to) return { status: 'skipped', reason: 'No recipient.' };
  try {
    await deliver(ready.ctx.smtp, message, ready.attachments);
    return { status: 'sent' };
  } catch (error) {
    const reason = describeSmtpError(error);
    console.error(`[mail] send failed: ${reason}`);
    await recordSmtpCheck(false, reason).catch(() => undefined);
    return { status: 'failed', error: reason };
  }
}

/** Admin's "Send test email" and template previews: saved settings, result recorded. */
export async function sendAdminMail(build: (ctx: MailContext) => Promise<OutgoingMail> | OutgoingMail) {
  const ready = await context();
  if (!ready.ok) return { ok: false as const, error: ready.reason };
  try {
    await deliver(ready.ctx.smtp, await build(ready.ctx), ready.attachments);
    await recordSmtpCheck(true);
    return { ok: true as const, logo: Boolean(ready.ctx.brand.logo) };
  } catch (error) {
    const reason = describeSmtpError(error);
    await recordSmtpCheck(false, reason);
    return { ok: false as const, error: reason };
  }
}
