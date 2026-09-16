'use server';

// Admin Server Functions. Every one re-checks the session and permission —
// they are reachable by direct POST, so the UI hiding a button is not enough.
// In api mode the backend enforces the same rules again.

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DEMO_CREDENTIALS, SESSION_COOKIE, can, getAdminSession } from '@/lib/admin/auth/session';
import type { Permission } from '@/lib/admin/auth/permissions';
import { getAdminDataSource, isMockAuthEnabled } from '@/lib/admin/common/config';
import { getPath, setPath, slugify } from '@/lib/admin/common/paths';
import type { FormSchema } from '@/lib/admin/common/schema';
import type { ResourceKey, SingletonKey } from '@/lib/admin/common/resource';
import type { AdminApiError, AdminRecord } from '@/lib/admin/common/types';
import { validateValues } from '@/lib/admin/common/validation';
import { RESOURCES, SINGLETONS, getRepository, getSingletonRepository } from '@/lib/admin/registry';

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

  if (!isMockAuthEnabled()) {
    // Real sign-in belongs to the backend's auth endpoint, which sets its own
    // session cookie. Nothing is checked in this app.
    return { error: 'Sign-in is not available: no authentication service is configured.' };
  }

  if (email !== DEMO_CREDENTIALS.email || password !== DEMO_CREDENTIALS.password) {
    return { error: 'Those credentials are not recognised.' };
  }

  const jar = await cookies();
  jar.set(SESSION_COOKIE, `mock:${DEMO_CREDENTIALS.staffId}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: formData.get('remember') ? 60 * 60 * 24 * 7 : undefined,
  });
  redirect('/admin');
}

export async function signOut(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
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

  // News keeps a real publication time only once it is actually published.
  if (resourceKey === 'news' && statusKey) {
    if (input[statusKey] === 'published') {
      const current = id ? await (await getRepository('news')).get(id) : null;
      const existing = current && current.ok ? current.data?.publishedAt : null;
      input.publishedAt = existing ?? new Date().toISOString();
    } else {
      input.publishedAt = null;
    }
  }

  const repo = await getRepository(resourceKey);
  const result = id ? await repo.update(id, input) : await repo.create({ ...definition.newRecord?.(), ...input });
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
    const mock = getAdminDataSource() === 'mock';
    const incoming = isRecord(values) && Array.isArray(values.items) ? values.items : [];
    let discarded = false;
    const items = (Array.isArray(current.data.items) ? current.data.items : []).map((item) => {
      const row = item as Record<string, unknown>;
      const update = incoming.find((i) => isRecord(i) && i.id === row.id) as Record<string, unknown> | undefined;
      const newKey = typeof update?.newKey === 'string' ? update.newKey.trim().slice(0, 500) : '';
      const endpoint = typeof update?.endpoint === 'string' && safeUrl(update.endpoint) ? update.endpoint : row.endpoint;
      if (mock) {
        // Demo mode has nowhere safe to keep a secret: the key is dropped and
        // the integration's state does not change.
        if (newKey) discarded = true;
        return { ...row, endpoint, newKey: '' };
      }
      // api mode: the backend stores the key encrypted and decides the state.
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
      message: discarded
        ? 'Demo mode: the key was not stored. Connect the backend to save credentials.'
        : 'Integration settings saved. Connections are verified by the backend.',
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

export async function staffAction(id: string, action: 'invite' | 'resend' | 'disable' | 'enable'): Promise<ActionResult> {
  const auth = await authorize('staff.edit');
  if (!auth.ok) return auth.result;

  if (action === 'invite' || action === 'resend') {
    if (getAdminDataSource() === 'mock') {
      return {
        ok: false,
        error: { code: 'unavailable', message: 'Invitations need the email service. Nothing was sent.' },
      };
    }
  }

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
