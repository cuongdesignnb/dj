// Admin runtime configuration. The backend owns credentials and
// authorization; this module only resolves the API origin and environment UI.

export function getApiBaseUrl(): string {
  const configured = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').trim().replace(/\/$/, '');
  if (configured) return configured;
  return (process.env.INTERNAL_API_BASE_URL ?? process.env.APP_URL ?? '').trim().replace(/\/$/, '');
}

export interface EnvironmentBadge {
  label: string;
  tone: 'production' | 'preview' | 'local';
}

/** Describes the deployment environment shown in the admin shell. */
export function getEnvironmentBadge(): EnvironmentBadge {
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
