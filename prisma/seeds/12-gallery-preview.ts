import type { SeedContext } from './context';

export async function seedGalleryPreview({ db, preview }: SeedContext, eventId: string) {
  await db.galleryAlbum.updateMany({ where: { slug: 'destiny-preview' }, data: { status: 'PREVIEW', publishedAt: null, indexable: false, followLinks: true } });
  if (!preview) {
    await db.galleryAlbum.updateMany({ where: { slug: 'destiny' }, data: { status: 'PREVIEW', publishedAt: null, indexable: false, followLinks: true } });
    return;
  }
  const hero = await db.mediaAsset.findUnique({ where: { storageKey: 'assets/hero-crowd.jpg' } });
  const album = await db.galleryAlbum.upsert({
    where: { slug: 'destiny' },
    update: { status: 'PREVIEW', featured: true, coverMediaId: hero?.id ?? undefined, heroMediaId: hero?.id ?? undefined, eventId, venue: 'Metro City, Perth', publishedAt: null, indexable: false, followLinks: true },
    create: { slug: 'destiny', status: 'PREVIEW', featured: true, coverMediaId: hero?.id, heroMediaId: hero?.id, eventId, venue: 'Metro City, Perth', publishedAt: null, indexable: false, followLinks: true },
  });
  for (const locale of ['en', 'vi'] as const) {
    await db.galleryTranslation.upsert({
      where: { albumId_locale: { albumId: album.id, locale } },
      update: { title: 'DESTINY', subtitle: 'Gallery Preview', description: 'Visual preview only — not historical event photography.' },
      create: { albumId: album.id, locale, title: 'DESTINY', subtitle: 'Gallery Preview', description: 'Visual preview only — not historical event photography.' },
    });
  }
  if (hero) {
    const existing = await db.galleryMedia.findFirst({ where: { albumId: album.id, mediaId: hero.id } });
    if (!existing) await db.galleryMedia.create({ data: { albumId: album.id, mediaId: hero.id, mediaType: 'PHOTO', category: 'preview', featured: true, sortOrder: 0, title: 'Connection atmosphere preview' } });
  }
}
