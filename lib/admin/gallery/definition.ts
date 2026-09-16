import { f, opts, section } from '@/lib/admin/common/fields';
import type { ResourceDefinition } from '@/lib/admin/common/resource';
import { PUBLISH_OPTIONS } from '@/lib/admin/common/schema';
import type { MediaRef, PublishStatus, SeoFields } from '@/lib/admin/common/types';

export interface AdminAlbumItem {
  type: 'photo' | 'video';
  category: string;
  image: MediaRef | null;
  /** Link to the video file or provider page — never embed code. */
  videoUrl: string;
  caption: string;
  featured: boolean;
  sortOrder: number;
}

export interface AdminAlbum {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  status: PublishStatus;
  cover: MediaRef | null;
  hero: MediaRef | null;
  venue: string;
  eventId: string;
  featured: boolean;
  items: AdminAlbumItem[];
  seo: SeoFields;
  updatedAt: string;
  [key: string]: unknown;
}

const CATEGORIES = opts(['crowd', 'Crowd'], ['artists', 'Artists'], ['venue', 'Venue'], ['production', 'Production'], ['video', 'Video'], ['other', 'Other']);

export const galleryDefinition: ResourceDefinition<AdminAlbum> = {
  key: 'gallery',
  label: 'Gallery Albums',
  singular: 'Album',
  description: 'Organise photo and video albums.',
  group: 'Content',
  basePath: '/admin/gallery',
  apiPath: 'gallery',
  permission: 'gallery',
  titleKey: 'title',
  idPrefix: 'album',
  seed: () => [],
  searchFields: ['title', 'slug', 'subtitle'],
  matchers: {
    featured: (r, v) => String(r.featured) === v,
    eventId: (r, v) => r.eventId === v,
  },
  defaultSort: { key: 'updatedAt', direction: 'desc' },
  filters: [
    { key: 'status', label: 'Status', options: PUBLISH_OPTIONS },
    { key: 'featured', label: 'Featured', options: opts(['true', 'Featured'], ['false', 'Not featured']) },
    { key: 'eventId', label: 'Related event', options: opts(['evt_destiny', 'DESTINY']) },
  ],
  columns: [
    { key: 'cover', label: 'Cover', type: 'image' },
    { key: 'title', label: 'Title', type: 'title', subKey: 'slug', sortable: true },
    { key: 'status', label: 'Status', type: 'status', sortable: true },
    { key: 'items', label: 'Media', type: 'count', align: 'center' },
    { key: 'featured', label: 'Featured', type: 'bool', hideOnMobile: true },
    { key: '_view.event', label: 'Related Event', type: 'text', hideOnMobile: true },
    { key: 'updatedAt', label: 'Updated', type: 'date', sortable: true },
  ],
  decorate: (r) => ({ event: r.eventId === 'evt_destiny' ? 'DESTINY' : r.eventId ? r.eventId : '—' }),
  actions: ['edit', 'duplicate', 'preview', 'archive', 'delete'],
  hasDetail: false,
  statusKey: 'status',
  publicPath: (r) => (r.status === 'archived' || r.status === 'draft' ? null : `/gallery/${r.slug}`),
  empty: { title: 'No albums yet.', description: 'Create an album to group photos and videos.' },
  newRecord: () => ({
    title: '',
    slug: '',
    subtitle: '',
    description: '',
    status: 'draft',
    cover: null,
    hero: null,
    venue: '',
    eventId: '',
    featured: false,
    items: [],
    seo: { index: true, follow: true },
  }),
  form: {
    titleKey: 'title',
    tabs: ['Album', 'Media'],
    seo: true,
    publish: { statuses: PUBLISH_OPTIONS, statusKey: 'status' },
    sections: [
      section('album', 'Album', [
        f.text('title', 'Title', { required: true, width: 'half', maxLength: 80 }),
        f.slug('slug', 'title'),
        f.text('subtitle', 'Subtitle', { width: 'half' }),
        f.text('venue', 'Venue', { width: 'half' }),
        f.textarea('description', 'Description'),
        f.media('cover', 'Cover image', { required: true }),
        f.media('hero', 'Hero image'),
        { key: 'eventId', label: 'Related event', type: 'select', optionSource: 'events', width: 'half' },
        f.toggle('featured', 'Featured album'),
      ], { tab: 'Album' }),
      section('items', 'Photos & videos', [
        f.repeater('items', 'Media items', [
          f.select('type', 'Type', opts(['photo', 'Photo'], ['video', 'Video'])),
          f.select('category', 'Category', CATEGORIES),
          f.media('image', 'Image / thumbnail', { required: true }),
          f.url('videoUrl', 'Video URL', { width: 'half', showWhen: { key: 'type', in: ['video'] }, help: 'A link, not embed code.' }),
          f.text('caption', 'Caption', { width: 'half' }),
          f.toggle('featured', 'Featured'),
        ], { itemLabelKey: 'caption', itemNoun: 'Item' }),
      ], { tab: 'Media', description: 'Use the arrows to reorder. The order here is the order on the site.' }),
    ],
  },
};
