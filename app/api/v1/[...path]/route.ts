import { randomUUID } from 'node:crypto';
import argon2 from 'argon2';
import { Prisma } from '@prisma/client';
import { db } from '@/server/db/client';
import { env } from '@/server/config';
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
  createMerchandiseCheckoutIntent,
  createTicketCheckoutIntent,
  createVipCheckoutIntent,
  expireExpiredCheckoutIntents,
  expireCheckoutIntent,
  getCheckoutIntentPublic,
  getCheckoutResult,
  payCheckoutIntent,
} from '@/server/services/payments/checkout-intent';
import { receiveSquareWebhook } from '@/server/services/payments/square-webhook.service';
import { preflightSquareLocation } from '@/server/integrations/square/locations';
import { getSquarePayment, squarePaymentStatus } from '@/server/integrations/square/payments';
import { refundSquarePayment } from '@/server/integrations/square/refunds';
import { finalizeCompletedPayment } from '@/server/services/payments/finalizer';
import { verifyIssuedTicketToken } from '@/server/services/tickets/verify';
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
  refundSchema,
  squarePaymentSchema,
  ticketCheckoutSchema,
  vipCheckoutSchema,
  zodFieldErrors,
} from '@/server/validators/api';
import type { SingletonKey } from '@/lib/admin/common/resource';
import { aboutContentDefinition, contactContentDefinition, homeContentDefinition } from '@/lib/admin/content/definitions';
import { integrationsDefinition, languageSettingsDefinition, shippingDefinition, siteSettingsDefinition, socialSettingsDefinition } from '@/lib/admin/settings/definitions';
import { revalidatePublicResource } from '@/server/cache/public-revalidation';
import {
  assignMenuLocation,
  createMenu,
  getAdminMenu,
  getAdminMenus,
  getAdminPageContent,
  getMenuLocations,
  getNavigationRoutes,
  getPublicNavigation,
  getPublicPageContent,
  getTicketSettings,
  getVipSettings,
  listBottleOptions,
  listTicketTiers,
  listVipBooths,
  listVipPackages,
  publishMenu,
  saveBottleOption,
  saveMenu,
  saveTicketTier,
  saveVipBooth,
  saveVipPackage,
  updateTicketSettings,
  updateVipSettings,
  deleteTicketTier,
  deleteVipPackage,
  deleteVipBooth,
  deleteBottleOption,
  updateAdminPageContent,
} from '@/server/services/cms';

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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function adminResourcePermission(resource: string, action: 'view' | 'create' | 'edit' | 'delete' | 'publish') {
  const normalized = resource === 'orders' || resource === 'payments' || resource === 'ticket-purchases' || resource === 'vip-bookings' ? 'orders' : resource === 'staff' ? 'staff' : resource === 'roles' ? 'roles' : resource === 'settings' || resource === 'audit' || resource === 'tasks' ? 'settings' : resource === 'faq' || resource === 'legal' ? 'content' : resource === 'booking-requests' || resource === 'contact-messages' ? 'support' : resource;
  return `${normalized}.${action}`;
}

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function booleanValue(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

function jsonValue(value: unknown) {
  return value === null ? Prisma.JsonNull : (value as Prisma.InputJsonValue);
}

function safePublicUrl(value: unknown) {
  return typeof value === 'string' && (value === '' || value.startsWith('/') || value.startsWith('https://') || value.startsWith('http://'));
}

/** Keep singleton writes JSON-only and prevent unsafe URLs from reaching public rendering. */
function cleanSingletonInput(value: unknown): JsonRecord {
  if (!isRecord(value)) throw validationError({ body: 'Request body must be an object.' });
  const serialized = JSON.stringify(value);
  if (serialized.length > 500_000) throw validationError({ body: 'Request body is too large.' });

  const clean = (input: unknown, key = ''): unknown => {
    if (Array.isArray(input)) return input.slice(0, 500).map((item) => clean(item, key));
    if (isRecord(input)) {
      const output: JsonRecord = {};
      for (const [childKey, childValue] of Object.entries(input)) {
        if (childKey === '__proto__' || childKey === 'constructor' || childKey === 'prototype') continue;
        output[childKey] = clean(childValue, childKey);
      }
      return output;
    }
    if (typeof input === 'string') {
      if (/(?:href|url|src)$/i.test(key) && !safePublicUrl(input)) return '';
      return input.slice(0, 20_000);
    }
    return input;
  };

  return clean(value) as JsonRecord;
}

const singletonRoutes: Record<string, { key: SingletonKey; permission: 'content' | 'settings' | 'products'; pageSlug?: string }> = {
  'content/home': { key: 'content-home', permission: 'content', pageSlug: 'home' },
  'content/about': { key: 'content-about', permission: 'content', pageSlug: 'about' },
  'content/contact': { key: 'content-contact', permission: 'content', pageSlug: 'contact' },
  'settings/site': { key: 'settings-site', permission: 'settings' },
  'settings/social': { key: 'settings-social', permission: 'settings' },
  'settings/languages': { key: 'settings-languages', permission: 'settings' },
  'settings/integrations': { key: 'settings-integrations', permission: 'settings' },
  shipping: { key: 'shipping', permission: 'products' },
};

function singletonRoute(second?: string, third?: string) {
  if (!second) return null;
  return singletonRoutes[third ? `${second}/${third}` : second] ?? null;
}

function singletonDefaults(key: SingletonKey): JsonRecord {
  if (key === 'content-home') return homeContentDefinition.seed() as JsonRecord;
  if (key === 'content-about') return aboutContentDefinition.seed() as JsonRecord;
  if (key === 'content-contact') return contactContentDefinition.seed() as JsonRecord;
  if (key === 'settings-site') return siteSettingsDefinition.seed() as JsonRecord;
  if (key === 'settings-social') return socialSettingsDefinition.seed() as JsonRecord;
  if (key === 'settings-languages') return languageSettingsDefinition.seed() as JsonRecord;
  if (key === 'settings-integrations') return integrationsDefinition.seed() as JsonRecord;
  return shippingDefinition.seed() as JsonRecord;
}

async function settingMap(keys: string[]) {
  const rows = await db.siteSetting.findMany({ where: { key: { in: keys } } });
  return new Map(rows.map((row) => [row.key, row.valueJson as unknown]));
}

function settingValue(values: Map<string, unknown>, key: string, fallback: unknown) {
  const value = values.get(key);
  return value === undefined || value === null ? fallback : value;
}

function mediaSetting(values: Map<string, unknown>, key: string, fallback: unknown = null) {
  const value = settingValue(values, key, fallback);
  return isRecord(value) ? value : fallback;
}

async function readContentSingleton(slug: string, key: SingletonKey) {
  const page = await db.contentPage.findUnique({ where: { slug }, include: { translations: true } });
  if (!page) throw notFound(`Content page ${slug} not found.`);
  const translation = page.translations.find((row) => row.locale === 'en') ?? page.translations[0];
  const content = isRecord(translation?.contentJson) ? translation.contentJson : {};
  return { ...singletonDefaults(key), ...content };
}

async function readSiteSingleton() {
  const defaults = singletonDefaults('settings-site');
  const values = await settingMap(['site.name', 'site.tagline', 'site.logo', 'site.favicon', 'seo.default_title', 'seo.default_description', 'seo.default_og_image', 'site.default_event_id', 'site.footer_tagline', 'legal.terms_path', 'legal.privacy_path', 'site.maintenance', 'site.maintenance_message']);
  return {
    ...defaults,
    siteName: settingValue(values, 'site.name', defaults.siteName),
    tagline: settingValue(values, 'site.tagline', defaults.tagline),
    logo: mediaSetting(values, 'site.logo', defaults.logo),
    favicon: mediaSetting(values, 'site.favicon', defaults.favicon),
    defaultTitle: settingValue(values, 'seo.default_title', defaults.defaultTitle),
    defaultDescription: settingValue(values, 'seo.default_description', defaults.defaultDescription),
    ogImage: mediaSetting(values, 'seo.default_og_image', defaults.ogImage),
    defaultEventId: settingValue(values, 'site.default_event_id', defaults.defaultEventId),
    footerTagline: settingValue(values, 'site.footer_tagline', defaults.footerTagline),
    termsPath: settingValue(values, 'legal.terms_path', defaults.termsPath),
    privacyPath: settingValue(values, 'legal.privacy_path', defaults.privacyPath),
    maintenance: booleanValue(settingValue(values, 'site.maintenance', defaults.maintenance), Boolean(defaults.maintenance)),
    maintenanceMessage: settingValue(values, 'site.maintenance_message', defaults.maintenanceMessage),
  };
}

async function readSocialSingleton() {
  const defaults = singletonDefaults('settings-social');
  const values = await settingMap(['contact.email', 'contact.phone', 'contact.address', 'social.instagram', 'social.facebook', 'social.youtube', 'social.tiktok', 'social.spotify']);
  return {
    ...defaults,
    email: settingValue(values, 'contact.email', defaults.email),
    phone: settingValue(values, 'contact.phone', defaults.phone),
    address: settingValue(values, 'contact.address', defaults.address),
    instagram: settingValue(values, 'social.instagram', defaults.instagram),
    facebook: settingValue(values, 'social.facebook', defaults.facebook),
    youtube: settingValue(values, 'social.youtube', defaults.youtube),
    tiktok: settingValue(values, 'social.tiktok', defaults.tiktok),
    spotify: settingValue(values, 'social.spotify', defaults.spotify),
  };
}

async function readLanguageSingleton() {
  const defaults = singletonDefaults('settings-languages');
  const values = await settingMap(['site.default_locale', 'site.enabled_locales', 'content.translation_status']);
  const enabled = settingValue(values, 'site.enabled_locales', defaults.enabled);
  return {
    ...defaults,
    defaultLanguage: settingValue(values, 'site.default_locale', defaults.defaultLanguage),
    enabled: Array.isArray(enabled) ? enabled : defaults.enabled,
    translations: settingValue(values, 'content.translation_status', defaults.translations),
  };
}

const INTEGRATION_ITEMS = [
  { id: 'ticket-provider', provider: 'ticket-provider', name: 'Ticket Provider', description: 'Hosted ticket sales for events.', endpoint: '' },
  { id: 'square', provider: 'square', name: 'Square', description: 'Card payments, orders, refunds and webhooks.', endpoint: '/api/v1/webhooks/square' },
  { id: 'mailchimp', provider: 'mailchimp', name: 'Mailchimp', description: 'Newsletter audience.', endpoint: '' },
  { id: 'brevo', provider: 'brevo', name: 'Brevo', description: 'Transactional and newsletter email.', endpoint: '' },
  { id: 'social', provider: 'social', name: 'Social Links', description: 'Public profile links (Social / Contact).', endpoint: '' },
  { id: 'analytics', provider: 'analytics', name: 'Analytics', description: 'Site analytics.', endpoint: '' },
] as const;

function integrationConfigured(id: string) {
  if (id === 'square') return Boolean(env('SQUARE_ACCESS_TOKEN') && env('SQUARE_LOCATION_ID'));
  if (id === 'mailchimp') return Boolean(env('MAILCHIMP_API_KEY'));
  if (id === 'brevo') return Boolean(env('BREVO_API_KEY'));
  if (id === 'social') return false;
  return false;
}

async function readIntegrationsSingleton() {
  const rows = await db.integrationSetting.findMany({ where: { provider: { in: INTEGRATION_ITEMS.map((item) => item.provider) } } });
  const byProvider = new Map(rows.map((row) => [row.provider, row]));
  const social = await readSocialSingleton();
  return {
    items: INTEGRATION_ITEMS.map((item) => {
      const row = byProvider.get(item.provider);
      const config = isRecord(row?.publicConfig) ? row.publicConfig : {};
      const endpoint = typeof config.endpoint === 'string' ? config.endpoint : item.endpoint;
      const configured = item.id === 'social' ? Object.values(social).some((value) => typeof value === 'string' && value.length > 0) : integrationConfigured(item.id);
      const state = row?.status === 'ERROR' ? 'error' : configured ? 'configured' : 'not-connected';
      return { id: item.id, name: item.name, description: item.description, state, keyConfigured: false, newKey: '', endpoint };
    }),
  };
}

async function readShippingSingleton() {
  const defaults = singletonDefaults('shipping');
  const values = await settingMap(['shipping.config']);
  const stored = values.get('shipping.config');
  return { ...defaults, ...(isRecord(stored) ? stored : {}) };
}

async function readAdminSingleton(route: { key: SingletonKey; pageSlug?: string }) {
  if (route.pageSlug) return readContentSingleton(route.pageSlug, route.key);
  if (route.key === 'settings-site') return readSiteSingleton();
  if (route.key === 'settings-social') return readSocialSingleton();
  if (route.key === 'settings-languages') return readLanguageSingleton();
  if (route.key === 'settings-integrations') return readIntegrationsSingleton();
  return readShippingSingleton();
}

async function writeSettings(values: JsonRecord, mappings: Record<string, string>, isPublic = true) {
  const writes = Object.entries(mappings)
    .filter(([field]) => field in values)
    .map(([field, key]) => db.siteSetting.upsert({
      where: { key },
      update: { valueJson: jsonValue(values[field]), isPublic },
      create: { key, valueJson: jsonValue(values[field]), isPublic },
    }));
  if (writes.length) await db.$transaction(writes);
}

async function writeContentSingleton(slug: string, key: SingletonKey, values: JsonRecord, requestId: string, actorUserId: string) {
  const before = await db.contentPage.findUnique({ where: { slug }, include: { translations: true } });
  if (!before) throw notFound(`Content page ${slug} not found.`);
  const oldTranslation = before.translations.find((row) => row.locale === 'en') ?? before.translations[0];
  const oldContent = isRecord(oldTranslation?.contentJson) ? oldTranslation.contentJson : {};
  const contentJson = { ...singletonDefaults(key), ...oldContent, ...values };
  const titleValue = contentJson.title;
  const title = isRecord(titleValue) ? stringValue(titleValue.en, before.slug) : stringValue(titleValue, before.slug);
  await db.$transaction(async (tx) => {
    await tx.contentPage.update({ where: { id: before.id }, data: { updatedAt: new Date() } });
    for (const locale of ['en', 'vi'] as const) {
      await tx.contentPageTranslation.upsert({
        where: { pageId_locale: { pageId: before.id, locale } },
        update: { title: title || before.slug, contentJson: jsonValue(contentJson) },
        create: { pageId: before.id, locale, title: title || before.slug, contentJson: jsonValue(contentJson) },
      });
    }
  });
  const after = await db.contentPage.findUnique({ where: { id: before.id }, include: { translations: true } });
  await writeAuditLog({ actorUserId, action: 'update', entityType: 'content_page', entityId: before.id, before, after, requestId });
  return contentJson;
}

async function writeIntegrationsSingleton(values: JsonRecord) {
  const incoming = Array.isArray(values.items) ? values.items.filter(isRecord) : [];
  for (const item of incoming) {
    const key = stringValue(item.newKey).trim();
    if (key) throw validationError({ items: 'Integration secrets cannot be stored until a server-side secret store is configured.' });
    const id = stringValue(item.id);
    const definition = INTEGRATION_ITEMS.find((candidate) => candidate.id === id);
    if (!definition) continue;
    const endpoint = stringValue(item.endpoint).trim();
    if (!safePublicUrl(endpoint)) throw validationError({ items: `${definition.name} endpoint must be an http(s) or local path URL.` });
    await db.integrationSetting.upsert({
      where: { provider: definition.provider },
      update: { publicConfig: jsonValue(endpoint ? { endpoint } : {}) },
      create: { provider: definition.provider, status: 'NOT_CONFIGURED', publicConfig: jsonValue(endpoint ? { endpoint } : {}) },
    });
  }
  return readIntegrationsSingleton();
}

async function writeAdminSingleton(route: { key: SingletonKey; pageSlug?: string }, values: JsonRecord, requestId: string, actorUserId: string) {
  if (route.pageSlug) return writeContentSingleton(route.pageSlug, route.key, values, requestId, actorUserId);
  if (route.key === 'settings-site') {
    await writeSettings(values, { siteName: 'site.name', tagline: 'site.tagline', logo: 'site.logo', favicon: 'site.favicon', defaultTitle: 'seo.default_title', defaultDescription: 'seo.default_description', ogImage: 'seo.default_og_image', defaultEventId: 'site.default_event_id', footerTagline: 'site.footer_tagline', termsPath: 'legal.terms_path', privacyPath: 'legal.privacy_path', maintenance: 'site.maintenance', maintenanceMessage: 'site.maintenance_message' });
    return readSiteSingleton();
  }
  if (route.key === 'settings-social') {
    await writeSettings(values, { email: 'contact.email', phone: 'contact.phone', address: 'contact.address', instagram: 'social.instagram', facebook: 'social.facebook', youtube: 'social.youtube', tiktok: 'social.tiktok', spotify: 'social.spotify' });
    return readSocialSingleton();
  }
  if (route.key === 'settings-languages') {
    await writeSettings(values, { defaultLanguage: 'site.default_locale', enabled: 'site.enabled_locales' });
    await writeSettings(values, { translations: 'content.translation_status' }, false);
    return readLanguageSingleton();
  }
  if (route.key === 'settings-integrations') return writeIntegrationsSingleton(values);
  await writeSettings({ 'shipping.config': values }, { 'shipping.config': 'shipping.config' }, false);
  return readShippingSingleton();
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
      tickets: {
        providerMode: row.ticketTiers?.some((tier: any) => tier.providerUrl || tier.providerName || tier.providerExternalId) ? 'external' : 'none',
        providerUrl: row.ticketTiers?.find((tier: any) => tier.providerUrl)?.providerUrl ?? '',
        tiers: (row.ticketTiers ?? []).map((tier: any, index: number) => ({
          id: tier.id,
          name: tier.name,
          price: { amountMinor: tier.priceMinor, currency: tier.currency },
          badge: tier.badge ?? '',
          online: tier.purchasableOnline,
          door: tier.purchasableAtDoor,
          sortOrder: tier.sortOrder ?? index,
          enabled: tier.enabled,
          availabilityStatus: tier.availabilityStatus,
          capacity: tier.capacity,
          providerName: tier.providerName,
          providerExternalId: tier.providerExternalId,
          providerUrl: tier.providerUrl,
        })),
      },
      vip: {
        id: packageRow?.id,
        enabled: Boolean(packageRow?.enabled),
        packageName: packageRow?.name ?? '',
        price: packageRow ? { amountMinor: packageRow.priceMinor, currency: packageRow.currency } : null,
        capacity: packageRow?.capacity ?? null,
        includedBottles: packageRow?.includedBottleCount ?? null,
        availabilityMode: packageRow?.paymentMode === 'REQUEST_ONLY' || !packageRow?.paymentMode ? 'on-request' : 'managed',
        paymentMode: packageRow?.paymentMode,
        depositAmountMinor: packageRow?.depositAmountMinor ?? null,
        booths: (row.vipBooths ?? []).map((booth: any, index: number) => ({ id: booth.id, code: booth.code, zone: booth.zone ?? '', x: booth.x == null ? null : Number(booth.x), y: booth.y == null ? null : Number(booth.y), requestable: booth.requestable, availabilityStatus: booth.availabilityStatus, sortOrder: booth.sortOrder ?? index })),
        bottles: (packageRow?.packageBottles ?? []).map((item: any, index: number) => ({ id: item.bottleOption?.id ?? item.bottleOptionId, name: item.bottleOption?.name ?? '', enabled: item.bottleOption?.enabled !== false, sortOrder: item.bottleOption?.sortOrder ?? index, mediaId: item.bottleOption?.mediaId ?? null })),
      },
      artistIds: (row.eventArtists ?? []).map((item: any) => item.artistId),
      albumIds: (row.galleryAlbums ?? []).map((album: any) => album.id),
      faqs: (row.faqItems ?? []).flatMap((item: any) => {
        const translation = item.translations?.find((translation: any) => translation.locale === 'en') ?? item.translations?.[0];
        return translation ? [{ id: item.id, question: translation.question, answer: translation.answer }] : [];
      }),
      seo: {
        title: row.seoTitle ?? '',
        description: row.seoDescription ?? '',
        canonical: row.canonicalOverride ?? '',
        ogImage: mediaRef(row.ogMedia),
        index: row.indexable !== false,
        follow: row.followLinks !== false,
      },
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
  if (resource === 'payments') {
    return {
      ...base,
      providerPaymentId: row.providerPaymentId ?? row.id,
      providerOrderId: row.providerOrderId ?? '',
      checkoutIntentId: row.checkoutIntentId ?? '',
      amount: { amountMinor: row.amountMinor, currency: row.currency },
      status: String(row.status).toLowerCase(),
      provider: row.provider,
      locationId: row.locationId ?? '',
      paidAt: row.paidAt ? iso(row.paidAt) : null,
      createdAt: iso(row.createdAt),
      updatedAt: iso(row.updatedAt ?? row.createdAt),
    };
  }
  if (resource === 'ticket-purchases') {
    const safeBase = { ...base };
    delete safeBase.issuedTickets;
    return {
      ...safeBase,
      customerName: row.customerName,
      customerEmail: row.customerEmail,
      quantity: (row.items ?? []).reduce((sum: number, item: any) => sum + item.quantity, 0),
      amount: { amountMinor: row.totalMinor, currency: row.currency },
      status: String(row.status).toLowerCase(),
      issuedCount: (row.issuedTickets ?? []).length,
      eventId: row.eventId,
      expiresAt: iso(row.expiresAt),
      createdAt: iso(row.createdAt),
      updatedAt: iso(row.updatedAt),
    };
  }
  if (resource === 'vip-bookings') {
    return {
      ...base,
      customerName: row.customerName,
      customerEmail: row.customerEmail,
      amount: { amountMinor: row.amountDueMinor, currency: row.currency },
      total: { amountMinor: row.totalMinor, currency: row.currency },
      status: String(row.status).toLowerCase(),
      eventId: row.eventId,
      vipPackageId: row.vipPackageId,
      boothId: row.boothId ?? '',
      expiresAt: iso(row.expiresAt),
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
    const [rows, total] = await Promise.all([db.event.findMany({ skip, take: pageSize, orderBy: { updatedAt: 'desc' }, include: { translations: true, ticketTiers: true, vipPackages: { include: { packageBottles: { include: { bottleOption: true } } } }, vipBooths: true, eventArtists: true, galleryAlbums: true, faqItems: { include: { translations: true } }, heroMedia: true, posterMedia: true } }), db.event.count()]);
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
  if (resource === 'payments') {
    const [rows, total] = await Promise.all([db.payment.findMany({ skip, take: pageSize, orderBy: { createdAt: 'desc' }, where: query(request).get('status') ? { status: String(query(request).get('status')).toUpperCase() as any } : undefined, include: { order: true, checkoutIntent: true, refunds: true } }), db.payment.count()]);
    return { rows, total };
  }
  if (resource === 'ticket-purchases') {
    const [rows, total] = await Promise.all([db.ticketPurchase.findMany({ skip, take: pageSize, orderBy: { createdAt: 'desc' }, where: query(request).get('status') ? { status: String(query(request).get('status')).toUpperCase() as any } : undefined, include: { items: true, holds: true, issuedTickets: true, event: true } }), db.ticketPurchase.count()]);
    return { rows, total };
  }
  if (resource === 'vip-bookings') {
    const [rows, total] = await Promise.all([db.vipBooking.findMany({ skip, take: pageSize, orderBy: { createdAt: 'desc' }, where: query(request).get('status') ? { status: String(query(request).get('status')).toUpperCase() as any } : undefined, include: { event: true, vipPackage: true, booth: true, hold: true, payments: true } }), db.vipBooking.count()]);
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

async function syncEventRelations(tx: Prisma.TransactionClient, eventId: string, input: any) {
  if (input.tickets) {
    const existingTiers = await tx.ticketTier.findMany({ where: { eventId } });
    const existingById = new Map(existingTiers.map((tier: any) => [tier.id, tier]));
    const keptIds = new Set<string>();
    for (const [index, tier] of input.tickets.tiers.entries()) {
      const existing = tier.id ? existingById.get(tier.id) : undefined;
      if (tier.id && !existing) throw validationError({ [`tickets.tiers.${index}.id`]: 'Ticket tier does not belong to this event.' });
      const providerUrl = input.tickets.providerMode === 'external' ? tier.providerUrl ?? input.tickets.providerUrl ?? null : null;
      const data = {
        name: tier.name,
        priceMinor: tier.price.amountMinor,
        currency: tier.price.currency,
        badge: tier.badge ?? null,
        purchasableOnline: tier.online,
        purchasableAtDoor: tier.door,
        providerName: input.tickets.providerMode === 'external' ? tier.providerName ?? null : null,
        providerExternalId: input.tickets.providerMode === 'external' ? tier.providerExternalId ?? null : null,
        providerUrl,
        availabilityStatus: tier.availabilityStatus ?? existing?.availabilityStatus ?? 'UNKNOWN',
        capacity: tier.capacity === undefined ? existing?.capacity ?? null : tier.capacity,
        sortOrder: tier.sortOrder ?? index,
        enabled: tier.enabled ?? existing?.enabled ?? true,
      };
      const row = existing
        ? await tx.ticketTier.update({ where: { id: existing.id }, data })
        : await tx.ticketTier.create({ data: { eventId, ...data } });
      keptIds.add(row.id);
    }
    for (const tier of existingTiers) {
      if (keptIds.has(tier.id)) continue;
      const [purchaseItems, holds, issuedTickets] = await Promise.all([
        tx.ticketPurchaseItem.count({ where: { ticketTierId: tier.id } }),
        tx.ticketHold.count({ where: { ticketTierId: tier.id } }),
        tx.issuedTicket.count({ where: { ticketTierId: tier.id } }),
      ]);
      if (purchaseItems || holds || issuedTickets) {
        await tx.ticketTier.update({ where: { id: tier.id }, data: { enabled: false, availabilityStatus: 'NOT_AVAILABLE' } });
      } else {
        await tx.ticketTier.delete({ where: { id: tier.id } });
      }
    }
  }

  const artistIds = Array.isArray(input.artistIds) ? input.artistIds : [];
  const artists = artistIds.length ? await tx.artist.findMany({ where: { id: { in: artistIds } }, select: { id: true } }) : [];
  if (artists.length !== artistIds.length) throw validationError({ artistIds: 'One or more selected artists no longer exist.' });
  await tx.eventArtist.deleteMany({ where: { eventId } });
  if (artistIds.length) {
    await tx.eventArtist.createMany({ data: artistIds.map((artistId: string, sortOrder: number) => ({ eventId, artistId, sortOrder })) });
  }

  const albumIds = Array.isArray(input.albumIds) ? input.albumIds : [];
  const albums = albumIds.length ? await tx.galleryAlbum.findMany({ where: { id: { in: albumIds } }, select: { id: true, eventId: true } }) : [];
  if (albums.length !== albumIds.length) throw validationError({ albumIds: 'One or more selected gallery albums no longer exist.' });
  const occupiedAlbums = albums.filter((album: any) => album.eventId && album.eventId !== eventId);
  if (occupiedAlbums.length) throw validationError({ albumIds: 'A selected gallery album is already linked to another event.' });
  await tx.galleryAlbum.updateMany({ where: { eventId }, data: { eventId: null } });
  for (const albumId of albumIds) await tx.galleryAlbum.update({ where: { id: albumId }, data: { eventId } });

  if (input.vip) {
    const vip = input.vip;
    const existingPackages = await tx.vipPackage.findMany({ where: { eventId }, include: { packageBottles: true } });
    const selectedPackage = vip.id ? existingPackages.find((pkg: any) => pkg.id === vip.id) : existingPackages[0];
    if (vip.id && !selectedPackage) throw validationError({ 'vip.id': 'VIP package does not belong to this event.' });

    let packageId = selectedPackage?.id ?? null;
    if (vip.enabled) {
      if (!vip.packageName || !vip.price || !vip.capacity || vip.includedBottles == null) throw validationError({ vip: 'Enabled VIP packages require a name, price, capacity, and bottle count.' });
      const paymentMode = vip.paymentMode ?? (vip.availabilityMode === 'managed' ? 'FULL_PAYMENT' : 'REQUEST_ONLY');
      const packageData = {
        name: vip.packageName,
        priceMinor: vip.price.amountMinor,
        currency: vip.price.currency,
        capacity: vip.capacity,
        includedBottleCount: vip.includedBottles,
        enabled: true,
        paymentMode,
        depositAmountMinor: paymentMode === 'DEPOSIT' ? vip.depositAmountMinor ?? null : null,
      };
      const packageRow = selectedPackage
        ? await tx.vipPackage.update({ where: { id: selectedPackage.id }, data: packageData })
        : await tx.vipPackage.create({ data: { eventId, ...packageData, sortOrder: 0 } });
      packageId = packageRow.id;
      await tx.vipPackage.updateMany({ where: { eventId, id: { not: packageId } }, data: { enabled: false } });

      const bottleIds: string[] = [];
      for (const [index, bottle] of vip.bottles.entries()) {
        const existingBottle = bottle.id ? await tx.bottleOption.findUnique({ where: { id: bottle.id } }) : await tx.bottleOption.findUnique({ where: { name: bottle.name } });
        if (bottle.id && !existingBottle) throw validationError({ [`vip.bottles.${index}.id`]: 'Bottle option does not exist.' });
        const bottleRow = existingBottle
          ? await tx.bottleOption.update({ where: { id: existingBottle.id }, data: { name: bottle.name, enabled: bottle.enabled, sortOrder: bottle.sortOrder ?? index, mediaId: bottle.mediaId ?? null } })
          : await tx.bottleOption.create({ data: { name: bottle.name, enabled: bottle.enabled, sortOrder: bottle.sortOrder ?? index, mediaId: bottle.mediaId ?? null } });
        bottleIds.push(bottleRow.id);
      }
      await tx.vipPackageBottle.deleteMany({ where: { vipPackageId: packageId, bottleOptionId: { notIn: bottleIds } } });
      if (bottleIds.length) await tx.vipPackageBottle.createMany({ data: bottleIds.map((bottleOptionId) => ({ vipPackageId: packageId!, bottleOptionId })), skipDuplicates: true });
    } else if (existingPackages.length) {
      await tx.vipPackage.updateMany({ where: { eventId }, data: { enabled: false } });
      packageId = (selectedPackage ?? existingPackages[0]).id;
    }

    const existingBooths = await tx.vipBooth.findMany({ where: { eventId } });
    const existingBoothById = new Map(existingBooths.map((booth: any) => [booth.id, booth]));
    const existingBoothByCode = new Map(existingBooths.map((booth: any) => [booth.code.toLowerCase(), booth]));
    const keptBoothIds = new Set<string>();
    for (const [index, booth] of vip.booths.entries()) {
      const existing = booth.id ? existingBoothById.get(booth.id) : existingBoothByCode.get(booth.code.toLowerCase());
      if (booth.id && !existing) throw validationError({ [`vip.booths.${index}.id`]: 'VIP booth does not belong to this event.' });
      const data = {
        code: booth.code,
        zone: booth.zone ?? null,
        x: booth.x ?? null,
        y: booth.y ?? null,
        requestable: vip.enabled ? booth.requestable !== false : false,
        availabilityStatus: vip.enabled ? booth.availabilityStatus ?? existing?.availabilityStatus ?? 'ON_REQUEST' : 'NOT_AVAILABLE',
        sortOrder: booth.sortOrder ?? index,
      };
      const row = existing
        ? await tx.vipBooth.update({ where: { id: existing.id }, data })
        : await tx.vipBooth.create({ data: { eventId, ...data } });
      keptBoothIds.add(row.id);
    }
    for (const booth of existingBooths) {
      if (keptBoothIds.has(booth.id)) continue;
      const [requests, holds, bookings] = await Promise.all([
        tx.bookingRequest.count({ where: { preferredBoothId: booth.id } }),
        tx.vipBoothHold.count({ where: { boothId: booth.id } }),
        tx.vipBooking.count({ where: { boothId: booth.id } }),
      ]);
      if (requests || holds || bookings) {
        await tx.vipBooth.update({ where: { id: booth.id }, data: { requestable: false, availabilityStatus: 'NOT_AVAILABLE' } });
      } else {
        await tx.vipBooth.delete({ where: { id: booth.id } });
      }
    }
  }

  if (Array.isArray(input.faqs)) {
    const existingFaqs = await tx.faqItem.findMany({ where: { eventId }, include: { translations: true } });
    const existingFaqIds = new Set(existingFaqs.map((faq: any) => faq.id));
    const keptFaqIds = new Set<string>();
    const category = input.faqs.length ? await tx.faqCategory.upsert({ where: { key: 'event' }, update: {}, create: { key: 'event', sortOrder: 0 } }) : null;
    for (const [index, faq] of input.faqs.entries()) {
      if (faq.id && !existingFaqIds.has(faq.id)) throw validationError({ [`faqs.${index}.id`]: 'FAQ does not belong to this event.' });
      const row = faq.id
        ? await tx.faqItem.update({ where: { id: faq.id }, data: { eventId } })
        : await tx.faqItem.create({ data: { eventId, categoryId: category!.id, published: false, answersConfirmed: false, sortOrder: index } });
      await tx.faqTranslation.upsert({ where: { faqId_locale: { faqId: row.id, locale: 'en' } }, update: { question: faq.question, answer: faq.answer }, create: { faqId: row.id, locale: 'en', question: faq.question, answer: faq.answer, keywordsJson: jsonInput([]) } });
      keptFaqIds.add(row.id);
    }
    if (existingFaqs.length) await tx.faqItem.updateMany({ where: { eventId, id: { notIn: [...keptFaqIds] } }, data: { eventId: null } });
  }
}

async function createAdminResource(resource: string, payload: unknown, requestId: string, userId: string) {
  if (resource === 'events') {
    const input = parse(eventMutationSchema, payload);
    const row = await db.$transaction(async (tx) => {
      const event = await tx.event.create({ data: { slug: input.slug, status: input.status ?? 'DRAFT', lifecycleStatus: input.lifecycleStatus ?? 'UPCOMING', dateStatus: input.dateStatus ?? 'TBA', scheduleStatus: input.scheduleStatus ?? 'TBC', startAt: input.startAt ? new Date(input.startAt) : null, endAt: input.endAt ? new Date(input.endAt) : null, venueName: input.venueName, city: input.city, region: input.region ?? null, country: input.country, address: input.address ?? null, mapUrl: input.mapUrl ?? null, featured: input.featured ?? false, heroMediaId: input.heroMediaId ?? null, posterMediaId: input.posterMediaId ?? null, seoTitle: input.seoTitle ?? null, seoDescription: input.seoDescription ?? null, canonicalOverride: input.canonicalOverride ?? null, ogMediaId: input.ogMediaId ?? null, indexable: input.indexable ?? true, followLinks: input.followLinks ?? true, publishedAt: input.status === 'PUBLISHED' ? new Date() : null } });
      await tx.eventTranslation.createMany({ data: input.translations.map((translation) => ({ eventId: event.id, ...translation })) });
      await syncEventRelations(tx, event.id, input);
      return tx.event.findUnique({ where: { id: event.id }, include: { translations: true, ticketTiers: true, vipPackages: { include: { packageBottles: { include: { bottleOption: true } } } }, vipBooths: true, eventArtists: true, galleryAlbums: true, faqItems: { include: { translations: true } }, heroMedia: true, posterMedia: true } });
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
      await tx.event.update({ where: { id }, data: { slug: input.slug, status: input.status, lifecycleStatus: input.lifecycleStatus, dateStatus: input.dateStatus, scheduleStatus: input.scheduleStatus, startAt: input.startAt === undefined ? undefined : input.startAt ? new Date(input.startAt) : null, endAt: input.endAt === undefined ? undefined : input.endAt ? new Date(input.endAt) : null, venueName: input.venueName, city: input.city, region: input.region ?? null, country: input.country, address: input.address ?? null, mapUrl: input.mapUrl ?? null, featured: input.featured, heroMediaId: input.heroMediaId ?? null, posterMediaId: input.posterMediaId ?? null, seoTitle: input.seoTitle ?? null, seoDescription: input.seoDescription ?? null, canonicalOverride: input.canonicalOverride ?? null, ogMediaId: input.ogMediaId ?? null, indexable: input.indexable ?? true, followLinks: input.followLinks ?? true, publishedAt: input.status === 'PUBLISHED' ? (before.publishedAt ?? new Date()) : input.status ? null : undefined } });
      await rememberPublishedSlug(tx, 'event', id, before, input.slug);
      await Promise.all(input.translations.map((translation) => tx.eventTranslation.upsert({ where: { eventId_locale: { eventId: id, locale: translation.locale } }, update: { title: translation.title, eyebrow: translation.eyebrow ?? null, shortDescription: translation.shortDescription ?? null, description: translation.description ?? null }, create: { eventId: id, locale: translation.locale, title: translation.title, eyebrow: translation.eyebrow ?? null, shortDescription: translation.shortDescription ?? null, description: translation.description ?? null } })));
      await syncEventRelations(tx, id, input);
      return tx.event.findUnique({ where: { id }, include: { translations: true, ticketTiers: true, vipPackages: { include: { packageBottles: { include: { bottleOption: true } } } }, vipBooths: true, eventArtists: true, galleryAlbums: true, faqItems: { include: { translations: true } }, heroMedia: true, posterMedia: true } });
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
  return createMerchandiseCheckoutIntent({ ...input, items: input.items });
}

async function handlePayCheckout(request: Request, checkoutId: string) {
  const input = parse(squarePaymentSchema, await body(request));
  return payCheckoutIntent({ checkoutId, ...input });
}

async function handleSquareWebhook(request: Request) {
  return receiveSquareWebhook(await request.text(), request.headers.get('x-square-hmacsha256-signature'));
}

async function handleAdminRefund(request: Request, paymentId: string, requestId: string, userId: string) {
  const input = parse(refundSchema, await body(request));
  const payment = await db.payment.findUnique({ where: { id: paymentId }, include: { refunds: true } });
  if (!payment) throw notFound('Payment not found.');
  if (payment.provider !== 'square' || !payment.providerPaymentId) throw conflict('This payment has no Square payment to refund.');
  if (!['COMPLETED', 'PAID'].includes(String(payment.status))) throw conflict('Only a completed payment can be refunded.');
  const completedRefunded = payment.refunds.filter((refund) => refund.status === 'COMPLETED').reduce((sum, refund) => sum + refund.amountMinor, 0);
  const amountMinor = input.amountMinor ?? payment.amountMinor - completedRefunded;
  if (amountMinor <= 0 || amountMinor > payment.amountMinor - completedRefunded) throw validationError({ amountMinor: 'Refund amount exceeds the remaining refundable amount.' });
  const idempotencyKey = input.idempotencyKey ?? `ref_${randomUUID().replaceAll('-', '')}`.slice(0, 45);
  const providerRefund = await refundSquarePayment({ paymentId: payment.providerPaymentId, idempotencyKey, amountMinor, currency: payment.currency, reason: input.reason });
  const status = String(providerRefund.status ?? '').toUpperCase();
  const localStatus = status === 'COMPLETED' ? 'COMPLETED' : status === 'FAILED' ? 'FAILED' : status === 'CANCELED' ? 'CANCELLED' : 'PENDING';
  const refund = await db.refund.create({ data: { paymentId: payment.id, providerRefundId: providerRefund.id, idempotencyKey, amountMinor, currency: payment.currency, reason: input.reason ?? null, status: localStatus } });
  if (localStatus === 'COMPLETED') {
    const total = completedRefunded + amountMinor;
    await db.payment.update({ where: { id: payment.id }, data: { status: total >= payment.amountMinor ? 'REFUNDED' : 'PARTIALLY_REFUNDED' } });
  }
  await writeAuditLog({ actorUserId: userId, action: 'refund', entityType: 'payment', entityId: payment.id, after: refund, requestId });
  return refund;
}

async function handleAdminReconcile(paymentId: string) {
  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw notFound('Payment not found.');
  if (payment.provider !== 'square' || !payment.providerPaymentId) throw conflict('This payment has no Square payment to reconcile.');
  const providerPayment = await getSquarePayment(payment.providerPaymentId);
  if (!providerPayment) throw notFound('Square payment not found.');
  const status = squarePaymentStatus(providerPayment.status);
  const updated = await db.payment.update({ where: { id: payment.id }, data: { status, providerOrderId: providerPayment.orderId, locationId: providerPayment.locationId, paidAt: status === 'COMPLETED' ? (payment.paidAt ?? new Date()) : payment.paidAt } });
  if (status === 'COMPLETED') await finalizeCompletedPayment(updated.id);
  return db.payment.findUnique({ where: { id: updated.id }, include: { order: true, checkoutIntent: true, ticketPurchase: true, vipBooking: true, refunds: true } });
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

  if (root === 'page-content' && second && request.method === 'GET') {
    return dataResponse(await getPublicPageContent(second, params.get('locale')));
  }
  if (root === 'navigation' && second && request.method === 'GET') {
    const result = await getPublicNavigation(second);
    return dataResponse(result, {}, { requestId, startedAt: Date.now() });
  }

  if (root === 'events' && request.method === 'GET') {
    if (second === 'past') return dataResponse(await listPublicEvents(locale, true));
    if (second && third === 'tickets') { const result = await getPublicTickets(second); if (!result) throw notFound('Event not found.'); return dataResponse({ settings: result.event, tiers: result.rows.map((row) => ({ id: row.id, name: row.name, description: row.description, priceMinor: row.priceMinor, currency: row.currency, badge: row.badge, purchasableOnline: row.purchasableOnline && result.event.ticketOnlineSalesEnabled, purchasableAtDoor: row.purchasableAtDoor && result.event.ticketDoorSalesEnabled, availabilityStatus: row.availabilityStatus, capacity: row.capacity, soldQuantity: row.soldQuantity, minQuantity: row.minQuantity, maxQuantity: row.maxQuantity, defaultQuantity: row.defaultQuantity, highlighted: row.highlighted, providerName: row.providerName ?? result.event.ticketProviderName, providerExternalId: row.providerExternalId ?? result.event.ticketProviderEventId, providerUrl: row.providerUrl ?? result.event.ticketProviderUrl })) }); }
    if (second && third === 'vip') { const result = await getPublicVip(second); if (!result) throw notFound('Event not found.'); return dataResponse({ settings: result.event, packages: result.packages.map((row) => ({ id: row.id, name: row.name, description: row.description, priceMinor: row.priceMinor, currency: row.currency, paymentMode: row.paymentMode.toLowerCase().replace('_', '-'), deposit: row.depositAmountMinor == null ? null : { amountMinor: row.depositAmountMinor, currency: row.currency }, capacity: row.capacity, includedBottleCount: row.includedBottleCount, minBottleSelections: row.minBottleSelection, maxBottleSelections: row.maxBottleSelection, bottles: row.packageBottles.map((item) => ({ id: item.bottleOption.id, name: item.bottleOption.name, description: item.bottleOption.description, category: item.bottleOption.category, image: item.bottleOption.media ? { src: item.bottleOption.media.publicUrl, alt: item.bottleOption.media.altText, width: item.bottleOption.media.width, height: item.bottleOption.media.height } : null })) })), booths: result.booths.map((booth) => ({ id: booth.id, label: booth.label ?? booth.code, zone: booth.zone?.toLowerCase(), x: booth.x ? Number(booth.x) : 50, y: booth.y ? Number(booth.y) : 50, requestable: booth.requestable, availability: booth.availabilityStatus.toLowerCase() })) }); }
    if (second) { const event = await getPublicEvent(second, locale); if (!event) throw notFound('Event not found.'); return dataResponse(event); }
    return dataResponse(await listPublicEvents(locale));
  }
  if (root === 'tickets' && second === 'verify' && request.method === 'GET') {
    await enforceRateLimit(`ticket-verify:${ip(request)}`, 30, 60);
    const token = params.get('token')?.trim() ?? '';
    if (!/^tkt_[A-Za-z0-9_-]{12,120}$/.test(token)) return dataResponse({ valid: false, ticket: null });
    const ticket = await verifyIssuedTicketToken(token);
    const valid = Boolean(ticket);
    return dataResponse({
      valid,
      ticket: ticket ? { id: ticket.id, eventSlug: ticket.eventSlug, tierName: ticket.tierName, issuedAt: ticket.issuedAt } : null,
    });
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
  if (root === 'media' && second && request.method === 'GET') return mediaResponse(second, params.get('presentation'));

  if (root === 'booking-requests' && request.method === 'POST') { assertSameOrigin(request); await enforceRateLimit(`booking:${ip(request)}`, 10, 3600); return dataResponse(await createBooking(parse(bookingSchema, await body(request))), { status: 202 }); }
  if (root === 'contact' && request.method === 'POST') { assertSameOrigin(request); await enforceRateLimit(`contact:${ip(request)}`, 10, 3600); return dataResponse(await createContact(parse(contactSchema, await body(request))), { status: 202 }); }
  if (root === 'newsletter' && second === 'subscribe' && request.method === 'POST') { assertSameOrigin(request); await enforceRateLimit(`newsletter:${ip(request)}`, 5, 3600); return dataResponse(await subscribeNewsletter(parse(newsletterSchema, await body(request))), { status: 202 }); }
  if (root === 'checkout' && second === 'session' && request.method === 'POST') { assertSameOrigin(request); await enforceRateLimit(`checkout:${ip(request)}`, 10, 600); return dataResponse(await handleCheckout(request), { status: 201 }); }
  if (root === 'checkout' && second === 'ticket-intent' && request.method === 'POST') { assertSameOrigin(request); await enforceRateLimit(`ticket-checkout:${ip(request)}`, 10, 600); return dataResponse(await createTicketCheckoutIntent(parse(ticketCheckoutSchema, await body(request))), { status: 201 }); }
  if (root === 'checkout' && second === 'vip-intent' && request.method === 'POST') { assertSameOrigin(request); await enforceRateLimit(`vip-checkout:${ip(request)}`, 10, 600); return dataResponse(await createVipCheckoutIntent(parse(vipCheckoutSchema, await body(request))), { status: 201 }); }
  if (root === 'checkout' && (second === 'intent' || second === 'intents') && third && !isUuid(third)) throw notFound('Checkout intent not found.');
  if (root === 'checkout' && (second === 'intent' || second === 'intents') && third && path[3] === 'pay' && request.method === 'POST') { assertSameOrigin(request); await enforceRateLimit(`pay:${ip(request)}`, 10, 600); return dataResponse(await handlePayCheckout(request, third), { status: 200 }); }
  if (root === 'checkout' && second === 'pay' && third && (!isUuid(third) || request.method !== 'POST')) { if (request.method !== 'POST') throw notFound(); throw notFound('Checkout intent not found.'); }
  if (root === 'checkout' && second === 'pay' && third && request.method === 'POST') { assertSameOrigin(request); await enforceRateLimit(`pay:${ip(request)}`, 10, 600); return dataResponse(await handlePayCheckout(request, third), { status: 200 }); }
  if (root === 'checkout' && (second === 'intent' || second === 'intents') && third && path[3] === 'cancel' && request.method === 'POST') { assertSameOrigin(request); await expireCheckoutIntent(third); return dataResponse({ cancelled: true }); }
  if (root === 'checkout' && (second === 'intent' || second === 'intents') && third && request.method === 'GET') return dataResponse(await getCheckoutIntentPublic(third));
  if (root === 'checkout' && second === 'result' && request.method === 'GET') {
    const checkoutId = params.get('checkout_id');
    if (!checkoutId) throw validationError({ checkout_id: 'checkout_id is required.' });
    if (!isUuid(checkoutId)) throw notFound('Checkout intent not found.');
    return dataResponse(await getCheckoutResult(checkoutId));
  }
  if (root === 'webhooks' && second === 'square' && request.method === 'POST') return dataResponse(await handleSquareWebhook(request));

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
      const square = await preflightSquareLocation();
      return dataResponse([
        { provider: 'square', configured: square.configured, healthy: square.ok, locationId: square.locationId, currency: square.currency, environment: env('SQUARE_ENVIRONMENT') ?? 'sandbox', errorCode: square.errorCode ?? null },
        { provider: 'redis', configured: Boolean(env('REDIS_URL')) },
        { provider: 'brevo', configured: Boolean(env('BREVO_API_KEY')) },
        { provider: 'mailchimp', configured: Boolean(env('MAILCHIMP_API_KEY')) },
        { provider: 's3', configured: Boolean(env('S3_BUCKET')) },
      ]);
    }
    if (second === 'payments' && third === 'expire-holds' && request.method === 'POST') {
      assertSameOrigin(request);
      await requirePermission(request, 'orders.edit', true);
      return dataResponse(await expireExpiredCheckoutIntents());
    }
    if (second === 'payments' && third && path[3] === 'refund' && request.method === 'POST') {
      assertSameOrigin(request);
      const session = await requirePermission(request, 'orders.edit', true);
      return dataResponse(await handleAdminRefund(request, third, requestId, session.user.id), { status: 201 });
    }
    if (second === 'payments' && third && path[3] === 'reconcile' && request.method === 'POST') {
      assertSameOrigin(request);
      await requirePermission(request, 'orders.edit', true);
      return dataResponse(await handleAdminReconcile(third));
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

    if (second === 'events' && third && path[3] && ['tickets', 'vip'].includes(path[3])) {
      const eventId = third;
      const eventModule = path[3];
      const resource = path[4];
      const resourceId = path[5];
      const viewPermission = 'events.view';
      const editPermission = 'events.edit';
      if (eventModule === 'tickets' && resource === 'settings') {
        if (request.method === 'GET') { await requirePermission(request, viewPermission); return dataResponse(await getTicketSettings(eventId)); }
        if (request.method === 'PATCH' || request.method === 'PUT') { assertSameOrigin(request); const session = await requirePermission(request, editPermission, true); const result = await updateTicketSettings(eventId, await body(request)); await writeAuditLog({ actorUserId: session.user.id, action: 'update', entityType: 'ticket_settings', entityId: eventId, after: result, requestId }); revalidatePublicResource('events', eventId); return dataResponse(result); }
      }
      if (eventModule === 'tickets' && resource === 'tiers') {
        if (request.method === 'GET') { await requirePermission(request, viewPermission); return dataResponse(await listTicketTiers(eventId)); }
        if (!resourceId && request.method === 'POST') { assertSameOrigin(request); const session = await requirePermission(request, editPermission, true); const result = await saveTicketTier(eventId, await body(request)); await writeAuditLog({ actorUserId: session.user.id, action: 'create', entityType: 'ticket_tier', entityId: result.id, after: result, requestId }); revalidatePublicResource('events', eventId); return dataResponse(result, { status: 201 }); }
        if (resourceId && (request.method === 'PATCH' || request.method === 'PUT')) { assertSameOrigin(request); const session = await requirePermission(request, editPermission, true); const raw = await body(request); const result = await saveTicketTier(eventId, { ...(isRecord(raw) ? raw : {}), id: resourceId }); await writeAuditLog({ actorUserId: session.user.id, action: 'update', entityType: 'ticket_tier', entityId: resourceId, after: result, requestId }); revalidatePublicResource('events', eventId); return dataResponse(result); }
        if (resourceId && request.method === 'DELETE') { assertSameOrigin(request); const session = await requirePermission(request, editPermission, true); const result = await deleteTicketTier(eventId, resourceId); await writeAuditLog({ actorUserId: session.user.id, action: 'delete', entityType: 'ticket_tier', entityId: resourceId, after: result, requestId }); revalidatePublicResource('events', eventId); return dataResponse(result); }
      }
      if (eventModule === 'vip' && resource === 'settings') {
        if (request.method === 'GET') { await requirePermission(request, viewPermission); return dataResponse(await getVipSettings(eventId)); }
        if (request.method === 'PATCH' || request.method === 'PUT') { assertSameOrigin(request); const session = await requirePermission(request, editPermission, true); const result = await updateVipSettings(eventId, await body(request)); await writeAuditLog({ actorUserId: session.user.id, action: 'update', entityType: 'vip_settings', entityId: eventId, after: result, requestId }); revalidatePublicResource('events', eventId); return dataResponse(result); }
      }
      if (eventModule === 'vip' && resource === 'packages') {
        if (request.method === 'GET') { await requirePermission(request, viewPermission); return dataResponse(await listVipPackages(eventId)); }
        if (request.method === 'POST' && !resourceId) { assertSameOrigin(request); const session = await requirePermission(request, editPermission, true); const result = await saveVipPackage(eventId, await body(request)); await writeAuditLog({ actorUserId: session.user.id, action: 'create', entityType: 'vip_package', entityId: result.id, after: result, requestId }); revalidatePublicResource('events', eventId); return dataResponse(result, { status: 201 }); }
        if ((request.method === 'PATCH' || request.method === 'PUT') && resourceId) { assertSameOrigin(request); const session = await requirePermission(request, editPermission, true); const raw = await body(request); const result = await saveVipPackage(eventId, { ...(isRecord(raw) ? raw : {}), id: resourceId }); await writeAuditLog({ actorUserId: session.user.id, action: 'update', entityType: 'vip_package', entityId: resourceId, after: result, requestId }); revalidatePublicResource('events', eventId); return dataResponse(result); }
        if (resourceId && request.method === 'DELETE') { assertSameOrigin(request); const session = await requirePermission(request, editPermission, true); const result = await deleteVipPackage(eventId, resourceId); await writeAuditLog({ actorUserId: session.user.id, action: 'delete', entityType: 'vip_package', entityId: resourceId, after: result, requestId }); revalidatePublicResource('events', eventId); return dataResponse(result); }
      }
      if (eventModule === 'vip' && resource === 'booths') {
        if (request.method === 'GET') { await requirePermission(request, viewPermission); return dataResponse(await listVipBooths(eventId)); }
        if (request.method === 'POST' && !resourceId) { assertSameOrigin(request); const session = await requirePermission(request, editPermission, true); const result = await saveVipBooth(eventId, await body(request)); await writeAuditLog({ actorUserId: session.user.id, action: 'create', entityType: 'vip_booth', entityId: result.id, after: result, requestId }); revalidatePublicResource('events', eventId); return dataResponse(result, { status: 201 }); }
        if ((request.method === 'PATCH' || request.method === 'PUT') && resourceId) { assertSameOrigin(request); const session = await requirePermission(request, editPermission, true); const raw = await body(request); const result = await saveVipBooth(eventId, { ...(isRecord(raw) ? raw : {}), id: resourceId }); await writeAuditLog({ actorUserId: session.user.id, action: 'update', entityType: 'vip_booth', entityId: resourceId, after: result, requestId }); revalidatePublicResource('events', eventId); return dataResponse(result); }
        if (resourceId && request.method === 'DELETE') { assertSameOrigin(request); const session = await requirePermission(request, editPermission, true); const result = await deleteVipBooth(eventId, resourceId); await writeAuditLog({ actorUserId: session.user.id, action: 'delete', entityType: 'vip_booth', entityId: resourceId, after: result, requestId }); revalidatePublicResource('events', eventId); return dataResponse(result); }
      }
      if (eventModule === 'vip' && resource === 'bottles') {
        if (request.method === 'GET') { await requirePermission(request, viewPermission); return dataResponse(await listBottleOptions(eventId)); }
        if (request.method === 'POST' && !resourceId) { assertSameOrigin(request); const session = await requirePermission(request, editPermission, true); const result = await saveBottleOption(eventId, await body(request)); await writeAuditLog({ actorUserId: session.user.id, action: 'create', entityType: 'bottle_option', entityId: result.id, after: result, requestId }); revalidatePublicResource('events', eventId); return dataResponse(result, { status: 201 }); }
        if ((request.method === 'PATCH' || request.method === 'PUT') && resourceId) { assertSameOrigin(request); const session = await requirePermission(request, editPermission, true); const raw = await body(request); const result = await saveBottleOption(eventId, { ...(isRecord(raw) ? raw : {}), id: resourceId }); await writeAuditLog({ actorUserId: session.user.id, action: 'update', entityType: 'bottle_option', entityId: resourceId, after: result, requestId }); revalidatePublicResource('events', eventId); return dataResponse(result); }
        if (resourceId && request.method === 'DELETE') { assertSameOrigin(request); const session = await requirePermission(request, editPermission, true); const result = await deleteBottleOption(eventId, resourceId); await writeAuditLog({ actorUserId: session.user.id, action: 'delete', entityType: 'bottle_option', entityId: resourceId, after: result, requestId }); revalidatePublicResource('events', eventId); return dataResponse(result); }
      }
    }

    if (second === 'page-content' && third) {
      const permission = third === 'global-content' ? 'settings' : 'content';
      if (request.method === 'GET') {
        await requirePermission(request, `${permission}.view`);
        return dataResponse(await getAdminPageContent(third, params.get('locale')));
      }
      if (request.method === 'PATCH' || request.method === 'PUT') {
        assertSameOrigin(request);
        const session = await requirePermission(request, `${permission}.edit`, true);
        const result = await updateAdminPageContent(third, await body(request));
        await writeAuditLog({ actorUserId: session.user.id, action: 'update', entityType: 'page_content', entityId: result.id, after: result, requestId });
        revalidatePublicResource('page-content', third);
        return dataResponse(result);
      }
    }

    if (second === 'navigation') {
      if (third === 'routes' && request.method === 'GET') {
        await requirePermission(request, 'navigation.view');
        return dataResponse(await getNavigationRoutes(params.get('q')));
      }
      if (third === 'locations') {
        if (request.method === 'GET') {
          await requirePermission(request, 'navigation.view');
          return dataResponse(await getMenuLocations());
        }
        if (request.method === 'PATCH' || request.method === 'PUT') {
          assertSameOrigin(request);
          const session = await requirePermission(request, 'navigation.edit', true);
          const rawInput = await body(request);
          const input = isRecord(rawInput) ? rawInput : {};
          const result = await assignMenuLocation(String(input.locationKey ?? ''), typeof input.menuId === 'string' ? input.menuId : null);
          await writeAuditLog({ actorUserId: session.user.id, action: 'menu.location.assign', entityType: 'menu_location', entityId: result.id, after: result, requestId });
          revalidatePublicResource('navigation');
          return dataResponse(result);
        }
      }
      if (third === 'menus') {
        const menuId = path[3];
        const menuAction = path[4];
        if (!menuId && request.method === 'GET') {
          await requirePermission(request, 'navigation.view');
          return dataResponse(await getAdminMenus());
        }
        if (!menuId && request.method === 'POST') {
          assertSameOrigin(request);
          const session = await requirePermission(request, 'navigation.edit', true);
          const result = await createMenu(await body(request));
          await writeAuditLog({ actorUserId: session.user.id, action: 'menu.create', entityType: 'menu', entityId: result.id, after: result, requestId });
          return dataResponse(result, { status: 201 });
        }
        if (menuId && menuAction === 'publish' && request.method === 'POST') {
          assertSameOrigin(request);
          const session = await requirePermission(request, 'navigation.publish', true);
          const result = await publishMenu(menuId);
          await writeAuditLog({ actorUserId: session.user.id, action: 'menu.publish', entityType: 'menu', entityId: menuId, after: result, requestId });
          revalidatePublicResource('navigation');
          return dataResponse(result);
        }
        if (menuId && request.method === 'GET') {
          await requirePermission(request, 'navigation.view');
          return dataResponse(await getAdminMenu(menuId));
        }
        if (menuId && (request.method === 'PATCH' || request.method === 'PUT')) {
          assertSameOrigin(request);
          const session = await requirePermission(request, 'navigation.edit', true);
          const result = await saveMenu(menuId, await body(request));
          await writeAuditLog({ actorUserId: session.user.id, action: 'menu.update', entityType: 'menu', entityId: menuId, after: result, requestId });
          await writeAuditLog({ actorUserId: session.user.id, action: 'menu.item.reorder', entityType: 'menu', entityId: menuId, after: { count: result.items.length }, requestId });
          revalidatePublicResource('navigation');
          return dataResponse(result);
        }
      }
    }
    const singleton = singletonRoute(second, third);
    if (singleton && request.method === 'GET') {
      await requirePermission(request, `${singleton.permission}.view`);
      return dataResponse(await readAdminSingleton(singleton));
    }
    if (singleton && request.method === 'PUT') {
      assertSameOrigin(request);
      const session = await requirePermission(request, `${singleton.permission}.edit`, true);
      const values = cleanSingletonInput(await body(request));
      const result = await writeAdminSingleton(singleton, values, requestId, session.user.id);
      revalidatePublicResource(singleton.key.startsWith('settings-') ? 'settings' : singleton.key.startsWith('content-') ? 'content' : singleton.key);
      return dataResponse(result);
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
      revalidatePublicResource(resource, (row as any)?.slug);
      return dataResponse(adminRecord(resource, row), { status: 201 });
    }
    if (resourceId && !action && request.method === 'GET') {
      await requirePermission(request, adminResourcePermission(resource, 'view'));
      if (resource === 'events') { const row = await db.event.findUnique({ where: { id: resourceId }, include: { translations: true, ticketTiers: true, vipPackages: { include: { packageBottles: { include: { bottleOption: true } } } }, vipBooths: true, eventArtists: true, galleryAlbums: true, faqItems: { include: { translations: true } }, heroMedia: true, posterMedia: true } }); if (!row) throw notFound(); return dataResponse(adminRecord(resource, row)); }
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
      if (resource === 'payments') { const row = await db.payment.findUnique({ where: { id: resourceId }, include: { order: true, checkoutIntent: true, ticketPurchase: true, vipBooking: true, refunds: true } }); if (!row) throw notFound(); return dataResponse(adminRecord(resource, row)); }
      if (resource === 'ticket-purchases') { const row = await db.ticketPurchase.findUnique({ where: { id: resourceId }, include: { items: true, holds: true, issuedTickets: true, event: true, checkoutIntent: true, payments: true } }); if (!row) throw notFound(); return dataResponse(adminRecord(resource, row)); }
      if (resource === 'vip-bookings') { const row = await db.vipBooking.findUnique({ where: { id: resourceId }, include: { event: true, vipPackage: true, booth: true, hold: true, checkoutIntent: true, payments: true } }); if (!row) throw notFound(); return dataResponse(adminRecord(resource, row)); }
      throw notFound();
    }
    if (resourceId && !action && (request.method === 'PATCH' || request.method === 'PUT')) {
      assertSameOrigin(request);
      const session = await requirePermission(request, adminResourcePermission(resource, 'edit'), true);
      const row = await updateAdminResource(resource, resourceId, await body(request), requestId, session.user.id);
      revalidatePublicResource(resource, (row as any)?.slug);
      return dataResponse(adminRecord(resource, row));
    }
    if (resourceId && !action && request.method === 'DELETE') {
      assertSameOrigin(request);
      const session = await requirePermission(request, adminResourcePermission(resource, 'delete'), true);
      const row = await deleteAdminResource(resource, resourceId, requestId, session.user.id);
      revalidatePublicResource(resource, (row as any)?.slug);
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
      revalidatePublicResource(resource, row?.slug);
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
      revalidatePublicResource(resource, row?.slug);
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
