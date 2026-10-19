'use client';

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { Sponsor } from '@/lib/sponsors';

const SponsorsContext = createContext<Sponsor[]>([]);

/** Provided once by the root layout from Admin › Partners (published, with a logo). */
export function SponsorsProvider({ value, children }: { value: Sponsor[]; children: ReactNode }) {
  return <SponsorsContext.Provider value={value}>{children}</SponsorsContext.Provider>;
}

export function useSponsors(): Sponsor[] {
  return useContext(SponsorsContext);
}

/**
 * A partner logo. A plain <img>: logos are often SVG and may come from the
 * media library (/api/v1/media/…), which the image optimiser would reject.
 */
export function PartnerLogo({ logo, name, className = '', eager = false }: { logo: { src: string; alt?: string | null; width?: number | null; height?: number | null }; name?: string; className?: string; eager?: boolean }) {
  if (!logo.src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo.src}
      alt={logo.alt || name || ''}
      width={logo.width ?? undefined}
      height={logo.height ?? undefined}
      className={className}
      data-partner-logo=""
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
    />
  );
}
