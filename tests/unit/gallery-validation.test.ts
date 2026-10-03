import { describe, expect, it } from 'vitest';
import { galleryMutationSchema, galleryUpdateMutationSchema } from '@/server/validators/api';

const mediaId = '51b891f9-b621-41e0-9c85-0bced27309ca';
const album = { title: 'DESTINY', slug: 'destiny-photos', coverMediaId: mediaId };

describe('Gallery mutation contract', () => {
  it('keeps optional album fields and the media list optional', () => {
    expect(galleryMutationSchema.safeParse(album).success).toBe(true);
    expect(galleryMutationSchema.safeParse({ ...album, items: [] }).success).toBe(true);
  });
  it.each(['title', 'slug', 'coverMediaId'] as const)('requires %s for create', (key) => {
    expect(galleryMutationSchema.safeParse({ ...album, [key]: undefined }).success).toBe(false);
  });
  it('retains captions, placement alt including intentional empty alt, and array order', () => {
    const items = [
      { mediaId, altText: 'Crowd on the dancefloor', caption: 'Opening', category: 'crowd', sortOrder: 1 },
      { mediaId, altText: '', caption: 'Closing', featured: true, sortOrder: 0 },
    ];
    const result = galleryMutationSchema.parse({ ...album, items });
    expect(result.items?.map((item) => [item.altText, item.caption, item.sortOrder])).toEqual(items.map((item) => [item.altText, item.caption, item.sortOrder]));
  });
  it.each(['bad slug', 'UPPER', 'double--hyphen', '../album'])('rejects invalid slug %s', (slug) => {
    expect(galleryMutationSchema.safeParse({ ...album, slug }).success).toBe(false);
  });
  it('rejects malformed media references and unsupported video URLs', () => {
    expect(galleryMutationSchema.safeParse({ ...album, items: [{ mediaId: 'not-a-uuid' }] }).success).toBe(false);
    expect(galleryMutationSchema.safeParse({ ...album, items: [{ mediaId, type: 'video', videoUrl: 'javascript:alert(1)' }] }).success).toBe(false);
  });
  it('allows a status-only update without clearing omitted fields or media', () => {
    expect(galleryUpdateMutationSchema.parse({ status: 'PUBLISHED' })).toEqual({ status: 'PUBLISHED' });
  });
  it('rejects unrecognized fields rather than silently dropping them', () => {
    expect(galleryMutationSchema.safeParse({ ...album, unsupported: true }).success).toBe(false);
  });
});
