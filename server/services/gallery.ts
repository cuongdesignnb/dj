import 'server-only';
import { Prisma } from '@prisma/client';
import { db } from '@/server/db/client';
import { forbidden, notFound, validationError } from '@/server/errors';
import { writeAuditLog } from '@/server/audit/log';
import { galleryMutationSchema, galleryUpdateMutationSchema, zodFieldErrors } from '@/server/validators/api';

export const galleryAlbumInclude = {
  translations: true,
  coverMedia: true,
  heroMedia: true,
  media: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }], include: { media: true } },
} satisfies Prisma.GalleryAlbumInclude;

function videoProvider(url?: string | null) {
  if (!url) return null;
  const host = new URL(url).hostname.toLowerCase();
  if (host === 'youtu.be' || host === 'youtube.com' || host.endsWith('.youtube.com')) return 'YOUTUBE';
  if (host === 'vimeo.com' || host.endsWith('.vimeo.com')) return 'VIMEO';
  return 'MP4';
}

/** Album, translation, image placements and audit are committed together. */
export async function saveGalleryAlbum(payload: unknown, context: {
  actorUserId: string;
  requestId: string;
  canPublish: boolean;
  action?: 'create' | 'update' | 'publish' | 'archive';
}, id?: string) {
  const parsed = (id ? galleryUpdateMutationSchema : galleryMutationSchema).safeParse(payload);
  if (!parsed.success) throw validationError(zodFieldErrors(parsed.error), 'Some album fields need attention.');
  const input = parsed.data;

  try {
    return await db.$transaction(async (tx) => {
      const before = id ? await tx.galleryAlbum.findUnique({ where: { id }, include: galleryAlbumInclude }) : null;
      if (id && (!before || before.deletedAt)) throw notFound('Album not found.');
      const status = input.status ?? before?.status ?? 'DRAFT';
      if (status === 'PUBLISHED' && before?.status !== 'PUBLISHED' && !context.canPublish) throw forbidden();
      const slug = input.slug ?? before?.slug;
      const translation = before?.translations.find((row) => row.locale === 'en') ?? before?.translations[0];
      const title = input.title ?? translation?.title;
      if (!slug || !title) throw validationError({ title: 'Title and slug are required.' });
      const clash = await tx.galleryAlbum.findUnique({ where: { slug }, select: { id: true } });
      if (clash && clash.id !== id) throw validationError({ slug: 'Another album already uses this slug.' });

      const imageRefs: Array<[string, string | null | undefined]> = [
        ['coverMediaId', input.coverMediaId ?? (status === 'PUBLISHED' ? before?.coverMediaId : undefined)],
        ['heroMediaId', input.heroMediaId === undefined && status === 'PUBLISHED' ? before?.heroMediaId : input.heroMediaId],
        ['ogMediaId', input.ogMediaId === undefined && status === 'PUBLISHED' ? before?.ogMediaId : input.ogMediaId],
      ];
      if (status === 'PUBLISHED' && !imageRefs[0][1]) throw validationError({ coverMediaId: 'Choose a cover image before publishing.' });
      const items = input.items ?? (status === 'PUBLISHED' ? before?.media.map((item) => ({ mediaId: item.mediaId })) : undefined);
      for (const [index, item] of (items ?? []).entries()) imageRefs.push([`items.${index}.mediaId`, item.mediaId]);
      const mediaIds = [...new Set(imageRefs.flatMap(([, mediaId]) => mediaId ? [mediaId] : []))];
      const media = await tx.mediaAsset.findMany({ where: { id: { in: mediaIds }, deletedAt: null }, select: { id: true, mimeType: true } });
      const validMedia = new Set(media.filter((asset) => asset.mimeType.startsWith('image/')).map((asset) => asset.id));
      for (const [field, mediaId] of imageRefs) {
        if (field.startsWith('items.') && !mediaId) throw validationError({ [field]: 'Choose an existing image from the Media Library.' });
        if (mediaId && !validMedia.has(mediaId)) throw validationError({ [field]: 'Choose an existing image from the Media Library.' });
      }
      if (input.eventId) {
        const event = await tx.event.findFirst({ where: { id: input.eventId, deletedAt: null }, select: { id: true } });
        if (!event) throw validationError({ eventId: 'The selected event no longer exists.' });
      }
      const placementIds = input.items?.flatMap((item) => item.id ? [item.id] : []) ?? [];
      if (new Set(placementIds).size !== placementIds.length || placementIds.some((itemId) => !before?.media.some((item) => item.id === itemId))) {
        throw validationError({ items: 'An image placement does not belong to this album.' });
      }

      const data = {
        slug, status, featured: input.featured,
        venue: input.venue, eventId: input.eventId,
        coverMediaId: input.coverMediaId, coverAltText: input.coverAltText,
        heroMediaId: input.heroMediaId, heroAltText: input.heroAltText,
        seoTitle: input.seoTitle, seoDescription: input.seoDescription,
        canonicalOverride: input.canonicalOverride, ogMediaId: input.ogMediaId,
        indexable: input.indexable, followLinks: input.followLinks,
        publishedAt: status === 'PUBLISHED' ? before?.publishedAt ?? new Date() : null,
      };
      const album = before
        ? await tx.galleryAlbum.update({ where: { id }, data })
        : await tx.galleryAlbum.create({ data });
      await tx.galleryTranslation.upsert({
        where: { albumId_locale: { albumId: album.id, locale: 'en' } },
        update: { title, subtitle: input.subtitle, description: input.description },
        create: { albumId: album.id, locale: 'en', title, subtitle: input.subtitle, description: input.description },
      });
      if (input.items !== undefined) {
        await tx.galleryMedia.deleteMany({ where: { albumId: album.id } });
        if (input.items.length) await tx.galleryMedia.createMany({ data: input.items.map((item, index) => ({
          id: item.id, albumId: album.id, mediaId: item.mediaId, mediaType: item.type.toUpperCase(),
          category: item.category, caption: item.caption, altText: item.altText,
          externalVideoUrl: item.type === 'video' ? item.videoUrl : null,
          videoProvider: item.type === 'video' ? videoProvider(item.videoUrl) : null,
          featured: item.featured, sortOrder: item.sortOrder ?? index,
        })) });
      }
      if (before && before.slug !== slug && (before.status === 'PUBLISHED' || before.publishedAt)) {
        await tx.slugHistory.upsert({
          where: { entityType_oldSlug: { entityType: 'gallery', oldSlug: before.slug } },
          update: { entityId: album.id },
          create: { entityType: 'gallery', entityId: album.id, oldSlug: before.slug },
        });
      }
      const after = await tx.galleryAlbum.findUniqueOrThrow({ where: { id: album.id }, include: galleryAlbumInclude });
      await writeAuditLog({ actorUserId: context.actorUserId, action: context.action ?? (before ? 'update' : 'create'), entityType: 'gallery', entityId: album.id, before: before ?? undefined, after, requestId: context.requestId }, tx);
      return { album: after, previousSlug: before?.slug };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw validationError({ slug: 'Another album already uses this slug.' });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      throw validationError({ items: 'A selected image or event is no longer available. Choose it again.' });
    }
    throw error;
  }
}
