import 'server-only';
import { db } from '@/server/db/client';
import { eventScheduleText } from '@/lib/events/presentation';
import {
  bookingReplyEmail,
  bookingTeamEmail,
  contactReplyEmail,
  contactTeamEmail,
  newsletterTeamEmail,
  reviewTeamEmail,
  testEmail,
  type BookingData,
  type EmailEvent,
  type RenderedEmail,
} from '@/lib/email/templates';
import { absoluteImage, siteLink } from './brand';
import { sendAdminMail, sendMail, type SendResult } from './mailer';

// Emails sent when visitors use the site's forms. Each runs after the response
// (next/server `after`), so a slow or broken mail server never blocks a visitor.
// Results go to the record's notificationStatus where the model has one.

function logResult(kind: string, result: SendResult) {
  if (result.status === 'failed') console.error(`[mail] ${kind}: ${result.error}`);
}

const eventSelect = {
  slug: true,
  startAt: true,
  endAt: true,
  venueName: true,
  city: true,
  translations: { select: { locale: true, title: true } },
  posterMedia: { select: { publicUrl: true, mimeType: true, deletedAt: true } },
} as const;

type EventRow = {
  slug: string;
  startAt: Date | null;
  endAt: Date | null;
  venueName: string;
  city: string;
  translations: Array<{ locale: string; title: string }>;
  posterMedia: { publicUrl: string; mimeType: string; deletedAt: Date | null } | null;
};

function emailEvent(row: EventRow): EmailEvent {
  const poster = row.posterMedia && !row.posterMedia.deletedAt && row.posterMedia.mimeType.startsWith('image/') && row.posterMedia.mimeType !== 'image/svg+xml' ? row.posterMedia.publicUrl : null;
  return {
    title: row.translations.find((t) => t.locale === 'en')?.title ?? row.translations[0]?.title ?? row.slug,
    when: eventScheduleText(row.startAt, row.endAt),
    venue: [row.venueName, row.city].filter(Boolean).join(', ') || null,
    url: siteLink(`/events/${encodeURIComponent(row.slug)}`),
    posterUrl: absoluteImage(poster),
  };
}

export async function notifyContactMessage(id: string) {
  const row = await db.contactMessage.findUnique({ where: { id } });
  if (!row) return;
  const data = { fullName: row.fullName, email: row.email, phone: row.phone, enquiryType: row.enquiryType, message: row.message };
  const team = await sendMail(({ smtp, brand }) => (smtp.settings.notifyContact ? { to: smtp.recipients, replyTo: row.email, ...contactTeamEmail(brand, data) } : null));
  logResult('contact', team);
  if (team.status !== 'skipped') await db.contactMessage.update({ where: { id }, data: { notificationStatus: team.status === 'sent' ? 'SENT' : 'FAILED' } }).catch(() => undefined);
  logResult('contact auto-reply', await sendMail(({ smtp, brand }) => (smtp.settings.autoReplyContact ? { to: row.email, ...contactReplyEmail(brand, data) } : null)));
}

export async function notifyBookingRequest(id: string) {
  const row = await db.bookingRequest.findUnique({
    where: { id },
    include: {
      event: { select: eventSelect },
      vipPackage: { select: { name: true } },
      preferredBooth: { select: { code: true, label: true } },
      bottles: { select: { bottleOption: { select: { name: true } } } },
    },
  });
  if (!row) return;
  const data: BookingData = {
    fullName: row.fullName,
    email: row.email,
    phone: row.phone,
    groupSize: row.groupSize,
    packageName: row.vipPackage?.name ?? null,
    table: row.preferredBooth ? [row.preferredBooth.label, row.preferredBooth.code].filter(Boolean).join(' · ') : null,
    bottles: row.bottles.map((b) => b.bottleOption.name).join(', ') || null,
    specialRequests: row.specialRequests,
    event: emailEvent(row.event),
  };
  const team = await sendMail(({ smtp, brand }) => (smtp.settings.notifyBooking ? { to: smtp.recipients, replyTo: row.email, ...bookingTeamEmail(brand, data) } : null));
  logResult('booking', team);
  if (team.status !== 'skipped') await db.bookingRequest.update({ where: { id }, data: { notificationStatus: team.status === 'sent' ? 'SENT' : 'FAILED' } }).catch(() => undefined);
  logResult('booking auto-reply', await sendMail(({ smtp, brand }) => (smtp.settings.autoReplyBooking ? { to: row.email, ...bookingReplyEmail(brand, data) } : null)));
}

async function eventTitle(slug: string | null | undefined) {
  if (!slug) return null;
  const row = await db.event.findFirst({ where: { slug }, select: eventSelect }).catch(() => null);
  return row ? emailEvent(row).title : null;
}

export async function notifyReview(input: { authorName: string; email: string; rating: number; comment: string; eventSlug?: string | null }) {
  const title = await eventTitle(input.eventSlug);
  logResult('review', await sendMail(({ smtp, brand }) => (smtp.settings.notifyReview ? {
    to: smtp.recipients,
    replyTo: input.email,
    ...reviewTeamEmail(brand, { authorName: input.authorName, email: input.email, rating: input.rating, comment: input.comment, eventTitle: title, adminUrl: siteLink('/admin/reviews') }),
  } : null)));
}

export async function notifyNewsletterSignup(email: string, source?: string | null) {
  const total = await db.newsletterSubscriber.count({ where: { status: 'SUBSCRIBED' } }).catch(() => null);
  logResult('newsletter', await sendMail(({ smtp, brand }) => (smtp.settings.notifyNewsletter ? { to: smtp.recipients, ...newsletterTeamEmail(brand, { email, source: source ?? null, total }) } : null)));
}

// ----------------------------------------------------- Admin test & previews ---

export const EMAIL_PREVIEWS = ['test', 'contact', 'contact-reply', 'booking', 'booking-reply', 'review', 'newsletter'] as const;
export type EmailPreview = (typeof EMAIL_PREVIEWS)[number];

/** The next upcoming published event, else the most recent one: previews show a real event card. */
async function previewEvent(): Promise<EmailEvent> {
  const now = new Date();
  const where = { status: 'PUBLISHED' as const, deletedAt: null };
  const row = (await db.event.findFirst({ where: { ...where, startAt: { gte: now } }, orderBy: { startAt: 'asc' }, select: eventSelect }).catch(() => null))
    ?? (await db.event.findFirst({ where, orderBy: { startAt: 'desc' }, select: eventSelect }).catch(() => null));
  return row ? emailEvent(row) : { title: 'Your next event', when: null, venue: null, url: siteLink('/events'), posterUrl: null };
}

const SAMPLE = {
  fullName: 'Sample Guest',
  email: 'guest@example.com',
  phone: '0400 000 000',
  message: 'This is a sample message so you can see how this email looks. Real emails show what the visitor typed.',
};

/** Sends the test email, or a preview of one template filled with clearly marked sample data. */
export async function sendEmailPreview(kind: EmailPreview, to: string) {
  const event = kind.startsWith('booking') ? await previewEvent() : null;
  return sendAdminMail(({ smtp, brand }) => {
    let mail: RenderedEmail;
    const contact = { fullName: SAMPLE.fullName, email: SAMPLE.email, phone: SAMPLE.phone, enquiryType: 'General enquiry', message: SAMPLE.message };
    const booking: BookingData = { fullName: SAMPLE.fullName, email: SAMPLE.email, phone: SAMPLE.phone, groupSize: 6, packageName: 'Sample VIP package', table: 'Sample table', bottles: 'Sample bottle', specialRequests: 'Sample special request.', event: event! };
    switch (kind) {
      case 'contact': mail = contactTeamEmail(brand, contact); break;
      case 'contact-reply': mail = contactReplyEmail(brand, contact); break;
      case 'booking': mail = bookingTeamEmail(brand, booking); break;
      case 'booking-reply': mail = bookingReplyEmail(brand, booking); break;
      case 'review': mail = reviewTeamEmail(brand, { authorName: SAMPLE.fullName, email: SAMPLE.email, rating: 5, comment: SAMPLE.message, eventTitle: null, adminUrl: siteLink('/admin/reviews') }); break;
      case 'newsletter': mail = newsletterTeamEmail(brand, { email: SAMPLE.email, source: 'Homepage', total: null }); break;
      default: {
        const t = smtp.transport;
        mail = testEmail(brand, { server: `${t.host}:${t.port} (${t.secure ? 'SSL/TLS' : t.requireTLS ? 'STARTTLS' : 'no encryption'})`, from: typeof smtp.from === 'string' ? smtp.from : `${smtp.from.name} <${smtp.from.address}>`, recipients: smtp.recipients, sentAt: `${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC` });
      }
    }
    return { to, ...mail, subject: kind === 'test' ? mail.subject : `[Preview] ${mail.subject}` };
  });
}
