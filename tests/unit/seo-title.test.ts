import { describe, expect, it } from 'vitest';
import { DEFAULT_TITLE, brandTitle, siteTitle } from '@/lib/seo/config';
import { buildMetadata } from '@/lib/seo/metadata';

describe('page titles name the site exactly once', () => {
  it.each([
    ['DESTINY Tickets | Connection Rave', 'DESTINY Tickets | Connection Rave'],
    ['Events | Connection Rave', 'Events | Connection Rave'],
    ['About Connection Rave | Sound Meets Soul', 'About Connection Rave | Sound Meets Soul'],
    ['DESTINY | Connection Rave — Perth', 'DESTINY | Connection Rave — Perth'],
    ['HI-LAND PERTH', 'HI-LAND PERTH | Connection Rave'],
    ['  Ticket Verification  ', 'Ticket Verification | Connection Rave'],
    ['connection rave lineup', 'connection rave lineup'],
    ['', DEFAULT_TITLE],
    [null, DEFAULT_TITLE],
  ])('%s → %s', (raw, expected) => {
    expect(brandTitle(raw)).toBe(expected);
  });

  it('bypasses the root template so it cannot be appended again', () => {
    expect(siteTitle('Secure Checkout')).toEqual({ absolute: 'Secure Checkout | Connection Rave' });
    const metadata = buildMetadata({ title: 'Gallery | Connection Rave', path: '/gallery' });
    expect(metadata.title).toEqual({ absolute: 'Gallery | Connection Rave' });
    expect(metadata.openGraph?.title).toBe('Gallery | Connection Rave');
    expect((metadata.twitter as { title?: string }).title).toBe('Gallery | Connection Rave');
    expect(buildMetadata({ title: 'HI-LAND PERTH', path: '/events/hi-land-perth' }).title).toEqual({ absolute: 'HI-LAND PERTH | Connection Rave' });
  });
});
