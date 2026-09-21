import { z } from 'zod';

const email = z.string().trim().toLowerCase().email().max(320);
// PostgreSQL UUID values in the existing content seed are canonical 36-character
// UUIDs but do not all carry RFC 4122 version bits. Keep the shape check strict
// without rejecting those stable database identifiers.
const uuid = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid UUID');
const locale = z.enum(['en', 'vi']).default('en');

export const loginSchema = z.object({ email, password: z.string().min(1).max(200), remember: z.boolean().optional().default(false) }).strict();

export const bookingSchema = z.object({
  eventId: z.string().trim().min(1).max(120),
  vipPackageId: z.string().trim().min(1).max(120).optional().nullable(),
  preferredBoothId: z.string().trim().min(1).max(120).optional().nullable(),
  bottleIds: z.array(z.string().trim().min(1).max(120)).max(12).default([]),
  fullName: z.string().trim().min(2).max(160),
  email,
  phone: z.string().trim().max(40).optional().nullable(),
  groupSize: z.number().int().min(1).max(100),
  specialRequests: z.string().trim().max(2000).optional().nullable(),
  locale,
}).strict();

export const contactSchema = z.object({
  fullName: z.string().trim().min(2).max(160),
  email,
  phone: z.string().trim().max(40).optional().nullable(),
  enquiryType: z.string().trim().max(80).optional().nullable(),
  message: z.string().trim().min(5).max(5000),
  locale,
}).strict();

export const newsletterSchema = z.object({ email, locale, source: z.string().trim().max(80).optional() }).strict();

const checkoutLines = z.array(z.object({ productId: uuid, variantId: uuid.optional().nullable(), quantity: z.number().int().min(1).max(20) }).strict()).min(1).max(50);

export const checkoutSchema = z.object({
  customerEmail: email.optional().nullable(),
  items: checkoutLines.optional(),
  lines: checkoutLines.optional(),
  promoCode: z.string().trim().max(80).optional().nullable(),
  clientReference: z.string().trim().regex(/^[A-Za-z0-9-]{8,80}$/).optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
}).strict().refine((value) => Boolean(value.items?.length || value.lines?.length), { message: 'At least one checkout line is required.', path: ['items'] }).transform((value) => ({ ...value, items: value.items ?? value.lines ?? [] }));

export const squarePaymentSchema = z.object({
  sourceId: z.string().trim().min(1).max(1000),
  verificationToken: z.string().trim().min(1).max(2000).optional().nullable(),
  idempotencyKey: z.string().trim().regex(/^[A-Za-z0-9_-]{8,45}$/),
}).strict();

export const ticketCheckoutSchema = z.object({
  eventId: uuid,
  customerName: z.string().trim().min(2).max(160),
  customerEmail: email,
  items: z.array(z.object({ ticketTierId: uuid, quantity: z.number().int().min(1).max(20) }).strict()).min(1).max(20),
  clientReference: z.string().trim().regex(/^[A-Za-z0-9-]{8,80}$/).optional(),
}).strict();

export const vipCheckoutSchema = z.object({
  eventId: uuid,
  vipPackageId: uuid,
  boothId: uuid.optional().nullable(),
  customerName: z.string().trim().min(2).max(160),
  customerEmail: email,
  phone: z.string().trim().max(40).optional().nullable(),
  groupSize: z.number().int().min(1).max(100),
  clientReference: z.string().trim().regex(/^[A-Za-z0-9-]{8,80}$/).optional(),
}).strict();

export const refundSchema = z.object({
  amountMinor: z.number().int().positive().optional(),
  reason: z.string().trim().max(200).optional().nullable(),
  idempotencyKey: z.string().trim().regex(/^[A-Za-z0-9_-]{8,45}$/).optional(),
}).strict();

export const paginationSchema = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20) });

const moneyMutationSchema = z.object({
  amountMinor: z.number().int().nonnegative(),
  currency: z.string().trim().length(3),
}).strict();

const eventTicketTierMutationSchema = z.object({
  id: uuid.optional(),
  name: z.string().trim().min(1).max(160),
  price: moneyMutationSchema,
  badge: z.string().trim().max(80).nullable().optional(),
  online: z.boolean().default(false),
  door: z.boolean().default(false),
  sortOrder: z.number().int().nonnegative().default(0),
  enabled: z.boolean().optional(),
  availabilityStatus: z.enum(['AVAILABLE', 'SOLD_OUT', 'NOT_AVAILABLE', 'UNKNOWN', 'ON_REQUEST']).optional(),
  capacity: z.number().int().nonnegative().nullable().optional(),
  providerName: z.string().trim().max(120).nullable().optional(),
  providerExternalId: z.string().trim().max(160).nullable().optional(),
  providerUrl: z.string().url().nullable().optional(),
}).strict();

const eventBoothMutationSchema = z.object({
  id: uuid.optional(),
  code: z.string().trim().min(1).max(80),
  zone: z.string().trim().max(80).nullable().optional(),
  x: z.number().min(0).max(100).nullable().optional(),
  y: z.number().min(0).max(100).nullable().optional(),
  requestable: z.boolean().optional(),
  availabilityStatus: z.enum(['AVAILABLE', 'SOLD_OUT', 'NOT_AVAILABLE', 'UNKNOWN', 'ON_REQUEST']).optional(),
  sortOrder: z.number().int().nonnegative().default(0),
}).strict();

const eventBottleMutationSchema = z.object({
  id: uuid.optional(),
  name: z.string().trim().min(1).max(160),
  enabled: z.boolean().default(true),
  sortOrder: z.number().int().nonnegative().default(0),
  mediaId: uuid.nullable().optional(),
}).strict();

const eventFaqMutationSchema = z.object({
  id: uuid.optional(),
  question: z.string().trim().min(1).max(160),
  answer: z.string().trim().min(1).max(10000),
}).strict();

export const eventMutationSchema = z.object({
  slug: z.string().trim().min(2).max(120),
  status: z.enum(['DRAFT', 'PREVIEW', 'PUBLISHED', 'ARCHIVED']).optional(),
  lifecycleStatus: z.string().trim().min(2).max(40).optional(),
  dateStatus: z.enum(['TBA', 'CONFIRMED']).optional(),
  scheduleStatus: z.enum(['TBC', 'CONFIRMED']).optional(),
  startAt: z.string().datetime().nullable().optional(),
  endAt: z.string().datetime().nullable().optional(),
  venueName: z.string().trim().min(1).max(160),
  city: z.string().trim().min(1).max(100),
  region: z.string().trim().max(100).nullable().optional(),
  country: z.string().trim().min(2).max(100),
  address: z.string().trim().max(300).nullable().optional(),
  mapUrl: z.string().url().nullable().optional(),
  featured: z.boolean().optional(),
  heroMediaId: uuid.nullable().optional(),
  posterMediaId: uuid.nullable().optional(),
  seoTitle: z.string().trim().max(200).nullable().optional(),
  seoDescription: z.string().trim().max(500).nullable().optional(),
  canonicalOverride: z.string().url().nullable().optional(),
  ogMediaId: uuid.nullable().optional(),
  indexable: z.boolean().optional(),
  followLinks: z.boolean().optional(),
  translations: z.array(z.object({ locale: z.enum(['en', 'vi']), title: z.string().trim().min(1).max(200), eyebrow: z.string().trim().max(200).nullable().optional(), shortDescription: z.string().trim().max(500).nullable().optional(), description: z.string().trim().max(10000).nullable().optional() }).strict()).min(1).max(2),
  tickets: z.object({
    providerMode: z.enum(['none', 'external']),
    providerUrl: z.string().url().nullable().optional(),
    tiers: z.array(eventTicketTierMutationSchema).max(50).default([]),
  }).strict().optional(),
  vip: z.object({
    id: uuid.optional(),
    enabled: z.boolean().default(false),
    packageName: z.string().trim().max(160).default(''),
    price: moneyMutationSchema.nullable().optional(),
    capacity: z.number().int().positive().nullable().optional(),
    includedBottles: z.number().int().nonnegative().nullable().optional(),
    availabilityMode: z.enum(['on-request', 'managed']).default('on-request'),
    paymentMode: z.enum(['REQUEST_ONLY', 'FULL_PAYMENT', 'DEPOSIT']).optional(),
    depositAmountMinor: z.number().int().nonnegative().nullable().optional(),
    booths: z.array(eventBoothMutationSchema).max(200).default([]),
    bottles: z.array(eventBottleMutationSchema).max(100).default([]),
  }).strict().optional(),
  artistIds: z.array(uuid).max(200).default([]),
  albumIds: z.array(uuid).max(200).default([]),
  faqs: z.array(eventFaqMutationSchema).max(100).default([]),
}).strict().superRefine((value, ctx) => {
  if (value.tickets?.providerMode === 'external' && !value.tickets.providerUrl) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['tickets', 'providerUrl'], message: 'A provider URL is required when an external ticket provider is selected.' });
  }
  if (value.tickets) {
    const names = new Set<string>();
    for (const [index, tier] of value.tickets.tiers.entries()) {
      const key = tier.name.toLowerCase();
      if (names.has(key)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['tickets', 'tiers', index, 'name'], message: 'Ticket tier names must be unique within an event.' });
      names.add(key);
    }
  }
  if (value.vip) {
    const codes = new Set<string>();
    for (const [index, booth] of value.vip.booths.entries()) {
      const key = booth.code.toLowerCase();
      if (codes.has(key)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['vip', 'booths', index, 'code'], message: 'Booth codes must be unique within an event.' });
      codes.add(key);
    }
    const bottles = new Set<string>();
    for (const [index, bottle] of value.vip.bottles.entries()) {
      const key = bottle.name.toLowerCase();
      if (bottles.has(key)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['vip', 'bottles', index, 'name'], message: 'Bottle names must be unique.' });
      bottles.add(key);
    }
    if (value.vip.enabled && (!value.vip.packageName || !value.vip.price || !value.vip.capacity || value.vip.includedBottles == null)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['vip'], message: 'Enabled VIP packages require a name, price, capacity, and bottle count.' });
    }
  }
});

export const artistMutationSchema = z.object({
  slug: z.string().trim().min(2).max(120),
  country: z.string().trim().min(2).max(80),
  yearLabel: z.string().trim().max(20).nullable().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  featured: z.boolean().optional(),
  portraitMediaId: uuid.nullable().optional(),
  heroMediaId: uuid.nullable().optional(),
  translations: z.array(z.object({ locale: z.enum(['en', 'vi']), name: z.string().trim().min(1).max(160), bio: z.string().trim().max(10000).nullable().optional(), genres: z.array(z.string().trim().max(80)).max(20).optional() }).strict()).min(1).max(2),
}).strict();

export const productMutationSchema = z.object({
  slug: z.string().trim().min(2).max(160),
  categoryId: uuid.nullable().optional(),
  categoryKey: z.string().trim().max(80).optional(),
  status: z.enum(['DRAFT', 'PREVIEW', 'PUBLISHED', 'ARCHIVED']).optional(),
  basePriceMinor: z.number().int().nonnegative(),
  currency: z.string().length(3).default('AUD'),
  badge: z.string().trim().max(80).nullable().optional(),
  featured: z.boolean().optional(),
  stockTracking: z.enum(['NONE', 'TRACKED']).default('NONE'),
  translations: z.array(z.object({ locale: z.enum(['en', 'vi']), title: z.string().trim().min(1).max(200), excerpt: z.string().trim().max(500).nullable().optional(), description: z.string().trim().max(10000).nullable().optional() }).strict()).min(1).max(2),
}).strict();

export const articleMutationSchema = z.object({
  slug: z.string().trim().min(2).max(160),
  category: z.string().trim().min(1).max(80),
  status: z.enum(['DRAFT', 'PREVIEW', 'PUBLISHED', 'ARCHIVED']).optional(),
  featured: z.boolean().optional(),
  heroMediaId: uuid.nullable().optional(),
  cardMediaId: uuid.nullable().optional(),
  relatedEventId: uuid.nullable().optional(),
  translations: z.array(z.object({ locale: z.enum(['en', 'vi']), title: z.string().trim().min(1).max(240), excerpt: z.string().trim().max(1000).nullable().optional(), bodyBlocks: z.array(z.unknown()).max(200), quickSummary: z.array(z.string().max(500)).max(20).optional(), readingTimeOverride: z.number().int().positive().nullable().optional() }).strict()).min(1).max(2),
}).strict();

export const galleryMutationSchema = z.object({
  slug: z.string().trim().min(2).max(160),
  status: z.enum(['DRAFT', 'PREVIEW', 'PUBLISHED', 'ARCHIVED']).optional(),
  title: z.string().trim().min(1).max(200),
  subtitle: z.string().trim().max(500).nullable().optional(),
  description: z.string().trim().max(10000).nullable().optional(),
  venue: z.string().trim().max(200).nullable().optional(),
  eventId: uuid.nullable().optional(),
  featured: z.boolean().optional(),
  coverMediaId: uuid.nullable().optional(),
  heroMediaId: uuid.nullable().optional(),
}).strict();

export const partnerMutationSchema = z.object({
  slug: z.string().trim().min(2).max(120),
  type: z.string().trim().min(1).max(80),
  status: z.enum(['DRAFT', 'PREVIEW', 'PUBLISHED', 'ARCHIVED']).optional(),
  logoMediaId: uuid.nullable().optional(),
  imageMediaId: uuid.nullable().optional(),
  websiteUrl: z.string().url().nullable().optional(),
  featured: z.boolean().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
  translations: z.array(z.object({
    locale: z.enum(['en', 'vi']),
    name: z.string().trim().min(1).max(160),
    tagline: z.string().trim().max(200).nullable().optional(),
    description: z.string().trim().max(10000).nullable().optional(),
  }).strict()).min(1).max(2),
}).strict();

export const faqMutationSchema = z.object({
  category: z.string().trim().min(1).max(80),
  published: z.boolean().default(false),
  answersConfirmed: z.boolean().default(false),
  sortOrder: z.number().int().nonnegative().default(0),
  translations: z.array(z.object({
    locale: z.enum(['en', 'vi']),
    question: z.string().trim().min(1).max(160),
    answer: z.string().trim().min(1).max(10000),
    keywords: z.array(z.string().trim().max(80)).max(20).default([]),
  }).strict()).min(1).max(2),
}).strict();

export const idSchema = z.object({ id: uuid }).strict();

export function zodFieldErrors(error: z.ZodError) {
  return Object.fromEntries(error.issues.map((issue) => [issue.path.join('.') || 'body', issue.message]));
}
