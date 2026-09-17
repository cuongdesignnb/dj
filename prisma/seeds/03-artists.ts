import { Prisma } from '@prisma/client';
import type { SeedContext } from './context';
import { ARTISTS } from './context';

export async function seedArtists({ db }: SeedContext, eventId: string) {
  const result = new Map<string, { id: string }>();
  for (const [sortOrder, [slug, name, country, portraitFile]] of ARTISTS.entries()) {
    const portrait = await db.mediaAsset.findUnique({ where: { storageKey: `assets/${portraitFile}` } });
    const artist = await db.artist.upsert({
      where: { slug },
      update: {
        country,
        yearLabel: null,
        portraitMediaId: portrait?.id ?? undefined,
        setTimeStatus: 'TBA',
        setTime: null,
        indexable: false,
        followLinks: true,
      },
      create: {
        slug,
        country,
        status: 'PUBLISHED',
        featured: true,
        portraitMediaId: portrait?.id,
        setTimeStatus: 'TBA',
        setTime: null,
        indexable: false,
        followLinks: true,
        seoTitle: `${name} | DESTINY Artist — Connection Rave`,
        seoDescription: `${name} is part of the DESTINY artist lineup by Connection Rave.`,
        ogMediaId: portrait?.id,
      },
    });
    result.set(slug, artist);
    for (const locale of ['en', 'vi'] as const) {
      await db.artistTranslation.upsert({
        where: { artistId_locale: { artistId: artist.id, locale } },
        update: { name, bio: null, genresJson: Prisma.DbNull },
        create: { artistId: artist.id, locale, name, bio: null, genresJson: Prisma.DbNull },
      });
    }
    const relation = await db.eventArtist.findUnique({ where: { eventId_artistId: { eventId, artistId: artist.id } } });
    if (relation) {
      await db.eventArtist.update({ where: { eventId_artistId: { eventId, artistId: artist.id } }, data: { sortOrder } });
    } else {
      await db.eventArtist.create({ data: { eventId, artistId: artist.id, sortOrder } });
    }
  }
  return result;
}
