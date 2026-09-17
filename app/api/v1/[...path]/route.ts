import { createHash, randomUUID } from 'node:crypto';
import argon2 from 'argon2';
import Stripe from 'stripe';
import { Prisma } from '@prisma/client';
import { db } from '@/server/db/client';
import { env, runtimeConfig } from '@/server/config';
import { ApiError, conflict, notFound, unauthorized, validationError } from '@/server/errors';
import { requestContext, dataResponse, errorResponse, listResponse, logRequest } from '@/server/http/response';
import { createAdminSession, destroyAdminSession, getAdminSession } from '@/server/auth/session';
import { requirePermission } from '@/server/auth/rbac';
import { enforceRateLimit } from '@/server/rate-limit';
import { writeAuditLog } from '@/server/audit/log';
import { readCsrfCookie, requestCsrfToken } from '@/server/security/csrf';
import { mediaResponse, storeMedia } from '@/server/media/storage';
import { createBooking, createContact, subscribeNewsletter } from '@/server/services/leads';
import {
  getPublicArtist,
  getPublicBootstrap,
  getPublicEvent,
  getPublicFaq,
  getPublicGallery,
  getPublicLegal,
  getPublicNews,
  getPublicPartners,
  getPublicProduct,
  getPublicTickets,
  getPublicVip,
  listPublicArtists,
  listPublicEvents,
  listPublicGallery,
  listPublicNews,
  listPublicProducts,
  localeFrom,
} from '@/server/services/public';
import {
  artistMutationSchema,
  articleMutationSchema,
  bookingSchema,
  checkoutSchema,
  contactSchema,
  eventMutationSchema,
  faqMutationSchema,
  galleryMutationSchema,
  loginSchema,
  newsletterSchema,
  paginationSchema,
  partnerMutationSchema,
  productMutationSchema,
  zodFieldErrors,
} from '@/server/validators/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ path: string[] }> };

async function body(request: Request) {
  const raw = await request.text();
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new ApiError(400, 'INVALID_JSON', 'Request body must be valid JSON.');
  }
}

function parse<T>(schema: import('zod').ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw validationError(Object.fromEntries(result.error.issues.map((issue) => [issue.path.join('.') || 'body', issue.message])));
  return result.data;
}

function jsonInput(value: unknown) {
  return value as Prisma.InputJsonValue;
}

async function rememberPublishedSlug(
  tx: Prisma.TransactionClient,
  entityType: string,
  entityId: string,
  before: { slug: string; status: string },
  nextSlug: string,
) {
  if (before.status !== 'PUBLISHED' || before.slug === nextSlug) return;
  await tx.slugHistory.upsert({
    where: { entityType_oldSlug: { entityType, oldSlug: before.slug } },
    update: { entityId },
    create: { entityType, entityId, oldSlug: before.slug },
  });
}

function ip(request: Request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? 'unknown';
}

function assertSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return;
  const configured = env('APP_URL');
  const expected = configured ? new URL(configured).origin : new URL(request.url).origin;
  if (origin !== expected) throw new ApiError(403, 'CROSS_ORIGIN', 'Cross-origin requests are not allowed.');
}

function query(request: Request) {
  return new URL(request.url).searchParams;
}

function adminResourcePermission(resource: string, action: 'view' | 'create' | 'edit' | 'delete' | 'publish') {
  const normalized = resource === 'orders' ? 'orders' : resource === 'staff' ? 'staff' : resource === 'roles' ? 'roles' : resource === 'settings' || resource === 'audit' || resource === 'tasks' ? 'settings' : resource === 'faq' || resource === 'legal' || resource === 'booking-requests' || resource === 'contact-messages' ? 'support' : resource;
  return `${normalized}.${action}`;
}

function jsonAdminRecord(row: any) {
  const copy = { ...row };
  delete copy.passwordHash;
  return copy;
}

function iso(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  return typeof value === 'string' ? value : '';
}

function localized(rows: any[] | undefined, field: string, locale = 'en') {
  const translation = rows?.find((row) => row.locale === locale) ?? rows?.find((row) => row.locale === 'en') ?? rows?.[0];
  return translation?.[field] ?? '';
}

function localizedMap(rows: any[] | undefined, field: string) {
  const output: Record<string, string> = {};
  for (const row of rows ?? []) {
    if ((row.locale === 'en' || row.locale === 'vi') && typeof row[field] === 'string') output[row.locale] = row[field];
  }
  return output;
}

function mediaRef(media: any) {
  return media?.publicUrl ? { src: media.publicUrl, alt: media.altText ?? '', mediaId: media.id } : null;
}

function adminRecord(resource: string, row: any) {
  const base = jsonAdminRecord(row);
  if (resource === 'events') {
    const packageRow = row.vipPackages?.[0];
    return {
      ...base,
      name: Object.keys(localizedMap(row.translations, 'title')).length ? localizedMap(row.translations, 'title') : { en: row.slug },
      eyebrow: localizedMap(row.translations, 'eyebrow'),
      shortDescription: localizedMap(row.translations, 'shortDescription'),
      longDescription: localizedMap(row.translations, 'description'),
      heroImage: mediaRef(row.heroMedia),
      posterImage: mediaRef(row.posterMedia),
      status: String(row.status).toLowerCase(),
      phase: String(row.lifecycleStatus ?? 'UPCOMING').toLowerCase(),
      dateStatus: String(row.dateStatus).toLowerCase(),
      startDate: row.startAt ? iso(row.startAt).slice(0, 10) : '',
      startTime: row.startAt ? iso(row.startAt).slice(11, 16) : '',
      endDate: row.endAt ? iso(row.endAt).slice(0, 10) : '',
      endTime: row.endAt ? iso(row.endAt).slice(11, 16) : '',
      scheduleStatus: String(row.scheduleStatus).toLowerCase(),
      venue: { name: row.venueName, city: row.city, region: row.region ?? '', country: row.country, address: row.address ?? '', mapUrl: row.mapUrl ?? '', image: null },
      tickets: { providerMode: row.ticketTiers?.length ? 'external' : 'none', providerUrl: '', tiers: (row.ticketTiers ?? []).map((tier: any, index: number) => ({ name: tier.name, price: { amountMinor: tier.priceMinor, currency: tier.currency }, badge: tier.badge ?? '', online: tier.purchasableOnline, door: tier.purchasableAtDoor, sortOrder: tier.sortOrder ?? index })) },
      vip: { enabled: Boolean(packageRow?.enabled), packageName: packageRow?.name ?? '', price: packageRow ? { amountMinor: packageRow.priceMinor, currency: packageRow.currency } : null, capacity: packageRow?.capacity ?? null, includedBottles: packageRow?.includedBottleCount ?? null, availabilityMode: 'on-request', booths: (row.vipBooths ?? []).map((booth: any) => ({ code: booth.code, zone: String(booth.zone).toLowerCase() })), bottles: [] },
      artistIds: (row.eventArtists ?? []).map((item: any) => item.artistId),
      albumIds: [],
      faqs: [],
      seo: {},
      updatedAt: iso(row.updatedAt),
    };
  }
  if (resource === 'artists') {
    return {
      ...base,
      name: localizedMap(row.translations, 'name'),
      year: row.yearLabel ?? '',
      portrait: mediaRef(row.portraitMedia),
      heroImage: mediaRef(row.heroMedia),
      bio: localizedMap(row.translations, 'bio'),
      genres: (row.translations?.[0]?.genresJson ?? []) as unknown[],
      setTimeStatus: String(row.setTimeStatus ?? 'TBA').toLowerCase(),
      setTime: row.setTime ? iso(row.setTime) : '',
      status: String(row.status).toLowerCase(),
      links: Object.fromEntries((row.links ?? []).map((link: any) => [link.type, link.url])),
      media: row.media ?? [],
      eventIds: (row.eventArtists ?? []).map((item: any) => item.eventId),
      seo: {},
      updatedAt: iso(row.updatedAt),
    };
  }
  if (resource === 'products') {
    return {
      ...base,
      title: Object.keys(localizedMap(row.translations, 'title')).length ? localizedMap(row.translations, 'title') : { en: row.slug },
      category: row.category?.key ?? '',
      status: String(row.status).toLowerCase(),
      price: { amountMinor: row.basePriceMinor, currency: row.currency },
      excerpt: localizedMap(row.translations, 'excerpt'),
      description: localizedMap(row.translations, 'description'),
      images: (row.images ?? []).map((image: any) => ({ label: image.label ?? '', image: mediaRef(image.media), sortOrder: image.sortOrder })),
      variants: row.variants ?? [],
      stockStatus: row.stockTracking === 'TRACKED' ? 'available' : 'unknown',
      details: [],
      highlights: [],
      seo: {},
      updatedAt: iso(row.updatedAt),
    };
  }
  if (resource === 'news') {
    const translation = row.translations?.find((item: any) => item.locale === 'en') ?? row.translations?.[0];
    return {
      ...base,
      title: Object.keys(localizedMap(row.translations, 'title')).length ? localizedMap(row.translations, 'title') : { en: row.slug },
      excerpt: localizedMap(row.translations, 'excerpt'),
      status: String(row.status).toLowerCase(),
      heroImage: mediaRef(row.heroMedia),
      cardImage: mediaRef(row.cardMedia),
      body: translation?.bodyBlocksJson ?? [],
      quickSummary: translation?.quickSummaryJson ?? [],
      tags: (row.tags ?? []).map((tag: any) => tag.tag?.label ?? tag.tagId),
      eventId: row.relatedEventId ?? '',
      publishedAt: row.publishedAt ? iso(row.publishedAt) : null,
      seo: { title: translation?.seoTitle ?? '', description: translation?.seoDescription ?? '' },
      updatedAt: iso(row.updatedAt),
    };
  }
  if (resource === 'gallery') {
    const translation = row.translations?.find((item: any) => item.locale === 'en') ?? row.translations?.[0];
    return {
      ...base,
      title: translation?.title ?? row.slug,
      subtitle: translation?.subtitle ?? '',
      description: translation?.description ?? '',
      status: String(row.status).toLowerCase(),
      cover: mediaRef(row.coverMedia),
      hero: mediaRef(row.heroMedia),
      items: row.media ?? [],
      updatedAt: iso(row.updatedAt),
    };
  }
  if (resource === 'partners') {
    return {
      ...base,
      name: localized(row.translations, 'name'),
      logo: mediaRef(row.logoMedia),
      collaborationImage: mediaRef(row.imageMedia),
      website: row.websiteUrl ?? '',
      status: String(row.status).toLowerCase(),
      updatedAt: iso(row.updatedAt),
    };
  }
  if (resource === 'orders') {
    return {
      ...base,
      customerName: '',
      email: row.customerEmail,
      currency: row.currency,
      lines: (row.items ?? []).map((item: any) => ({ title: item.titleSnapshot, variant: item.variantSnapshot ?? '', unitPrice: { amountMinor: item.unitPriceMinor, currency: row.currency }, quantity: item.quantity, lineTotal: { amountMinor: item.lineTotalMinor, currency: row.currency } })),
      itemCount: (row.items ?? []).reduce((sum: number, item: any) => sum + item.quantity, 0),
      subtotal: { amountMinor: row.subtotalMinor, currency: row.currency },
      shipping: row.shippingMinor ? { amountMinor: row.shippingMinor, currency: row.currency } : null,
      tax: row.taxMinor ? { amountMinor: row.taxMinor, currency: row.currency } : null,
      discount: row.discountMinor ? { amountMinor: row.discountMinor, currency: row.currency } : null,
      total: { amountMinor: row.totalMinor, currency: row.currency },
      paymentStatus: String(row.paymentStatus).toLowerCase(),
      fulfillmentStatus: String(row.fulfillmentStatus).toLowerCase(),
      createdAt: iso(row.createdAt),
      updatedAt: iso(row.updatedAt),
    };
  }
  if (resource === 'media') {
    const name = String(row.storageKey).split('/').pop() ?? row.storageKey;
    return { ...base, name, url: row.publicUrl, kind: row.mimeType.startsWith('video/') ? 'video-thumbnail' : row.mimeType === 'application/pdf' ? 'document' : row.mimeType.includes('svg') ? 'logo' : 'image', alt: row.altText, usedBy: [], updatedAt: iso(row.updatedAt) };
  }
  if (resource === 'staff') {
    const role = row.userRoles?.[0]?.role;
    return { ...base, name: row.name, roleId: row.userRoles?.[0]?.roleId ?? '', roleName: role?.name ?? '', status: String(row.status).toLowerCase(), language: row.locale, lastActiveAt: row.lastLoginAt ? iso(row.lastLoginAt) : null, updatedAt: iso(row.updatedAt) };
  }
  if (resource === 'roles') {
    return { ...base, name: row.name, description: row.description ?? '', permissions: (row.rolePermissions ?? []).map((item: any) => item.permission.key), system: row.isSystem, updatedAt: iso(row.updatedAt) };
  }
  if (resource === 'faq') {
    return { ...base, category: row.category?.key ?? '', question: localizedMap(row.translations, 'question'), answer: localizedMap(row.translations, 'answer'), keywords: row.translations?.[0]?.keywordsJson ?? [], published: row.published === true, answersConfirmed: row.answersConfirmed === true, sortOrder: row.sortOrder, updatedAt: iso(row.updatedAt) };
  }
  if (resource === 'legal') {
    const translation = row.translations?.find((item: any) => item.locale === 'en') ?? row.translations?.[0];
    const sections = Array.isArray(translation?.sectionsJson) ? translation.sectionsJson : [];
    return { ...base, id: row.type, title: translation?.title ?? row.type, status: String(row.status).toLowerCase(), intro: translation?.intro ?? '', version: row.version, effectiveDate: row.effectiveAt ? iso(row.effectiveAt).slice(0, 10) : '', updatedDate: iso(row.updatedAt).slice(0, 10), sections, seo: {}, updatedAt: iso(row.updatedAt) };
  }
  if (resource === 'audit') {
    return { id: row.id, actorName: row.actor?.name ?? 'System', action: row.action, entityType: row.entityType, entityId: row.entityId ?? undefined, createdAt: iso(row.createdAt) };
  }
  return base;
}

async function adminList(resource: string, request: Request) {
  const parsed = paginationSchema.safeParse(Object.fromEntries(query(request)));
  if (!parsed.success) throw validationError(zodFieldErrors(parsed.error));
  const { page, pageSize } = parsed.data;
  const skip = (page - 1) * pageSize;
  if (resource === 'events') {
    const [rows, total] = await Promise.all([db.event.findMany({ skip, take: pageSize, orderBy: { updatedAt: 'desc' }, include: { translations: true, ticketTiers: true, vipPackages: true, vipBooths: true, eventArtists: true, heroMedia: true, posterMedia: true } }), db.event.count()]);
    return { rows, total };
  }
  if (resource === 'artists') {
    const [rows, total] = await Promise.all([db.artist.findMany({ skip, take: pageSize, orderBy: { updatedAt: 'desc' }, include: { translations: true, portraitMedia: true, heroMedia: true, links: true, media: true, eventArtists: true } }), db.artist.count()]);
    return { rows, total };
  }
  if (resource === 'products') {
    const [rows, total] = await Promise.all([db.product.findMany({ skip, take: pageSize, orderBy: { updatedAt: 'desc' }, include: { translations: true, variants: true, category: true, images: { include: { media: true } } } }), db.product.count()]);
    return { rows, total };
  }
  if (resource === 'news') {
    const [rows, total] = await Promise.all([db.newsArticle.findMany({ skip, take: pageSize, orderBy: { updatedAt: 'desc' }, include: { translations: true, heroMedia: true, cardMedia: true, tags: { include: { tag: true } } } }), db.newsArticle.count()]);
    return { rows, total };
  }
  if (resource === 'gallery') {
    const [rows, total] = await Promise.all([db.galleryAlbum.findMany({ skip, take: pageSize, orderBy: { updatedAt: 'desc' }, include: { translations: true, media: { include: { media: true } }, coverMedia: true, heroMedia: true } }), db.galleryAlbum.count()]);
    return { rows, total };
  }
  if (resource === 'partners') {
    const [rows, total] = await Promise.all([db.partner.findMany({ skip, take: pageSize, orderBy: { updatedAt: 'desc' }, include: { translations: true, logoMedia: true, imageMedia: true } }), db.partner.count()]);
    return { rows, total };
  }
  if (resource === 'orders') {
    const [rows, total] = await Promise.all([db.order.findMany({ skip, take: pageSize, orderBy: { createdAt: 'desc' }, include: { items: true, payments: true } }), db.order.count()]);
    return { rows, total };
  }
  if (resource === 'booking-requests') {
    const [rows, total] = await Promise.all([db.bookingRequest.findMany({ skip, take: pageSize, orderBy: { createdAt: 'desc' }, include: { event: true, vipPackage: true, preferredBooth: true } }), db.bookingRequest.count()]);
    return { rows, total };
  }
  if (resource === 'contact-messages') {
    const [rows, total] = await Promise.all([db.contactMessage.findMany({ skip, take: pageSize, orderBy: { createdAt: 'desc' } }), db.contactMessage.count()]);
    return { rows, total };
  }
  if (resource === 'media') {
    const [rows, total] = await Promise.all([db.mediaAsset.findMany({ where: { deletedAt: null }, skip, take: pageSize, orderBy: { updatedAt: 'desc' } }), db.mediaAsset.count({ where: { deletedAt: null } })]);
    return { rows, total };
  }
  if (resource === 'discounts') {
    const [rows, total] = await Promise.all([db.discount.findMany({ skip, take: pageSize, orderBy: { code: 'asc' } }), db.discount.count()]);
    return { rows, total };
  }
  if (resource === 'staff') {
    const [rows, total] = await Promise.all([db.adminUser.findMany({ skip, take: pageSize, orderBy: { updatedAt: 'desc' }, include: { userRoles: { include: { role: true } } } }), db.adminUser.count()]);
    return { rows, total };
  }
  if (resource === 'roles') {
    const [rows, total] = await Promise.all([db.role.findMany({ skip, take: pageSize, orderBy: { name: 'asc' }, include: { rolePermissions: { include: { permission: true } } } }), db.role.count()]);
    return { rows, total };
  }
  if (resource === 'faq') {
    const [rows, total] = await Promise.all([db.faqItem.findMany({ skip, take: pageSize, orderBy: { sortOrder: 'asc' }, include: { category: true, translations: true } }), db.faqItem.count()]);
    return { rows, total };
  }
  if (resource === 'legal') {
    const [rows, total] = await Promise.all([db.legalDocument.findMany({ skip, take: pageSize, orderBy: { type: 'asc' }, include: { translations: true } }), db.legalDocument.count()]);
    return { rows, total };
  }
  if (resource === 'audit') {
    const [rows, total] = await Promise.all([db.auditLog.findMany({ skip, take: pageSize, orderBy: { createdAt: 'desc' }, include: { actor: { select: { name: true } } } }), db.auditLog.count()]);
    return { rows, total };
  }
  if (resource === 'tasks') return { rows: [], total: 0 };
  throw notFound('Admin resource not found.');
}

async function createAdminResource(resource: string, payload: unknown, requestId: string, userId: string) {
  if (resource === 'events') {
    const input = parse(eventMutationSchema, payload);
    const row = await db.$transaction(async (tx) => {
      const event = await tx.event.create({ data: { slug: input.slug, status: input.status ?? 'DRAFT', lifecycleStatus: input.lifecycleStatus ?? 'UPCOMING', dateStatus: input.dateStatus ?? 'TBA', scheduleStatus: input.scheduleStatus ?? 'TBC', startAt: input.startAt ? new Date(input.startAt) : null, endAt: input.endAt ? new Date(input.endAt) : null, venueName: input.venueName, city: input.city, region: input.region ?? null, country: input.country, address: input.address ?? null, mapUrl: input.mapUrl ?? null, featured: input.featured ?? false, publishedAt: input.status === 'PUBLISHED' ? new Date() : null } });
      await tx.eventTranslation.createMany({ data: input.translations.map((translation) => ({ eventId: event.id, ...translation })) });
      return tx.event.findUnique({ where: { id: event.id }, include: { translations: true, ticketTiers: true, vipPackages: true, vipBooths: true, eventArtists: true, heroMedia: true, posterMedia: true } });
    });
    await writeAuditLog({ actorUserId: userId, action: 'create', entityType: 'event', entityId: row?.id, after: row, requestId });
    return row;
  }
  if (resource === 'artists') {
    const input = parse(artistMutationSchema, payload);
    const row = await db.$transaction(async (tx) => {
      const artist = await tx.artist.create({ data: { slug: input.slug, country: input.country, yearLabel: input.yearLabel ?? null, status: input.status ?? 'DRAFT', featured: input.featured ?? false, portraitMediaId: input.portraitMediaId ?? null, heroMediaId: input.heroMediaId ?? null } });
      await tx.artistTranslation.createMany({ data: input.translations.map((translation) => ({ artistId: artist.id, locale: translation.locale, name: translation.name, bio: translation.bio ?? null, genresJson: jsonInput(translation.genres ?? []) })) });
      return tx.artist.findUnique({ where: { id: artist.id }, include: { translations: true, portraitMedia: true, heroMedia: true, links: true, media: true, eventArtists: true } });
    });
    await writeAuditLog({ actorUserId: userId, action: 'create', entityType: 'artist', entityId: row?.id, after: row, requestId });
    return row;
  }
  if (resource === 'products') {
    const input = parse(productMutationSchema, payload);
    const row = await db.$transaction(async (tx) => {
      const categoryId = input.categoryId ?? (input.categoryKey ? (await tx.productCategory.findUnique({ where: { key: input.categoryKey } }))?.id ?? null : null);
      if (input.categoryKey && !categoryId) throw validationError({ categoryKey: 'Product category not found.' });
      const product = await tx.product.create({ data: { slug: input.slug, categoryId, status: input.status ?? 'DRAFT', basePriceMinor: input.basePriceMinor, currency: input.currency, badge: input.badge ?? null, featured: input.featured ?? false, stockTracking: input.stockTracking, publishedAt: input.status === 'PUBLISHED' ? new Date() : null } });
      await tx.productTranslation.createMany({ data: input.translations.map((translation) => ({ productId: product.id, locale: translation.locale, title: translation.title, excerpt: translation.excerpt ?? null, description: translation.description ?? null })) });
      return tx.product.findUnique({ where: { id: product.id }, include: { translations: true, category: true, variants: true, images: { include: { media: true } } } });
    });
    await writeAuditLog({ actorUserId: userId, action: 'create', entityType: 'product', entityId: row?.id, after: row, requestId });
    return row;
  }
  if (resource === 'news') {
    const input = parse(articleMutationSchema, payload);
    const row = await db.$transaction(async (tx) => {
      const article = await tx.newsArticle.create({ data: { slug: input.slug, category: input.category, status: input.status ?? 'DRAFT', featured: input.featured ?? false, heroMediaId: input.heroMediaId ?? null, cardMediaId: input.cardMediaId ?? null, relatedEventId: input.relatedEventId ?? null, publishedAt: input.status === 'PUBLISHED' ? new Date() : null } });
      await tx.newsTranslation.createMany({ data: input.translations.map((translation) => ({ articleId: article.id, locale: translation.locale, title: translation.title, excerpt: translation.excerpt ?? null, bodyBlocksJson: jsonInput(translation.bodyBlocks), quickSummaryJson: jsonInput(translation.quickSummary ?? []), readingTimeOverride: translation.readingTimeOverride ?? null })) });
      return tx.newsArticle.findUnique({ where: { id: article.id }, include: { translations: true, heroMedia: true, cardMedia: true, tags: { include: { tag: true } } } });
    });
    await writeAuditLog({ actorUserId: userId, action: 'create', entityType: 'news', entityId: row?.id, after: row, requestId });
    return row;
  }
  if (resource === 'partners') {
    const input = parse(partnerMutationSchema, payload);
    const row = await db.$transaction(async (tx) => {
      const partner = await tx.partner.create({ data: { slug: input.slug, type: input.type, status: input.status ?? 'DRAFT', logoMediaId: input.logoMediaId ?? null, imageMediaId: input.imageMediaId ?? null, websiteUrl: input.websiteUrl ?? null, featured: input.featured ?? false, sortOrder: input.sortOrder ?? 0 } });
      await tx.partnerTranslation.createMany({ data: input.translations.map((translation) => ({ partnerId: partner.id, ...translation })) });
      return tx.partner.findUnique({ where: { id: partner.id }, include: { translations: true, logoMedia: true, imageMedia: true } });
    });
    await writeAuditLog({ actorUserId: userId, action: 'create', entityType: 'partner', entityId: row?.id, after: row, requestId });
    return row;
  }
  if (resource === 'faq') {
    const input = parse(faqMutationSchema, payload);
    const row = await db.$transaction(async (tx) => {
      const category = await tx.faqCategory.upsert({ where: { key: input.category }, update: {}, create: { key: input.category, sortOrder: input.sortOrder } });
      const item = await tx.faqItem.create({ data: { categoryId: category.id, published: input.published, answersConfirmed: input.answersConfirmed, sortOrder: input.sortOrder } });
      await tx.faqTranslation.createMany({ data: input.translations.map((translation) => ({ faqId: item.id, locale: translation.locale, question: translation.question, answer: translation.answer, keywordsJson: jsonInput(translation.keywords) })) });
      return tx.faqItem.findUnique({ where: { id: item.id }, include: { category: true, translations: true } });
    });
    await writeAuditLog({ actorUserId: userId, action: 'create', entityType: 'faq', entityId: row?.id, after: row, requestId });
    return row;
  }
  throw notFound('This admin resource cannot be created through the API yet.');
}

async function updateAdminResource(resource: string, id: string, payload: unknown, requestId: string, userId: string) {
  if (resource === 'events') {
    const input = parse(eventMutationSchema, payload);
    const before = await db.event.findUnique({ where: { id }, include: { translations: true } });
    if (!before) throw notFound();
    const row = await db.$transaction(async (tx) => {
      await tx.event.update({ where: { id }, data: { slug: input.slug, status: input.status, lifecycleStatus: input.lifecycleStatus, dateStatus: input.dateStatus, scheduleStatus: input.scheduleStatus, startAt: input.startAt === undefined ? undefined : input.startAt ? new Date(input.startAt) : null, endAt: input.endAt === undefined ? undefined : input.endAt ? new Date(input.endAt) : null, venueName: input.venueName, city: input.city, region: input.region ?? null, country: input.country, address: input.address ?? null, mapUrl: input.mapUrl ?? null, featured: input.featured, publishedAt: input.status === 'PUBLISHED' ? (before.publishedAt ?? new Date()) : input.status ? null : undefined } });
      await rememberPublishedSlug(tx, 'event', id, before, input.slug);
      await Promise.all(input.translations.map((translation) => tx.eventTranslation.upsert({ where: { eventId_locale: { eventId: id, locale: translation.locale } }, update: { title: translation.title, eyebrow: translation.eyebrow ?? null, shortDescription: translation.shortDescription ?? null, description: translation.description ?? null }, create: { eventId: id, locale: translation.locale, title: translation.title, eyebrow: translation.eyebrow ?? null, shortDescription: translation.shortDescription ?? null, description: translation.description ?? null } })));
      return tx.event.findUnique({ where: { id }, include: { translations: true, ticketTiers: true, vipPackages: true, vipBooths: true, eventArtists: true, heroMedia: true, posterMedia: true } });
    });
    await writeAuditLog({ actorUserId: userId, action: 'update', entityType: 'event', entityId: id, before, after: row, requestId });
    return row;
  }
  if (resource === 'artists') {
    const input = parse(artistMutationSchema, payload);
    const before = await db.artist.findUnique({ where: { id }, include: { translations: true } });
    if (!before) throw notFound();
    const row = await db.$transaction(async (tx) => {
      await tx.artist.update({ where: { id }, data: { slug: input.slug, country: input.country, yearLabel: input.yearLabel ?? null, status: input.status, featured: input.featured, portraitMediaId: input.portraitMediaId ?? null, heroMediaId: input.heroMediaId ?? null } });
      await rememberPublishedSlug(tx, 'artist', id, before, input.slug);
      await Promise.all(input.translations.map((translation) => tx.artistTranslation.upsert({ where: { artistId_locale: { artistId: id, locale: translation.locale } }, update: { name: translation.name, bio: translation.bio ?? null, genresJson: jsonInput(translation.genres ?? []) }, create: { artistId: id, locale: translation.locale, name: translation.name, bio: translation.bio ?? null, genresJson: jsonInput(translation.genres ?? []) } })));
      return tx.artist.findUnique({ where: { id }, include: { translations: true, portraitMedia: true, heroMedia: true, links: true, media: true, eventArtists: true } });
    });
    await writeAuditLog({ actorUserId: userId, action: 'update', entityType: 'artist', entityId: id, before, after: row, requestId });
    return row;
  }
  if (resource === 'products') {
    const input = parse(productMutationSchema, payload);
    const before = await db.product.findUnique({ where: { id }, include: { translations: true } });
    if (!before) throw notFound();
    const row = await db.$transaction(async (tx) => {
      const categoryId = input.categoryId ?? (input.categoryKey ? (await tx.productCategory.findUnique({ where: { key: input.categoryKey } }))?.id ?? null : null);
      if (input.categoryKey && !categoryId) throw validationError({ categoryKey: 'Product category not found.' });
      await tx.product.update({ where: { id }, data: { slug: input.slug, categoryId, status: input.status, basePriceMinor: input.basePriceMinor, currency: input.currency, badge: input.badge ?? null, featured: input.featured, stockTracking: input.stockTracking, publishedAt: input.status === 'PUBLISHED' ? (before.publishedAt ?? new Date()) : input.status ? null : undefined } });
      await rememberPublishedSlug(tx, 'product', id, before, input.slug);
      await Promise.all(input.translations.map((translation) => tx.productTranslation.upsert({ where: { productId_locale: { productId: id, locale: translation.locale } }, update: { title: translation.title, excerpt: translation.excerpt ?? null, description: translation.description ?? null }, create: { productId: id, locale: translation.locale, title: translation.title, excerpt: translation.excerpt ?? null, description: translation.description ?? null } })));
      return tx.product.findUnique({ where: { id }, include: { translations: true, category: true, variants: true, images: { include: { media: true } } } });
    });
    await writeAuditLog({ actorUserId: userId, action: 'update', entityType: 'product', entityId: id, before, after: row, requestId });
    return row;
  }
  if (resource === 'news') {
    const input = parse(articleMutationSchema, payload);
    const before = await db.newsArticle.findUnique({ where: { id }, include: { translations: true } });
    if (!before) throw notFound();
    const row = await db.$transaction(async (tx) => {
      await tx.newsArticle.update({ where: { id }, data: { slug: input.slug, category: input.category, status: input.status, featured: input.featured, heroMediaId: input.heroMediaId ?? null, cardMediaId: input.cardMediaId ?? null, relatedEventId: input.relatedEventId ?? null, publishedAt: input.status === 'PUBLISHED' ? (before.publishedAt ?? new Date()) : input.status ? null : undefined } });
      await rememberPublishedSlug(tx, 'news', id, before, input.slug);
      await Promise.all(input.translations.map((translation) => tx.newsTranslation.upsert({ where: { articleId_locale: { articleId: id, locale: translation.locale } }, update: { title: translation.title, excerpt: translation.excerpt ?? null, bodyBlocksJson: jsonInput(translation.bodyBlocks), quickSummaryJson: jsonInput(translation.quickSummary ?? []), readingTimeOverride: translation.readingTimeOverride ?? null }, create: { articleId: id, locale: translation.locale, title: translation.title, excerpt: translation.excerpt ?? null, bodyBlocksJson: jsonInput(translation.bodyBlocks), quickSummaryJson: jsonInput(translation.quickSummary ?? []), readingTimeOverride: translation.readingTimeOverride ?? null } })));
      return tx.newsArticle.findUnique({ where: { id }, include: { translations: true, heroMedia: true, cardMedia: true, tags: { include: { tag: true } } } });
    });
    await writeAuditLog({ actorUserId: userId, action: 'update', entityType: 'news', entityId: id, before, after: row, requestId });
    return row;
  }
  if (resource === 'gallery') {
    const input = parse(galleryMutationSchema, payload);
    const before = await db.galleryAlbum.findUnique({ where: { id }, include: { translations: true } });
    if (!before) throw notFound();
    const row = await db.$transaction(async (tx) => {
      await tx.galleryAlbum.update({ where: { id }, data: { slug: input.slug, status: input.status, venue: input.venue ?? null, eventId: input.eventId ?? null, featured: input.featured, coverMediaId: input.coverMediaId ?? null, heroMediaId: input.heroMediaId ?? null, publishedAt: input.status === 'PUBLISHED' ? (before.publishedAt ?? new Date()) : input.status ? null : undefined } });
      await rememberPublishedSlug(tx, 'gallery', id, before, input.slug);
      await tx.galleryTranslation.upsert({ where: { albumId_locale: { albumId: id, locale: 'en' } }, update: { title: input.title, subtitle: input.subtitle ?? null, description: input.description ?? null }, create: { albumId: id, locale: 'en', title: input.title, subtitle: input.subtitle ?? null, description: input.description ?? null } });
      return tx.galleryAlbum.findUnique({ where: { id }, include: { translations: true, media: { include: { media: true } }, coverMedia: true, heroMedia: true } });
    });
    await writeAuditLog({ actorUserId: userId, action: 'update', entityType: 'gallery', entityId: id, before, after: row, requestId });
    return row;
  }
  if (resource === 'partners') {
    const input = parse(partnerMutationSchema, payload);
    const before = await db.partner.findUnique({ where: { id }, include: { translations: true, logoMedia: true, imageMedia: true } });
    if (!before) throw notFound();
    const row = await db.$transaction(async (tx) => {
      await tx.partner.update({ where: { id }, data: { slug: input.slug, type: input.type, status: input.status, logoMediaId: input.logoMediaId ?? null, imageMediaId: input.imageMediaId ?? null, websiteUrl: input.websiteUrl ?? null, featured: input.featured, sortOrder: input.sortOrder } });
      await Promise.all(input.translations.map((translation) => tx.partnerTranslation.upsert({ where: { partnerId_locale: { partnerId: id, locale: translation.locale } }, update: { name: translation.name, tagline: translation.tagline ?? null, description: translation.description ?? null }, create: { partnerId: id, locale: translation.locale, name: translation.name, tagline: translation.tagline ?? null, description: translation.description ?? null } })));
      return tx.partner.findUnique({ where: { id }, include: { translations: true, logoMedia: true, imageMedia: true } });
    });
    await writeAuditLog({ actorUserId: userId, action: 'update', entityType: 'partner', entityId: id, before, after: row, requestId });
    return row;
  }
  if (resource === 'faq') {
    const input = parse(faqMutationSchema, payload);
    const before = await db.faqItem.findUnique({ where: { id }, include: { translations: true } });
    if (!before) throw notFound();
    const answersChanged = input.translations.some((translation) => before.translations.find((item) => item.locale === translation.locale)?.answer !== translation.answer);
    const row = await db.$transaction(async (tx) => {
      const category = await tx.faqCategory.upsert({ where: { key: input.category }, update: {}, create: { key: input.category, sortOrder: input.sortOrder } });
      await tx.faqItem.update({ where: { id }, data: { categoryId: category.id, published: input.published, answersConfirmed: answersChanged ? false : input.answersConfirmed, sortOrder: input.sortOrder } });
      await Promise.all(input.translations.map((translation) => tx.faqTranslation.upsert({ where: { faqId_locale: { faqId: id, locale: translation.locale } }, update: { question: translation.question, answer: translation.answer, keywordsJson: jsonInput(translation.keywords) }, create: { faqId: id, locale: translation.locale, question: translation.question, answer: translation.answer, keywordsJson: jsonInput(translation.keywords) } })));
      return tx.faqItem.findUnique({ where: { id }, include: { category: true, translations: true } });
    });
    await writeAuditLog({ actorUserId: userId, action: 'update', entityType: 'faq', entityId: id, before, after: row, requestId });
    return row;
  }
  throw notFound('This admin resource cannot be updated through the API yet.');
}

async function deleteAdminResource(resource: string, id: string, requestId: string, userId: string) {
  const now = new Date();
  let before: any;
  let after: any;
  if (resource === 'events') {
    before = await db.event.findUnique({ where: { id } });
    if (!before) throw notFound();
    after = await db.event.update({ where: { id }, data: { status: 'ARCHIVED', publishedAt: null } });
  } else if (resource === 'artists') {
    before = await db.artist.findUnique({ where: { id } });
    if (!before) throw notFound();
    after = await db.artist.update({ where: { id }, data: { status: 'ARCHIVED', deletedAt: now } });
  } else if (resource === 'products') {
    before = await db.product.findUnique({ where: { id } });
    if (!before) throw notFound();
    after = await db.product.update({ where: { id }, data: { status: 'ARCHIVED', deletedAt: now, publishedAt: null } });
  } else if (resource === 'news') {
    before = await db.newsArticle.findUnique({ where: { id } });
    if (!before) throw notFound();
    after = await db.newsArticle.update({ where: { id }, data: { status: 'ARCHIVED', deletedAt: now, publishedAt: null } });
  } else if (resource === 'gallery') {
    before = await db.galleryAlbum.findUnique({ where: { id } });
    if (!before) throw notFound();
    after = await db.galleryAlbum.update({ where: { id }, data: { status: 'ARCHIVED', deletedAt: now, publishedAt: null } });
  } else if (resource === 'partners') {
    before = await db.partner.findUnique({ where: { id } });
    if (!before) throw notFound();
    after = await db.partner.update({ where: { id }, data: { status: 'ARCHIVED' } });
  } else if (resource === 'media') {
    before = await db.mediaAsset.findUnique({ where: { id } });
    if (!before || before.deletedAt) throw notFound();
    after = await db.mediaAsset.update({ where: { id }, data: { deletedAt: now } });
  } else if (resource === 'discounts') {
    before = await db.discount.findUnique({ where: { id } });
    if (!before) throw notFound();
    after = await db.discount.update({ where: { id }, data: { active: false } });
  } else if (resource === 'faq') {
    before = await db.faqItem.findUnique({ where: { id } });
    if (!before) throw notFound();
    after = await db.faqItem.update({ where: { id }, data: { published: false } });
  } else if (resource === 'roles') {
    before = await db.role.findUnique({ where: { id } });
    if (!before) throw notFound();
    if (before.isSystem) throw conflict('System roles cannot be deleted.');
    after = await db.role.delete({ where: { id } });
  } else if (resource === 'staff') {
    before = await db.adminUser.findUnique({ where: { id } });
    if (!before) throw notFound();
    after = await db.adminUser.update({ where: { id }, data: { status: 'DISABLED' } });
  } else {
    throw notFound('This admin resource cannot be deleted through the API.');
  }
  await writeAuditLog({ actorUserId: userId, action: 'delete', entityType: resource, entityId: id, before, after, requestId });
  return after;
}

async function handleCheckout(request: Request) {
  const input = parse(checkoutSchema, await body(request));
  const secret = env('STRIPE_SECRET_KEY');
  if (!secret) throw new ApiError(503, 'STRIPE_NOT_CONFIGURED', 'Checkout is not configured.');
  const stripe = new Stripe(secret);
  const products = await db.product.findMany({ where: { id: { in: input.items.map((item) => item.productId) }, status: 'PUBLISHED', deletedAt: null }, include: { translations: true, variants: true, images: { orderBy: { sortOrder: 'asc' }, include: { media: true } } } });
  const byId = new Map(products.map((product) => [product.id, product]));
  const lineItems = [] as Array<{ productId: string; variantId: string | null; title: string; image: string | null; unitPrice: number; quantity: number; lineTotal: number }>;
  for (const item of input.items) {
    const product = byId.get(item.productId);
    if (!product) throw validationError({ items: 'A product is unavailable.' });
    const variant = item.variantId ? product.variants.find((row) => row.id === item.variantId && row.enabled) : null;
    if (item.variantId && !variant) throw validationError({ items: 'A selected variant is unavailable.' });
    const price = variant?.priceMinor ?? product.basePriceMinor;
    if (product.stockTracking === 'TRACKED' && variant?.stockQuantity !== null && variant?.stockQuantity !== undefined && variant.stockQuantity < item.quantity) throw validationError({ items: 'A selected item is out of stock.' });
    const title = product.translations.find((row) => row.locale === 'en')?.title ?? product.slug;
    const lineTotal = price * item.quantity;
    lineItems.push({ productId: product.id, variantId: variant?.id ?? null, title, image: product.images[0]?.media?.publicUrl ?? null, unitPrice: price, quantity: item.quantity, lineTotal });
  }
  const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const discount = input.promoCode ? await db.discount.findFirst({ where: { code: input.promoCode.toUpperCase(), active: true, OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }], AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }] }] } }) : null;
  let discountMinor = 0;
  if (discount && (!discount.minimumSubtotalMinor || subtotal >= discount.minimumSubtotalMinor)) {
    discountMinor = discount.type === 'PERCENTAGE' && discount.percentage ? Math.floor(subtotal * Number(discount.percentage) / 100) : Math.min(subtotal, discount.valueMinor ?? 0);
  }
  const total = subtotal - discountMinor;
  const result = await db.$transaction(async (tx) => {
    const order = await tx.order.create({ data: { orderNumber: `DR-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}`, clientReference: input.clientReference ?? null, customerEmail: input.customerEmail?.toLowerCase() ?? null, subtotalMinor: subtotal, discountMinor, totalMinor: total, currency: 'AUD', discountId: discount?.id ?? null, items: { create: lineItems.map((item) => ({ productId: item.productId, variantId: item.variantId, titleSnapshot: item.title, imageUrlSnapshot: item.image, unitPriceMinor: item.unitPrice, quantity: item.quantity, lineTotalMinor: item.lineTotal })) } } });
    const session = await stripe.checkout.sessions.create({ mode: 'payment', ...(input.customerEmail ? { customer_email: input.customerEmail } : { customer_creation: 'always' }), line_items: lineItems.map((item) => ({ quantity: item.quantity, price_data: { currency: 'aud', unit_amount: item.unitPrice, product_data: { name: item.title, ...(item.image ? { images: [new URL(item.image, runtimeConfig().appUrl).toString()] } : {}) } } })), success_url: input.successUrl ?? `${runtimeConfig().appUrl}/checkout/result?session_id={CHECKOUT_SESSION_ID}`, cancel_url: input.cancelUrl ?? `${runtimeConfig().appUrl}/cart` });
    if (!session.id) throw new ApiError(502, 'CHECKOUT_FAILED', 'Stripe did not return a checkout session.');
    await tx.checkoutSession.create({ data: { orderId: order.id, provider: 'stripe', providerSessionId: session.id, status: 'OPEN', expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : null } });
    return { order, session };
  });
  return { checkoutUrl: result.session.url, sessionId: result.session.id, orderNumber: result.order.orderNumber };
}

async function handleStripeWebhook(request: Request) {
  const secret = env('STRIPE_SECRET_KEY');
  const webhookSecret = env('STRIPE_WEBHOOK_SECRET');
  if (!secret || !webhookSecret) throw new ApiError(503, 'STRIPE_NOT_CONFIGURED', 'Stripe webhook is not configured.');
  const signature = request.headers.get('stripe-signature');
  if (!signature) throw new ApiError(400, 'INVALID_SIGNATURE', 'Stripe signature is required.');
  const raw = await request.text();
  const stripe = new Stripe(secret);
  let event: Stripe.Event;
  try { event = stripe.webhooks.constructEvent(raw, signature, webhookSecret); } catch { throw new ApiError(400, 'INVALID_SIGNATURE', 'Invalid Stripe signature.'); }
  const payloadHash = createHash('sha256').update(raw).digest('hex');
  const existing = await db.webhookEvent.findUnique({ where: { provider_providerEventId: { provider: 'stripe', providerEventId: event.id } } });
  if (existing?.status === 'PROCESSED') return { received: true, duplicate: true };
  const record = existing ?? await db.webhookEvent.create({ data: { provider: 'stripe', providerEventId: event.id, eventType: event.type, payloadHash, status: 'PROCESSING' } });
  try {
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object as Stripe.Checkout.Session;
      await db.$transaction(async (tx) => {
        const checkout = await tx.checkoutSession.findUnique({ where: { providerSessionId: session.id } });
        if (!checkout) return;
        await tx.checkoutSession.update({ where: { id: checkout.id }, data: { status: 'COMPLETE' } });
        await tx.order.update({ where: { id: checkout.orderId }, data: { paymentStatus: 'PAID', customerEmail: session.customer_details?.email ?? undefined } });
        const paymentId = typeof session.payment_intent === 'string' ? session.payment_intent : null;
        if (paymentId && !(await tx.payment.findFirst({ where: { provider: 'stripe', providerPaymentId: paymentId } }))) {
          await tx.payment.create({ data: { orderId: checkout.orderId, provider: 'stripe', providerPaymentId: paymentId, status: 'PAID', amountMinor: session.amount_total ?? 0, currency: (session.currency ?? 'aud').toUpperCase(), paidAt: new Date() } });
        }
      });
    } else if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;
      await db.checkoutSession.updateMany({ where: { providerSessionId: session.id }, data: { status: 'EXPIRED' } });
    }
    await db.webhookEvent.update({ where: { id: record.id }, data: { status: 'PROCESSED', processedAt: new Date() } });
  } catch (error) {
    await db.webhookEvent.update({ where: { id: record.id }, data: { status: 'FAILED' } });
    throw error;
  }
  return { received: true };
}

async function dispatch(request: Request, path: string[], requestId: string) {
  const [root, second, third] = path;
  const params = query(request);
  const locale = localeFrom(params.get('locale'));

  if (root === 'auth' && second === 'login' && request.method === 'POST') {
    const input = parse(loginSchema, await body(request));
    await enforceRateLimit(`login:${ip(request)}:${input.email.toLowerCase()}`, 5, 600);
    const user = await db.adminUser.findUnique({ where: { email: input.email.toLowerCase() } });
    if (!user || user.status !== 'ACTIVE' || !(await argon2.verify(user.passwordHash, input.password))) throw unauthorized('Invalid email or password.');
    await db.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const response = dataResponse({ user: { id: user.id, email: user.email, name: user.name, locale: user.locale } }, { status: 200 }, { requestId, startedAt: Date.now() });
    await createAdminSession(user.id, response, input.remember);
    return response;
  }
  if (root === 'auth' && second === 'logout' && request.method === 'POST') {
    assertSameOrigin(request);
    await requestCsrfToken(request);
    const response = dataResponse({ loggedOut: true }, {}, { requestId, startedAt: Date.now() });
    await destroyAdminSession(request, response);
    return response;
  }
  if (root === 'auth' && second === 'session' && request.method === 'GET') {
    const session = await getAdminSession(request);
    return dataResponse(session ? { user: session.user, permissions: [...session.permissions], csrfToken: await readCsrfCookie() } : null, {}, { requestId, startedAt: Date.now() });
  }

  if (root === 'events' && request.method === 'GET') {
    if (second === 'past') return dataResponse(await listPublicEvents(locale, true));
    if (second && third === 'tickets') { const rows = await getPublicTickets(second); if (!rows) throw notFound('Event not found.'); return dataResponse(rows.map((row) => ({ id: row.id, name: row.name, priceMinor: row.priceMinor, currency: row.currency, badge: row.badge, purchasableOnline: row.purchasableOnline, purchasableAtDoor: row.purchasableAtDoor, availabilityStatus: row.availabilityStatus, providerName: row.providerName, providerExternalId: row.providerExternalId, providerUrl: row.providerUrl }))); }
    if (second && third === 'vip') { const result = await getPublicVip(second); if (!result) throw notFound('Event not found.'); return dataResponse({ packages: result.packages.map((row) => ({ id: row.id, name: row.name, priceMinor: row.priceMinor, currency: row.currency, capacity: row.capacity, includedBottleCount: row.includedBottleCount, bottles: row.packageBottles.map((item) => ({ id: item.bottleOption.id, name: item.bottleOption.name, image: item.bottleOption.media ? { src: item.bottleOption.media.publicUrl, alt: item.bottleOption.media.altText, width: item.bottleOption.media.width, height: item.bottleOption.media.height } : null })) })), booths: result.booths.map((booth) => ({ id: booth.id, label: booth.code, zone: booth.zone?.toLowerCase(), x: booth.x ? Number(booth.x) : 50, y: booth.y ? Number(booth.y) : 50, requestable: booth.requestable, availability: booth.availabilityStatus.toLowerCase() })) }); }
    if (second) { const event = await getPublicEvent(second, locale); if (!event) throw notFound('Event not found.'); return dataResponse(event); }
    return dataResponse(await listPublicEvents(locale));
  }
  if (root === 'artists' && request.method === 'GET') {
    if (second) { const artist = await getPublicArtist(second, locale); if (!artist) throw notFound('Artist not found.'); return dataResponse(artist); }
    return dataResponse(await listPublicArtists(locale));
  }
  if (root === 'products' && request.method === 'GET') {
    if (second) { const product = await getPublicProduct(second, locale); if (!product) throw notFound('Product not found.'); return dataResponse(product); }
    return dataResponse(await listPublicProducts(locale));
  }
  if (root === 'news' && request.method === 'GET') {
    if (second) { const article = await getPublicNews(second, locale); if (!article) throw notFound('Article not found.'); return dataResponse(article); }
    return dataResponse(await listPublicNews(locale));
  }
  if (root === 'gallery' && request.method === 'GET') {
    if (second) { const album = await getPublicGallery(second, locale); if (!album) throw notFound('Gallery collection not found.'); return dataResponse(album); }
    return dataResponse(await listPublicGallery(locale));
  }
  if (root === 'faq' && request.method === 'GET') return dataResponse(await getPublicFaq(locale));
  if (root === 'legal' && request.method === 'GET' && (second === 'terms' || second === 'privacy')) { const document = await getPublicLegal(second, locale); if (!document) throw notFound('Legal document not found.'); return dataResponse(document); }
  if (root === 'partners' && request.method === 'GET') return dataResponse(await getPublicPartners(locale));
  if (root === 'site' && second === 'bootstrap' && request.method === 'GET') return dataResponse(await getPublicBootstrap(locale));
  if (root === 'media' && second && request.method === 'GET') return mediaResponse(second);

  if (root === 'booking-requests' && request.method === 'POST') { assertSameOrigin(request); await enforceRateLimit(`booking:${ip(request)}`, 10, 3600); return dataResponse(await createBooking(parse(bookingSchema, await body(request))), { status: 202 }); }
  if (root === 'contact' && request.method === 'POST') { assertSameOrigin(request); await enforceRateLimit(`contact:${ip(request)}`, 10, 3600); return dataResponse(await createContact(parse(contactSchema, await body(request))), { status: 202 }); }
  if (root === 'newsletter' && second === 'subscribe' && request.method === 'POST') { assertSameOrigin(request); await enforceRateLimit(`newsletter:${ip(request)}`, 5, 3600); return dataResponse(await subscribeNewsletter(parse(newsletterSchema, await body(request))), { status: 202 }); }
  if (root === 'checkout' && second === 'session' && request.method === 'POST') { assertSameOrigin(request); await enforceRateLimit(`checkout:${ip(request)}`, 10, 600); return dataResponse(await handleCheckout(request), { status: 201 }); }
  if (root === 'checkout' && second === 'result' && request.method === 'GET') {
    const sessionId = params.get('session_id');
    if (!sessionId) throw validationError({ session_id: 'session_id is required.' });
    const row = await db.checkoutSession.findUnique({ where: { providerSessionId: sessionId }, include: { order: { include: { items: true } } } });
    if (!row) throw notFound('Checkout session not found.');
    const status = row.order.paymentStatus === 'PAID' ? 'paid' : row.order.paymentStatus === 'FAILED' ? 'failed' : row.status === 'EXPIRED' ? 'cancelled' : row.status === 'COMPLETE' ? 'processing' : 'pending';
    const orderStatus = status;
    return dataResponse({
      status,
      order: {
        id: row.order.id,
        orderNumber: row.order.orderNumber,
        status: orderStatus,
        createdAt: row.order.createdAt.toISOString(),
        customerEmail: row.order.customerEmail,
        clientReference: row.order.clientReference,
        lines: row.order.items.map((item) => ({ id: item.id, productId: item.productId ?? '', variantId: item.variantId, productSlug: null, title: item.titleSnapshot, image: item.imageUrlSnapshot ? { src: item.imageUrlSnapshot, alt: item.titleSnapshot } : null, sizeLabel: null, colorLabel: null, quantity: item.quantity, unitPrice: { amountMinor: item.unitPriceMinor, currency: row.order.currency }, lineTotal: { amountMinor: item.lineTotalMinor, currency: row.order.currency } })),
        subtotal: { amountMinor: row.order.subtotalMinor, currency: row.order.currency },
        discount: row.order.discountMinor ? { amountMinor: row.order.discountMinor, currency: row.order.currency } : null,
        shipping: row.order.shippingMinor ? { amountMinor: row.order.shippingMinor, currency: row.order.currency } : null,
        tax: row.order.taxMinor ? { amountMinor: row.order.taxMinor, currency: row.order.currency } : null,
        total: { amountMinor: row.order.totalMinor, currency: row.order.currency },
        confirmationEmailSent: false,
        progress: [],
      },
    });
  }
  if (root === 'webhooks' && second === 'stripe' && request.method === 'POST') return dataResponse(await handleStripeWebhook(request));

  if (root === 'admin') {
    if (second === 'dashboard' && request.method === 'GET') {
      await requirePermission(request, 'settings.view');
      const [events, artists, products, orders, articles, albums, bookingRequests, messages] = await Promise.all([db.event.count({ where: { status: 'PUBLISHED' } }), db.artist.count({ where: { status: 'PUBLISHED' } }), db.product.count({ where: { status: 'PUBLISHED' } }), db.order.count(), db.newsArticle.count({ where: { status: 'PUBLISHED' } }), db.galleryAlbum.count({ where: { status: 'PUBLISHED' } }), db.bookingRequest.count({ where: { status: 'RECEIVED' } }), db.contactMessage.count({ where: { status: 'NEW' } })]);
      return dataResponse({ metrics: { events, artists, products, orders, articles, albums, bookingRequests, messages } });
    }
    if (second === 'activity' && request.method === 'GET') {
      await requirePermission(request, 'settings.view');
      const rows = await db.auditLog.findMany({ take: 50, orderBy: { createdAt: 'desc' }, include: { actor: { select: { id: true, name: true, email: true } } } });
      return dataResponse(rows);
    }
    if (second === 'integrations' && third === 'status' && request.method === 'GET') {
      await requirePermission(request, 'settings.view');
      return dataResponse(['stripe', 'redis', 'brevo', 'mailchimp', 's3'].map((provider) => ({ provider, configured: provider === 'stripe' ? Boolean(env('STRIPE_SECRET_KEY')) : provider === 'redis' ? Boolean(env('REDIS_URL')) : provider === 'brevo' ? Boolean(env('BREVO_API_KEY')) : provider === 'mailchimp' ? Boolean(env('MAILCHIMP_API_KEY')) : Boolean(env('S3_BUCKET')) })));
    }
    if (second === 'media' && third === 'upload' && request.method === 'POST') {
      assertSameOrigin(request);
      const session = await requirePermission(request, 'media.create', true);
      const form = await request.formData();
      const file = form.get('file');
      const altText = typeof form.get('altText') === 'string' ? String(form.get('altText')) : '';
      const row = await storeMedia(file as File, altText, session.user.id);
      await writeAuditLog({ actorUserId: session.user.id, action: 'upload', entityType: 'media', entityId: row.id, after: row, requestId });
      return dataResponse(adminRecord('media', row), { status: 201 });
    }
    const resource = second;
    const resourceId = third;
    const action = path[3];
    if (!resource) throw notFound('Admin route not found.');
    if (!resourceId && request.method === 'GET') {
      await requirePermission(request, adminResourcePermission(resource, 'view'));
      const result = await adminList(resource, request);
      return listResponse(result.rows.map((row) => adminRecord(resource, row)), { page: Number(query(request).get('page') ?? 1), pageSize: Number(query(request).get('pageSize') ?? 20), total: result.total }, { requestId, startedAt: Date.now() });
    }
    if (!resourceId && request.method === 'POST') {
      assertSameOrigin(request);
      const session = await requirePermission(request, adminResourcePermission(resource, 'create'), true);
      const row = await createAdminResource(resource, await body(request), requestId, session.user.id);
      return dataResponse(adminRecord(resource, row), { status: 201 });
    }
    if (resourceId && !action && request.method === 'GET') {
      await requirePermission(request, adminResourcePermission(resource, 'view'));
      if (resource === 'events') { const row = await db.event.findUnique({ where: { id: resourceId }, include: { translations: true, ticketTiers: true, vipPackages: true, vipBooths: true, eventArtists: true, heroMedia: true, posterMedia: true } }); if (!row) throw notFound(); return dataResponse(adminRecord(resource, row)); }
      if (resource === 'artists') { const row = await db.artist.findUnique({ where: { id: resourceId }, include: { translations: true, portraitMedia: true, heroMedia: true, links: true, media: true, eventArtists: true } }); if (!row) throw notFound(); return dataResponse(adminRecord(resource, row)); }
      if (resource === 'products') { const row = await db.product.findUnique({ where: { id: resourceId }, include: { translations: true, images: { include: { media: true } }, optionGroups: true, variants: true, category: true } }); if (!row) throw notFound(); return dataResponse(adminRecord(resource, row)); }
      if (resource === 'news') { const row = await db.newsArticle.findUnique({ where: { id: resourceId }, include: { translations: true, heroMedia: true, cardMedia: true, tags: { include: { tag: true } } } }); if (!row) throw notFound(); return dataResponse(adminRecord(resource, row)); }
      if (resource === 'gallery') { const row = await db.galleryAlbum.findUnique({ where: { id: resourceId }, include: { translations: true, media: { include: { media: true } }, coverMedia: true, heroMedia: true } }); if (!row) throw notFound(); return dataResponse(adminRecord(resource, row)); }
      if (resource === 'partners') { const row = await db.partner.findUnique({ where: { id: resourceId }, include: { translations: true, logoMedia: true, imageMedia: true } }); if (!row) throw notFound(); return dataResponse(adminRecord(resource, row)); }
      if (resource === 'media') { const row = await db.mediaAsset.findUnique({ where: { id: resourceId } }); if (!row || row.deletedAt) throw notFound(); return dataResponse(adminRecord(resource, row)); }
      if (resource === 'staff') { const row = await db.adminUser.findUnique({ where: { id: resourceId }, include: { userRoles: { include: { role: true } } } }); if (!row) throw notFound(); return dataResponse(adminRecord(resource, row)); }
      if (resource === 'roles') { const row = await db.role.findUnique({ where: { id: resourceId }, include: { rolePermissions: { include: { permission: true } } } }); if (!row) throw notFound(); return dataResponse(adminRecord(resource, row)); }
      if (resource === 'faq') { const row = await db.faqItem.findUnique({ where: { id: resourceId }, include: { category: true, translations: true } }); if (!row) throw notFound(); return dataResponse(adminRecord(resource, row)); }
      if (resource === 'legal') { const row = await db.legalDocument.findFirst({ where: { type: resourceId }, include: { translations: true } }); if (!row) throw notFound(); return dataResponse(adminRecord(resource, row)); }
      if (resource === 'orders') { const row = await db.order.findUnique({ where: { id: resourceId }, include: { items: true, payments: true, checkoutSessions: true, notes: true } }); if (!row) throw notFound(); return dataResponse(adminRecord(resource, row)); }
      throw notFound();
    }
    if (resourceId && !action && (request.method === 'PATCH' || request.method === 'PUT')) {
      assertSameOrigin(request);
      const session = await requirePermission(request, adminResourcePermission(resource, 'edit'), true);
      const row = await updateAdminResource(resource, resourceId, await body(request), requestId, session.user.id);
      return dataResponse(adminRecord(resource, row));
    }
    if (resourceId && !action && request.method === 'DELETE') {
      assertSameOrigin(request);
      const session = await requirePermission(request, adminResourcePermission(resource, 'delete'), true);
      await deleteAdminResource(resource, resourceId, requestId, session.user.id);
      return dataResponse(null, { status: 200 }, { requestId, startedAt: Date.now() });
    }
    if (resourceId && action === 'publish' && request.method === 'POST') {
      assertSameOrigin(request);
      const session = await requirePermission(request, adminResourcePermission(resource, 'publish'), true);
      const table = resource === 'events' ? db.event : resource === 'artists' ? db.artist : resource === 'products' ? db.product : resource === 'news' ? db.newsArticle : resource === 'gallery' ? db.galleryAlbum : null;
      if (!table) throw notFound();
      const before = await (table as any).findUnique({ where: { id: resourceId } });
      if (!before) throw notFound();
      const row = await (table as any).update({ where: { id: before.id }, data: { status: 'PUBLISHED', publishedAt: new Date() } });
      await writeAuditLog({ actorUserId: session.user.id, action: 'publish', entityType: resource, entityId: before.id, before, after: row, requestId });
      return dataResponse(jsonAdminRecord(row));
    }
    if (resourceId && action === 'archive' && request.method === 'POST') {
      assertSameOrigin(request);
      const session = await requirePermission(request, adminResourcePermission(resource, 'publish'), true);
      const table = resource === 'events' ? db.event : resource === 'artists' ? db.artist : resource === 'products' ? db.product : resource === 'news' ? db.newsArticle : resource === 'gallery' ? db.galleryAlbum : null;
      if (!table) throw notFound();
      const id = resourceId;
      const before = await (table as any).findUnique({ where: { id } });
      if (!before) throw notFound();
      const row = await (table as any).update({ where: { id }, data: { status: 'ARCHIVED', publishedAt: null } });
      await writeAuditLog({ actorUserId: session.user.id, action: 'archive', entityType: resource, entityId: id, before, after: row, requestId });
      return dataResponse(jsonAdminRecord(row));
    }
  }
  throw notFound('API route not found.');
}

export async function GET(request: Request, context: RouteContext) {
  const ctx = requestContext(request);
  try { const result = await dispatch(request, (await context.params).path, ctx.requestId); logRequest(request, ctx, result.status); return result; } catch (error) { const response = errorResponse(error, ctx); logRequest(request, ctx, response.status); return response; }
}

export async function POST(request: Request, context: RouteContext) {
  const ctx = requestContext(request);
  try { const result = await dispatch(request, (await context.params).path, ctx.requestId); logRequest(request, ctx, result.status); return result; } catch (error) { const response = errorResponse(error, ctx); logRequest(request, ctx, response.status); return response; }
}

export async function PATCH(request: Request, context: RouteContext) {
  const ctx = requestContext(request);
  try { const result = await dispatch(request, (await context.params).path, ctx.requestId); logRequest(request, ctx, result.status); return result; } catch (error) { const response = errorResponse(error, ctx); logRequest(request, ctx, response.status); return response; }
}

export async function PUT(request: Request, context: RouteContext) {
  return PATCH(request, context);
}

export async function DELETE(request: Request, context: RouteContext) {
  const ctx = requestContext(request);
  try { const result = await dispatch(request, (await context.params).path, ctx.requestId); logRequest(request, ctx, result.status); return result; } catch (error) { const response = errorResponse(error, ctx); logRequest(request, ctx, response.status); return response; }
}
