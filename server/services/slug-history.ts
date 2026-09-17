import 'server-only';

import { db } from '@/server/db/client';

export type PublicSlugEntity = 'event' | 'artist' | 'news' | 'gallery' | 'product';

/**
 * Resolve a historical slug only when the referenced record is still a live
 * public record. Deleted, archived and draft records remain real 404s.
 */
export async function getPublicSlugRedirect(entityType: PublicSlugEntity, oldSlug: string) {
  const normalized = oldSlug.trim().toLowerCase();
  if (!normalized) return null;

  const history = await db.slugHistory.findUnique({
    where: { entityType_oldSlug: { entityType, oldSlug: normalized } },
    select: { entityId: true },
  });
  if (!history) return null;

  const where = { id: history.entityId, status: 'PUBLISHED' as const, ...(entityType === 'event' || entityType === 'artist' || entityType === 'news' || entityType === 'gallery' || entityType === 'product' ? { deletedAt: null } : {}) };
  const row = entityType === 'event'
    ? await db.event.findFirst({ where, select: { slug: true } })
    : entityType === 'artist'
      ? await db.artist.findFirst({ where, select: { slug: true } })
      : entityType === 'news'
        ? await db.newsArticle.findFirst({ where, select: { slug: true } })
        : entityType === 'gallery'
          ? await db.galleryAlbum.findFirst({ where, select: { slug: true } })
          : await db.product.findFirst({ where, select: { slug: true } });

  return row && row.slug !== normalized ? row.slug : null;
}
