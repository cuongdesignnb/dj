import { f, opts, section } from '@/lib/admin/common/fields';
import type { ResourceDefinition } from '@/lib/admin/common/resource';
import { PUBLISH_OPTIONS } from '@/lib/admin/common/schema';
import type { LocalizedString, MediaRef, PublishStatus, SeoFields } from '@/lib/admin/common/types';

export interface AdminArtist {
  id: string;
  name: string;
  slug: string;
  country: string;
  year: string;
  portrait: MediaRef | null;
  heroImage: MediaRef | null;
  /** Empty until the artist supplies one — never written for them. */
  bio: LocalizedString;
  genres: string[];
  setTimeStatus: 'tba' | 'confirmed';
  setTime: string;
  featured: boolean;
  status: PublishStatus;
  links: { instagram: string; facebook: string; tiktok: string; youtube: string; spotify: string; soundcloud: string; website: string };
  media: { kind: 'image' | 'video'; url: string; caption: string }[];
  eventIds: string[];
  seo: SeoFields;
  updatedAt: string;
  [key: string]: unknown;
}

const EMPTY_LINKS = { instagram: '', facebook: '', tiktok: '', youtube: '', spotify: '', soundcloud: '', website: '' };

const COUNTRIES = ['AUSTRALIA', 'SINGAPORE', 'VIETNAM'];

export const artistsDefinition: ResourceDefinition<AdminArtist> = {
  key: 'artists',
  label: 'Artists',
  singular: 'Artist',
  description: 'Manage artist profiles and lineup appearances.',
  group: 'Artist Management',
  basePath: '/admin/artists',
  apiPath: 'artists',
  permission: 'artists',
  titleKey: 'name',
  idPrefix: 'artist',
  seed: () => [],
  searchFields: ['name', 'slug', 'country'],
  matchers: { featured: (r, v) => String(r.featured) === v },
  defaultSort: { key: 'name', direction: 'asc' },
  filters: [
    { key: 'country', label: 'Country', options: COUNTRIES.map((c) => ({ value: c, label: c.charAt(0) + c.slice(1).toLowerCase() })) },
    { key: 'featured', label: 'Featured', options: opts(['true', 'Featured'], ['false', 'Not featured']) },
    { key: 'status', label: 'Status', options: PUBLISH_OPTIONS },
  ],
  columns: [
    { key: 'portrait', label: 'Portrait', type: 'image' },
    { key: 'name', label: 'Artist', type: 'title', subKey: 'slug', sortable: true },
    { key: 'country', label: 'Country', type: 'text', sortable: true },
    { key: 'year', label: 'Year', type: 'text', hideOnMobile: true },
    { key: 'eventIds', label: 'Upcoming Events', type: 'count', align: 'center', hideOnMobile: true },
    { key: 'status', label: 'Profile Status', type: 'status', sortable: true },
    { key: 'updatedAt', label: 'Updated', type: 'date', sortable: true },
  ],
  actions: ['view', 'edit', 'preview', 'archive', 'delete'],
  hasDetail: true,
  statusKey: 'status',
  publicPath: (r) => (r.status === 'published' ? `/lineup/${r.slug}` : null),
  empty: { title: 'No artists yet.', description: 'Add the first artist to the lineup.' },
  newRecord: () => ({
    name: '',
    slug: '',
    country: '',
    year: '',
    portrait: null,
    heroImage: null,
    bio: {},
    genres: [],
    setTimeStatus: 'tba',
    setTime: '',
    featured: false,
    status: 'draft',
    links: { ...EMPTY_LINKS },
    media: [],
    eventIds: [],
    seo: { index: true, follow: true },
  }),
  form: {
    titleKey: 'name',
    tabs: ['Profile', 'Media', 'Social & Music', 'Events'],
    seo: true,
    publish: { statuses: PUBLISH_OPTIONS, statusKey: 'status' },
    sections: [
      section('profile', 'Profile', [
        f.text('name', 'Name', { required: true, width: 'half', maxLength: 60 }),
        f.slug('slug', 'name'),
        f.text('country', 'Country', { width: 'third' }),
        f.text('year', 'Year', { width: 'third' }),
        f.toggle('featured', 'Featured artist', { width: 'third' }),
        f.locArea('bio', 'Biography', { help: 'Use the artist’s supplied biography only.' }),
        f.tags('genres', 'Genres'),
        f.select('setTimeStatus', 'Set time', opts(['tba', 'TBA'], ['confirmed', 'Confirmed'])),
        f.time('setTime', 'Set time', { showWhen: { key: 'setTimeStatus', in: ['confirmed'] } }),
      ], { tab: 'Profile' }),
      section('media', 'Media', [
        f.media('portrait', 'Portrait', { required: true }),
        f.media('heroImage', 'Hero image'),
        f.repeater('media', 'Images & videos', [
          f.select('kind', 'Type', opts(['image', 'Image'], ['video', 'Video link'])),
          f.url('url', 'URL', { required: true, width: 'half', help: 'Links only — embed code is not accepted.' }),
          f.text('caption', 'Caption'),
        ], { itemLabelKey: 'caption', itemNoun: 'Media item' }),
      ], { tab: 'Media' }),
      section('links', 'Social & music links', [
        f.url('links.instagram', 'Instagram', { width: 'half' }),
        f.url('links.facebook', 'Facebook', { width: 'half' }),
        f.url('links.tiktok', 'TikTok', { width: 'half' }),
        f.url('links.youtube', 'YouTube', { width: 'half' }),
        f.url('links.spotify', 'Spotify', { width: 'half' }),
        f.url('links.soundcloud', 'SoundCloud', { width: 'half' }),
        f.url('links.website', 'Website', { width: 'half' }),
      ], { tab: 'Social & Music', description: 'Empty links are hidden on the public profile.' }),
      section('events', 'Events', [f.multi('eventIds', 'Appears at', { optionSource: 'events' })], { tab: 'Events' }),
    ],
  },
};
