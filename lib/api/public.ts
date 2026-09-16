import { apiRequest } from './client';
import type { ApiRequestOptions, ApiResult } from './client';

/**
 * Public API access is same-origin in the browser. During SSR, prefer the
 * container-local API origin so Docker does not try to reach the published
 * host port from inside the app container.
 */
export function publicApiBaseUrl(): string {
  const configured = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').trim().replace(/\/$/, '');
  if (configured) return configured;
  if (typeof window !== 'undefined') return '';
  return (process.env.INTERNAL_API_BASE_URL ?? process.env.APP_URL ?? 'http://localhost:3000')
    .trim()
    .replace(/\/$/, '');
}

export async function publicApi<T>(
  path: string,
  options: Omit<ApiRequestOptions, 'cookie'> = {},
): Promise<ApiResult<T>> {
  return apiRequest<T>(publicApiBaseUrl(), `/api/v1${path}`, options);
}

export function unwrapApiData<T>(value: unknown): T {
  if (value && typeof value === 'object' && 'data' in value) {
    return (value as { data: T }).data;
  }
  return value as T;
}
