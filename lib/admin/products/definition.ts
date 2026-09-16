import { CATEGORY_LABELS } from '@/lib/shop/helpers';
import { f, opts, section } from '@/lib/admin/common/fields';
import type { ResourceDefinition } from '@/lib/admin/common/resource';
import { PUBLISH_OPTIONS } from '@/lib/admin/common/schema';
import type { LocalizedString, MediaRef, PublishStatus, SeoFields } from '@/lib/admin/common/types';
import type { Money } from '@/lib/money';

export interface AdminProduct {
  id: string;
  title: LocalizedString;
  slug: string;
  category: string;
  status: PublishStatus;
  badge: string;
  price: Money | null;
  excerpt: LocalizedString;
  description: LocalizedString;
  featured: boolean;
  images: { label: string; image: MediaRef | null; sortOrder: number }[];
  sizes: string[];
  colors: string[];
  variants: { sku: string; size: string; color: string; priceOverride: Money | null; stockStatus: string; stockQuantity: number | null }[];
  stockStatus: 'unknown' | 'available' | 'sold-out';
  details: { title: string; body: string }[];
  highlights: { title: string; description: string }[];
  seo: SeoFields;
  updatedAt: string;
  [key: string]: unknown;
}

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }));
const STOCK_OPTIONS = opts(['unknown', 'Unknown'], ['available', 'Available'], ['sold-out', 'Sold out']);

export const productsDefinition: ResourceDefinition<AdminProduct> = {
  key: 'products',
  label: 'Products',
  singular: 'Product',
  description: 'Manage merchandise products, variants and stock status.',
  group: 'Merchandise',
  basePath: '/admin/products',
  apiPath: 'products',
  permission: 'products',
  titleKey: 'title',
  idPrefix: 'prod',
  seed: () => [],
  searchFields: ['title', 'slug', 'category'],
  matchers: { featured: (r, v) => String(r.featured) === v },
  defaultSort: { key: 'title', direction: 'asc' },
  filters: [
    { key: 'category', label: 'Category', options: CATEGORY_OPTIONS },
    { key: 'status', label: 'Status', options: PUBLISH_OPTIONS },
    { key: 'featured', label: 'Featured', options: opts(['true', 'Featured'], ['false', 'Not featured']) },
    { key: 'stockStatus', label: 'Stock', options: STOCK_OPTIONS },
  ],
  columns: [
    { key: 'title', label: 'Product', type: 'title', subKey: 'slug', sortable: true },
    { key: '_view.category', label: 'Category', type: 'text' },
    { key: 'price', label: 'Price', type: 'money', sortable: true, align: 'right' },
    { key: 'status', label: 'Status', type: 'status', sortable: true },
    { key: 'variants', label: 'Variants', type: 'count', align: 'center', hideOnMobile: true },
    { key: 'stockStatus', label: 'Stock', type: 'status', hideOnMobile: true },
    { key: 'featured', label: 'Featured', type: 'bool', hideOnMobile: true },
    { key: 'updatedAt', label: 'Updated', type: 'date', sortable: true },
  ],
  decorate: (r) => ({ category: CATEGORY_LABELS[r.category as keyof typeof CATEGORY_LABELS] ?? r.category }),
  actions: ['view', 'edit', 'duplicate', 'preview', 'archive', 'delete'],
  hasDetail: true,
  statusKey: 'status',
  publicPath: (r) => (r.status === 'archived' ? null : `/shop/${r.slug}`),
  empty: { title: 'No merchandise products yet.', description: 'Add a product to start the catalogue.' },
  newRecord: () => ({
    title: { en: '' },
    slug: '',
    category: 'apparel',
    status: 'draft',
    badge: '',
    price: { amountMinor: 0, currency: 'AUD' },
    excerpt: {},
    description: {},
    featured: false,
    images: [],
    sizes: [],
    colors: [],
    variants: [],
    stockStatus: 'unknown',
    details: [],
    highlights: [],
    seo: { index: true, follow: true },
  }),
  form: {
    titleKey: 'title',
    tabs: ['Product', 'Media', 'Variants', 'Inventory', 'Details'],
    seo: true,
    publish: { statuses: PUBLISH_OPTIONS, statusKey: 'status' },
    sections: [
      section('product', 'Product', [
        f.loc('title', 'Title', { required: true, maxLength: 80 }),
        f.slug('slug', 'title'),
        f.select('category', 'Category', CATEGORY_OPTIONS, { required: true }),
        f.money('price', 'Price (AUD)', { required: true }),
        f.text('badge', 'Badge', { width: 'half', maxLength: 30 }),
        f.toggle('featured', 'Featured product'),
        f.locArea('excerpt', 'Excerpt', { maxLength: 240 }),
        f.locArea('description', 'Description'),
      ], { tab: 'Product' }),
      section('media', 'Media', [
        f.repeater('images', 'Images', [
          f.media('image', 'Image', { required: true }),
          f.select('label', 'Label', opts(['Front', 'Front'], ['Back', 'Back'], ['Detail', 'Detail'], ['Lifestyle', 'Lifestyle'])),
          f.number('sortOrder', 'Sort order', { min: 0 }),
        ], { itemLabelKey: 'label', itemNoun: 'Image' }),
      ], { tab: 'Media', description: 'The first image by sort order is the card image.' }),
      section('variants', 'Variants', [
        f.tags('sizes', 'Sizes', { help: 'e.g. S, M, L, XL' }),
        f.tags('colors', 'Colours'),
        f.repeater('variants', 'Variant matrix', [
          f.text('size', 'Size', { width: 'third' }),
          f.text('color', 'Colour', { width: 'third' }),
          f.text('sku', 'SKU', { width: 'third' }),
          f.money('priceOverride', 'Price override'),
        ], { itemLabelKey: 'size', itemNoun: 'Variant' }),
      ], { tab: 'Variants' }),
      section('inventory', 'Inventory', [
        f.select('stockStatus', 'Stock status', STOCK_OPTIONS, { help: 'Leave Unknown until an inventory source reports stock.' }),
        f.repeater('variants', 'Per-variant stock', [
          f.readonly('size', 'Size'),
          f.select('stockStatus', 'Stock status', STOCK_OPTIONS),
          f.number('stockQuantity', 'Quantity (optional)', { min: 0 }),
        ], { itemLabelKey: 'size', itemNoun: 'Variant' }),
      ], { tab: 'Inventory' }),
      section('details', 'Product details', [
        f.repeater('details', 'Detail sections', [
          f.text('title', 'Title', { required: true, width: 'half' }),
          f.textarea('body', 'Body', { required: true }),
        ], { itemLabelKey: 'title', itemNoun: 'Section' }),
        f.repeater('highlights', 'Collection story', [
          f.text('title', 'Title', { required: true, width: 'half' }),
          f.textarea('description', 'Description', { required: true }),
        ], { itemLabelKey: 'title', itemNoun: 'Highlight' }),
      ], { tab: 'Details' }),
    ],
  },
};
