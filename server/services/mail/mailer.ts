import 'server-only';
import nodemailer from 'nodemailer';
import { escapeHtml, headerText } from '@/lib/email/smtp-config';
import { recordSmtpCheck, resolveSmtp, type ResolvedSmtp } from './settings';

export interface OutgoingMail {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  replyTo?: string | null;
}

export type SendResult = { status: 'sent' } | { status: 'skipped'; reason: string } | { status: 'failed'; error: string };

/** A short, password-free description of an SMTP failure for Admin. */
export function describeSmtpError(error: unknown): string {
  const e = error as { code?: string; responseCode?: number; response?: string; message?: string };
  if (e?.code === 'EAUTH') return 'Login rejected — check the username and password (Gmail and Outlook need an app password).';
  if (e?.code === 'ESOCKET' || e?.code === 'ECONNECTION' || e?.code === 'ETIMEDOUT' || e?.code === 'ECONNREFUSED') return `Cannot reach the SMTP server (${e.code}) — check host, port and security.`;
  if (e?.code === 'EDNS' || e?.code === 'ENOTFOUND') return 'SMTP server name not found — check the host.';
  if (e?.code === 'EENVELOPE') return 'An address was refused by the server.';
  const detail = e?.response || e?.message || String(error);
  return headerText(`${e?.responseCode ? `${e.responseCode} ` : ''}${detail}`, 180);
}

async function deliver(smtp: ResolvedSmtp, mail: OutgoingMail) {
  const transport = nodemailer.createTransport({
    ...smtp.transport,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    // Never let message content pull in local files or remote URLs.
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  try {
    await transport.sendMail({
      from: smtp.from,
      to: mail.to,
      subject: headerText(mail.subject),
      text: mail.text,
      html: mail.html,
      replyTo: mail.replyTo ?? smtp.replyTo ?? undefined,
    });
  } finally {
    transport.close();
  }
}

/** Sends one email with the saved SMTP settings. Never throws: the caller gets a result to store. */
export async function sendMail(mail: OutgoingMail | ((smtp: ResolvedSmtp) => OutgoingMail | null)): Promise<SendResult> {
  const resolved = await resolveSmtp().catch((error: unknown) => ({ ok: false as const, reason: describeSmtpError(error) }));
  if (!resolved.ok) return { status: 'skipped', reason: resolved.reason };
  const message = typeof mail === 'function' ? mail(resolved.smtp) : mail;
  if (!message) return { status: 'skipped', reason: 'Nothing to send.' };
  if (Array.isArray(message.to) ? message.to.length === 0 : !message.to) return { status: 'skipped', reason: 'No recipient.' };
  try {
    await deliver(resolved.smtp, message);
    return { status: 'sent' };
  } catch (error) {
    const reason = describeSmtpError(error);
    console.error(`[mail] send failed: ${reason}`);
    await recordSmtpCheck(false, reason).catch(() => undefined);
    return { status: 'failed', error: reason };
  }
}

/** Admin's "Send test email": uses the saved settings and records the result. */
export async function sendTestEmail(to: string, siteName: string) {
  const resolved = await resolveSmtp();
  if (!resolved.ok) return { ok: false as const, error: resolved.reason };
  try {
    await deliver(resolved.smtp, {
      to,
      subject: `Test email from ${siteName}`,
      text: `This is a test email from ${siteName}.\n\nIf you can read this, email sending works. Notifications go to: ${resolved.smtp.recipients.join(', ') || '(no addresses set)'}.`,
      html: `<p>This is a test email from <strong>${escapeHtml(siteName)}</strong>.</p><p>If you can read this, email sending works.</p>`,
    });
    await recordSmtpCheck(true);
    return { ok: true as const };
  } catch (error) {
    const reason = describeSmtpError(error);
    await recordSmtpCheck(false, reason);
    return { ok: false as const, error: reason };
  }
}
