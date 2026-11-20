import { describe, expect, it } from 'vitest';
import { emailSettingsDefaults, headerText, normaliseEmailSettings, parseRecipients, validateEmailSettings } from '@/lib/email/smtp-config';
import { renderEmail, subject } from '@/lib/email/templates';
import { openSecret, sealSecret } from '@/server/security/secret-box';
import { describeSmtpError } from '@/server/services/mail/mailer';

describe('SMTP settings', () => {
  it('defaults to off, port 587 STARTTLS, notifying the team about forms but not auto-replying', () => {
    const d = emailSettingsDefaults();
    expect(d).toMatchObject({ enabled: false, port: 587, security: 'starttls', notifyContact: true, notifyBooking: true, notifyReview: true, notifyNewsletter: false, autoReplyContact: false, autoReplyBooking: false });
  });

  it('keeps only known fields with safe types', () => {
    const s = normaliseEmailSettings({ host: ' SMTP.Gmail.com ', port: '465', security: 'bogus', fromName: 'Connection\r\nBcc: x@evil.test', enabled: 'yes', extra: 1 });
    expect(s.host).toBe('smtp.gmail.com');
    expect(s.port).toBe(465);
    expect(s.security).toBe('starttls');
    expect(s.fromName).toBe('Connection Bcc: x@evil.test');
    expect(s.enabled).toBe(false);
    expect(s).not.toHaveProperty('extra');
  });

  it('splits a typed recipient list and reports bad entries', () => {
    expect(parseRecipients('A@x.com, b@y.co\nA@x.com; not-an-email')).toEqual({ valid: ['a@x.com', 'b@y.co'], invalid: ['not-an-email'] });
  });

  it('lets email be saved switched off, but asks for server, sender, password and recipients to switch it on', () => {
    const off = normaliseEmailSettings({});
    expect(validateEmailSettings(off, { hasPassword: false, usesServerEnv: false })).toEqual({});
    const on = normaliseEmailSettings({ enabled: true, username: 'me@x.com' });
    expect(Object.keys(validateEmailSettings(on, { hasPassword: false, usesServerEnv: false })).sort()).toEqual(['fromEmail', 'host', 'notifyTo', 'password']);
    const ready = normaliseEmailSettings({ enabled: true, host: 'smtp.x.com', username: 'me@x.com', fromEmail: 'me@x.com', notifyTo: 'team@x.com' });
    expect(validateEmailSettings(ready, { hasPassword: true, usesServerEnv: false })).toEqual({});
  });

  it('accepts the server .env as the mail server when the host is left empty', () => {
    const on = normaliseEmailSettings({ enabled: true, notifyTo: 'team@x.com' });
    expect(validateEmailSettings(on, { hasPassword: false, usesServerEnv: true })).toEqual({});
  });

  it('rejects a host with spaces or a scheme', () => {
    expect(validateEmailSettings(normaliseEmailSettings({ host: 'https://smtp.x.com' }), { hasPassword: false, usesServerEnv: false }).host).toBeTruthy();
  });
});

describe('email content', () => {
  it('escapes everything a visitor typed and drops empty rows', () => {
    const { html, text } = renderEmail({ siteName: 'Connection', heading: 'New contact message', rows: [['Name', '<script>alert(1)</script>'], ['Phone', null]], message: { label: 'Message', body: 'Hi & <b>bye</b>' } });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('Hi &amp; &lt;b&gt;bye&lt;/b&gt;');
    expect(html).not.toContain('Phone');
    expect(text).toContain('Name: <script>alert(1)</script>');
  });

  it('keeps subject lines on one line', () => {
    expect(subject('New VIP table request', 'Hi-Land', 'Eve\r\nBcc: x@evil.test')).toBe('New VIP table request — Hi-Land — Eve Bcc: x@evil.test');
    expect(headerText('a\n\nb')).toBe('a b');
  });
});

describe('stored SMTP password', () => {
  it('round-trips, is not readable as plain text and fails closed when tampered with', () => {
    const sealed = sealSecret('app-password-123', 'smtp-password');
    expect(sealed).not.toContain('app-password-123');
    expect(openSecret(sealed, 'smtp-password')).toBe('app-password-123');
    expect(openSecret(sealed, 'other-purpose')).toBeNull();
    expect(openSecret(`${sealed.slice(0, -4)}AAAA`, 'smtp-password')).toBeNull();
    expect(openSecret('plain', 'smtp-password')).toBeNull();
  });
});

describe('SMTP errors shown in Admin', () => {
  it('explains common failures without echoing credentials', () => {
    expect(describeSmtpError({ code: 'EAUTH', response: '535 auth failed for pass=secret' })).toMatch(/Login rejected/);
    expect(describeSmtpError({ code: 'ETIMEDOUT' })).toMatch(/Cannot reach/);
  });
});
