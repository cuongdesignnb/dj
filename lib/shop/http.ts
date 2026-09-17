import type {
  MediaAsset,
  Product,
  ProductCategory,
  ProductColor,
  ProductDetailSection,
  ProductHighlight,
  ProductImage,
  ProductOptionValue,
  ProductStatus,
  ProductVariant,
  ShopIcon,
  StockStatus,
} from './types';
import type { Money } from '@/lib/money';

// Normalizes product payloads from an API.
//
// A record that is missing what the UI cannot do without — slug, title,
// category, a valid price — is dropped, never patched with local content. Stock
// fields pass through only as the API states them; absent means unknown.

const CATEGORIES: ProductCategory[] = ['apparel', 'accessories', 'posters', 'collectibles'];
const STATUSES: ProductStatus[] = ['preview', 'active', 'sold-out', 'archived'];
const STOCK: StockStatus[] = ['unknown', 'available', 'sold-out'];
const ICONS: ShopIcon[] = [
  'gem',
  'box',
  'music',
  'globe',
  'shirt',
  'star',
  'heart',
  'users',
  'file',
  'droplet',
  'sparkles',
  'card',
  'timer',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function nullableStr(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function icon(value: unknown): ShopIcon | null {
  return ICONS.find((i) => i === value) ?? null;
}

export function normalizeMoney(value: unknown): Money | null {
  if (!isRecord(value)) return null;
  const amount = value.amountMinor;
  const currency = str(value.currency).toUpperCase();
  if (typeof amount !== 'number' || !Number.isInteger(amount) || amount < 0) return null;
  if (!/^[A-Z]{3}$/.test(currency)) return null;
  return { amountMinor: amount, currency };
}

function media(value: unknown): MediaAsset | null {
  if (!isRecord(value)) return null;
  const src = str(value.src);
  if (!src) return null;
  return {
    src,
    alt: str(value.alt),
    width: typeof value.width === 'number' ? value.width : undefined,
    height: typeof value.height === 'number' ? value.height : undefined,
  };
}

function images(value: unknown): ProductImage[] {
  return list(value).flatMap((raw, index) => {
    if (!isRecord(raw)) return [];
    const image = media(raw.image);
    if (!image) return [];
    return [
      {
        id: str(raw.id, `image-${index}`),
        image,
        label: nullableStr(raw.label),
        sortOrder: typeof raw.sortOrder === 'number' ? raw.sortOrder : index,
      },
    ];
  });
}

function options(value: unknown): ProductOptionValue[] {
  return list(value).flatMap((raw) => {
    if (!isRecord(raw)) return [];
    const id = str(raw.id);
    const label = str(raw.label);
    if (!id || !label) return [];
    return [{ id, label, available: typeof raw.available === 'boolean' ? raw.available : null }];
  });
}

function colors(value: unknown): ProductColor[] {
  return list(value).flatMap((raw) => {
    if (!isRecord(raw)) return [];
    const id = str(raw.id);
    const name = str(raw.name);
    if (!id || !name) return [];
    const hex = str(raw.hex);
    return [{ id, name, hex: /^#[0-9a-f]{3,8}$/i.test(hex) ? hex : null }];
  });
}

function variants(value: unknown): ProductVariant[] {
  return list(value).flatMap((raw) => {
    if (!isRecord(raw)) return [];
    const id = str(raw.id);
    if (!id) return [];
    const quantity = raw.stockQuantity;
    return [
      {
        id,
        sizeId: nullableStr(raw.sizeId),
        colorId: nullableStr(raw.colorId),
        price: normalizeMoney(raw.price),
        stockStatus: STOCK.find((s) => s === raw.stockStatus) ?? 'unknown',
        stockQuantity:
          typeof quantity === 'number' && Number.isInteger(quantity) && quantity >= 0
            ? quantity
            : null,
      },
    ];
  });
}

function sections(value: unknown): ProductDetailSection[] {
  return list(value).flatMap((raw) => {
    if (!isRecord(raw)) return [];
    const title = str(raw.title);
    const body = str(raw.body);
    return title && body ? [{ title, body, icon: icon(raw.icon) }] : [];
  });
}

function highlights(value: unknown): ProductHighlight[] {
  return list(value).flatMap((raw) => {
    if (!isRecord(raw)) return [];
    const title = str(raw.title);
    const description = str(raw.description);
    return title && description ? [{ title, description, icon: icon(raw.icon) }] : [];
  });
}

export function normalizeProduct(raw: unknown, index = 0): Product | null {
  if (!isRecord(raw)) return null;

  const slug = str(raw.slug).trim().toLowerCase();
  const title = str(raw.title).trim();
  const category = CATEGORIES.find((c) => c === raw.category);
  const price = normalizeMoney(raw.price);
  if (!slug || !title || !category || !price) return null;

  const sizes = options(raw.sizes);
  const defaultSizeId = nullableStr(raw.defaultSizeId);

  return {
    id: str(raw.id, slug),
    slug,
    title,
    category,
    status: STATUSES.find((s) => s === raw.status) ?? 'preview',
    price,
    badge: nullableStr(raw.badge),
    excerpt: str(raw.excerpt),
    description: nullableStr(raw.description),
    images: images(raw.images),
    sizes,
    colors: colors(raw.colors),
    variants: variants(raw.variants),
    defaultSizeId: defaultSizeId && sizes.some((s) => s.id === defaultSizeId) ? defaultSizeId : null,
    featureLabels: list(raw.featureLabels).filter((v): v is string => typeof v === 'string'),
    detailSections: sections(raw.detailSections),
    collectionHighlights: highlights(raw.collectionHighlights),
    featured: raw.featured === true,
    sortOrder: typeof raw.sortOrder === 'number' ? raw.sortOrder : index,
    seoTitle: nullableStr(raw.seoTitle),
    seoDescription: nullableStr(raw.seoDescription),
    canonicalOverride: nullableStr(raw.canonicalOverride),
    indexable: raw.indexable !== false,
    followLinks: raw.followLinks !== false,
  };
}

/** Accepts either a bare array or `{ products: [...] }`. */
export function normalizeProducts(raw: unknown): Product[] {
  const items = isRecord(raw) && Array.isArray(raw.products) ? raw.products : list(raw);
  return items.flatMap((item, index) => {
    const product = normalizeProduct(item, index);
    return product ? [product] : [];
  });
}
