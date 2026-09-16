// Admin repositories are deliberately HTTP-only. The browser and server
// screens share this contract, while the API remains the single source of
// truth for authorization, validation, persistence and audit logging.

import { apiRequest } from '@/lib/api/client';
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

function csrfToken(cookie?: string) {
  const match = cookie?.match(/(?:^|;\s*)destiny_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

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
    return apiRequest<T>(this.baseUrl, this.path(), {
      method: 'POST',
      body: input,
      cookie: this.cookie,
      csrfToken: csrfToken(this.cookie),
    });
  }

  async update(id: string, input: Partial<T>): Promise<Result<T>> {
    return apiRequest<T>(this.baseUrl, this.path(id), {
      method: 'PATCH',
      body: input,
      cookie: this.cookie,
      csrfToken: csrfToken(this.cookie),
    });
  }

  async remove(id: string): Promise<Result<null>> {
    const result = await apiRequest<null>(this.baseUrl, this.path(id), {
      method: 'DELETE',
      cookie: this.cookie,
      csrfToken: csrfToken(this.cookie),
    });
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
      csrfToken: csrfToken(this.cookie),
    });
  }
}
