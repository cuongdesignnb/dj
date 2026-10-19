import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import { normaliseSponsors, sponsorToFooterPartner } from '@/lib/sponsors';
import { SPONSORS, SPONSOR_EXTRA_MEDIA } from '@/prisma/seeds/16-sponsors';

describe('normaliseSponsors', () => {
  it('keeps partners with a usable logo, in order, with role and safe links', () => {
    const sponsors = normaliseSponsors([
      { id: 'a', slug: 'mcq', name: 'MCQ', tagline: 'Powered by', websiteUrl: 'https://mcq.example', logo: { src: '/assets/logo-mcq.svg', alt: '', width: 300, height: 100 } },
      { id: 'b', slug: 'no-logo', name: 'No logo', logo: null },
      { id: 'c', slug: 'bad-src', name: 'Bad', logo: { src: 'javascript:alert(1)' } },
      { id: 'd', slug: 'proto', name: 'Proto', logo: { src: '//evil.example/x.svg' } },
      { id: 'e', slug: 'vina9', name: 'VINA9', tagline: '  ', websiteUrl: 'http://insecure.example', logo: { src: '/api/v1/media/123', alt: 'VINA9 logo' } },
    ]);
    expect(sponsors.map((s) => s.slug)).toEqual(['mcq', 'vina9']);
    expect(sponsors[0]).toMatchObject({ role: 'Powered by', href: 'https://mcq.example', logo: { alt: 'MCQ', width: 300, height: 100 } });
    expect(sponsors[1]).toMatchObject({ role: null, href: null, logo: { src: '/api/v1/media/123', alt: 'VINA9 logo', width: null, height: null } });
  });

  it('returns an empty list for anything that is not an array', () => {
    expect(normaliseSponsors(null)).toEqual([]);
    expect(normaliseSponsors({ data: [] })).toEqual([]);
  });

  it('maps to the footer shape with default dimensions', () => {
    const [sponsor] = normaliseSponsors([{ id: 'a', slug: 'mcq', name: 'MCQ', logo: { src: '/assets/logo-mcq.svg' } }]);
    expect(sponsorToFooterPartner(sponsor)).toEqual({ id: 'a', name: 'MCQ', logo: { src: '/assets/logo-mcq.svg', alt: 'MCQ', width: 240, height: 80 } });
  });
});

describe('sponsor seed assets', () => {
  it('ships every redrawn logo as a self-contained SVG in public/', () => {
    // The MCQ logo predates this set and still uses live <text>.
    const keys = [...SPONSORS.filter((s) => s.slug !== 'mcq').map((s) => s.logo.storageKey), ...SPONSOR_EXTRA_MEDIA.map((m) => m.storageKey)];
    expect(keys).toHaveLength(8);
    expect(new Set(SPONSORS.map((s) => s.slug)).size).toBe(SPONSORS.length);
    for (const key of keys) {
      const svg = fs.readFileSync(path.join(process.cwd(), 'public', key), 'utf8');
      expect(svg, key).toMatch(/^<svg [^>]*viewBox="/);
      // Text is outlined: no webfont dependency, no external references or scripts.
      expect(svg, key).not.toMatch(/<text|font-family|<script|href="http|xlink:href="http/);
    }
  });
});
