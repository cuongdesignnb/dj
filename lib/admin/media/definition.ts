import { DEMO_UPDATED, f, opts, section } from '@/lib/admin/common/fields';
import type { ResourceDefinition } from '@/lib/admin/common/resource';

// The library indexes files that already ship with the site. Uploading needs
// a storage backend; until then the upload control says it is unavailable.

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

function item(file: string, kind: MediaKind, alt: string, usedBy: string[]): AdminMedia {
  const url = file;
  const name = file.split('/').pop() ?? file;
  return {
    id: `media_${name.replace(/\.[a-z]+$/, '').replace(/[^a-z0-9]+/gi, '_')}`,
    name,
    url,
    kind,
    alt,
    mimeType: name.endsWith('.svg') ? 'image/svg+xml' : 'image/jpeg',
    usedBy,
    updatedAt: DEMO_UPDATED,
  };
}

const ARTIST_FILES: [string, string][] = [
  ['ryal', 'RYAL'],
  ['nicole-chen', 'NICOLE CHEN'],
  ['kickcheeze', 'KICKCHEEZE'],
  ['bi-hi', 'BI HI'],
  ['rysal', 'RYSAL'],
  ['maya', 'MAYA'],
  ['mico', 'MICO'],
  ['ems', 'EMS'],
];

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
  seed: () => [
    item('/assets/hero-crowd.jpg', 'image', 'Crowd with raised hands under red lasers', ['events', 'news', 'gallery']),
    item('/assets/event-poster.jpg', 'image', 'DESTINY poster: Music Meets Soul', ['events', 'gallery', 'news']),
    item('/assets/vip-booth.jpg', 'image', 'VIP booth with bottle service', ['events', 'gallery']),
    item('/assets/bar-list.jpg', 'image', 'Bar menu board', ['gallery']),
    item('/assets/club-map.jpg', 'image', 'Neon floor-plan style club map', []),
    ...ARTIST_FILES.map(([slug, name]) => item(`/assets/artist-${slug}.jpg`, 'image', `${name} portrait`, ['artists', 'gallery'])),
    item('/assets/logo-connection.svg', 'logo', 'Connection logo', []),
    item('/assets/destiny-wordmark.svg', 'logo', 'DESTINY wordmark', []),
    item('/assets/logo-mcq.svg', 'logo', 'MCQ logo', ['partners']),
    item('/assets/logo-bihi.svg', 'logo', 'BIHI Entertainment logo', ['partners']),
    item('/merch/tee-front.svg', 'image', 'DESTINY Oversized Tee, front (mock-up)', ['products']),
    item('/merch/tee-back.svg', 'image', 'DESTINY Oversized Tee, back (mock-up)', ['products']),
    item('/merch/tee-artwork.svg', 'image', 'DESTINY artwork detail (mock-up)', ['products']),
    item('/merch/tee-sleeve.svg', 'image', 'Tee fabric detail (mock-up)', ['products']),
    item('/merch/hoodie-front.svg', 'image', 'Connection Hoodie, front (mock-up)', ['products']),
    item('/merch/hoodie-back.svg', 'image', 'Connection Hoodie, back (mock-up)', ['products']),
    item('/merch/cap.svg', 'image', 'Sound Meets Soul Cap (mock-up)', ['products']),
    item('/merch/tote.svg', 'image', 'Connection Tote (mock-up)', ['products']),
    item('/merch/poster.svg', 'image', 'Metro City Poster (mock-up)', ['products']),
    item('/merch/sticker-pack.svg', 'image', 'Rave Sticker Pack (mock-up)', ['products']),
  ],
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
