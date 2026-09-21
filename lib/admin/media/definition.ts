import { f, opts, section } from '@/lib/admin/common/fields';
import type { ResourceDefinition } from '@/lib/admin/common/resource';

// The library indexes both shipped assets and files uploaded through the
// configured local/S3 storage backend.

export type MediaKind = 'image' | 'video-thumbnail' | 'logo' | 'document';

export interface AdminMedia {
  id: string;
  name: string;
  url: string;
  kind: MediaKind;
  alt: string;
  mimeType: string;
  usedBy: string[];
  updatedAt: string;
  [key: string]: unknown;
}

export const USED_BY_OPTIONS = opts(
  ['events', 'Events'],
  ['artists', 'Artists'],
  ['products', 'Products'],
  ['news', 'News'],
  ['gallery', 'Gallery'],
  ['partners', 'Partners'],
  ['unused', 'Not used'],
);

export const mediaDefinition: ResourceDefinition<AdminMedia> = {
  key: 'media',
  label: 'Media Library',
  singular: 'Media item',
  description: 'Images, logos and documents used across the site.',
  group: 'Content',
  basePath: '/admin/media',
  apiPath: 'media',
  permission: 'media',
  titleKey: 'name',
  idPrefix: 'media',
  seed: () => [],
  searchFields: ['name', 'alt', 'url'],
  matchers: {
    usedBy: (r, v) => (v === 'unused' ? r.usedBy.length === 0 : r.usedBy.includes(v)),
  },
  defaultSort: { key: 'name', direction: 'asc' },
  filters: [
    { key: 'kind', label: 'Type', options: opts(['image', 'Image'], ['video-thumbnail', 'Video thumbnail'], ['logo', 'Logo'], ['document', 'Document']) },
    { key: 'usedBy', label: 'Used by', options: USED_BY_OPTIONS },
  ],
  columns: [
    { key: 'url', label: 'Preview', type: 'image' },
    { key: 'name', label: 'File', type: 'title', subKey: 'url', sortable: true },
    { key: 'kind', label: 'Type', type: 'status' },
    { key: 'alt', label: 'Alt text', type: 'text', hideOnMobile: true },
    { key: 'usedBy', label: 'Used by', type: 'list', hideOnMobile: true },
  ],
  actions: ['delete'],
  hasDetail: false,
  empty: { title: 'No media yet.', description: 'Uploaded files will appear here.' },
  form: {
    titleKey: 'name',
    seo: false,
    publish: null,
    sections: [
      section('file', 'File', [
        f.text('name', 'File name', { required: true, maxLength: 120 }),
        f.textarea('alt', 'Alt text', { help: 'Describe what the image shows for people using screen readers.', maxLength: 200 }),
        f.readonly('url', 'URL', { width: 'full' }),
        f.readonly('mimeType', 'Type'),
      ]),
    ],
  },
};
