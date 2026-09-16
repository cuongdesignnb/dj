import { PARTNERS_MOCK } from '@/lib/partners/mock';
import { DEMO_UPDATED, f, opts, section } from '@/lib/admin/common/fields';
import type { ResourceDefinition } from '@/lib/admin/common/resource';
import { PUBLISH_OPTIONS } from '@/lib/admin/common/schema';
import type { MediaRef, PublishStatus } from '@/lib/admin/common/types';

export interface AdminPartner {
  id: string;
  name: string;
  slug: string;
  type: string;
  logo: MediaRef | null;
  description: string;
  tagline: string;
  website: string;
  featured: boolean;
  status: PublishStatus;
  sortOrder: number;
  collaborationImage: MediaRef | null;
  ctaUrl: string;
  updatedAt: string;
  [key: string]: unknown;
}

export const PARTNER_TYPES = opts(
  ['sponsor', 'Sponsor'],
  ['event-partner', 'Event Partner'],
  ['media-partner', 'Media Partner'],
  ['community-partner', 'Community Partner'],
  ['venue', 'Venue'],
  ['other', 'Other'],
);

export const partnersDefinition: ResourceDefinition<AdminPartner> = {
  key: 'partners',
  label: 'Sponsors / Partners',
  singular: 'Partner',
  description: 'Manage sponsors and partner information.',
  group: 'Partners',
  basePath: '/admin/partners',
  apiPath: 'partners',
  permission: 'partners',
  titleKey: 'name',
  idPrefix: 'partner',
  // Only the two partners the public site already names.
  seed: () =>
    PARTNERS_MOCK.featuredPartners.map((p, index) => ({
      id: `partner_${p.id}`,
      name: p.name,
      slug: p.id,
      type: 'event-partner',
      logo: { src: p.logo.src, alt: p.logo.alt, mediaId: null },
      description: p.description,
      tagline: p.tagline ?? '',
      website: p.href ?? '',
      featured: !!p.featured,
      status: 'published',
      sortOrder: index + 1,
      collaborationImage: p.image ? { src: p.image.src, alt: p.image.alt, mediaId: null } : null,
      ctaUrl: '',
      updatedAt: DEMO_UPDATED,
    })),
  searchFields: ['name', 'slug', 'tagline'],
  matchers: { featured: (r, v) => String(r.featured) === v },
  defaultSort: { key: 'sortOrder', direction: 'asc' },
  filters: [
    { key: 'type', label: 'Type', options: PARTNER_TYPES },
    { key: 'status', label: 'Status', options: PUBLISH_OPTIONS },
    { key: 'featured', label: 'Featured', options: opts(['true', 'Featured'], ['false', 'Not featured']) },
  ],
  columns: [
    { key: 'logo', label: 'Logo', type: 'image' },
    { key: 'name', label: 'Name', type: 'title', subKey: 'tagline', sortable: true },
    { key: '_view.type', label: 'Type', type: 'text' },
    { key: 'featured', label: 'Featured', type: 'bool' },
    { key: 'status', label: 'Status', type: 'status', sortable: true },
    { key: 'updatedAt', label: 'Updated', type: 'date', sortable: true, hideOnMobile: true },
  ],
  decorate: (r) => ({ type: PARTNER_TYPES.find((o) => o.value === r.type)?.label ?? r.type }),
  actions: ['edit', 'duplicate', 'archive', 'delete'],
  hasDetail: false,
  statusKey: 'status',
  empty: { title: 'No partners yet.', description: 'Add a sponsor or partner.' },
  newRecord: () => ({
    name: '',
    slug: '',
    type: 'sponsor',
    logo: null,
    description: '',
    tagline: '',
    website: '',
    featured: false,
    status: 'draft',
    sortOrder: 10,
    collaborationImage: null,
    ctaUrl: '',
  }),
  form: {
    titleKey: 'name',
    seo: false,
    publish: { statuses: PUBLISH_OPTIONS, statusKey: 'status' },
    sections: [
      section('partner', 'Partner', [
        f.text('name', 'Name', { required: true, width: 'half', maxLength: 80 }),
        f.slug('slug', 'name'),
        f.select('type', 'Type', PARTNER_TYPES, { required: true }),
        f.number('sortOrder', 'Sort order', { min: 0 }),
        f.media('logo', 'Logo', { required: true }),
        f.toggle('featured', 'Featured partner'),
        f.text('tagline', 'Tagline', { maxLength: 60 }),
        f.textarea('description', 'Description'),
        f.url('website', 'Website', { width: 'half' }),
      ]),
      section('extras', 'Optional', [
        f.media('collaborationImage', 'Collaboration image'),
        f.url('ctaUrl', 'CTA URL', { width: 'half' }),
      ]),
    ],
  },
};
