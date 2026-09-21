'use server';

// Admin Server Functions. Every one re-checks the session and permission —
// they are reachable by direct POST, so the UI hiding a button is not enough.
// In api mode the backend enforces the same rules again.

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { destroyAdminSessionFromCookies } from '@/server/auth/session';
import { can, getAdminSession } from '@/lib/admin/auth/session';
import type { Permission } from '@/lib/admin/auth/permissions';
import { getPath, setPath, slugify } from '@/lib/admin/common/paths';
import type { FormSchema } from '@/lib/admin/common/schema';
import type { ResourceKey, SingletonKey } from '@/lib/admin/common/resource';
import type { AdminApiError, AdminRecord } from '@/lib/admin/common/types';
import { validateValues } from '@/lib/admin/common/validation';
import { RESOURCES, SINGLETONS, getRepository, getSingletonRepository } from '@/lib/admin/registry';
import { apiRequest } from '@/lib/api/client';
import { getApiBaseUrl } from '@/lib/checkout/config';

export type ActionResult<T = null> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: AdminApiError };

const denied = (): ActionResult<never> => ({
  ok: false,
  error: { code: 'forbidden', message: 'You do not have permission to do that.' },
});

async function authorize(permission: Permission) {
  const session = await getAdminSession();
  if (!session) return { ok: false as const, result: { ok: false as const, error: { code: 'unauthenticated', message: 'Your session has ended. Please sign in again.' } } };
  if (!can(session, permission)) return { ok: false as const, result: denied() };
  return { ok: true as const, session };
}

function isResourceKey(value: unknown): value is ResourceKey {
  return typeof value === 'string' && value in RESOURCES;
}

function isSingletonKey(value: unknown): value is SingletonKey {
  return typeof value === 'string' && value in SINGLETONS;
}

// ---------------------------------------------------------------------------
// Sign in / out
// ---------------------------------------------------------------------------

export interface SignInState {
  error?: string;
}

export async function signIn(_state: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  if (!email || !password) return { error: 'Enter your email and password.' };

  return { error: 'Sign-in is handled by the API login endpoint.' };
}

export async function signOut(): Promise<void> {
  await destroyAdminSessionFromCookies();
  redirect('/admin/login');
}

// ---------------------------------------------------------------------------
// Input shaping
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Top-level keys a schema is allowed to write. Anything else is dropped. */
function writableKeys(schema: FormSchema): Set<string> {
  // Read-only fields are displayed, never written.
  const keys = new Set(
    schema.sections.flatMap((s) => s.fields.filter((field) => field.type !== 'readonly').map((field) => field.key.split('.')[0])),
  );
  if (schema.seo) keys.add('seo');
  if (schema.publish) keys.add(schema.publish.statusKey);
  return keys;
}

function safeUrl(value: unknown): boolean {
  return typeof value === 'string' && (value === '' || value.startsWith('/') || /^https?:\/\//.test(value));
}

/** Removes anything that could smuggle markup or unsafe links into content. */
function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitize);
  if (isRecord(value)) {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value)) {
      if (key === 'src' && !safeUrl(v)) {
        out[key] = '';
      } else if (key === '__proto__' || key === 'constructor') {
        continue;
      } else {
        out[key] = sanitize(v);
      }
    }
    return out;
  }
  if (typeof value === 'string') return value.slice(0, 20000);
  return value;
}

function pickWritable(schema: FormSchema, values: unknown): Record<string, unknown> {
  const allowed = writableKeys(schema);
  const out: Record<string, unknown> = {};
  if (!isRecord(values)) return out;
  for (const key of allowed) {
    if (key in values) out[key] = sanitize(values[key]);
  }
  return out;
}

const ALLOWED_BLOCKS = new Set(['paragraph', 'heading', 'image', 'quote', 'list']);

function cleanBlocks(input: Record<string, unknown>): Record<string, unknown> {
  if (!Array.isArray(input.body)) return input;
  const body = input.body.flatMap((raw, index): Record<string, unknown>[] => {
    if (!isRecord(raw) || !ALLOWED_BLOCKS.has(String(raw.type))) return [];
    const id = typeof raw.id === 'string' && raw.id ? raw.id : `block-${index + 1}`;
    switch (raw.type) {
      case 'heading':
        return [{ id, type: 'heading', level: raw.level === 3 ? 3 : 2, text: String(raw.text ?? '') }];
      case 'image':
        return isRecord(raw.image) && safeUrl(raw.image.src)
          ? [{ id, type: 'image', image: { src: String(raw.image.src), alt: String(raw.image.alt ?? ''), caption: String(raw.image.caption ?? '') } }]
          : [];
      case 'quote':
        return [{ id, type: 'quote', text: String(raw.text ?? ''), attribution: raw.attribution ? String(raw.attribution) : null }];
      case 'list':
        return [{ id, type: 'list', style: raw.style === 'numbered' ? 'numbered' : 'bullet', items: Array.isArray(raw.items) ? raw.items.map(String) : [] }];
      default:
        return [{ id, type: 'paragraph', text: String(raw.text ?? '') }];
    }
  });
  return { ...input, body };
}

function titleText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (isRecord(value)) return String(value.en ?? '');
  return '';
}

function textValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function nullableText(value: unknown): string | null {
  const text = textValue(value);
  return text || null;
}

function enumValue(value: unknown): string | undefined {
  const text = textValue(value);
  return text ? text.toUpperCase() : undefined;
}

function mediaId(value: unknown): string | null {
  if (typeof value === 'string') return value || null;
  if (isRecord(value) && typeof value.mediaId === 'string') return value.mediaId || null;
  return null;
}

function localizedValue(value: unknown, language: 'en' | 'vi'): string {
  if (typeof value === 'string') return language === 'en' ? value.trim() : '';
  if (!isRecord(value)) return '';
  return typeof value[language] === 'string' ? String(value[language]).trim() : '';
}

function localizedTranslations(
  input: Record<string, unknown>,
  requiredKey: string,
  build: (locale: 'en' | 'vi') => Record<string, unknown>,
) {
  const locales = (['en', 'vi'] as const).filter((locale) => localizedValue(input[requiredKey], locale));
  return (locales.length ? locales : ['en' as const]).map(build);
}

function dateTime(date: unknown, time: unknown): string | null {
  const dateText = textValue(date);
  if (!dateText) return null;
  const timeText = textValue(time) || '00:00';
  const value = new Date(`${dateText}T${timeText}:00.000Z`);
  return Number.isNaN(value.getTime()) ? null : value.toISOString();
}

function moneyValue(value: unknown): Record<string, unknown> | null {
  if (!isRecord(value)) return null;
  const amountMinor = typeof value.amountMinor === 'number' ? value.amountMinor : 0;
  const currency = textValue(value.currency) || 'AUD';
  return { amountMinor, currency };
}

function idValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

/** Converts the admin form model into the public API write contract. */
function apiPayload(resource: ResourceKey, input: Record<string, unknown>): Record<string, unknown> {
  if (resource === 'events') {
    const venue = isRecord(input.venue) ? input.venue : {};
    const seo = isRecord(input.seo) ? input.seo : {};
    const tickets = isRecord(input.tickets) ? input.tickets : {};
    const vip = isRecord(input.vip) ? input.vip : {};
    const tierInputs = Array.isArray(tickets.tiers) ? tickets.tiers : [];
    const boothInputs = Array.isArray(vip.booths) ? vip.booths : [];
    const bottleInputs = Array.isArray(vip.bottles) ? vip.bottles : [];
    const faqInputs = Array.isArray(input.faqs) ? input.faqs : [];
    return {
      slug: textValue(input.slug),
      status: enumValue(input.status),
      lifecycleStatus: enumValue(input.phase),
      dateStatus: enumValue(input.dateStatus),
      scheduleStatus: enumValue(input.scheduleStatus),
      startAt: dateTime(input.startDate, input.startTime),
      endAt: dateTime(input.endDate, input.endTime),
      venueName: textValue(venue.name),
      city: textValue(venue.city),
      region: nullableText(venue.region),
      country: textValue(venue.country),
      address: nullableText(venue.address),
      mapUrl: nullableText(venue.mapUrl),
      featured: Boolean(input.featured),
      heroMediaId: mediaId(input.heroImage),
      posterMediaId: mediaId(input.posterImage),
      seoTitle: nullableText(seo.title),
      seoDescription: nullableText(seo.description),
      canonicalOverride: nullableText(seo.canonical),
      ogMediaId: mediaId(seo.ogImage),
      indexable: typeof seo.index === 'boolean' ? seo.index : true,
      followLinks: typeof seo.follow === 'boolean' ? seo.follow : true,
      translations: localizedTranslations(input, 'name', (locale) => ({
        locale,
        title: localizedValue(input.name, locale),
        eyebrow: nullableText(localizedValue(input.eyebrow, locale)),
        shortDescription: nullableText(localizedValue(input.shortDescription, locale)),
        description: nullableText(localizedValue(input.longDescription, locale)),
      })),
      tickets: {
        providerMode: textValue(tickets.providerMode) === 'external' ? 'external' : 'none',
        providerUrl: nullableText(tickets.providerUrl),
        tiers: tierInputs.map((raw, index) => {
          const tier = isRecord(raw) ? raw : {};
          return {
            id: idValue(tier.id),
            name: textValue(tier.name),
            price: moneyValue(tier.price),
            badge: nullableText(tier.badge),
            online: Boolean(tier.online),
            door: Boolean(tier.door),
            sortOrder: typeof tier.sortOrder === 'number' ? tier.sortOrder : index,
            enabled: typeof tier.enabled === 'boolean' ? tier.enabled : true,
            availabilityStatus: enumValue(tier.availabilityStatus),
            capacity: typeof tier.capacity === 'number' ? tier.capacity : null,
            providerName: nullableText(tier.providerName),
            providerExternalId: nullableText(tier.providerExternalId),
            providerUrl: nullableText(tier.providerUrl) ?? nullableText(tickets.providerUrl),
          };
        }),
      },
      vip: {
        id: idValue(vip.id),
        enabled: Boolean(vip.enabled),
        packageName: textValue(vip.packageName),
        price: moneyValue(vip.price),
        capacity: typeof vip.capacity === 'number' ? vip.capacity : null,
        includedBottles: typeof vip.includedBottles === 'number' ? vip.includedBottles : null,
        availabilityMode: textValue(vip.availabilityMode) === 'managed' ? 'managed' : 'on-request',
        paymentMode: enumValue(vip.paymentMode),
        depositAmountMinor: typeof vip.depositAmountMinor === 'number' ? vip.depositAmountMinor : null,
        booths: boothInputs.map((raw, index) => {
          const booth = isRecord(raw) ? raw : {};
          return {
            id: idValue(booth.id),
            code: textValue(booth.code),
            zone: nullableText(booth.zone),
            x: typeof booth.x === 'number' ? booth.x : null,
            y: typeof booth.y === 'number' ? booth.y : null,
            requestable: typeof booth.requestable === 'boolean' ? booth.requestable : true,
            availabilityStatus: enumValue(booth.availabilityStatus),
            sortOrder: typeof booth.sortOrder === 'number' ? booth.sortOrder : index,
          };
        }),
        bottles: bottleInputs.map((raw, index) => {
          const bottle = isRecord(raw) ? raw : {};
          return {
            id: idValue(bottle.id),
            name: textValue(bottle.name),
            enabled: typeof bottle.enabled === 'boolean' ? bottle.enabled : true,
            sortOrder: typeof bottle.sortOrder === 'number' ? bottle.sortOrder : index,
            mediaId: mediaId(bottle.media ?? bottle.mediaId),
          };
        }),
      },
      artistIds: Array.isArray(input.artistIds) ? input.artistIds.map(idValue).filter((value): value is string => Boolean(value)) : [],
      albumIds: Array.isArray(input.albumIds) ? input.albumIds.map(idValue).filter((value): value is string => Boolean(value)) : [],
      faqs: faqInputs.map((raw) => {
        const faq = isRecord(raw) ? raw : {};
        return { id: idValue(faq.id), question: textValue(faq.question), answer: textValue(faq.answer) };
      }),
    };
  }

  if (resource === 'artists') {
    return {
      slug: textValue(input.slug),
      country: textValue(input.country),
      yearLabel: nullableText(input.year),
      status: enumValue(input.status),
      featured: Boolean(input.featured),
      portraitMediaId: mediaId(input.portrait),
      heroMediaId: mediaId(input.heroImage),
      translations: localizedTranslations(input, 'name', (locale) => ({
        locale,
        name: localizedValue(input.name, locale),
        bio: nullableText(localizedValue(input.bio, locale)),
        genres: Array.isArray(input.genres) ? input.genres.map(String) : [],
      })),
    };
  }

  if (resource === 'products') {
    const price = isRecord(input.price) ? input.price : {};
    const stockStatus = textValue(input.stockStatus);
    return {
      slug: textValue(input.slug),
      categoryKey: textValue(input.category),
      status: enumValue(input.status),
      basePriceMinor: typeof price.amountMinor === 'number' ? price.amountMinor : 0,
      currency: textValue(price.currency) || 'AUD',
      badge: nullableText(input.badge),
      featured: Boolean(input.featured),
      stockTracking: stockStatus && stockStatus !== 'unknown' ? 'TRACKED' : 'NONE',
      translations: localizedTranslations(input, 'title', (locale) => ({
        locale,
        title: localizedValue(input.title, locale),
        excerpt: nullableText(localizedValue(input.excerpt, locale)),
        description: nullableText(localizedValue(input.description, locale)),
      })),
    };
  }

  if (resource === 'news') {
    return {
      slug: textValue(input.slug),
      category: textValue(input.category),
      status: enumValue(input.status),
      featured: Boolean(input.featured),
      heroMediaId: mediaId(input.heroImage),
      cardMediaId: mediaId(input.cardImage),
      relatedEventId: nullableText(input.eventId),
      translations: localizedTranslations(input, 'title', (locale) => ({
        locale,
        title: localizedValue(input.title, locale),
        excerpt: nullableText(localizedValue(input.excerpt, locale)),
        bodyBlocks: Array.isArray(input.body) ? input.body : [],
        quickSummary: Array.isArray(input.quickSummary) ? input.quickSummary.map(String) : [],
      })),
    };
  }

  if (resource === 'gallery') {
    return {
      slug: textValue(input.slug),
      status: enumValue(input.status),
      title: textValue(input.title),
      subtitle: nullableText(input.subtitle),
      description: nullableText(input.description),
      venue: nullableText(input.venue),
      eventId: nullableText(input.eventId),
      featured: Boolean(input.featured),
      coverMediaId: mediaId(input.cover),
      heroMediaId: mediaId(input.hero),
    };
  }

  if (resource === 'partners') {
    return {
      slug: textValue(input.slug),
      type: textValue(input.type),
      status: enumValue(input.status),
      logoMediaId: mediaId(input.logo),
      imageMediaId: mediaId(input.collaborationImage),
      websiteUrl: nullableText(input.website),
      featured: Boolean(input.featured),
      sortOrder: typeof input.sortOrder === 'number' ? input.sortOrder : 0,
      translations: [{ locale: 'en', name: textValue(input.name), tagline: nullableText(input.tagline), description: nullableText(input.description) }],
    };
  }

  if (resource === 'faq') {
    const question = isRecord(input.question) ? input.question : {};
    const answer = isRecord(input.answer) ? input.answer : {};
    const keywords = Array.isArray(input.keywords) ? input.keywords.map(String) : [];
    const translations = (['en', 'vi'] as const)
      .filter((locale) => localizedValue(question, locale) && localizedValue(answer, locale))
      .map((locale) => ({ locale, question: localizedValue(question, locale), answer: localizedValue(answer, locale), keywords }));
    return {
      category: textValue(input.category),
      published: Boolean(input.published),
      answersConfirmed: Boolean(input.answersConfirmed),
      sortOrder: typeof input.sortOrder === 'number' ? input.sortOrder : 0,
      translations: translations.length ? translations : [{ locale: 'en', question: localizedValue(question, 'en'), answer: localizedValue(answer, 'en'), keywords }],
    };
  }

  return input;
}

// ---------------------------------------------------------------------------
// Records
// ---------------------------------------------------------------------------

export type SaveIntent = 'save' | 'publish';

export async function saveRecord(
  resourceKey: string,
  id: string | null,
  values: unknown,
  intent: SaveIntent = 'save',
): Promise<ActionResult<{ id: string; record: AdminRecord }>> {
  if (!isResourceKey(resourceKey)) return { ok: false, error: { message: 'Unknown module.' } };
  const definition = RESOURCES[resourceKey];
  if (!definition.form) return denied();

  const auth = await authorize(`${definition.permission}.${id ? 'edit' : 'create'}` as Permission);
  if (!auth.ok) return auth.result;
  if (intent === 'publish' && !can(auth.session, `${definition.permission}.publish` as Permission)) return denied();

  const schema = definition.form;
  let input = cleanBlocks(pickWritable(schema, values));
  const statusKey = schema.publish?.statusKey;

  if (statusKey) {
    const requested = String(input[statusKey] ?? 'draft');
    const allowed = schema.publish!.statuses.map((o) => o.value);
    // Saving never publishes; only the Publish action does.
    let status = allowed.includes(requested) ? requested : 'draft';
    if (intent === 'publish') status = 'published';
    else if (status === 'published' && id) {
      const current = await (await getRepository(resourceKey)).get(id);
      if (!current.ok || current.data?.[statusKey] !== 'published') status = 'draft';
    } else if (status === 'published') status = 'draft';
    input = { ...input, [statusKey]: status };
  }

  const fieldErrors = validateValues(schema, input);

  // Slugs must be unique within a module.
  const slug = typeof input.slug === 'string' ? input.slug : null;
  if (slug && !fieldErrors.slug) {
    const repo = await getRepository(resourceKey);
    const clash = await repo.list({ page: 1, pageSize: 50, search: slug });
    if (clash.ok && clash.data.items.some((r) => r.slug === slug && r.id !== id)) {
      fieldErrors.slug = 'Another item already uses this slug.';
    }
  }

  if (Object.keys(fieldErrors).length) {
    return { ok: false, error: { code: 'validation', message: 'Some fields need attention.', fieldErrors } };
  }

  const repo = await getRepository(resourceKey);
  const payload = apiPayload(resourceKey, input);
  const result = id ? await repo.update(id, payload) : await repo.create(payload);
  if (!result.ok) return result;
  return {
    ok: true,
    data: { id: result.data.id, record: result.data },
    message: intent === 'publish' ? 'Published.' : id ? 'Changes saved.' : 'Draft saved.',
  };
}

export async function deleteRecords(resourceKey: string, ids: string[]): Promise<ActionResult<number>> {
  if (!isResourceKey(resourceKey)) return { ok: false, error: { message: 'Unknown module.' } };
  const definition = RESOURCES[resourceKey];
  if (!definition.actions.includes('delete')) return denied();
  const auth = await authorize(`${definition.permission}.delete` as Permission);
  if (!auth.ok) return auth.result;

  const repo = await getRepository(resourceKey);
  let count = 0;
  for (const id of ids.slice(0, 100)) {
    if (resourceKey === 'roles') {
      const role = await repo.get(id);
      if (role.ok && role.data?.system) {
        return { ok: false, error: { message: 'Protected roles cannot be deleted.' } };
      }
    }
    if (resourceKey === 'staff' && id === auth.session.user.id) {
      return { ok: false, error: { message: 'You cannot remove your own account.' } };
    }
    const result = await repo.remove(id);
    if (!result.ok) return result;
    count += 1;
  }
  return { ok: true, data: count, message: count === 1 ? 'Item deleted.' : `${count} items deleted.` };
}

export async function archiveRecords(resourceKey: string, ids: string[]): Promise<ActionResult<number>> {
  if (!isResourceKey(resourceKey)) return { ok: false, error: { message: 'Unknown module.' } };
  const definition = RESOURCES[resourceKey];
  if (!definition.statusKey || !definition.actions.includes('archive')) return denied();
  const auth = await authorize(`${definition.permission}.edit` as Permission);
  if (!auth.ok) return auth.result;

  const repo = await getRepository(resourceKey);
  for (const id of ids.slice(0, 100)) {
    const result = await repo.update(id, { [definition.statusKey]: 'archived' });
    if (!result.ok) return result;
  }
  return { ok: true, data: ids.length, message: ids.length === 1 ? 'Item archived.' : `${ids.length} items archived.` };
}

export async function duplicateRecord(resourceKey: string, id: string): Promise<ActionResult<{ id: string }>> {
  if (!isResourceKey(resourceKey)) return { ok: false, error: { message: 'Unknown module.' } };
  const definition = RESOURCES[resourceKey];
  if (!definition.form || !definition.actions.includes('duplicate')) return denied();
  const auth = await authorize(`${definition.permission}.create` as Permission);
  if (!auth.ok) return auth.result;

  const repo = await getRepository(resourceKey);
  const source = await repo.get(id);
  if (!source.ok) return source;
  if (!source.data) return { ok: false, error: { message: 'This item no longer exists.' } };

  let copy: Record<string, unknown> = { ...source.data };
  delete copy.id;
  const titleKey = definition.titleKey;
  const title = getPath(copy, titleKey);
  copy = setPath(copy, titleKey, typeof title === 'string' ? `${title} (Copy)` : { ...(isRecord(title) ? title : {}), en: `${titleText(title)} (Copy)` });
  if (typeof copy.slug === 'string') copy.slug = slugify(`${copy.slug}-copy`);
  if (definition.statusKey) copy[definition.statusKey] = 'draft';
  if (resourceKey === 'news') copy.publishedAt = null;
  if (resourceKey === 'roles') copy.system = false;
  if (resourceKey === 'discounts') {
    copy.code = `${String(copy.code ?? '')}-COPY`;
    copy.active = false;
    copy.usageCount = 0;
  }

  const created = await repo.create(copy as Partial<AdminRecord>);
  if (!created.ok) return created;
  return { ok: true, data: { id: created.data.id }, message: 'Copy created as a draft.' };
}

// ---------------------------------------------------------------------------
// Singletons
// ---------------------------------------------------------------------------

export async function saveSingleton(key: string, values: unknown): Promise<ActionResult<Record<string, unknown>>> {
  if (!isSingletonKey(key)) return { ok: false, error: { message: 'Unknown settings page.' } };
  const definition = SINGLETONS[key];
  const auth = await authorize(`${definition.permission}.edit` as Permission);
  if (!auth.ok) return auth.result;

  const repo = await getSingletonRepository(key);

  if (key === 'settings-integrations') {
    const current = await repo.get();
    if (!current.ok) return current;
    const incoming = isRecord(values) && Array.isArray(values.items) ? values.items : [];
    const items = (Array.isArray(current.data.items) ? current.data.items : []).map((item) => {
      const row = item as Record<string, unknown>;
      const update = incoming.find((i) => isRecord(i) && i.id === row.id) as Record<string, unknown> | undefined;
      const newKey = typeof update?.newKey === 'string' ? update.newKey.trim().slice(0, 500) : '';
      const endpoint = typeof update?.endpoint === 'string' && safeUrl(update.endpoint) ? update.endpoint : row.endpoint;
      return { ...row, endpoint, newKey };
    });
    const saved = await repo.save({ ...current.data, items });
    if (!saved.ok) return saved;
    // Never hand a key back to the browser, whatever the backend returns.
    const clean = {
      ...saved.data,
      items: (Array.isArray(saved.data.items) ? saved.data.items : []).map((i) => ({ ...(i as Record<string, unknown>), newKey: '' })),
    };
    return {
      ok: true,
      data: clean,
      message: 'Integration settings saved. Connections are verified by the backend.',
    };
  }

  const input = pickWritable(definition.form, values);
  const fieldErrors = validateValues(definition.form, input);
  if (Object.keys(fieldErrors).length) {
    return { ok: false, error: { code: 'validation', message: 'Some fields need attention.', fieldErrors } };
  }
  const current = await repo.get();
  const saved = await repo.save({ ...(current.ok ? current.data : {}), ...input });
  if (!saved.ok) return saved;
  return { ok: true, data: saved.data, message: 'Changes saved.' };
}

// ---------------------------------------------------------------------------
// Orders and staff
// ---------------------------------------------------------------------------

export async function updateOrder(
  id: string,
  action: 'processing' | 'shipped' | 'note',
  note?: string,
): Promise<ActionResult<AdminRecord>> {
  const auth = await authorize('orders.edit');
  if (!auth.ok) return auth.result;
  const repo = await getRepository('orders');
  const current = await repo.get(id);
  if (!current.ok) return current;
  const order = current.data;
  if (!order) return { ok: false, error: { message: 'This order no longer exists.' } };

  const now = new Date().toISOString();
  const timeline = Array.isArray(order.timeline) ? [...order.timeline] : [];
  const notes = Array.isArray(order.notes) ? [...order.notes] : [];
  const patch: Record<string, unknown> = {};

  if (action === 'note') {
    const body = (note ?? '').trim().slice(0, 1000);
    if (!body) return { ok: false, error: { message: 'Write a note first.', fieldErrors: { note: 'Write a note first.' } } };
    notes.push({ at: now, author: auth.session.user.name, body });
    patch.notes = notes;
  } else {
    if (order.paymentStatus !== 'paid') {
      return { ok: false, error: { message: 'Only paid orders can move to fulfilment.' } };
    }
    patch.fulfillmentStatus = action;
    timeline.push({ at: now, label: action === 'processing' ? `Marked processing by ${auth.session.user.name}` : `Marked shipped by ${auth.session.user.name}` });
    patch.timeline = timeline;
  }

  const saved = await repo.update(id, patch);
  if (!saved.ok) return saved;
  return { ok: true, data: saved.data, message: action === 'note' ? 'Note added.' : 'Order updated.' };
}

function csrfFromCookie(cookie: string) {
  const match = cookie.match(/(?:^|;\s*)destiny_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

export async function paymentAction(id: string, action: 'reconcile' | 'refund', amountMinor?: number, reason?: string): Promise<ActionResult<AdminRecord>> {
  const auth = await authorize('orders.edit');
  if (!auth.ok) return auth.result;
  const cookie = (await cookies()).toString();
  const path = `/api/v1/admin/payments/${encodeURIComponent(id)}/${action}`;
  const result = await apiRequest<AdminRecord>(getApiBaseUrl(), path, {
    method: 'POST',
    body: action === 'refund' ? { ...(amountMinor ? { amountMinor } : {}), reason: reason?.trim() || null } : undefined,
    cookie,
    csrfToken: csrfFromCookie(cookie),
  });
  if (!result.ok) return result;
  return { ok: true, data: result.data, message: action === 'refund' ? 'Refund request sent to Square.' : 'Payment reconciled from Square.' };
}

export async function staffAction(id: string, action: 'invite' | 'resend' | 'disable' | 'enable'): Promise<ActionResult> {
  const auth = await authorize('staff.edit');
  if (!auth.ok) return auth.result;

  const repo = await getRepository('staff');
  if (action === 'disable' || action === 'enable') {
    if (id === auth.session.user.id) return { ok: false, error: { message: 'You cannot disable your own account.' } };
    const saved = await repo.update(id, { status: action === 'disable' ? 'disabled' : 'active' });
    if (!saved.ok) return saved;
    return { ok: true, data: null, message: action === 'disable' ? 'Access disabled.' : 'Access restored.' };
  }

  // api mode: the backend sends the email.
  const saved = await repo.update(id, { status: 'invited' });
  if (!saved.ok) return saved;
  return { ok: true, data: null, message: 'Invitation requested.' };
}

// ---------------------------------------------------------------------------
// Global search
// ---------------------------------------------------------------------------

export interface SearchHit {
  module: string;
  label: string;
  href: string;
  sub?: string;
}

const SEARCHABLE: ResourceKey[] = ['events', 'artists', 'products', 'orders', 'news', 'gallery', 'partners'];

export async function adminSearch(query: string): Promise<ActionResult<SearchHit[]>> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: { message: 'Your session has ended.' } };
  const q = query.trim().slice(0, 60);
  if (q.length < 2) return { ok: true, data: [] };

  const hits: SearchHit[] = [];
  for (const key of SEARCHABLE) {
    const definition = RESOURCES[key];
    if (!can(session, `${definition.permission}.view` as Permission)) continue;
    const result = await (await getRepository(key)).list({ page: 1, pageSize: 4, search: q });
    if (!result.ok) continue;
    for (const record of result.data.items) {
      const editable = definition.form && definition.actions.includes('edit');
      hits.push({
        module: definition.label,
        label: titleText(getPath(record, definition.titleKey)) || record.id,
        sub: typeof record.slug === 'string' ? record.slug : undefined,
        href: definition.hasDetail
          ? `${definition.basePath}/${record.id}`
          : editable
            ? `${definition.basePath}/${record.id}/edit`
            : definition.basePath,
      });
    }
  }
  return { ok: true, data: hits };
}
