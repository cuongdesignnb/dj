import { z } from 'zod';

/**
 * Page-content keys are deliberately finite.  The JSON column is a storage
 * detail; every public key is validated against one of these schemas before
 * it can be written or rendered.
 */
export const PAGE_CONTENT_KEYS = [
  'global-content',
  'events-list',
  'past-events',
  'lineup-list',
  'news-list',
  'gallery-list',
  'shop-list',
] as const;

export type PageContentKey = (typeof PAGE_CONTENT_KEYS)[number] | `tickets:${string}` | `tables:${string}` | `booking:${string}`;

const text = z.string().max(20_000);
const url = z.string().max(2_000).refine((value) => value === '' || value.startsWith('/') || /^https?:\/\//i.test(value) || /^(mailto|tel):/i.test(value), 'Use a relative, http(s), mailto or tel URL.');
const media = z.object({ src: text, alt: text, width: z.number().int().nonnegative().optional(), height: z.number().int().nonnegative().optional() }).nullable();
const action = z.object({ label: text, href: url });
const cta = z.object({ title: text, subtitle: text.optional(), primary: action, secondary: action.optional(), background: media.optional() });
const seo = z.object({ title: text, description: text, ogImage: media.optional(), index: z.boolean(), follow: z.boolean() });
const faq = z.object({ id: text.optional(), question: text, answer: text, enabled: z.boolean().optional(), sortOrder: z.number().int().optional() });
const info = z.object({ id: text.optional(), icon: text, title: text, description: text, action: action.optional(), ctaLabel: text.optional(), ctaUrl: url.optional(), enabled: z.boolean().optional(), sortOrder: z.number().int().optional() });
const hero = z.object({
  breadcrumb: text.optional(),
  eyebrow: text.optional(),
  title: text.optional(),
  titleLine1: text.optional(),
  titleLine2: text.optional(),
  description: text.optional(),
  image: media.optional(),
  sideNotes: z.array(text).max(12).optional(),
  footNotes: z.array(text).max(12).optional(),
}).strict();

const ticketSchema = z.object({
  hero: hero.optional(),
  selector: z.object({ eyebrow: text, title: text, description: text, aside: text.optional(), emptyTitle: text, emptyDescription: text }).strict().optional(),
  trustItems: z.array(info.extend({ verificationState: z.enum(['provider-confirmed', 'marketing-copy']).optional() })).max(50),
  infoItems: z.array(info).max(50),
  faq: z.array(faq).max(50),
  finalCta: cta,
  provider: z.object({ unavailableNote: text, providerName: text.optional() }).strict().optional(),
  footer: z.object({ email: text.nullable(), phone: text.nullable(), legalTermsHref: url, legalPrivacyHref: url }).strict().optional(),
  seo,
}).strict();

const tablesSchema = z.object({
  hero: hero,
  map: z.object({ eyebrow: text, title: text, description: text, disclaimer: text, stageLabel: text, background: media.optional() }).strict(),
  infoTitle: text,
  infoContext: text,
  faqContext: text,
  infoItems: z.array(info).max(50),
  faq: z.array(faq).max(50),
  finalCta: cta,
  seo,
}).strict();

const bookingSchema = z.object({
  hero: hero,
  tabs: z.object({ tickets: text, vip: text }).strict(),
  form: z.object({ heading: text, description: text, nameLabel: text, emailLabel: text, phoneLabel: text, groupSizeLabel: text, boothLabel: text, bottleLabel: text, specialRequestLabel: text, submitLabel: text }).strict(),
  bookingNotes: z.array(info).max(50),
  notesTitle: text,
  notesContext: text,
  processSteps: z.array(z.object({ id: text.optional(), title: text, description: text }).strict()).max(20),
  faq: z.array(faq).max(50),
  faqContext: text,
  finalCta: cta,
  seo,
}).strict();

const listingHero = hero.extend({ primary: action.optional(), secondary: action.optional() });
const listingSchema = z.object({
  hero: listingHero,
  filters: z.array(z.object({ key: text, label: text, options: z.array(text).max(50) }).strict()).max(30).optional(),
  sections: z.array(z.object({ key: text, eyebrow: text.optional(), title: text, description: text.optional(), enabled: z.boolean().optional() }).strict()).max(30).optional(),
  emptyState: z.object({ title: text, description: text, cta: action.optional() }).strict(),
  finalCta: cta,
  seo,
}).strict();

const globalSchema = z.object({
  tagline: text,
  footerDescription: text,
  ageNotice: text,
  genericCtaFallback: action,
  copyright: text,
  emptyCopy: text,
  seo,
}).strict();

export const pageContentSchemas = {
  tickets: ticketSchema,
  tables: tablesSchema,
  booking: bookingSchema,
  listing: listingSchema,
  global: globalSchema,
} as const;

export type PageContentData = z.infer<typeof ticketSchema> | z.infer<typeof tablesSchema> | z.infer<typeof bookingSchema> | z.infer<typeof listingSchema> | z.infer<typeof globalSchema>;

export function pageContentKind(key: string): keyof typeof pageContentSchemas | null {
  if (key === 'global-content') return 'global';
  if (key.startsWith('tickets:')) return 'tickets';
  if (key.startsWith('tables:')) return 'tables';
  if (key.startsWith('booking:')) return 'booking';
  if (PAGE_CONTENT_KEYS.includes(key as (typeof PAGE_CONTENT_KEYS)[number])) return 'listing';
  return null;
}

export function pageContentSchema(key: string) {
  const kind = pageContentKind(key);
  if (!kind) return null;
  return pageContentSchemas[kind];
}

export function isPageContentKey(value: string): value is PageContentKey {
  return pageContentKind(value) !== null;
}

export function parsePageContent(key: string, value: unknown): PageContentData {
  const schema = pageContentSchema(key);
  if (!schema) throw new Error(`Unsupported page content key: ${key}`);
  return schema.parse(value) as PageContentData;
}

export function safePageContentUrl(value: string): boolean {
  return url.safeParse(value).success;
}
