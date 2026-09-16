// Central JSON client for backend calls. Every HTTP adapter goes through
// here, so base URL, timeout, auth forwarding and error shape live in one place.

import type { AdminApiError } from '@/lib/admin/common/types';

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Record<string, string | number | undefined | null>;
  body?: unknown;
  /** Cookie header to forward, so the backend sees the admin session. */
  cookie?: string;
  /** CSRF header for same-origin state-changing requests. */
  csrfToken?: string;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export type ApiResult<T> = { ok: true; data: T; status: number } | { ok: false; error: AdminApiError; status: number };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Turns any error body into the admin error shape. Never exposes stack traces. */
export function normalizeApiError(status: number, body: unknown): AdminApiError {
  const envelope = isRecord(body) && isRecord(body.error) ? body.error : body;
  if (isRecord(envelope)) {
    const message = typeof envelope.message === 'string' && envelope.message.length <= 300 ? envelope.message : null;
    const fieldErrors: Record<string, string> = {};
    if (isRecord(envelope.fieldErrors)) {
      for (const [key, value] of Object.entries(envelope.fieldErrors)) {
        if (typeof value === 'string') fieldErrors[key] = value.slice(0, 200);
      }
    }
    return {
      code: typeof envelope.code === 'string' ? envelope.code : `http_${status}`,
      message: message ?? defaultMessage(status),
      fieldErrors: Object.keys(fieldErrors).length ? fieldErrors : undefined,
    };
  }
  return { code: `http_${status}`, message: defaultMessage(status) };
}

function defaultMessage(status: number): string {
  if (status === 0) return 'The server could not be reached. Please try again.';
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to do that.';
  if (status === 404) return 'The requested item was not found.';
  if (status === 409) return 'This item was changed elsewhere. Reload and try again.';
  if (status === 422) return 'Some fields need attention.';
  return 'Something went wrong. Please try again.';
}

export async function apiRequest<T>(
  baseUrl: string,
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiResult<T>> {
  const rawUrl = `${baseUrl}${path}`;
  const url = new URL(rawUrl, typeof window === 'undefined' ? (process.env.APP_URL ?? 'http://localhost:3000') : window.location.origin);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 15000);
  options.signal?.addEventListener('abort', () => controller.abort());

  try {
    const response = await fetch(url, {
      method: options.method ?? 'GET',
      headers: {
        accept: 'application/json',
        ...(options.body !== undefined ? { 'content-type': 'application/json' } : {}),
        ...(options.cookie ? { cookie: options.cookie } : {}),
        ...(options.csrfToken ? { 'x-csrf-token': options.csrfToken } : {}),
      },
      credentials: 'include',
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: 'no-store',
      signal: controller.signal,
    });
    const body: unknown = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) {
      return { ok: false, status: response.status, error: normalizeApiError(response.status, body) };
    }
    const data = isRecord(body) && 'data' in body ? body.data : body;
    return { ok: true, status: response.status, data: data as T };
  } catch {
    return { ok: false, status: 0, error: normalizeApiError(0, null) };
  } finally {
    clearTimeout(timer);
  }
}
