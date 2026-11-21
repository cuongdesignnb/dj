import { escapeHtml, headerText } from './smtp-config';

// Branded email templates in the site's "Electric Blue × Liquid Chrome" look.
// Table layout with inline styles only, so Gmail, Outlook and Apple Mail agree.
// Every visitor-typed value is escaped; these functions are pure for testing.

export interface EmailBrand {
  siteName: string;
  siteUrl: string;
  /** Inline logo (sent as an attachment, referenced by cid). Null: a text wordmark is shown. */
  logo: { cid: string; width: number; height: number; alt: string } | null;
  contactEmail: string | null;
  socials: Array<{ label: string; href: string }>;
}

export interface EmailEvent {
  title: string;
  when: string | null;
  venue: string | null;
  url: string | null;
  posterUrl: string | null;
}

export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

const C = {
  page: '#00090E',
  card: '#071923',
  panel: '#0A1E2A',
  line: '#13303D',
  blue: '#04B8FC',
  ice: '#70D9FF',
  deep: '#006CA8',
  silver: '#C4D0DC',
  text: '#F5FAFF',
  muted: '#94A6B5',
  faint: '#5F7383',
  onBlue: '#00131D',
};
const FONT = "'Helvetica Neue',Helvetica,Arial,sans-serif";
const HEAD = "'Oswald','Arial Narrow','Helvetica Neue',Arial,sans-serif";

const e = escapeHtml;

/** One line of subject; visitor-typed names cannot add headers. */
export function subject(...parts: Array<string | null | undefined>) {
  return headerText(parts.filter(Boolean).join(' — '));
}

function firstName(full: string) {
  return full.trim().split(/\s+/)[0] || full;
}

// ---------------------------------------------------------------- blocks ---

function badge(label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="border:1px solid ${C.blue};border-radius:4px;padding:6px 10px;font:700 11px/1 ${FONT};letter-spacing:2px;text-transform:uppercase;color:${C.ice};">${e(label)}</td></tr></table>`;
}

function heading(title: string, intro?: string) {
  return `<h1 style="margin:18px 0 0;font:700 28px/1.15 ${HEAD};letter-spacing:1px;text-transform:uppercase;color:${C.text};">${e(title)}</h1>${intro ? `<p style="margin:12px 0 0;font:400 15px/1.6 ${FONT};color:${C.muted};">${e(intro)}</p>` : ''}`;
}

function section(label: string, inner: string) {
  return `<p style="margin:28px 0 10px;font:700 11px/1 ${FONT};letter-spacing:2px;text-transform:uppercase;color:${C.blue};">${e(label)}</p>${inner}`;
}

type Row = [label: string, value: string | number | null | undefined, href?: string | null];

function present(rows: Row[]) {
  return rows.filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '');
}

function details(rows: Row[]) {
  const shown = present(rows);
  if (!shown.length) return '';
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">${shown
    .map(([label, value, href], i) => {
      const v = e(String(value));
      const val = href ? `<a href="${e(href)}" style="color:${C.ice};text-decoration:none;">${v}</a>` : v;
      return `<tr><td style="padding:11px 12px 11px 0;${i ? `border-top:1px solid ${C.line};` : ''}width:36%;font:400 13px/1.4 ${FONT};color:${C.muted};vertical-align:top;">${e(label)}</td><td style="padding:11px 0;${i ? `border-top:1px solid ${C.line};` : ''}font:700 14px/1.4 ${FONT};color:${C.text};vertical-align:top;">${val}</td></tr>`;
    })
    .join('')}</table>`;
}

function quote(body: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background:${C.panel};border-left:3px solid ${C.blue};border-radius:0 6px 6px 0;padding:16px 18px;font:400 15px/1.65 ${FONT};color:${C.text};white-space:pre-wrap;">${e(body)}</td></tr></table>`;
}

function note(body: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;"><tr><td style="border:1px solid ${C.line};border-radius:6px;padding:14px 16px;font:400 13px/1.6 ${FONT};color:${C.silver};">${e(body)}</td></tr></table>`;
}

interface Button { label: string; href: string; primary?: boolean }

function buttons(list: Array<Button | null>) {
  const shown = list.filter((b): b is Button => Boolean(b));
  if (!shown.length) return '';
  const cells = shown
    .map((b) => {
      const style = b.primary
        ? `background:${C.blue};color:${C.onBlue};border:1px solid ${C.blue};`
        : `background:transparent;color:${C.ice};border:1px solid ${C.blue};`;
      return `<td style="padding:0 10px 10px 0;"><a href="${e(b.href)}" style="${style}display:inline-block;border-radius:6px;padding:13px 22px;font:700 13px/1 ${FONT};letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;">${e(b.label)}</a></td>`;
    })
    .join('');
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;"><tr>${cells}</tr></table>`;
}

function eventCard(event: EmailEvent) {
  const poster = event.posterUrl
    ? `<tr><td style="padding:0;"><img src="${e(event.posterUrl)}" width="536" alt="${e(event.title)}" style="display:block;width:100%;max-width:536px;height:auto;border:0;border-radius:6px 6px 0 0;"></td></tr>`
    : '';
  const meta = [event.when, event.venue].filter(Boolean).map((line) => `<p style="margin:6px 0 0;font:400 14px/1.5 ${FONT};color:${C.silver};">${e(line!)}</p>`).join('');
  const title = event.url
    ? `<a href="${e(event.url)}" style="color:${C.text};text-decoration:none;">${e(event.title)}</a>`
    : e(event.title);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;background:${C.panel};border:1px solid ${C.line};border-radius:6px;">${poster}<tr><td style="padding:18px 20px;"><p style="margin:0;font:700 11px/1 ${FONT};letter-spacing:2px;text-transform:uppercase;color:${C.blue};">Event</p><p style="margin:8px 0 0;font:700 22px/1.2 ${HEAD};text-transform:uppercase;letter-spacing:0.5px;color:${C.text};">${title}</p>${meta}</td></tr></table>`;
}

function stars(rating: number) {
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return `<p style="margin:22px 0 0;font:400 30px/1 ${FONT};letter-spacing:4px;"><span style="color:${C.blue};">${'★'.repeat(r)}</span><span style="color:#24404E;">${'★'.repeat(5 - r)}</span><span style="font:700 15px/1 ${FONT};letter-spacing:0;color:${C.muted};">&nbsp;&nbsp;${r} / 5</span></p>`;
}

function bigValue(label: string, value: string, href?: string) {
  const v = href ? `<a href="${e(href)}" style="color:${C.ice};text-decoration:none;">${e(value)}</a>` : e(value);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;background:${C.panel};border:1px solid ${C.line};border-radius:6px;"><tr><td align="center" style="padding:26px 16px;"><p style="margin:0;font:700 11px/1 ${FONT};letter-spacing:2px;text-transform:uppercase;color:${C.muted};">${e(label)}</p><p style="margin:12px 0 0;font:700 22px/1.3 ${FONT};color:${C.ice};word-break:break-all;">${v}</p></td></tr></table>`;
}

function steps(list: string[]) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${list
    .map((step, i) => `<tr><td width="34" style="padding:8px 0;vertical-align:top;"><span style="display:inline-block;width:24px;height:24px;border-radius:12px;background:${C.deep};color:${C.text};font:700 12px/24px ${FONT};text-align:center;">${i + 1}</span></td><td style="padding:10px 0 8px;font:400 14px/1.55 ${FONT};color:${C.silver};">${e(step)}</td></tr>`)
    .join('')}</table>`;
}

// ---------------------------------------------------------------- layout ---

function header(brand: EmailBrand) {
  const mark = brand.logo
    ? `<img src="cid:${e(brand.logo.cid)}" width="${brand.logo.width}" height="${brand.logo.height}" alt="${e(brand.logo.alt)}" style="display:block;border:0;outline:none;height:${brand.logo.height}px;width:${brand.logo.width}px;">`
    : `<span style="font:700 22px/1 ${HEAD};letter-spacing:5px;text-transform:uppercase;color:${C.text};">${e(brand.siteName)}</span>`;
  return `<tr><td align="center" style="padding:6px 0 26px;"><a href="${e(brand.siteUrl)}" style="text-decoration:none;color:${C.text};">${mark}</a></td></tr>`;
}

function footer(brand: EmailBrand, audience: 'team' | 'visitor', reason: string) {
  const links = [
    ...brand.socials.map((s) => `<a href="${e(s.href)}" style="color:${C.ice};text-decoration:none;">${e(s.label)}</a>`),
    `<a href="${e(brand.siteUrl)}" style="color:${C.ice};text-decoration:none;">${e(brand.siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</a>`,
  ].join(`<span style="color:${C.faint};">&nbsp;&nbsp;·&nbsp;&nbsp;</span>`);
  const contact = audience === 'visitor' && brand.contactEmail
    ? `<p style="margin:10px 0 0;font:400 12px/1.6 ${FONT};color:${C.muted};">Questions? Email <a href="mailto:${e(brand.contactEmail)}" style="color:${C.ice};text-decoration:none;">${e(brand.contactEmail)}</a></p>`
    : '';
  return `<tr><td align="center" style="padding:26px 12px 8px;"><p style="margin:0;font:400 13px/1.6 ${FONT};">${links}</p>${contact}<p style="margin:12px 0 0;font:400 11px/1.6 ${FONT};color:${C.faint};">${e(reason)}</p><p style="margin:6px 0 0;font:700 10px/1 ${FONT};letter-spacing:3px;text-transform:uppercase;color:${C.faint};">${e(brand.siteName)}</p></td></tr>`;
}

function shell(brand: EmailBrand, opts: { preheader: string; body: string; audience: 'team' | 'visitor'; reason: string }) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark light"><meta name="supported-color-schemes" content="dark light"><title>${e(brand.siteName)}</title></head>
<body style="margin:0;padding:0;background:${C.page};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.page};">${e(opts.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.page}" style="background:${C.page};"><tr><td align="center" style="padding:32px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
${header(brand)}
<tr><td style="background:${C.card};border:1px solid ${C.line};border-radius:8px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="height:4px;line-height:4px;font-size:0;background:${C.blue};background-image:linear-gradient(90deg,${C.deep},${C.blue},${C.ice});border-radius:8px 8px 0 0;">&nbsp;</td></tr>
<tr><td style="padding:32px 32px 36px;">${opts.body}</td></tr>
</table></td></tr>
${footer(brand, opts.audience, opts.reason)}
</table></td></tr></table></body></html>`;
}

/** Plain-text twin of every email, for clients that do not show HTML. */
function plain(brand: EmailBrand, title: string, parts: Array<string | null | undefined>) {
  return [title.toUpperCase(), '', ...parts.filter((p): p is string => p !== null && p !== undefined), '', '—', brand.siteName, brand.siteUrl].join('\n');
}

function plainRows(rows: Row[]) {
  return present(rows).map(([label, value]) => `${label}: ${value}`).join('\n');
}

function mailto(address: string, subjectLine: string) {
  return `mailto:${address}?subject=${encodeURIComponent(subjectLine)}`;
}

// ------------------------------------------------------------- templates ---

export interface ContactData { fullName: string; email: string; phone: string | null; enquiryType: string | null; message: string }

export function contactTeamEmail(brand: EmailBrand, d: ContactData): RenderedEmail {
  const rows: Row[] = [['Name', d.fullName], ['Email', d.email, `mailto:${d.email}`], ['Phone', d.phone, d.phone ? `tel:${d.phone.replace(/[^\d+]/g, '')}` : null], ['Enquiry', d.enquiryType]];
  const body = badge('New message') + heading('New contact message', `${d.fullName} wrote through the website contact form.`) + section('From', details(rows)) + section('Message', quote(d.message)) + buttons([{ label: `Reply to ${firstName(d.fullName)}`, href: mailto(d.email, `Re: your message to ${brand.siteName}`), primary: true }]);
  return {
    subject: subject('New contact message', d.fullName),
    html: shell(brand, { preheader: d.message.slice(0, 120), body, audience: 'team', reason: `Sent by the ${brand.siteName} website. Reply to this email to answer ${firstName(d.fullName)} directly.` }),
    text: plain(brand, 'New contact message', [plainRows(rows), '', 'Message:', d.message]),
  };
}

export function contactReplyEmail(brand: EmailBrand, d: ContactData): RenderedEmail {
  const body = badge('Message received') + heading(`Thanks, ${firstName(d.fullName)}`, `We got your message and the ${brand.siteName} team will get back to you as soon as they can.`) + section('Your message', quote(d.message)) + section('What happens next', steps(['The team reads your message.', 'You get a reply at this email address.', 'Need to add something? Just reply to this email.'])) + buttons([{ label: 'See upcoming events', href: `${brand.siteUrl.replace(/\/$/, '')}/#upcoming-events`, primary: true }]);
  return {
    subject: subject('We received your message', brand.siteName),
    html: shell(brand, { preheader: 'Thanks — your message reached the team.', body, audience: 'visitor', reason: `This is an automatic reply to your message on the ${brand.siteName} website.` }),
    text: plain(brand, `Thanks, ${firstName(d.fullName)}`, [`We got your message and the ${brand.siteName} team will get back to you.`, '', 'Your message:', d.message]),
  };
}

export interface BookingData {
  fullName: string;
  email: string;
  phone: string | null;
  groupSize: number;
  packageName: string | null;
  table: string | null;
  bottles: string | null;
  specialRequests: string | null;
  event: EmailEvent;
}

function bookingRows(d: BookingData): Row[] {
  return [['Package', d.packageName], ['Preferred table', d.table], ['Group size', `${d.groupSize} ${d.groupSize === 1 ? 'guest' : 'guests'}`], ['Bottles', d.bottles]];
}

export function bookingTeamEmail(brand: EmailBrand, d: BookingData): RenderedEmail {
  const guest: Row[] = [['Name', d.fullName], ['Email', d.email, `mailto:${d.email}`], ['Phone', d.phone, d.phone ? `tel:${d.phone.replace(/[^\d+]/g, '')}` : null]];
  const body = badge('VIP table request') + heading('New VIP table request', `${d.fullName} asked for a table. Nothing is reserved yet — confirm availability with them.`) + eventCard(d.event) + section('Guest', details(guest)) + section('Request', details(bookingRows(d))) + (d.specialRequests ? section('Special requests', quote(d.specialRequests)) : '') + buttons([{ label: `Reply to ${firstName(d.fullName)}`, href: mailto(d.email, `Your VIP table request — ${d.event.title}`), primary: true }, d.phone ? { label: 'Call', href: `tel:${d.phone.replace(/[^\d+]/g, '')}` } : null]);
  return {
    subject: subject('New VIP table request', d.event.title, d.fullName),
    html: shell(brand, { preheader: `${d.fullName} · ${d.groupSize} guests · ${d.event.title}`, body, audience: 'team', reason: `Sent by the ${brand.siteName} website. Reply to this email to answer the guest directly.` }),
    text: plain(brand, 'New VIP table request', [`Event: ${d.event.title}`, d.event.when ? `When: ${d.event.when}` : null, '', plainRows(guest), plainRows(bookingRows(d)), d.specialRequests ? `\nSpecial requests:\n${d.specialRequests}` : null]),
  };
}

export function bookingReplyEmail(brand: EmailBrand, d: BookingData): RenderedEmail {
  const body = badge('Request received') + heading(`Thanks, ${firstName(d.fullName)}`, 'We got your VIP table request. The team will confirm availability with you — this is not a reservation yet.') + eventCard(d.event) + section('Your request', details(bookingRows(d))) + (d.specialRequests ? section('Special requests', quote(d.specialRequests)) : '') + section('What happens next', steps(['The team checks table availability for your night.', 'You get a reply at this email address to confirm the details.', 'Your table is only held once the team confirms it.'])) + buttons([d.event.url ? { label: 'View event', href: d.event.url, primary: true } : null]);
  return {
    subject: subject('We received your VIP table request', d.event.title),
    html: shell(brand, { preheader: `Request received for ${d.event.title} — not a reservation yet.`, body, audience: 'visitor', reason: `This is an automatic reply to your VIP table request on the ${brand.siteName} website.` }),
    text: plain(brand, 'Request received', ['Thanks for your VIP table request. The team will confirm availability with you — this is not a reservation yet.', '', `Event: ${d.event.title}`, d.event.when ? `When: ${d.event.when}` : null, plainRows(bookingRows(d))]),
  };
}

export interface ReviewData { authorName: string; email: string; rating: number; comment: string; eventTitle: string | null; adminUrl: string }

export function reviewTeamEmail(brand: EmailBrand, d: ReviewData): RenderedEmail {
  const rows: Row[] = [['Name', d.authorName], ['Email', d.email, `mailto:${d.email}`], ['Event', d.eventTitle]];
  const body = badge('Review to approve') + heading('New review waiting', 'It stays hidden on the website until someone approves it in Admin › Reviews.') + stars(d.rating) + section('Review', quote(d.comment)) + section('From', details(rows)) + buttons([{ label: 'Approve in Admin', href: d.adminUrl, primary: true }]);
  return {
    subject: subject('New review waiting for approval', `${d.rating}★`, d.authorName),
    html: shell(brand, { preheader: `${d.rating}/5 from ${d.authorName}: ${d.comment.slice(0, 90)}`, body, audience: 'team', reason: `Sent by the ${brand.siteName} website.` }),
    text: plain(brand, 'New review waiting for approval', [`Rating: ${d.rating} / 5`, plainRows(rows), '', 'Review:', d.comment, '', `Approve: ${d.adminUrl}`]),
  };
}

export interface NewsletterData { email: string; source: string | null; total: number | null }

export function newsletterTeamEmail(brand: EmailBrand, d: NewsletterData): RenderedEmail {
  const rows: Row[] = [['Signed up from', d.source], ['Subscribers now', d.total === null ? null : d.total.toLocaleString('en-AU')]];
  const body = badge('New subscriber') + heading('Newsletter signup', 'Someone joined the mailing list on the website.') + bigValue('Email', d.email, `mailto:${d.email}`) + (present(rows).length ? section('Details', details(rows)) : '');
  return {
    subject: subject('New newsletter signup', d.email),
    html: shell(brand, { preheader: `${d.email} joined the mailing list.`, body, audience: 'team', reason: `Sent by the ${brand.siteName} website. Turn these off in Admin › Settings › Email (SMTP).` }),
    text: plain(brand, 'New newsletter signup', [`Email: ${d.email}`, plainRows(rows)]),
  };
}

export interface TestData { server: string; from: string; recipients: string[]; sentAt: string }

export function testEmail(brand: EmailBrand, d: TestData): RenderedEmail {
  const rows: Row[] = [['Mail server', d.server], ['Sent from', d.from], ['Notifications go to', d.recipients.join(', ') || 'No addresses set yet'], ['Sent at', d.sentAt]];
  const body = badge('Test email') + heading('Email is working', `If you can read this, the ${brand.siteName} website can send email.`) + section('Settings used', details(rows)) + note('Not in your inbox next time? Check the spam folder, and make sure the From email is an address your mail server allows you to send from.');
  return {
    subject: subject(`Test email from ${brand.siteName}`),
    html: shell(brand, { preheader: 'Your email settings work.', body, audience: 'team', reason: 'Sent from Admin › Settings › Email (SMTP).' }),
    text: plain(brand, 'Email is working', [`If you can read this, the ${brand.siteName} website can send email.`, '', plainRows(rows)]),
  };
}
