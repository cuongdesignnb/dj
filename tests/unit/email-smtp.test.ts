import { describe, expect, it } from 'vitest';
import { emailSettingsDefaults, headerText, normaliseEmailSettings, parseRecipients, validateEmailSettings } from '@/lib/email/smtp-config';
import { bookingReplyEmail, bookingTeamEmail, contactReplyEmail, contactTeamEmail, newsletterTeamEmail, reviewTeamEmail, subject, testEmail, type EmailBrand } from '@/lib/email/templates';
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

const brand: EmailBrand = { siteName: 'Connection Rave', siteUrl: 'https://connectionland.com.au', logo: { cid: 'logo@x', width: 200, height: 54, alt: 'Connection' }, contactEmail: 'hello@example.com', socials: [{ label: 'Instagram', href: 'https://instagram.com/x' }] };
const event = { title: 'Hi-Land Perth', when: 'Sat 7 Nov 2026 · 9:00 PM – 3:00 AM', venue: 'Rapture Nightclub, Perth', url: 'https://connectionland.com.au/events/hi-land-perth', posterUrl: 'https://connectionland.com.au/api/v1/media/abc' };
const booking = { fullName: 'Eve <b>Smith</b>', email: 'eve@example.com', phone: '0400 000 000', groupSize: 6, packageName: 'Gold', table: 'A1', bottles: 'Vodka', specialRequests: 'Birthday', event };

describe('email templates', () => {
  it('every template shows the inline logo, escapes visitor text and has a plain-text version', () => {
    const contact = { fullName: '<script>x</script> Eve', email: 'eve@example.com', phone: null, enquiryType: null, message: 'Hi & <b>bye</b>' };
    const all = [
      contactTeamEmail(brand, contact), contactReplyEmail(brand, contact), bookingTeamEmail(brand, booking), bookingReplyEmail(brand, booking),
      reviewTeamEmail(brand, { authorName: 'Eve', email: 'eve@example.com', rating: 4, comment: 'Great <i>night</i>', eventTitle: 'Hi-Land Perth', adminUrl: 'https://x/admin/reviews' }),
      newsletterTeamEmail(brand, { email: 'eve@example.com', source: 'Homepage', total: 12 }),
      testEmail(brand, { server: 'smtp.x.com:587', from: 'a@x.com', recipients: ['team@x.com'], sentAt: 'now' }),
    ];
    for (const mail of all) {
      expect(mail.html).toContain('src="cid:logo@x"');
      expect(mail.html).not.toMatch(/<script>|<b>bye|<i>night|<b>Smith/);
      expect(mail.text.length).toBeGreaterThan(20);
      expect(mail.subject).not.toMatch(/[\r\n]/);
    }
    expect(all[0].html).toContain('Hi &amp; &lt;b&gt;bye&lt;/b&gt;');
  });

  it('falls back to the site name when the logo cannot be drawn', () => {
    const mail = contactReplyEmail({ ...brand, logo: null }, { fullName: 'Eve', email: 'e@x.com', phone: null, enquiryType: null, message: 'Hello there' });
    expect(mail.html).not.toContain('cid:');
    expect(mail.html).toContain('Connection Rave');
  });

  it('VIP emails show the event card and say a request is not a reservation', () => {
    const team = bookingTeamEmail(brand, booking);
    expect(team.html).toContain('Hi-Land Perth');
    expect(team.html).toContain('src="https://connectionland.com.au/api/v1/media/abc"');
    expect(team.html).toContain('mailto:eve@example.com');
    expect(bookingReplyEmail(brand, booking).html).toContain('not a reservation yet');
  });

  it('a review shows its star rating', () => {
    expect(reviewTeamEmail(brand, { authorName: 'Eve', email: 'e@x.com', rating: 3, comment: 'Good', eventTitle: null, adminUrl: 'https://x' }).html).toContain('3 / 5');
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

  it('says which address was refused and quotes the server', () => {
    const from = describeSmtpError({ code: 'EENVELOPE', command: 'MAIL FROM', response: '553 5.7.1 Sender address rejected: not owned by user' });
    expect(from).toMatch(/refused the sender/);
    expect(from).toContain('not owned by user');
    expect(from).toMatch(/From email/);
    const to = describeSmtpError({ code: 'EENVELOPE', command: 'RCPT TO', response: '550 5.7.1 Relaying denied' });
    expect(to).toMatch(/refused the recipient/);
    expect(to).toContain('Relaying denied');
  });
});
