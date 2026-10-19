'use client';

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { DEFAULT_SITE_BRANDING, type SiteBranding } from '@/lib/site-branding';

const BrandingContext = createContext<SiteBranding>(DEFAULT_SITE_BRANDING);

/** Provided once by the root layout from Admin › Settings › Site. */
export function SiteBrandingProvider({ value, children }: { value: SiteBranding; children: ReactNode }) {
  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useSiteBranding(): SiteBranding {
  return useContext(BrandingContext);
}

/**
 * The site logo as chosen in Admin. A plain <img>: logos are often SVG and may
 * come from the media library or object storage, so no image optimisation.
 */
export function SiteLogo({ className = '', alt, priority = false }: { className?: string; alt?: string; priority?: boolean }) {
  const { logo } = useSiteBranding();
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logo.src} alt={alt ?? logo.alt} className={className} data-site-logo="" decoding="async" {...(priority ? { fetchPriority: 'high' as const } : { loading: 'lazy' as const })} />
  );
}
