import { getPath } from './paths';
import type { ListParams, Paginated, SortDirection } from './types';

export const PAGE_SIZES = [10, 20, 50];
export const DEFAULT_PAGE_SIZE = 10;

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Reads list state from the URL: ?search=&status=&page=&pageSize=&sort=&dir=
 * Only filter keys the page declares are accepted.
 */
export function parseListParams(params: SearchParams, filterKeys: string[] = []): ListParams {
  const page = Math.max(1, Number.parseInt(first(params.page) ?? '1', 10) || 1);
  const sizeRaw = Number.parseInt(first(params.pageSize) ?? '', 10);
  const pageSize = PAGE_SIZES.includes(sizeRaw) ? sizeRaw : DEFAULT_PAGE_SIZE;
  const search = (first(params.search) ?? '').trim().slice(0, 100);
  const sort = (first(params.sort) ?? '').replace(/[^a-zA-Z0-9_.]/g, '').slice(0, 40);
  const direction: SortDirection = first(params.dir) === 'asc' ? 'asc' : 'desc';

  const filters: Record<string, string> = {};
  for (const key of filterKeys) {
    const value = (first(params[key]) ?? '').trim().slice(0, 60);
    if (value) filters[key] = value;
  }

  return { page, pageSize, search, sort: sort || undefined, direction, filters };
}

function comparable(value: unknown): string | number {
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (value && typeof value === 'object' && 'en' in (value as object)) {
    return String((value as { en?: string }).en ?? '').toLowerCase();
  }
  if (value && typeof value === 'object' && 'amountMinor' in (value as object)) {
    return Number((value as { amountMinor: number }).amountMinor);
  }
  return String(value ?? '').toLowerCase();
}

export function sortRecords<T>(items: T[], sort?: string, direction: SortDirection = 'desc'): T[] {
  if (!sort) return items;
  const factor = direction === 'asc' ? 1 : -1;
  return [...items].sort((a, b) => {
    const x = comparable(getPath(a, sort));
    const y = comparable(getPath(b, sort));
    if (x < y) return -1 * factor;
    if (x > y) return 1 * factor;
    return 0;
  });
}

export function paginate<T>(items: T[], page: number, pageSize: number): Paginated<T> {
  const total = items.length;
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, lastPage);
  const start = (current - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total, page: current, pageSize };
}
