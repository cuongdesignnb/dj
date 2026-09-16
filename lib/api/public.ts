import { apiRequest } from './client';
import type { ApiRequestOptions, ApiResult } from './client';

/** Public API access is same-origin in the browser and uses APP_URL during SSR. */
export function publicApiBaseUrl(): string {
  const configured = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').trim().replace(/\/$/, '');
  if (configured) return configured;
  if (typeof window !== 'undefined') return '';
  return (process.env.APP_URL ?? 'http://localhost:3000').trim().replace(/\/$/, '');
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
