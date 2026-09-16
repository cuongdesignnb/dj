import { CATEGORY_LABELS } from '@/lib/news/helpers';
import type { ArticleContentBlock } from '@/lib/news/types';
import { f, opts, section } from '@/lib/admin/common/fields';
import type { ResourceDefinition } from '@/lib/admin/common/resource';
import { PUBLISH_OPTIONS } from '@/lib/admin/common/schema';
import type { LocalizedString, MediaRef, PublishStatus, SeoFields } from '@/lib/admin/common/types';

export interface AdminArticle {
  id: string;
  title: LocalizedString;
  slug: string;
  excerpt: LocalizedString;
  category: string;
  status: PublishStatus;
  featured: boolean;
  heroImage: MediaRef | null;
  cardImage: MediaRef | null;
  /** Structured blocks — the editor never stores raw HTML. */
  body: ArticleContentBlock[];
  quickSummary: string[];
  tags: string[];
  eventId: string;
  /** Only ever set when the article is actually published. */
  publishedAt: string | null;
  seo: SeoFields;
  updatedAt: string;
  [key: string]: unknown;
}

export const NEWS_CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }));

export const newsDefinition: ResourceDefinition<AdminArticle> = {
  key: 'news',
  label: 'News',
  singular: 'Article',
  description: 'Write and publish news, announcements and stories.',
  group: 'Content',
  basePath: '/admin/news',
  apiPath: 'news',
  permission: 'news',
  titleKey: 'title',
  idPrefix: 'news',
  seed: () => [],
  searchFields: ['title', 'slug', 'excerpt', 'tags'],
  matchers: {
    featured: (r, v) => String(r.featured) === v,
    dated: (r, v) => (v === 'dated' ? !!r.publishedAt : !r.publishedAt),
  },
  defaultSort: { key: 'updatedAt', direction: 'desc' },
  filters: [
    { key: 'category', label: 'Category', options: NEWS_CATEGORY_OPTIONS },
    { key: 'status', label: 'Status', options: PUBLISH_OPTIONS },
    { key: 'featured', label: 'Featured', options: opts(['true', 'Featured'], ['false', 'Not featured']) },
    { key: 'dated', label: 'Date', options: opts(['dated', 'Has publish date'], ['undated', 'No publish date']) },
  ],
  columns: [
    { key: 'title', label: 'Title', type: 'title', subKey: 'slug', sortable: true },
    { key: '_view.category', label: 'Category', type: 'text' },
    { key: 'status', label: 'Status', type: 'status', sortable: true },
    { key: 'featured', label: 'Featured', type: 'bool', hideOnMobile: true },
    { key: '_view.published', label: 'Published', type: 'text', hideOnMobile: true },
    { key: 'updatedAt', label: 'Updated', type: 'date', sortable: true },
  ],
  decorate: (r) => ({
    category: CATEGORY_LABELS[r.category as keyof typeof CATEGORY_LABELS] ?? r.category,
    published: r.publishedAt ? r.publishedAt.slice(0, 10) : 'Not published',
  }),
  actions: ['edit', 'duplicate', 'preview', 'archive', 'delete'],
  hasDetail: false,
  statusKey: 'status',
  publicPath: (r) => (r.status === 'archived' || r.status === 'draft' ? null : `/news/${r.slug}`),
  empty: { title: 'No articles yet.', description: 'Write the first story.' },
  newRecord: () => ({
    title: { en: '' },
    slug: '',
    excerpt: {},
    category: 'announcements',
    status: 'draft',
    featured: false,
    heroImage: null,
    cardImage: null,
    body: [],
    quickSummary: [],
    tags: [],
    eventId: '',
    publishedAt: null,
    seo: { index: true, follow: true },
  }),
  form: {
    titleKey: 'title',
    tabs: ['Article', 'Body', 'Media', 'Summary & Tags'],
    seo: true,
    publish: { statuses: PUBLISH_OPTIONS, statusKey: 'status' },
    sections: [
      section('article', 'Article', [
        f.loc('title', 'Title', { required: true, maxLength: 100 }),
        f.slug('slug', 'title'),
        f.select('category', 'Category', NEWS_CATEGORY_OPTIONS, { required: true }),
        f.locArea('excerpt', 'Excerpt', { required: true, maxLength: 260 }),
        f.toggle('featured', 'Featured story'),
        { key: 'eventId', label: 'Related event', type: 'select', optionSource: 'events', width: 'half' },
      ], { tab: 'Article' }),
      section('body', 'Body', [{ key: 'body', label: 'Content blocks', type: 'blocks' }], {
        tab: 'Body',
        description: 'Paragraphs, headings, images, quotes and lists. Raw HTML is not accepted.',
      }),
      section('media', 'Media', [
        f.media('heroImage', 'Hero image', { required: true }),
        f.media('cardImage', 'Card image', { help: 'Falls back to the hero image.' }),
      ], { tab: 'Media' }),
      section('summary', 'Summary & tags', [
        f.tags('quickSummary', 'Quick summary points'),
        f.tags('tags', 'Tags', { help: 'Stored without the leading #.' }),
      ], { tab: 'Summary & Tags' }),
    ],
  },
};
