// Admin runtime configuration. Server-side only.
//
//   NEXT_PUBLIC_ADMIN_DATA_SOURCE = mock | api   (default mock)
//   NEXT_PUBLIC_API_BASE_URL      = backend origin for api mode
//   NEXT_PUBLIC_ADMIN_MOCK_AUTH   = true enables the demo sign-in
//   NEXT_PUBLIC_ADMIN_ENV_LABEL   = label for the environment badge in api mode
//
// No secret is read here; the backend owns credentials and authorization.

export type AdminDataSource = 'mock' | 'api';

export function getAdminDataSource(): AdminDataSource {
  const raw = (process.env.NEXT_PUBLIC_ADMIN_DATA_SOURCE ?? 'mock').trim().toLowerCase();
  return raw === 'api' || raw === 'http' ? 'api' : 'mock';
}

export function isMockAuthEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ADMIN_MOCK_AUTH === 'true' && getAdminDataSource() === 'mock';
}

export function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').trim().replace(/\/$/, '');
}

export interface EnvironmentBadge {
  label: string;
  tone: 'demo' | 'production' | 'preview' | 'local';
}

/** Says what the data actually is: demo data is never labelled Production. */
export function getEnvironmentBadge(): EnvironmentBadge {
  if (getAdminDataSource() === 'mock') return { label: 'Demo Data', tone: 'demo' };
  const label = (process.env.NEXT_PUBLIC_ADMIN_ENV_LABEL ?? '').trim();
  const vercel = process.env.VERCEL_ENV;
  if (label) {
    const tone = /prod/i.test(label) ? 'production' : /preview|staging/i.test(label) ? 'preview' : 'local';
    return { label, tone };
  }
  if (vercel === 'production') return { label: 'Production', tone: 'production' };
  if (vercel === 'preview') return { label: 'Preview', tone: 'preview' };
  return { label: 'Local', tone: 'local' };
}
