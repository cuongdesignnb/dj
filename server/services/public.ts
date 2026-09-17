import 'server-only';
import { db } from '@/server/db/client';

export const LOCALES = ['en', 'vi'] as const;
export type Locale = (typeof LOCALES)[number];

export function localeFrom(value: string | null | undefined): Locale {
  return value === 'vi' ? 'vi' : 'en';
}

function translated(rows: any[], locale: Locale): any {
  return rows.find((row) => row.locale === locale) ?? rows.find((row) => row.locale === 'en') ?? rows[0] ?? null;
}

function mediaDto(media: { publicUrl: string; altText: string; width: number | null; height: number | null } | null | undefined) {
  if (!media) return null;
  return { src: media.publicUrl, alt: media.altText, width: media.width, height: media.height };
}

function eventDto(event: any, locale: Locale) {
  const translation = translated(event.translations, locale);
  return {
    id: event.id,
    slug: event.slug,
    status: event.status,
    lifecycleStatus: event.lifecycleStatus,
    dateStatus: event.dateStatus,
    scheduleStatus: event.scheduleStatus,
    startAt: event.startAt?.toISOString() ?? null,
    endAt: event.endAt?.toISOString() ?? null,
    venue: { name: event.venueName, city: event.city, region: event.region, country: event.country, address: event.address, mapUrl: event.mapUrl },
    featured: event.featured,
    title: translation?.title ?? event.slug,
    eyebrow: translation?.eyebrow ?? null,
    shortDescription: translation?.shortDescription ?? null,
    description: translation?.description ?? null,
    poster: mediaDto(event.posterMedia),
    hero: mediaDto(event.heroMedia),
    seoTitle: event.seoTitle ?? translation?.seoTitle ?? null,
    seoDescription: event.seoDescription ?? translation?.seoDescription ?? null,
    ogMediaId: event.ogMediaId ?? translation?.ogMediaId ?? null,
    canonicalOverride: event.canonicalOverride ?? null,
    indexable: event.indexable !== false,
    followLinks: event.followLinks !== false,
    genres: event.genres.map((item: any) => item.genre),
    lineup: event.eventArtists.map((item: any) => ({ id: item.artist.id, slug: item.artist.slug, name: translated(item.artist.translations, locale)?.name ?? item.artist.slug, country: item.artist.country, portrait: mediaDto(item.artist.portraitMedia), sortOrder: item.sortOrder })),
  };
}

export async function listPublicEvents(locale: Locale, past = false) {
  const events = await db.event.findMany({
    where: { status: 'PUBLISHED', deletedAt: null, ...(past ? { lifecycleStatus: 'COMPLETED' } : { lifecycleStatus: { not: 'COMPLETED' } }) },
    orderBy: [{ featured: 'desc' }, { startAt: 'asc' }, { createdAt: 'desc' }],
    include: {
      translations: true,
      posterMedia: true,
      heroMedia: true,
      genres: { orderBy: { sortOrder: 'asc' } },
      eventArtists: { orderBy: { sortOrder: 'asc' }, include: { artist: { include: { translations: true, portraitMedia: true } } } },
    },
  });
  return events.map((event) => eventDto(event, locale));
}

export async function getPublicEvent(slug: string, locale: Locale) {
  const event = await db.event.findFirst({
    where: { slug, status: 'PUBLISHED', deletedAt: null },
    include: {
      translations: true,
      posterMedia: true,
      heroMedia: true,
      genres: { orderBy: { sortOrder: 'asc' } },
      scheduleItems: { orderBy: { sortOrder: 'asc' } },
      ticketTiers: { where: { enabled: true }, orderBy: { sortOrder: 'asc' } },
      vipPackages: { where: { enabled: true }, orderBy: { sortOrder: 'asc' }, include: { packageBottles: { include: { bottleOption: true } } } },
      vipBooths: { where: { requestable: true }, orderBy: { sortOrder: 'asc' } },
      eventArtists: { orderBy: { sortOrder: 'asc' }, include: { artist: { include: { translations: true, portraitMedia: true } } } },
    },
  });
  return event ? eventDto(event, locale) : null;
}

export async function getPublicTickets(slug: string) {
  const event = await db.event.findFirst({ where: { slug, status: 'PUBLISHED', deletedAt: null }, select: { id: true } });
  if (!event) return null;
  return db.ticketTier.findMany({ where: { eventId: event.id, enabled: true }, orderBy: { sortOrder: 'asc' } });
}

export async function getPublicVip(slug: string) {
  const event = await db.event.findFirst({ where: { slug, status: 'PUBLISHED', deletedAt: null }, select: { id: true, vipBooths: { where: { requestable: true }, orderBy: { sortOrder: 'asc' } } } });
  if (!event) return null;
  const packages = await db.vipPackage.findMany({ where: { eventId: event.id, enabled: true }, orderBy: { sortOrder: 'asc' }, include: { packageBottles: { include: { bottleOption: { include: { media: true } } } } } });
  return { packages, booths: event.vipBooths };
}

function artistDto(artist: any, locale: Locale) {
  const translation = translated(artist.translations, locale);
  return {
    id: artist.id,
    slug: artist.slug,
    name: translation?.name ?? artist.slug,
    country: artist.country,
    year: artist.yearLabel,
    status: artist.status,
    featured: artist.featured,
    portrait: mediaDto(artist.portraitMedia),
    heroImage: mediaDto(artist.heroMedia),
    bio: translation?.bio ?? null,
    genres: Array.isArray(translation?.genresJson) ? translation.genresJson : [],
    seoTitle: artist.seoTitle ?? translation?.seoTitle ?? null,
    seoDescription: artist.seoDescription ?? translation?.seoDescription ?? null,
    ogMediaId: artist.ogMediaId ?? translation?.ogMediaId ?? null,
    canonicalOverride: artist.canonicalOverride ?? null,
    indexable: artist.indexable !== false,
    followLinks: artist.followLinks !== false,
    setTime: artist.setTime?.toISOString() ?? null,
    setTimeStatus: artist.setTimeStatus,
    externalLinks: artist.links.map((link: any) => ({ type: link.type, url: link.url, label: link.label })),
  };
}

export async function listPublicArtists(locale: Locale) {
  const rows = await db.artist.findMany({
    where: { status: 'PUBLISHED', deletedAt: null },
    orderBy: [{ featured: 'desc' }, { createdAt: 'asc' }],
    include: { translations: true, portraitMedia: true, heroMedia: true, links: { orderBy: { sortOrder: 'asc' } } },
  });
  return rows.map((row) => artistDto(row, locale));
}

export async function getPublicArtist(slug: string, locale: Locale) {
  const row = await db.artist.findFirst({ where: { slug, status: 'PUBLISHED', deletedAt: null }, include: { translations: true, portraitMedia: true, heroMedia: true, links: { orderBy: { sortOrder: 'asc' } }, media: { orderBy: { sortOrder: 'asc' }, include: { media: true } }, eventArtists: { include: { event: { include: { translations: true } } }, orderBy: { sortOrder: 'asc' } } } });
  return row ? { ...artistDto(row, locale), media: row.media.map((item: any) => ({ id: item.id, type: item.type, url: item.externalUrl ?? item.media?.publicUrl ?? null, title: item.title, thumbnail: mediaDto(item.media) })), events: row.eventArtists.filter((item: any) => item.event.status === 'PUBLISHED').map((item: any) => ({ id: item.event.id, slug: item.event.slug, title: translated(item.event.translations, locale)?.title ?? item.event.slug })) } : null;
}

function productDto(product: any, locale: Locale) {
  const translation = translated(product.translations, locale);
  const optionGroups = product.optionGroups.map((group: any) => ({ key: group.key, label: group.label, values: group.values.map((value: any) => ({ id: value.id, key: value.valueKey, label: value.label, colorHex: value.colorHex })) }));
  const sizeValues = optionGroups.find((group: any) => group.key.toLowerCase() === 'size')?.values ?? [];
  const colorValues = optionGroups.find((group: any) => group.key.toLowerCase() === 'color' || group.key.toLowerCase() === 'colour')?.values ?? [];
  const status = product.status === 'PUBLISHED' ? 'active' : product.status === 'ARCHIVED' ? 'archived' : 'preview';
  return {
    id: product.id,
    slug: product.slug,
    status,
    title: translation?.title ?? product.slug,
    excerpt: translation?.excerpt ?? null,
    description: translation?.description ?? null,
    category: product.category?.key ?? 'collectibles',
    price: { amountMinor: product.basePriceMinor, currency: product.currency },
    currency: product.currency,
    badge: product.badge,
    featured: product.featured,
    images: product.images.map((item: any, index: number) => ({ id: item.id, label: item.label, sortOrder: item.sortOrder ?? index, image: mediaDto(item.media) })),
    sizes: sizeValues.map((value: any) => ({ id: value.id, label: value.label, available: null })),
    colors: colorValues.map((value: any) => ({ id: value.id, name: value.label, hex: value.colorHex })),
    optionGroups,
    variants: product.variants.filter((variant: any) => variant.enabled).map((variant: any) => {
      const ids = variant.optionValues.map((item: any) => item.optionValueId);
      const size = sizeValues.find((value: any) => ids.includes(value.id));
      const color = colorValues.find((value: any) => ids.includes(value.id));
      return { id: variant.id, sku: variant.sku, price: variant.priceMinor === null ? null : { amountMinor: variant.priceMinor, currency: variant.currency }, stockStatus: variant.stockStatus === 'IN_STOCK' ? 'available' : variant.stockStatus === 'OUT_OF_STOCK' ? 'sold-out' : 'unknown', stockQuantity: variant.stockQuantity, sizeId: size?.id ?? null, colorId: color?.id ?? null, optionValueIds: ids };
    }),
    featureLabels: [],
    detailSections: [],
    collectionHighlights: [],
    sortOrder: product.sortOrder ?? 0,
    seoTitle: product.seoTitle ?? translation?.seoTitle ?? translation?.title ?? null,
    seoDescription: product.seoDescription ?? translation?.seoDescription ?? translation?.excerpt ?? null,
    ogMediaId: product.ogMediaId ?? translation?.ogMediaId ?? null,
    canonicalOverride: product.canonicalOverride ?? null,
    indexable: product.indexable !== false,
    followLinks: product.followLinks !== false,
  };
}

export async function listPublicProducts(locale: Locale) {
  const rows = await db.product.findMany({ where: { status: 'PUBLISHED', deletedAt: null }, orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }], include: { translations: true, category: true, images: { orderBy: { sortOrder: 'asc' }, include: { media: true } }, optionGroups: { orderBy: { sortOrder: 'asc' }, include: { values: { orderBy: { sortOrder: 'asc' } } } }, variants: true } });
  return rows.map((row) => productDto(row, locale));
}

export async function getPublicProduct(slug: string, locale: Locale) {
  const row = await db.product.findFirst({ where: { slug, status: 'PUBLISHED', deletedAt: null }, include: { translations: true, category: true, images: { orderBy: { sortOrder: 'asc' }, include: { media: true } }, optionGroups: { orderBy: { sortOrder: 'asc' }, include: { values: { orderBy: { sortOrder: 'asc' } } } }, variants: { include: { optionValues: true } } } });
  return row ? productDto(row, locale) : null;
}

function articleDto(article: any, locale: Locale) {
  const translation = translated(article.translations, locale);
  return { id: article.id, slug: article.slug, category: article.category, status: article.status.toLowerCase(), featured: article.featured, title: translation?.title ?? article.slug, excerpt: translation?.excerpt ?? '', body: translation?.bodyBlocksJson ?? [], quickSummary: translation?.quickSummaryJson ?? [], readingTimeMinutes: translation?.readingTimeOverride ?? null, heroImage: mediaDto(article.heroMedia), cardImage: mediaDto(article.cardMedia), tags: article.tags.map((item: any) => item.tag.key), relatedEvent: article.relatedEvent ? { id: article.relatedEvent.id, slug: article.relatedEvent.slug, title: translated(article.relatedEvent.translations, locale)?.title ?? article.relatedEvent.slug } : null, publishedAt: article.publishedAt?.toISOString() ?? null, updatedAt: article.updatedAt?.toISOString() ?? null, seoTitle: article.seoTitle ?? translation?.seoTitle ?? null, seoDescription: article.seoDescription ?? translation?.seoDescription ?? null, ogMediaId: article.ogMediaId ?? null, canonicalOverride: article.canonicalOverride ?? null, indexable: article.indexable !== false, followLinks: article.followLinks !== false };
}

export async function listPublicNews(locale: Locale) {
  const rows = await db.newsArticle.findMany({ where: { status: 'PUBLISHED', deletedAt: null }, orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }], include: { translations: true, heroMedia: true, cardMedia: true, tags: { include: { tag: true } }, relatedEvent: { include: { translations: true } } } });
  return rows.map((row) => articleDto(row, locale));
}

export async function getPublicNews(slug: string, locale: Locale) {
  const row = await db.newsArticle.findFirst({ where: { slug, status: 'PUBLISHED', deletedAt: null }, include: { translations: true, heroMedia: true, cardMedia: true, tags: { include: { tag: true } }, relatedEvent: { include: { translations: true } } } });
  return row ? articleDto(row, locale) : null;
}

function galleryDto(album: any, locale: Locale) {
  const translation = translated(album.translations, locale);
  return { id: album.id, slug: album.slug, status: album.status.toLowerCase(), featured: album.featured, title: translation?.title ?? album.slug, subtitle: translation?.subtitle ?? null, description: translation?.description ?? null, venue: album.venue, cover: mediaDto(album.coverMedia), hero: mediaDto(album.heroMedia), event: album.event ? { id: album.event.id, slug: album.event.slug, title: translated(album.event.translations, locale)?.title ?? album.event.slug } : null, media: album.media.map((item: any, index: number) => ({ id: item.id, type: item.mediaType.toLowerCase() === 'video' ? 'video' : 'photo', category: (item.category ?? 'other').toLowerCase(), title: item.title, caption: item.caption, featured: item.featured, sortOrder: item.sortOrder ?? index, video: item.externalVideoUrl ? { provider: item.videoProvider?.toLowerCase() ?? 'mp4', url: item.externalVideoUrl } : null, image: mediaDto(item.media), thumbnail: mediaDto(item.media) })), seoTitle: album.seoTitle ?? translation?.seoTitle ?? null, seoDescription: album.seoDescription ?? translation?.seoDescription ?? null, ogMediaId: album.ogMediaId ?? null, canonicalOverride: album.canonicalOverride ?? null, indexable: album.indexable !== false, followLinks: album.followLinks !== false };
}

export async function listPublicGallery(locale: Locale) {
  const rows = await db.galleryAlbum.findMany({ where: { status: 'PUBLISHED', deletedAt: null }, orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }], include: { translations: true, coverMedia: true, heroMedia: true, media: { orderBy: { sortOrder: 'asc' }, include: { media: true } }, event: { include: { translations: true } } } });
  return rows.map((row) => galleryDto(row, locale));
}

export async function getPublicGallery(slug: string, locale: Locale) {
  const row = await db.galleryAlbum.findFirst({ where: { slug, status: 'PUBLISHED', deletedAt: null }, include: { translations: true, coverMedia: true, heroMedia: true, media: { orderBy: { sortOrder: 'asc' }, include: { media: true } }, event: { include: { translations: true } } } });
  return row ? galleryDto(row, locale) : null;
}

export async function getPublicFaq(locale: Locale) {
  const rows = await db.faqItem.findMany({ where: { published: true }, orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }], include: { translations: true, category: true } });
  return rows.map((row) => { const translation = translated(row.translations, locale); return { id: row.id, category: row.category.key, question: translation?.question ?? '', answer: translation?.answer ?? '', keywords: Array.isArray(translation?.keywordsJson) ? translation.keywordsJson : [], sortOrder: row.sortOrder, published: row.published }; });
}

export async function getPublicLegal(type: string, locale: Locale) {
  const row = await db.legalDocument.findFirst({ where: { type, status: 'PUBLISHED' }, include: { translations: true } });
  if (!row) return null;
  const translation = translated(row.translations, locale);
  return { type: row.type, status: row.status.toLowerCase(), version: row.version, effectiveDate: row.effectiveAt?.toISOString() ?? null, updatedAt: row.updatedAt.toISOString(), title: translation?.title ?? row.type, intro: translation?.intro ?? '', sections: translation?.sectionsJson ?? [], seoTitle: row.seoTitle ?? translation?.seoTitle ?? null, seoDescription: row.seoDescription ?? translation?.seoDescription ?? null, canonicalOverride: row.canonicalOverride ?? null, indexable: row.indexable !== false, followLinks: row.followLinks !== false };
}

export async function getPublicPartners(locale: Locale) {
  const rows = await db.partner.findMany({ where: { status: 'PUBLISHED' }, orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }], include: { translations: true, logoMedia: true, imageMedia: true } });
  return rows.map((row) => ({ id: row.id, slug: row.slug, type: row.type, websiteUrl: row.websiteUrl, featured: row.featured, logo: mediaDto(row.logoMedia), image: mediaDto(row.imageMedia), ...translated(row.translations, locale) }));
}

export async function getPublicBootstrap(locale: Locale) {
  const [settings, partners, pages] = await Promise.all([
    db.siteSetting.findMany({ where: { isPublic: true } }),
    getPublicPartners(locale),
    db.contentPage.findMany({ where: { status: 'PUBLISHED' }, include: { translations: true }, orderBy: { slug: 'asc' } }),
  ]);
  return {
    locale,
    settings: Object.fromEntries(settings.map((setting) => [setting.key, setting.valueJson])),
    partners,
    pages: pages.map((page) => {
      const translation = translated(page.translations, locale);
      return { slug: page.slug, title: translation?.title ?? page.slug, content: translation?.contentJson ?? {}, seoTitle: page.seoTitle ?? translation?.seoTitle ?? null, seoDescription: page.seoDescription ?? translation?.seoDescription ?? null, canonicalOverride: page.canonicalOverride ?? null, indexable: page.indexable, followLinks: page.followLinks };
    }),
  };
}
