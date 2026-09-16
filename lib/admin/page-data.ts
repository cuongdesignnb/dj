// Server-side helpers shared by admin pages: session gate, option lists for
// selects, the media picker list, and the paged list loader.

import { notFound } from 'next/navigation';
import type { ClientSession } from '@/components/admin/ui/PermissionGate';
import type { MediaChoice } from '@/components/admin/form/FieldInput';
import type { TableColumn } from '@/components/admin/ui/DataTable';
import { can, requireAdmin } from './auth/session';
import type { AdminSession } from './auth/session';
import type { Permission } from './auth/permissions';
import { parseListParams } from './common/pagination';
import type { ResourceDefinition, ResourceKey } from './common/resource';
import type { Option, OptionSource } from './common/schema';
import { buildRows, formatDate, textOf } from './common/table';
import type { TableRow } from './common/table';
import type { AdminRecord } from './common/types';
import { RESOURCES, getRepository, getResource } from './registry';

export type SearchParams = Record<string, string | string[] | undefined>;

export function toClientSession(session: AdminSession): ClientSession {
  return {
    name: session.user.name,
    email: session.user.email,
    roleName: session.user.roleName,
    userId: session.user.id,
    permissions: session.permissions,
    mock: session.mock,
  };
}

/** Signed-in check plus one permission. Returns `allowed: false` rather than throwing. */
export async function gate(permission: Permission) {
  const session = await requireAdmin();
  return { session, allowed: can(session, permission) };
}

export function resourceOr404(key: string): ResourceDefinition<AdminRecord> {
  const definition = getResource(key);
  if (!definition) notFound();
  return definition;
}

async function allRecords(key: ResourceKey): Promise<AdminRecord[]> {
  const repo = await getRepository(key);
  const result = await repo.list({ page: 1, pageSize: 200 });
  return result.ok ? result.data.items : [];
}

const SOURCE_KEYS: Record<OptionSource, ResourceKey> = {
  artists: 'artists',
  events: 'events',
  gallery: 'gallery',
  products: 'products',
  roles: 'roles',
};

/** Options for selects that point at other records, loaded only when a form uses them. */
export async function loadOptionSets(sources: OptionSource[]): Promise<Record<string, Option[]>> {
  const unique = [...new Set(sources)];
  const entries = await Promise.all(
    unique.map(async (source) => {
      const key = SOURCE_KEYS[source];
      const titleKey = RESOURCES[key].titleKey;
      const records = await allRecords(key);
      return [source, records.map((r) => ({ value: r.id, label: textOf(r[titleKey]) }))] as const;
    }),
  );
  return Object.fromEntries(entries);
}

export async function loadMediaChoices(): Promise<MediaChoice[]> {
  const records = await allRecords('media');
  return records
    .filter((r) => r.kind !== 'document' && typeof r.url === 'string')
    .map((r) => ({ src: String(r.url), label: String(r.name ?? r.url), alt: String(r.alt ?? '') }));
}

export function optionSourcesOf(definition: { form?: { sections: { fields: { optionSource?: OptionSource; itemFields?: { optionSource?: OptionSource }[] }[] }[] } }): OptionSource[] {
  const out: OptionSource[] = [];
  for (const section of definition.form?.sections ?? []) {
    for (const field of section.fields) {
      if (field.optionSource) out.push(field.optionSource);
      for (const sub of field.itemFields ?? []) if (sub.optionSource) out.push(sub.optionSource);
    }
  }
  return out;
}

export interface ListView {
  rows: TableRow[];
  columns: TableColumn[];
  total: number;
  page: number;
  pageSize: number;
  query: Record<string, string>;
  error: string | null;
}

/** Loads one page for a list screen and turns it into table rows. */
export async function loadList(
  definition: ResourceDefinition<AdminRecord>,
  searchParams: SearchParams,
  session: AdminSession,
  extraFilters: Record<string, string> = {},
): Promise<ListView> {
  const filterKeys = definition.filters.map((f) => f.key);
  const params = parseListParams(searchParams, filterKeys);
  params.filters = { ...params.filters, ...extraFilters };
  const repo = await getRepository(definition.key);
  const result = await repo.list(params);

  const query: Record<string, string> = {};
  for (const [key, value] of Object.entries(searchParams)) {
    const v = Array.isArray(value) ? value[0] : value;
    if (v && (['search', 'page', 'pageSize', 'sort', 'dir'].includes(key) || filterKeys.includes(key))) query[key] = v;
  }

  const columns: TableColumn[] = definition.columns.map((c) => ({
    key: c.key,
    label: c.label,
    sortable: c.sortable && !c.key.startsWith('_view'),
    align: c.align,
    hideOnMobile: c.hideOnMobile,
  }));

  if (!result.ok) {
    return { rows: [], columns, total: 0, page: params.page, pageSize: params.pageSize, query, error: result.error.message };
  }
  return {
    rows: buildRows(definition, result.data.items, session.permissions),
    columns,
    total: result.data.total,
    page: result.data.page,
    pageSize: result.data.pageSize,
    query,
    error: null,
  };
}

export function updatedLabel(record: AdminRecord): string {
  return formatDate(record.updatedAt, true);
}

export function isDemo(session: AdminSession): boolean {
  return session.mock;
}

const PUBLIC_BASE: Partial<Record<ResourceKey, string>> = {
  news: '/news/',
  products: '/shop/',
  gallery: '/gallery/',
  artists: '/lineup/',
};

/** Address prefix for the search preview. Uses SITE_URL when set; never guesses a domain. */
export function serpBase(key: ResourceKey): string | undefined {
  const base = PUBLIC_BASE[key];
  if (!base) return undefined;
  const site = (process.env.SITE_URL ?? '').replace(/^https?:\/\//, '').replace(/\/$/, '');
  return `${site}${base}`;
}
