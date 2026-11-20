import 'server-only';
import { db } from '@/server/db/client';
import { runtimeConfig } from '@/server/config';
import { eventScheduleText } from '@/lib/events/presentation';
import { renderEmail, subject } from '@/lib/email/templates';
import { sendMail, type SendResult } from './mailer';
import type { ResolvedSmtp } from './settings';

// Emails sent when visitors use the site's forms. Each runs after the response
// (next/server `after`), so a slow or broken mail server never blocks a visitor.
// Results go to the record's notificationStatus where the model has one.

async function siteName() {
  const row = await db.siteSetting.findUnique({ where: { key: 'site.name' } }).catch(() => null);
  return typeof row?.valueJson === 'string' && row.valueJson.trim() ? row.valueJson.trim() : 'Connection Rave';
}

function adminUrl(path: string) {
  return `${runtimeConfig().appUrl.replace(/\/$/, '')}${path}`;
}

function toAdmins(smtp: ResolvedSmtp, flag: boolean) {
  return flag ? smtp.recipients : [];
}

function logResult(kind: string, result: SendResult) {
  if (result.status === 'failed') console.error(`[mail] ${kind}: ${result.error}`);
}

export async function notifyContactMessage(id: string) {
  const row = await db.contactMessage.findUnique({ where: { id } });
  if (!row) return;
  const name = await siteName();
  const rows: Array<[string, string | null]> = [['Name', row.fullName], ['Email', row.email], ['Phone', row.phone], ['Enquiry', row.enquiryType]];
  const admin = await sendMail((smtp) => ({
    to: toAdmins(smtp, smtp.settings.notifyContact),
    replyTo: row.email,
    subject: subject('New contact message', row.fullName),
    ...renderEmail({ siteName: name, heading: 'New contact message', intro: 'Someone sent a message through the website contact form. Reply to this email to answer them.', rows, message: { label: 'Message', body: row.message }, footer: `${name} · website contact form` }),
  }));
  logResult('contact', admin);
  if (admin.status !== 'skipped') await db.contactMessage.update({ where: { id }, data: { notificationStatus: admin.status === 'sent' ? 'SENT' : 'FAILED' } }).catch(() => undefined);

  logResult('contact auto-reply', await sendMail((smtp) => (smtp.settings.autoReplyContact ? {
    to: row.email,
    subject: subject(`We received your message`, name),
    ...renderEmail({ siteName: name, heading: `Thanks, ${row.fullName.split(' ')[0]}`, intro: 'We received your message and will get back to you. A copy is below.', message: { label: 'Your message', body: row.message }, footer: `${name} · this is an automatic reply` }),
  } : null)));
}

export async function notifyBookingRequest(id: string) {
  const row = await db.bookingRequest.findUnique({
    where: { id },
    include: {
      event: { select: { slug: true, startAt: true, endAt: true, translations: { select: { locale: true, title: true } } } },
      vipPackage: { select: { name: true } },
      preferredBooth: { select: { code: true, label: true } },
      bottles: { select: { bottleOption: { select: { name: true } } } },
    },
  });
  if (!row) return;
  const name = await siteName();
  const eventTitle = row.event.translations.find((t) => t.locale === 'en')?.title ?? row.event.translations[0]?.title ?? row.event.slug;
  const booth = row.preferredBooth ? [row.preferredBooth.label, row.preferredBooth.code].filter(Boolean).join(' · ') : null;
  const rows: Array<[string, string | number | null]> = [
    ['Event', eventTitle],
    ['When', eventScheduleText(row.event.startAt, row.event.endAt)],
    ['Package', row.vipPackage?.name ?? null],
    ['Preferred table', booth],
    ['Group size', row.groupSize],
    ['Bottles', row.bottles.map((b) => b.bottleOption.name).join(', ') || null],
  ];
  const contact: Array<[string, string | null]> = [['Name', row.fullName], ['Email', row.email], ['Phone', row.phone]];

  const admin = await sendMail((smtp) => ({
    to: toAdmins(smtp, smtp.settings.notifyBooking),
    replyTo: row.email,
    subject: subject('New VIP table request', eventTitle, row.fullName),
    ...renderEmail({ siteName: name, heading: 'New VIP table request', intro: 'A guest asked for a VIP table. Confirm availability with them — nothing is reserved yet.', rows: [...contact, ...rows], message: row.specialRequests ? { label: 'Special requests', body: row.specialRequests } : null, cta: { label: 'Open VIP bookings', href: adminUrl('/admin/vip-bookings') }, footer: `${name} · VIP table request` }),
  }));
  logResult('booking', admin);
  if (admin.status !== 'skipped') await db.bookingRequest.update({ where: { id }, data: { notificationStatus: admin.status === 'sent' ? 'SENT' : 'FAILED' } }).catch(() => undefined);

  logResult('booking auto-reply', await sendMail((smtp) => (smtp.settings.autoReplyBooking ? {
    to: row.email,
    subject: subject('We received your VIP table request', eventTitle),
    ...renderEmail({ siteName: name, heading: 'Request received', intro: `Thanks, ${row.fullName.split(' ')[0]}. The team will confirm availability with you — this is not a reservation yet.`, rows, message: row.specialRequests ? { label: 'Your special requests', body: row.specialRequests } : null, footer: `${name} · this is an automatic reply` }),
  } : null)));
}

export async function notifyReview(input: { authorName: string; email: string; rating: number; comment: string; eventSlug?: string | null }) {
  const name = await siteName();
  logResult('review', await sendMail((smtp) => ({
    to: toAdmins(smtp, smtp.settings.notifyReview),
    replyTo: input.email,
    subject: subject('New review waiting for approval', `${input.rating}★`, input.authorName),
    ...renderEmail({ siteName: name, heading: 'New review waiting for approval', intro: 'It stays hidden on the website until someone approves it in Admin › Reviews.', rows: [['Name', input.authorName], ['Email', input.email], ['Rating', `${input.rating} / 5`], ['Event', input.eventSlug ?? null]], message: { label: 'Review', body: input.comment }, cta: { label: 'Open Reviews', href: adminUrl('/admin/reviews') }, footer: `${name} · reviews` }),
  })));
}

export async function notifyNewsletterSignup(email: string, source?: string | null) {
  const name = await siteName();
  logResult('newsletter', await sendMail((smtp) => ({
    to: toAdmins(smtp, smtp.settings.notifyNewsletter),
    subject: subject('New newsletter signup', email),
    ...renderEmail({ siteName: name, heading: 'New newsletter signup', rows: [['Email', email], ['Signed up from', source ?? null]], footer: `${name} · newsletter` }),
  })));
}
