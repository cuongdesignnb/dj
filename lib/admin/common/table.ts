// Turns records into ready-to-render table rows on the server. Dates and money
// are formatted here, once, so the client table never re-formats anything and
// server and client HTML always match.

import { formatMoney } from '@/lib/money';
import type { Money } from '@/lib/money';
import { hasPermission } from '@/lib/admin/auth/permissions';
import type { Permission } from '@/lib/admin/auth/permissions';
import { getPath } from './paths';
import type { ResourceDefinition } from './resource';
import type { ColumnConfig } from './schema';
import type { AdminRecord } from './types';

export type Cell =
  | { type: 'title'; text: string; sub?: string; href?: string }
  | { type: 'text'; text: string }
  | { type: 'status'; value: string }
  | { type: 'image'; src: string; alt: string }
  | { type: 'bool'; value: boolean }
  | { type: 'list'; items: string[] };

export interface TableRow {
  id: string;
  label: string;
  cells: Cell[];
  links: { view?: string; edit?: string; preview?: string };
  can: { duplicate: boolean; archive: boolean; delete: boolean };
  archived: boolean;
}

const DATE = new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Perth' });
const DATE_TIME = new Intl.DateTimeFormat('en-AU', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Australia/Perth',
});

export function formatDate(value: unknown, withTime = false): string {
  if (typeof value !== 'string' || !value || Number.isNaN(Date.parse(value))) return '—';
  return (withTime ? DATE_TIME : DATE).format(new Date(value));
}

export function formatRelative(value: string, now = Date.now()): string {
  const diff = Math.max(0, now - Date.parse(value));
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return formatDate(value);
}

export function textOf(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object' && value && 'en' in value) return String((value as { en?: string }).en || '—');
  if (typeof value === 'object' && value && 'amountMinor' in value) return formatMoney(value as Money);
  return '—';
}

function cellFor(column: ColumnConfig, record: AdminRecord, view: Record<string, unknown>, href?: string): Cell {
  const source = { ...record, _view: view };
  const value = getPath(source, column.key);
  switch (column.type) {
    case 'title':
    case 'localized':
      return { type: 'title', text: textOf(value), sub: column.subKey ? textOf(getPath(source, column.subKey)) : undefined, href };
    case 'status':
      return { type: 'status', value: String(value ?? 'unknown') };
    case 'date':
      return { type: 'text', text: formatDate(value) };
    case 'datetime':
      return { type: 'text', text: value ? formatDate(value, true) : 'Never' };
    case 'money':
      return { type: 'text', text: value && typeof value === 'object' ? formatMoney(value as Money) : '—' };
    case 'image': {
      const src = typeof value === 'string' ? value : (value as { src?: string } | null)?.src ?? '';
      const alt = typeof value === 'object' && value ? String((value as { alt?: string }).alt ?? '') : '';
      return { type: 'image', src, alt };
    }
    case 'bool':
      return { type: 'bool', value: value === true };
    case 'count':
      return { type: 'text', text: String(Array.isArray(value) ? value.length : 0) };
    case 'list':
      return { type: 'list', items: Array.isArray(value) ? value.map(String) : [] };
    default:
      return { type: 'text', text: textOf(value) };
  }
}

export function buildRows(definition: ResourceDefinition, records: AdminRecord[], permissions: string[]): TableRow[] {
  const may = (action: string) => hasPermission(permissions, `${definition.permission}.${action}` as Permission);
  return records.map((record) => {
    const view = definition.decorate?.(record) ?? {};
    const links: TableRow['links'] = {};
    if (definition.hasDetail && definition.actions.includes('view')) links.view = `${definition.basePath}/${record.id}`;
    if (definition.form && definition.actions.includes('edit') && may('edit')) links.edit = `${definition.basePath}/${record.id}/edit`;
    if (definition.actions.includes('preview')) {
      const path = definition.key === 'news' ? `/admin/news/${record.id}/preview` : definition.publicPath?.(record) ?? undefined;
      if (path) links.preview = path;
    }
    const primary = links.view ?? links.edit;
    return {
      id: record.id,
      label: textOf(getPath(record, definition.titleKey)),
      cells: definition.columns.map((column) => cellFor(column, record, view, column.type === 'title' ? primary : undefined)),
      links,
      can: {
        duplicate: definition.actions.includes('duplicate') && may('create'),
        archive: definition.actions.includes('archive') && may('edit') && record[definition.statusKey ?? ''] !== 'archived',
        delete: definition.actions.includes('delete') && may('delete'),
      },
      archived: !!definition.statusKey && record[definition.statusKey] === 'archived',
    };
  });
}
