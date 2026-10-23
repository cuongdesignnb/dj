import { describe, expect, it } from 'vitest';
import { DEFAULT_SITE_BRANDING, normaliseBranding } from '@/lib/site-branding';
import { organizationSchema } from '@/lib/seo/structured-data';

describe('site branding from Admin › Settings › Site', () => {
  it('uses the stored logo, alt text, favicon and name', () => {
    expect(normaliseBranding({
      logo: { src: '/assets/new-logo.svg', alt: 'Connection Rave', mediaId: 'm1' },
      favicon: { src: 'https://cdn.example.com/icon.png', alt: '' },
      name: 'Connection Rave',
    })).toEqual({ name: 'Connection Rave', logo: { src: '/assets/new-logo.svg', alt: 'Connection Rave' }, favicon: 'https://cdn.example.com/icon.png', theme: 'connection' });
  });

  it('falls back to the bundled brand when nothing usable is stored', () => {
    expect(normaliseBranding({ logo: null, favicon: null, name: null })).toEqual(DEFAULT_SITE_BRANDING);
    expect(normaliseBranding({ logo: { src: '' }, favicon: { src: '' }, name: '  ' })).toEqual(DEFAULT_SITE_BRANDING);
  });

  it('never accepts unsafe or protocol-relative sources', () => {
    for (const src of ['javascript:alert(1)', '//evil.example/logo.svg', 'http://insecure.example/logo.svg', 'data:image/svg+xml,<svg/>']) {
      const branding = normaliseBranding({ logo: { src }, favicon: { src }, name: 'X' });
      expect(branding.logo.src).toBe(DEFAULT_SITE_BRANDING.logo.src);
      expect(branding.favicon).toBeNull();
    }
  });

  it('uses the name as alt text when the logo has none, and feeds the Organization schema', () => {
    expect(normaliseBranding({ logo: { src: '/assets/a.svg', alt: '' }, favicon: null, name: 'Connection' }).logo.alt).toBe('Connection');
    expect(organizationSchema('/assets/a.svg').logo).toMatch(/\/assets\/a\.svg$/);
    expect(organizationSchema('https://cdn.example.com/a.svg').logo).toBe('https://cdn.example.com/a.svg');
  });

  it('accepts only the listed site themes', () => {
    expect(normaliseBranding({ logo: null, favicon: null, name: null, theme: 'highland' }).theme).toBe('highland');
    for (const theme of [undefined, null, '', 'HIGHLAND', 'neon', { value: 'highland' }]) {
      expect(normaliseBranding({ logo: null, favicon: null, name: null, theme }).theme).toBe('connection');
    }
  });
});
