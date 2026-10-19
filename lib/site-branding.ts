/** Brand assets the whole public site shows; edited in Admin › Settings › Site. */
export interface SiteBranding {
  name: string;
  logo: { src: string; alt: string };
  favicon: string | null;
}

export const DEFAULT_SITE_BRANDING: SiteBranding = {
  name: 'Connection Rave',
  logo: { src: '/assets/logo-connection.svg', alt: 'Connection — Sound Meets Soul' },
  favicon: null,
};

/** Site paths and https URLs only; anything else falls back to the bundled asset. */
function safeSrc(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const src = value.trim();
  return /^\/(?!\/)/.test(src) || /^https:\/\//i.test(src) ? src : null;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

/** Accepts the stored media setting ({ src, alt, mediaId }) or a bare URL. */
export function normaliseBranding(input: { logo: unknown; favicon: unknown; name: unknown }): SiteBranding {
  const logo = record(input.logo);
  const logoSrc = safeSrc(logo.src ?? input.logo);
  const favicon = record(input.favicon);
  const name = typeof input.name === 'string' && input.name.trim() ? input.name.trim() : DEFAULT_SITE_BRANDING.name;
  return {
    name,
    logo: logoSrc
      ? { src: logoSrc, alt: typeof logo.alt === 'string' && logo.alt.trim() ? logo.alt.trim() : name }
      : DEFAULT_SITE_BRANDING.logo,
    favicon: safeSrc(favicon.src ?? input.favicon),
  };
}
