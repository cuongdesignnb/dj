// Generic admin repositories.
//
//   AdminRepository<T>     — list / get / create / update / remove
//   SingletonRepository<T> — get / save, for settings and page content
//
// Each has a Mock implementation (an in-process store seeded with demo data)
// and an Http implementation (the backend contract under /api/v1/admin).
// Modules only declare their seed data and how records are searched.

import { apiRequest } from '@/lib/api/client';
import { paginate, sortRecords } from './pagination';
import { getPath } from './paths';
import type { AdminRecord, ListParams, Paginated, Result } from './types';

export interface AdminRepository<T extends AdminRecord> {
  list(params: ListParams): Promise<Result<Paginated<T>>>;
  get(id: string): Promise<Result<T | null>>;
  create(input: Partial<T>): Promise<Result<T>>;
  update(id: string, input: Partial<T>): Promise<Result<T>>;
  remove(id: string): Promise<Result<null>>;
}

export interface SingletonRepository<T extends object> {
  get(): Promise<Result<T>>;
  save(input: T): Promise<Result<T>>;
}

export type Matcher<T> = (record: T, value: string) => boolean;

export interface MockOptions<T> {
  /** Paths searched by the free-text box. */
  searchFields: string[];
  /** Custom filter logic; filters without one compare `record[key]` to the value. */
  matchers?: Record<string, Matcher<T>>;
  idPrefix: string;
  defaultSort?: { key: string; direction: 'asc' | 'desc' };
}

// ---------------------------------------------------------------------------
// Mock
// ---------------------------------------------------------------------------

type Store = Map<string, unknown>;
const globalStore = globalThis as typeof globalThis & { __adminMockStore?: Store };
const stores: Store = (globalStore.__adminMockStore ??= new Map());

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function textOf(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(textOf).join(' ');
  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>;
    if ('en' in v || 'vi' in v) return `${v.en ?? ''} ${v.vi ?? ''}`;
    if ('name' in v) return String(v.name ?? '');
  }
  return '';
}

/**
 * Demo data held in server memory. Changes last for the life of the server
 * process only — they are not persisted anywhere.
 */
export class MockAdminRepository<T extends AdminRecord> implements AdminRepository<T> {
  constructor(
    private readonly key: string,
    private readonly seed: () => T[],
    private readonly options: MockOptions<T>,
  ) {}

  private records(): T[] {
    if (!stores.has(this.key)) stores.set(this.key, clone(this.seed()));
    return stores.get(this.key) as T[];
  }

  private write(next: T[]) {
    stores.set(this.key, next);
  }

  async list(params: ListParams): Promise<Result<Paginated<T>>> {
    let items = this.records();
    const needle = params.search?.toLowerCase();
    if (needle) {
      items = items.filter((record) =>
        this.options.searchFields.some((path) => textOf(getPath(record, path)).toLowerCase().includes(needle)),
      );
    }
    for (const [key, value] of Object.entries(params.filters ?? {})) {
      const matcher = this.options.matchers?.[key];
      items = items.filter((record) =>
        matcher ? matcher(record, value) : String(getPath(record, key) ?? '') === value,
      );
    }
    const sort = params.sort ?? this.options.defaultSort?.key;
    const direction = params.sort ? params.direction : this.options.defaultSort?.direction;
    items = sortRecords(items, sort, direction);
    return { ok: true, data: clone(paginate(items, params.page, params.pageSize)) };
  }

  async get(id: string): Promise<Result<T | null>> {
    const found = this.records().find((record) => record.id === id);
    return { ok: true, data: found ? clone(found) : null };
  }

  async create(input: Partial<T>): Promise<Result<T>> {
    const records = this.records();
    let n = records.length + 1;
    let id = `${this.options.idPrefix}_new_${n}`;
    while (records.some((r) => r.id === id)) id = `${this.options.idPrefix}_new_${++n}`;
    const record = { ...clone(input), id, updatedAt: new Date().toISOString() } as T;
    this.write([record, ...records]);
    return { ok: true, data: clone(record) };
  }

  async update(id: string, input: Partial<T>): Promise<Result<T>> {
    const records = this.records();
    const index = records.findIndex((record) => record.id === id);
    if (index === -1) return { ok: false, error: { code: 'not_found', message: 'This item no longer exists.' } };
    const record = { ...records[index], ...clone(input), id, updatedAt: new Date().toISOString() } as T;
    const next = [...records];
    next[index] = record;
    this.write(next);
    return { ok: true, data: clone(record) };
  }

  async remove(id: string): Promise<Result<null>> {
    this.write(this.records().filter((record) => record.id !== id));
    return { ok: true, data: null };
  }
}

export class MockSingletonRepository<T extends object> implements SingletonRepository<T> {
  constructor(
    private readonly key: string,
    private readonly seed: () => T,
  ) {}

  async get(): Promise<Result<T>> {
    if (!stores.has(this.key)) stores.set(this.key, clone(this.seed()));
    return { ok: true, data: clone(stores.get(this.key) as T) };
  }

  async save(input: T): Promise<Result<T>> {
    const record = { ...clone(input), updatedAt: new Date().toISOString() };
    stores.set(this.key, record);
    return { ok: true, data: clone(record) };
  }
}

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

function isPaginated(value: unknown): value is Paginated<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as Paginated<unknown>).items) &&
    typeof (value as Paginated<unknown>).total === 'number'
  );
}

/** Backend contract: /api/v1/admin/{resource}[/{id}]. */
export class HttpAdminRepository<T extends AdminRecord> implements AdminRepository<T> {
  constructor(
    private readonly baseUrl: string,
    private readonly resource: string,
    private readonly cookie?: string,
  ) {}

  private path(id?: string) {
    return `/api/v1/admin/${this.resource}${id ? `/${encodeURIComponent(id)}` : ''}`;
  }

  async list(params: ListParams): Promise<Result<Paginated<T>>> {
    const result = await apiRequest<unknown>(this.baseUrl, this.path(), {
      cookie: this.cookie,
      query: {
        page: params.page,
        pageSize: params.pageSize,
        search: params.search,
        sort: params.sort,
        dir: params.sort ? params.direction : undefined,
        ...params.filters,
      },
    });
    if (!result.ok) return result;
    if (!isPaginated(result.data)) {
      return { ok: false, error: { code: 'invalid', message: 'The server returned an unexpected list.' } };
    }
    return { ok: true, data: result.data as Paginated<T> };
  }

  async get(id: string): Promise<Result<T | null>> {
    const result = await apiRequest<T>(this.baseUrl, this.path(id), { cookie: this.cookie });
    if (!result.ok) return result.status === 404 ? { ok: true, data: null } : result;
    return { ok: true, data: result.data };
  }

  async create(input: Partial<T>): Promise<Result<T>> {
    return apiRequest<T>(this.baseUrl, this.path(), { method: 'POST', body: input, cookie: this.cookie });
  }

  async update(id: string, input: Partial<T>): Promise<Result<T>> {
    return apiRequest<T>(this.baseUrl, this.path(id), { method: 'PATCH', body: input, cookie: this.cookie });
  }

  async remove(id: string): Promise<Result<null>> {
    const result = await apiRequest<null>(this.baseUrl, this.path(id), { method: 'DELETE', cookie: this.cookie });
    return result.ok ? { ok: true, data: null } : result;
  }
}

/** Backend contract: /api/v1/admin/{resource} (GET, PUT). */
export class HttpSingletonRepository<T extends object> implements SingletonRepository<T> {
  constructor(
    private readonly baseUrl: string,
    private readonly resource: string,
    private readonly cookie?: string,
  ) {}

  async get(): Promise<Result<T>> {
    return apiRequest<T>(this.baseUrl, `/api/v1/admin/${this.resource}`, { cookie: this.cookie });
  }

  async save(input: T): Promise<Result<T>> {
    return apiRequest<T>(this.baseUrl, `/api/v1/admin/${this.resource}`, {
      method: 'PUT',
      body: input,
      cookie: this.cookie,
    });
  }
}
