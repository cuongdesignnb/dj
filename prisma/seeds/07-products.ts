import type { SeedContext } from './context';

const PREVIEW_PRODUCTS = [
  ['destiny-oversized-tee', 'DESTINY Oversized Tee', 'apparel', 6500, 'merch/cutout-tee.svg'],
  ['connection-hoodie', 'Connection Hoodie', 'apparel', 11000, 'merch/cutout-hoodie.svg'],
  ['metro-city-poster', 'Metro City Poster', 'posters', 2500, 'merch/cutout-poster.svg'],
  ['sound-meets-soul-cap', 'Sound Meets Soul Cap', 'accessories', 4000, 'merch/cap.svg'],
  ['connection-tote', 'Connection Tote', 'accessories', 3000, 'merch/tote.svg'],
  ['rave-sticker-pack', 'Rave Sticker Pack', 'accessories', 1200, 'merch/sticker-pack.svg'],
] as const;

const LEGACY_PREVIEW_SLUGS: string[] = [...PREVIEW_PRODUCTS.map(([slug]) => slug), 'destiny-poster'];

export async function seedProducts({ db, preview }: SeedContext) {
  const slugs = LEGACY_PREVIEW_SLUGS;
  await db.product.updateMany({ where: { slug: { in: slugs } }, data: { status: 'PREVIEW', publishedAt: null, indexable: false, followLinks: true } });
  if (!preview) {
    return;
  }

  const categories = new Map<string, string>();
  for (const [key, label] of [['apparel', 'Apparel'], ['accessories', 'Accessories'], ['posters', 'Posters']] as const) {
    const row = await db.productCategory.upsert({ where: { key }, update: { label }, create: { key, label } });
    categories.set(key, row.id);
  }

  for (const [slug, title, category, priceMinor, imageKey] of PREVIEW_PRODUCTS) {
    const media = await db.mediaAsset.findUnique({ where: { storageKey: imageKey } });
    const product = await db.product.upsert({
      where: { slug },
      update: { categoryId: categories.get(category), status: 'PREVIEW', basePriceMinor: priceMinor, currency: 'AUD', featured: slug === 'destiny-oversized-tee', publishedAt: null, indexable: false, followLinks: true, ogMediaId: media?.id ?? undefined },
      create: { slug, categoryId: categories.get(category), status: 'PREVIEW', basePriceMinor: priceMinor, currency: 'AUD', featured: slug === 'destiny-oversized-tee', publishedAt: null, indexable: false, followLinks: true, ogMediaId: media?.id },
    });
    for (const locale of ['en', 'vi'] as const) {
      await db.productTranslation.upsert({
        where: { productId_locale: { productId: product.id, locale } },
        update: { title, excerpt: locale === 'en' ? 'Preview concept — product details to be confirmed.' : 'Bản xem trước — thông tin sản phẩm sẽ được xác nhận.', description: locale === 'en' ? 'This merchandise concept is shown for preview only and is not currently available to purchase.' : 'Mẫu merchandise này chỉ để xem trước và hiện chưa mở bán.' },
        create: { productId: product.id, locale, title, excerpt: locale === 'en' ? 'Preview concept — product details to be confirmed.' : 'Bản xem trước — thông tin sản phẩm sẽ được xác nhận.', description: locale === 'en' ? 'This merchandise concept is shown for preview only and is not currently available to purchase.' : 'Mẫu merchandise này chỉ để xem trước và hiện chưa mở bán.' },
      });
    }
    if (media) {
      const existing = await db.productImage.findFirst({ where: { productId: product.id, mediaId: media.id } });
      if (!existing) await db.productImage.create({ data: { productId: product.id, mediaId: media.id, label: 'Preview concept', sortOrder: 0 } });
    }
  }
}
