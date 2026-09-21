import 'server-only';

import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { db } from '@/server/db/client';
import { notFound, validationError } from '@/server/errors';
import { isPageContentKey, pageContentSchema } from '@/lib/cms/page-content';
import { isSafeCustomUrl, isValidAnchor, STATIC_ROUTES, type InternalRoute } from '@/lib/navigation/route-registry';

const LOCALES = ['en', 'vi'] as const;
type Locale = (typeof LOCALES)[number];
type JsonRecord = Record<string, unknown>;

function localeOrDefault(value?: string | null): Locale {
  return value === 'vi' ? 'vi' : 'en';
}

function jsonInput(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function record(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {};
}

export async function getPublicPageContent(key: string, localeValue?: string | null) {
  if (!isPageContentKey(key)) throw notFound('Page content not found.');
  const locale = localeOrDefault(localeValue);
  const row = await db.pageContent.findFirst({ where: { key, status: 'PUBLISHED' }, include: { translations: true } });
  if (!row) throw notFound('Page content not found.');
  const translation = row.translations.find((item) => item.locale === locale) ?? row.translations.find((item) => item.locale === 'en');
  if (!translation) throw notFound('Page content translation not found.');
  const schema = pageContentSchema(key);
  const parsed = schema?.safeParse(translation.contentJson);
  if (!parsed?.success) throw notFound('Page content is not valid.');
  return { key, locale: translation.locale, data: parsed.data, seo: { title: translation.seoTitle, description: translation.seoDescription, ogImageUrl: translation.ogImageUrl } };
}

export async function getAdminPageContent(key: string, localeValue?: string | null) {
  if (!isPageContentKey(key)) throw notFound('Page content not found.');
  const locale = localeOrDefault(localeValue);
  const row = await db.pageContent.findUnique({ where: { key }, include: { translations: true } });
  if (!row) throw notFound('Page content has not been seeded yet.');
  const translation = row.translations.find((item) => item.locale === locale) ?? row.translations.find((item) => item.locale === 'en');
  if (!translation) throw notFound('Page content translation not found.');
  return { id: row.id, key: row.key, status: row.status, locale: translation.locale, data: translation.contentJson, seo: { title: translation.seoTitle, description: translation.seoDescription, ogImageUrl: translation.ogImageUrl }, updatedAt: row.updatedAt.toISOString() };
}

export async function updateAdminPageContent(key: string, payload: unknown) {
  if (!isPageContentKey(key)) throw notFound('Page content not found.');
  const input = record(payload);
  const locale = localeOrDefault(typeof input.locale === 'string' ? input.locale : 'en');
  const rawData = input.data ?? input.content;
  const schema = pageContentSchema(key);
  if (!schema) throw notFound('Page content schema not found.');
  const parsed = schema.safeParse(rawData);
  if (!parsed.success) throw validationError(Object.fromEntries(parsed.error.issues.map((issue) => [issue.path.join('.') || 'data', issue.message])));
  const status = typeof input.status === 'string' && ['DRAFT', 'PREVIEW', 'PUBLISHED', 'ARCHIVED'].includes(input.status) ? input.status as 'DRAFT' | 'PREVIEW' | 'PUBLISHED' | 'ARCHIVED' : undefined;
  const seoInput = record(input.seo);
  const existing = await db.pageContent.findUnique({ where: { key } });
  const row = await db.$transaction(async (tx) => {
    const page = existing
      ? await tx.pageContent.update({ where: { id: existing.id }, data: status ? { status } : {} })
      : await tx.pageContent.create({ data: { key, status: status ?? 'DRAFT' } });
    await tx.pageContentTranslation.upsert({
      where: { pageContentId_locale: { pageContentId: page.id, locale } },
      update: { contentJson: jsonInput(parsed.data), seoTitle: typeof seoInput.title === 'string' ? seoInput.title : undefined, seoDescription: typeof seoInput.description === 'string' ? seoInput.description : undefined, ogImageUrl: typeof seoInput.ogImageUrl === 'string' ? seoInput.ogImageUrl : undefined },
      create: { pageContentId: page.id, locale, contentJson: jsonInput(parsed.data), seoTitle: typeof seoInput.title === 'string' ? seoInput.title : null, seoDescription: typeof seoInput.description === 'string' ? seoInput.description : null, ogImageUrl: typeof seoInput.ogImageUrl === 'string' ? seoInput.ogImageUrl : null },
    });
    return tx.pageContent.findUniqueOrThrow({ where: { id: page.id }, include: { translations: true } });
  });
  const translation = row.translations.find((item) => item.locale === locale) ?? row.translations[0];
  return { id: row.id, key: row.key, status: row.status, locale: translation?.locale ?? locale, data: translation?.contentJson ?? parsed.data, seo: { title: translation?.seoTitle ?? null, description: translation?.seoDescription ?? null, ogImageUrl: translation?.ogImageUrl ?? null }, updatedAt: row.updatedAt.toISOString() };
}

function dynamicRoute(entityType: string, id: string, label: string, slug: string, status: string, deletedAt: Date | null | undefined): InternalRoute {
  const available = status === 'PUBLISHED' && !deletedAt;
  const base = entityType === 'event' ? '/events' : entityType === 'artist' ? '/lineup' : entityType === 'news' ? '/news' : entityType === 'gallery' ? '/gallery' : '/shop';
  return { key: `${entityType}:${id}`, label, href: `${base}/${encodeURIComponent(slug)}`, group: `${entityType[0].toUpperCase()}${entityType.slice(1)}s`, dynamic: true, entityType, indexable: available, available, reason: available ? undefined : 'Archived, deleted, or unpublished' };
}

export async function getNavigationRoutes(search?: string | null) {
  const query = (search ?? '').trim().toLowerCase();
  const [events, artists, news, gallery, products] = await Promise.all([
    db.event.findMany({ where: { deletedAt: null }, select: { id: true, slug: true, status: true, deletedAt: true, translations: { select: { locale: true, title: true } } }, orderBy: { updatedAt: 'desc' }, take: 500 }),
    db.artist.findMany({ where: { deletedAt: null }, select: { id: true, slug: true, status: true, deletedAt: true, translations: { select: { locale: true, name: true } } }, orderBy: { updatedAt: 'desc' }, take: 500 }),
    db.newsArticle.findMany({ where: { deletedAt: null }, select: { id: true, slug: true, status: true, deletedAt: true, translations: { select: { locale: true, title: true } } }, orderBy: { updatedAt: 'desc' }, take: 500 }),
    db.galleryAlbum.findMany({ where: { deletedAt: null }, select: { id: true, slug: true, status: true, deletedAt: true, translations: { select: { locale: true, title: true } } }, orderBy: { updatedAt: 'desc' }, take: 500 }),
    db.product.findMany({ where: { deletedAt: null }, select: { id: true, slug: true, status: true, deletedAt: true, translations: { select: { locale: true, title: true } } }, orderBy: { updatedAt: 'desc' }, take: 500 }),
  ]);
  const title = (rows: Array<{ locale: string; title?: string | null; name?: string | null }>, fallback: string) => rows.find((item) => item.locale === 'en')?.title ?? rows.find((item) => item.locale === 'en')?.name ?? rows[0]?.title ?? rows[0]?.name ?? fallback;
  const dynamic = [
    ...events.map((item) => dynamicRoute('event', item.id, title(item.translations, item.slug), item.slug, item.status, item.deletedAt)),
    ...artists.map((item) => dynamicRoute('artist', item.id, title(item.translations, item.slug), item.slug, item.status, item.deletedAt)),
    ...news.map((item) => dynamicRoute('news', item.id, title(item.translations, item.slug), item.slug, item.status, item.deletedAt)),
    ...gallery.map((item) => dynamicRoute('gallery', item.id, title(item.translations, item.slug), item.slug, item.status, item.deletedAt)),
    ...products.map((item) => dynamicRoute('product', item.id, title(item.translations, item.slug), item.slug, item.status, item.deletedAt)),
  ];
  return [...STATIC_ROUTES, ...dynamic].filter((route) => !query || `${route.label} ${route.href} ${route.key}`.toLowerCase().includes(query));
}

async function resolveDynamicRoute(key: string): Promise<InternalRoute | null> {
  const match = /^(event|artist|news|gallery|product):([0-9a-f-]{36})$/i.exec(key);
  if (!match) return null;
  const [, type, id] = match;
  if (type === 'event') { const row = await db.event.findUnique({ where: { id }, select: { id: true, slug: true, status: true, deletedAt: true, translations: { select: { locale: true, title: true } } } }); return row ? dynamicRoute(type, row.id, row.translations.find((t) => t.locale === 'en')?.title ?? row.slug, row.slug, row.status, row.deletedAt) : null; }
  if (type === 'artist') { const row = await db.artist.findUnique({ where: { id }, select: { id: true, slug: true, status: true, deletedAt: true, translations: { select: { locale: true, name: true } } } }); return row ? dynamicRoute(type, row.id, row.translations.find((t) => t.locale === 'en')?.name ?? row.slug, row.slug, row.status, row.deletedAt) : null; }
  if (type === 'news') { const row = await db.newsArticle.findUnique({ where: { id }, select: { id: true, slug: true, status: true, deletedAt: true, translations: { select: { locale: true, title: true } } } }); return row ? dynamicRoute(type, row.id, row.translations.find((t) => t.locale === 'en')?.title ?? row.slug, row.slug, row.status, row.deletedAt) : null; }
  if (type === 'gallery') { const row = await db.galleryAlbum.findUnique({ where: { id }, select: { id: true, slug: true, status: true, deletedAt: true, translations: { select: { locale: true, title: true } } } }); return row ? dynamicRoute(type, row.id, row.translations.find((t) => t.locale === 'en')?.title ?? row.slug, row.slug, row.status, row.deletedAt) : null; }
  const row = await db.product.findUnique({ where: { id }, select: { id: true, slug: true, status: true, deletedAt: true, translations: { select: { locale: true, title: true } } } });
  return row ? dynamicRoute(type, row.id, row.translations.find((t) => t.locale === 'en')?.title ?? row.slug, row.slug, row.status, row.deletedAt) : null;
}

async function resolveRoute(key: string): Promise<InternalRoute | null> {
  return STATIC_ROUTES.find((route) => route.key === key) ?? resolveDynamicRoute(key);
}

const menuItemInput = z.object({
  id: z.string().uuid().optional(),
  parentId: z.string().uuid().nullable().optional(),
  itemType: z.enum(['INTERNAL_ROUTE', 'CUSTOM_URL', 'HASH_ANCHOR', 'NO_LINK']),
  labelEn: z.string().trim().min(1).max(160),
  labelVi: z.string().max(160).nullable().optional(),
  routeKey: z.string().max(180).nullable().optional(),
  customUrl: z.string().max(2_000).nullable().optional(),
  anchor: z.string().max(100).nullable().optional(),
  target: z.enum(['_self', '_blank']).optional(),
  enabled: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
  icon: z.string().max(80).nullable().optional(),
  badge: z.string().max(80).nullable().optional(),
  visibilityJson: z.unknown().nullable().optional(),
});
export type MenuItemInput = z.infer<typeof menuItemInput>;

export async function validateMenuItems(items: unknown[]) {
  const parsed = items.map((item) => menuItemInput.parse(item));
  const ids = parsed.map((item) => item.id).filter(Boolean) as string[];
  if (new Set(ids).size !== ids.length) throw validationError({ items: 'Menu item ids must be unique.' });
  const byId = new Set(ids);
  const depth = (id: string, seen = new Set<string>()): number => {
    if (seen.has(id)) throw validationError({ items: 'Menu item cycles are not allowed.' });
    const item = parsed.find((candidate) => candidate.id === id);
    if (!item?.parentId) return 1;
    if (!byId.has(item.parentId)) throw validationError({ items: 'Menu item parent does not exist.' });
    seen.add(id);
    return depth(item.parentId, seen) + 1;
  };
  for (const item of parsed) {
    const itemDepth = item.id ? depth(item.id) : 1;
    if (itemDepth > 3) throw validationError({ items: 'Menu nesting cannot exceed three levels.' });
    if (item.itemType === 'INTERNAL_ROUTE') {
      if (!item.routeKey) throw validationError({ routeKey: 'An internal route is required.' });
      const route = await resolveRoute(item.routeKey);
      if (!route || (!route.available && route.dynamic && item.enabled !== false)) throw validationError({ routeKey: 'The selected route is unavailable. Disable or replace it first.' });
    }
    if (item.itemType === 'CUSTOM_URL' && (!item.customUrl || !isSafeCustomUrl(item.customUrl))) throw validationError({ customUrl: 'Unsafe or invalid custom URL.' });
    if (item.itemType === 'HASH_ANCHOR' && (!item.customUrl || !isSafeCustomUrl(item.customUrl) || !item.anchor || !isValidAnchor(item.anchor))) throw validationError({ anchor: 'Use a valid route and #anchor.' });
  }
  return parsed;
}

function itemDto(item: any, route: InternalRoute | null) {
  const valid = item.itemType === 'NO_LINK' || (item.itemType === 'INTERNAL_ROUTE' ? Boolean(route && route.available !== false) : item.itemType === 'CUSTOM_URL' ? Boolean(item.customUrl && isSafeCustomUrl(item.customUrl)) : Boolean(item.customUrl && item.anchor && isSafeCustomUrl(item.customUrl) && isValidAnchor(item.anchor)));
  const href = item.itemType === 'INTERNAL_ROUTE' ? route?.href ?? null : item.itemType === 'HASH_ANCHOR' ? `${item.customUrl ?? ''}${item.anchor ?? ''}` : item.itemType === 'CUSTOM_URL' ? item.customUrl : null;
  return { id: item.id, parentId: item.parentId, itemType: item.itemType, labelEn: item.labelEn, labelVi: item.labelVi, routeKey: item.routeKey, customUrl: item.customUrl, anchor: item.anchor, target: item.target, enabled: item.enabled, sortOrder: item.sortOrder, icon: item.icon, badge: item.badge, href, valid, resolved: route ? { key: route.key, label: route.label, href: route.href, available: route.available !== false, reason: route.reason ?? null } : null };
}

export async function getAdminMenus() {
  const rows = await db.menu.findMany({ orderBy: { name: 'asc' }, include: { items: { orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }] }, locations: true } });
  return Promise.all(rows.map(async (menu) => ({ ...menu, items: await Promise.all(menu.items.map(async (item) => itemDto(item, item.routeKey ? await resolveRoute(item.routeKey) : null))) })));
}

export async function getAdminMenu(id: string) {
  const menu = await db.menu.findUnique({ where: { id }, include: { items: { orderBy: { sortOrder: 'asc' } }, locations: true } });
  if (!menu) throw notFound('Menu not found.');
  return { ...menu, items: await Promise.all(menu.items.map(async (item) => itemDto(item, item.routeKey ? await resolveRoute(item.routeKey) : null))) };
}

export async function createMenu(input: unknown) {
  const value = z.object({ name: z.string().trim().min(1).max(160), key: z.string().trim().regex(/^[a-z0-9_-]+$/).max(100), status: z.enum(['DRAFT', 'PUBLISHED']).optional() }).parse(input);
  return db.menu.create({ data: { ...value, status: value.status ?? 'DRAFT' } });
}

export async function saveMenu(id: string, input: unknown) {
  const payload = record(input);
  const items = await validateMenuItems(Array.isArray(payload.items) ? payload.items : []);
  const name = typeof payload.name === 'string' ? payload.name.trim().slice(0, 160) : undefined;
  const status = payload.status === 'PUBLISHED' || payload.status === 'DRAFT' ? payload.status : undefined;
  return db.$transaction(async (tx) => {
    const existing = await tx.menu.findUnique({ where: { id } });
    if (!existing) throw notFound('Menu not found.');
    const rows = items.map((item, index) => ({ ...item, id: item.id ?? randomUUID(), sortOrder: item.sortOrder ?? index }));
    await tx.menuItem.deleteMany({ where: { menuId: id } });
    const byOldId = new Map(items.flatMap((item, index) => item.id ? [[item.id, rows[index].id] as const] : []));
    for (const [index, item] of rows.entries()) {
      const source = items[index];
      await tx.menuItem.create({ data: { id: item.id, menuId: id, parentId: source.parentId ? byOldId.get(source.parentId) ?? source.parentId : null, itemType: source.itemType, labelEn: source.labelEn, labelVi: source.labelVi ?? null, routeKey: source.routeKey ?? null, customUrl: source.customUrl ?? null, anchor: source.anchor ?? null, target: source.target ?? '_self', enabled: source.enabled ?? true, sortOrder: source.sortOrder ?? item.sortOrder, icon: source.icon ?? null, badge: source.badge ?? null, visibilityJson: source.visibilityJson == null ? Prisma.JsonNull : jsonInput(source.visibilityJson) } });
    }
    await tx.menu.update({ where: { id }, data: { name, status } });
    return tx.menu.findUniqueOrThrow({ where: { id }, include: { items: { orderBy: { sortOrder: 'asc' } }, locations: true } });
  });
}

export async function publishMenu(id: string) {
  await db.menu.update({ where: { id }, data: { status: 'PUBLISHED' } });
  return getAdminMenu(id);
}

export async function getMenuLocations() {
  const keys = ['HEADER_PRIMARY', 'HEADER_CTA', 'MOBILE_PRIMARY', 'FOOTER_QUICK', 'FOOTER_LEGAL', 'FOOTER_SECONDARY'] as const;
  const rows = await db.menuLocation.findMany({ include: { menu: { select: { id: true, name: true, key: true, status: true } } } });
  return keys.map((locationKey) => rows.find((row) => row.locationKey === locationKey) ?? { id: null, locationKey, menuId: null, menu: null });
}

export async function assignMenuLocation(locationValue: string, menuId: string | null) {
  if (!['HEADER_PRIMARY', 'HEADER_CTA', 'MOBILE_PRIMARY', 'FOOTER_QUICK', 'FOOTER_LEGAL', 'FOOTER_SECONDARY'].includes(locationValue)) throw validationError({ locationKey: 'Unknown menu location.' });
  if (menuId) { const menu = await db.menu.findUnique({ where: { id: menuId } }); if (!menu) throw validationError({ menuId: 'Menu not found.' }); }
  return db.menuLocation.upsert({ where: { locationKey: locationValue as any }, update: { menuId }, create: { locationKey: locationValue as any, menuId } });
}

async function publicItem(item: any) {
  const route = item.routeKey ? await resolveRoute(item.routeKey) : null;
  return itemDto(item, route);
}

export async function getPublicNavigation(locationValue: string) {
  const location = locationValue.toUpperCase();
  if (!['HEADER_PRIMARY', 'HEADER_CTA', 'MOBILE_PRIMARY', 'FOOTER_QUICK', 'FOOTER_LEGAL', 'FOOTER_SECONDARY'].includes(location)) throw notFound('Navigation location not found.');
  const assigned = await db.menuLocation.findUnique({ where: { locationKey: location as any }, include: { menu: { include: { items: { orderBy: { sortOrder: 'asc' } } } } } });
  if (!assigned?.menu || assigned.menu.status !== 'PUBLISHED') return { location, menu: null, items: [] };
  const resolved = (await Promise.all(assigned.menu.items.map(publicItem))).filter((item) => item.enabled && item.valid && item.href !== null);
  const byParent = new Map<string | null, any[]>();
  for (const item of resolved) { const parent = assigned.menu.items.find((raw) => raw.id === item.id)?.parentId ?? null; const list = byParent.get(parent) ?? []; list.push({ ...item, children: [] }); byParent.set(parent, list); }
  const build = (parent: string | null): any[] => (byParent.get(parent) ?? []).map((item) => ({ ...item, children: build(item.id) }));
  return { location, menu: { id: assigned.menu.id, name: assigned.menu.name, key: assigned.menu.key, status: assigned.menu.status }, items: build(null) };
}

const eventIdSchema = z.string().uuid();
const currency = z.string().regex(/^[A-Z]{3}$/);

async function ensureEvent(eventId: string) {
  const id = eventIdSchema.parse(eventId);
  const event = await db.event.findUnique({ where: { id } });
  if (!event) throw notFound('Event not found.');
  return event;
}

export async function getTicketSettings(eventId: string) {
  const event = await ensureEvent(eventId);
  return {
    eventId: event.id,
    ticketingEnabled: event.ticketingEnabled,
    saleStatus: event.ticketSaleStatus,
    currency: event.ticketCurrency,
    onlineSalesEnabled: event.ticketOnlineSalesEnabled,
    doorSalesEnabled: event.ticketDoorSalesEnabled,
    capacityTracking: event.ticketCapacityTracking,
    saleStart: event.ticketSaleStart?.toISOString() ?? null,
    saleEnd: event.ticketSaleEnd?.toISOString() ?? null,
    squarePaymentEnabled: event.ticketSquareEnabled,
    externalProviderEnabled: event.ticketExternalProviderEnabled,
    providerName: event.ticketProviderName,
    providerUrl: event.ticketProviderUrl,
    providerEventId: event.ticketProviderEventId,
  };
}

export async function updateTicketSettings(eventId: string, input: unknown) {
  await ensureEvent(eventId);
  const value = z.object({
    ticketingEnabled: z.boolean().optional(),
    saleStatus: z.enum(['COMING_SOON', 'ON_SALE', 'PAUSED', 'SOLD_OUT', 'ENDED']).optional(),
    currency: currency.optional(),
    onlineSalesEnabled: z.boolean().optional(),
    doorSalesEnabled: z.boolean().optional(),
    capacityTracking: z.boolean().optional(),
    saleStart: z.string().datetime().nullable().optional(),
    saleEnd: z.string().datetime().nullable().optional(),
    squarePaymentEnabled: z.boolean().optional(),
    externalProviderEnabled: z.boolean().optional(),
    providerName: z.string().max(160).nullable().optional(),
    providerUrl: z.string().max(2_000).nullable().optional(),
    providerEventId: z.string().max(160).nullable().optional(),
  }).parse(input);
  const row = await db.event.update({ where: { id: eventId }, data: {
    ticketingEnabled: value.ticketingEnabled,
    ticketSaleStatus: value.saleStatus,
    ticketCurrency: value.currency,
    ticketOnlineSalesEnabled: value.onlineSalesEnabled,
    ticketDoorSalesEnabled: value.doorSalesEnabled,
    ticketCapacityTracking: value.capacityTracking,
    ticketSaleStart: value.saleStart === undefined ? undefined : value.saleStart ? new Date(value.saleStart) : null,
    ticketSaleEnd: value.saleEnd === undefined ? undefined : value.saleEnd ? new Date(value.saleEnd) : null,
    ticketSquareEnabled: value.squarePaymentEnabled,
    ticketExternalProviderEnabled: value.externalProviderEnabled,
    ticketProviderName: value.providerName,
    ticketProviderUrl: value.providerUrl,
    ticketProviderEventId: value.providerEventId,
  } });
  return getTicketSettings(row.id);
}

const ticketTierInput = z.object({
  id: z.string().uuid().optional(), name: z.string().trim().min(1).max(160), description: z.string().max(20_000).nullable().optional(), priceMinor: z.number().int().min(0), currency: currency, badge: z.string().max(120).nullable().optional(), capacity: z.number().int().positive().nullable().optional(), availabilityStatus: z.enum(['AVAILABLE', 'SOLD_OUT', 'NOT_AVAILABLE', 'UNKNOWN', 'ON_REQUEST']).optional(), purchasableOnline: z.boolean(), purchasableAtDoor: z.boolean(), minQuantity: z.number().int().min(0).optional(), maxQuantity: z.number().int().min(0).nullable().optional(), defaultQuantity: z.number().int().min(0).nullable().optional(), highlighted: z.boolean().optional(), sortOrder: z.number().int().min(0).optional(), enabled: z.boolean().optional(), providerName: z.string().max(160).nullable().optional(), providerUrl: z.string().max(2_000).nullable().optional(), providerExternalId: z.string().max(160).nullable().optional(),
});

export async function listTicketTiers(eventId: string) {
  await ensureEvent(eventId);
  return db.ticketTier.findMany({ where: { eventId }, orderBy: { sortOrder: 'asc' } });
}

export async function saveTicketTier(eventId: string, input: unknown) {
  await ensureEvent(eventId);
  const value = ticketTierInput.parse(input);
  const data = { name: value.name, description: value.description ?? null, priceMinor: value.priceMinor, currency: value.currency, badge: value.badge ?? null, capacity: value.capacity ?? null, availabilityStatus: value.availabilityStatus ?? 'UNKNOWN', purchasableOnline: value.purchasableOnline, purchasableAtDoor: value.purchasableAtDoor, minQuantity: value.minQuantity ?? 1, maxQuantity: value.maxQuantity ?? null, defaultQuantity: value.defaultQuantity ?? null, highlighted: value.highlighted ?? false, sortOrder: value.sortOrder ?? 0, enabled: value.enabled ?? true, providerName: value.providerName ?? null, providerUrl: value.providerUrl ?? null, providerExternalId: value.providerExternalId ?? null };
  if (value.id) {
    const existing = await db.ticketTier.findFirst({ where: { id: value.id, eventId } });
    if (!existing) throw notFound('Ticket tier not found.');
    return db.ticketTier.update({ where: { id: value.id }, data });
  }
  return db.ticketTier.create({ data: { eventId, ...data } });
}

export async function deleteTicketTier(eventId: string, tierId: string) {
  await ensureEvent(eventId);
  const existing = await db.ticketTier.findFirst({ where: { id: tierId, eventId } });
  if (!existing) throw notFound('Ticket tier not found.');
  const used = await db.ticketPurchaseItem.count({ where: { ticketTierId: tierId } });
  if (used) return db.ticketTier.update({ where: { id: tierId }, data: { enabled: false, availabilityStatus: 'NOT_AVAILABLE' } });
  return db.ticketTier.delete({ where: { id: tierId } });
}

const vipSettingsInput = z.object({
  vipEnabled: z.boolean().optional(), paymentMode: z.enum(['REQUEST_ONLY', 'FULL_PAYMENT', 'DEPOSIT']).optional(), availabilityMode: z.string().max(40).optional(), bookingEnabled: z.boolean().optional(), defaultPackageId: z.string().uuid().nullable().optional(), requestExpiryMinutes: z.number().int().positive().optional(), boothHoldMinutes: z.number().int().positive().optional(), currency: currency.optional(), squarePaymentEnabled: z.boolean().optional(),
});

export async function getVipSettings(eventId: string) {
  const event = await ensureEvent(eventId);
  const defaultPackage = event.vipDefaultPackageId ? await db.vipPackage.findFirst({ where: { id: event.vipDefaultPackageId, eventId }, select: { id: true, name: true } }) : null;
  return { eventId: event.id, vipEnabled: event.vipEnabled, paymentMode: defaultPackage ? (await db.vipPackage.findUnique({ where: { id: defaultPackage.id }, select: { paymentMode: true } }))?.paymentMode ?? 'REQUEST_ONLY' : 'REQUEST_ONLY', availabilityMode: event.vipAvailabilityMode, bookingEnabled: event.vipBookingEnabled, defaultPackageId: defaultPackage?.id ?? null, requestExpiryMinutes: event.vipRequestExpiryMinutes, boothHoldMinutes: event.vipBoothHoldMinutes, currency: event.vipCurrency, squarePaymentEnabled: event.vipSquareEnabled };
}

export async function updateVipSettings(eventId: string, input: unknown) {
  await ensureEvent(eventId);
  const value = vipSettingsInput.parse(input);
  if (value.defaultPackageId) { const pkg = await db.vipPackage.findFirst({ where: { id: value.defaultPackageId, eventId } }); if (!pkg) throw validationError({ defaultPackageId: 'Package does not belong to this event.' }); }
  const row = await db.event.update({ where: { id: eventId }, data: { vipEnabled: value.vipEnabled, vipAvailabilityMode: value.availabilityMode, vipBookingEnabled: value.bookingEnabled, vipDefaultPackageId: value.defaultPackageId, vipRequestExpiryMinutes: value.requestExpiryMinutes, vipBoothHoldMinutes: value.boothHoldMinutes, vipCurrency: value.currency, vipSquareEnabled: value.squarePaymentEnabled } });
  if (value.paymentMode && value.defaultPackageId) await db.vipPackage.update({ where: { id: value.defaultPackageId }, data: { paymentMode: value.paymentMode } });
  return getVipSettings(row.id);
}

const vipPackageInput = z.object({ id: z.string().uuid().optional(), name: z.string().trim().min(1).max(160), description: z.string().max(20_000).nullable().optional(), priceMinor: z.number().int().min(0), depositAmountMinor: z.number().int().min(0).nullable().optional(), currency, capacity: z.number().int().positive(), includedBottleCount: z.number().int().min(0), minBottleSelection: z.number().int().min(0).optional(), maxBottleSelection: z.number().int().min(0).optional(), enabled: z.boolean().optional(), sortOrder: z.number().int().min(0).optional(), paymentMode: z.enum(['REQUEST_ONLY', 'FULL_PAYMENT', 'DEPOSIT']).optional(), bottleOptionIds: z.array(z.string().uuid()).optional() });

export async function listVipPackages(eventId: string) { await ensureEvent(eventId); return db.vipPackage.findMany({ where: { eventId }, orderBy: { sortOrder: 'asc' }, include: { packageBottles: { include: { bottleOption: true } } } }); }
export async function saveVipPackage(eventId: string, input: unknown) {
  await ensureEvent(eventId); const value = vipPackageInput.parse(input);
  const data = { name: value.name, description: value.description ?? null, priceMinor: value.priceMinor, depositAmountMinor: value.depositAmountMinor ?? null, currency: value.currency, capacity: value.capacity, includedBottleCount: value.includedBottleCount, minBottleSelection: value.minBottleSelection ?? 0, maxBottleSelection: value.maxBottleSelection ?? 3, enabled: value.enabled ?? true, sortOrder: value.sortOrder ?? 0, paymentMode: value.paymentMode ?? 'REQUEST_ONLY' as const };
  const row = value.id ? await db.vipPackage.updateMany({ where: { id: value.id, eventId }, data }) : null;
  if (value.id && !row?.count) throw notFound('VIP package not found.');
  const packageRow = value.id ? await db.vipPackage.findUniqueOrThrow({ where: { id: value.id } }) : await db.vipPackage.create({ data: { eventId, ...data } });
  if (value.bottleOptionIds) { const bottles = await db.bottleOption.findMany({ where: { id: { in: value.bottleOptionIds } }, select: { id: true } }); if (bottles.length !== value.bottleOptionIds.length) throw validationError({ bottleOptionIds: 'One or more bottle options do not exist.' }); await db.vipPackageBottle.deleteMany({ where: { vipPackageId: packageRow.id } }); if (value.bottleOptionIds.length) await db.vipPackageBottle.createMany({ data: value.bottleOptionIds.map((bottleOptionId) => ({ vipPackageId: packageRow.id, bottleOptionId })) }); }
  return db.vipPackage.findUniqueOrThrow({ where: { id: packageRow.id }, include: { packageBottles: { include: { bottleOption: true } } } });
}

export async function deleteVipPackage(eventId: string, packageId: string) {
  await ensureEvent(eventId);
  const existing = await db.vipPackage.findFirst({ where: { id: packageId, eventId } });
  if (!existing) throw notFound('VIP package not found.');
  const [requests, bookings] = await Promise.all([
    db.bookingRequest.count({ where: { vipPackageId: packageId } }),
    db.vipBooking.count({ where: { vipPackageId: packageId } }),
  ]);
  if (requests || bookings) return db.vipPackage.update({ where: { id: packageId }, data: { enabled: false } });
  return db.vipPackage.delete({ where: { id: packageId } });
}

const boothInput = z.object({ id: z.string().uuid().optional(), code: z.string().trim().min(1).max(40), label: z.string().max(100).nullable().optional(), zone: z.string().max(80).nullable().optional(), x: z.number().min(0).max(100), y: z.number().min(0).max(100), requestable: z.boolean(), availabilityStatus: z.enum(['AVAILABLE', 'SOLD_OUT', 'NOT_AVAILABLE', 'UNKNOWN', 'ON_REQUEST']).optional(), enabled: z.boolean().optional(), sortOrder: z.number().int().min(0).optional() });
export async function listVipBooths(eventId: string) { await ensureEvent(eventId); return db.vipBooth.findMany({ where: { eventId }, orderBy: { sortOrder: 'asc' } }); }
export async function saveVipBooth(eventId: string, input: unknown) { await ensureEvent(eventId); const value = boothInput.parse(input); const data = { code: value.code, label: value.label ?? null, zone: value.zone ?? null, x: value.x, y: value.y, requestable: value.requestable, availabilityStatus: value.availabilityStatus ?? 'ON_REQUEST', enabled: value.enabled ?? true, sortOrder: value.sortOrder ?? 0 }; if (value.id) { const existing = await db.vipBooth.findFirst({ where: { id: value.id, eventId } }); if (!existing) throw notFound('Booth not found.'); return db.vipBooth.update({ where: { id: value.id }, data }); } return db.vipBooth.create({ data: { eventId, ...data } }); }

export async function deleteVipBooth(eventId: string, boothId: string) {
  await ensureEvent(eventId);
  const existing = await db.vipBooth.findFirst({ where: { id: boothId, eventId } });
  if (!existing) throw notFound('Booth not found.');
  const [requests, bookings, holds] = await Promise.all([
    db.bookingRequest.count({ where: { preferredBoothId: boothId } }),
    db.vipBooking.count({ where: { boothId } }),
    db.vipBoothHold.count({ where: { boothId } }),
  ]);
  if (requests || bookings || holds) return db.vipBooth.update({ where: { id: boothId }, data: { enabled: false, availabilityStatus: 'NOT_AVAILABLE' } });
  return db.vipBooth.delete({ where: { id: boothId } });
}

const bottleInput = z.object({ id: z.string().uuid().optional(), name: z.string().trim().min(1).max(160), mediaId: z.string().uuid().nullable().optional(), description: z.string().max(20_000).nullable().optional(), category: z.string().max(80).nullable().optional(), enabled: z.boolean().optional(), sortOrder: z.number().int().min(0).optional() });
export async function listBottleOptions(eventId: string) { await ensureEvent(eventId); return db.bottleOption.findMany({ orderBy: { sortOrder: 'asc' }, include: { media: true } }); }
export async function saveBottleOption(eventId: string, input: unknown) { await ensureEvent(eventId); const value = bottleInput.parse(input); const data = { name: value.name, mediaId: value.mediaId ?? null, description: value.description ?? null, category: value.category ?? null, enabled: value.enabled ?? true, sortOrder: value.sortOrder ?? 0 }; if (value.id) { return db.bottleOption.update({ where: { id: value.id }, data }); } return db.bottleOption.create({ data }); }

export async function deleteBottleOption(eventId: string, bottleId: string) {
  await ensureEvent(eventId);
  const existing = await db.bottleOption.findUnique({ where: { id: bottleId } });
  if (!existing) throw notFound('Bottle option not found.');
  const [packages, requests] = await Promise.all([
    db.vipPackageBottle.count({ where: { bottleOptionId: bottleId } }),
    db.bookingRequestBottle.count({ where: { bottleOptionId: bottleId } }),
  ]);
  if (packages || requests) return db.bottleOption.update({ where: { id: bottleId }, data: { enabled: false } });
  return db.bottleOption.delete({ where: { id: bottleId } });
}
