import { f, opts, section } from '@/lib/admin/common/fields';
import type { ResourceDefinition } from '@/lib/admin/common/resource';
import { PUBLISH_OPTIONS } from '@/lib/admin/common/schema';
import type { LocalizedString, MediaRef, PublishStatus, SeoFields } from '@/lib/admin/common/types';
import type { Money } from '@/lib/money';

export interface TicketTierInput {
  name: string;
  price: Money | null;
  badge: string;
  online: boolean;
  door: boolean;
  sortOrder: number;
}

export interface AdminEvent {
  id: string;
  name: LocalizedString;
  slug: string;
  eyebrow: LocalizedString;
  shortDescription: LocalizedString;
  longDescription: LocalizedString;
  heroImage: MediaRef | null;
  posterImage: MediaRef | null;
  status: PublishStatus;
  featured: boolean;
  phase: 'upcoming' | 'past';
  dateStatus: 'tba' | 'confirmed';
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  scheduleStatus: 'tbc' | 'confirmed';
  venue: { name: string; city: string; region: string; country: string; address: string; mapUrl: string; image: MediaRef | null };
  tickets: { providerMode: 'none' | 'external'; providerUrl: string; tiers: TicketTierInput[] };
  vip: {
    enabled: boolean;
    packageName: string;
    price: Money | null;
    capacity: number | null;
    includedBottles: number | null;
    availabilityMode: 'on-request' | 'managed';
    booths: { code: string; zone: string }[];
    bottles: { name: string; enabled: boolean }[];
  };
  artistIds: string[];
  albumIds: string[];
  faqs: { question: string; answer: string }[];
  seo: SeoFields;
  updatedAt: string;
  [key: string]: unknown;
}

const STATUS_FILTER = { key: 'status', label: 'Status', options: PUBLISH_OPTIONS };

export const eventsDefinition: ResourceDefinition<AdminEvent> = {
  key: 'events',
  label: 'Events',
  singular: 'Event',
  description: 'Manage upcoming and past events.',
  group: 'Event Management',
  basePath: '/admin/events',
  apiPath: 'events',
  permission: 'events',
  titleKey: 'name',
  idPrefix: 'evt',
  seed: () => [],
  searchFields: ['name', 'slug', 'venue.name', 'venue.city'],
  matchers: {
    venue: (r, v) => r.venue.name === v,
    dates: (r, v) => r.dateStatus === v,
  },
  defaultSort: { key: 'updatedAt', direction: 'desc' },
  filters: [
    STATUS_FILTER,
    { key: 'phase', label: 'Upcoming / Past', options: opts(['upcoming', 'Upcoming'], ['past', 'Past']) },
    { key: 'venue', label: 'Venue', options: [] },
    { key: 'dates', label: 'Date', options: opts(['tba', 'Date TBA'], ['confirmed', 'Date confirmed']) },
  ],
  columns: [
    { key: 'name', label: 'Event', type: 'title', subKey: 'slug', sortable: true },
    { key: 'status', label: 'Status', type: 'status', sortable: true },
    { key: '_view.date', label: 'Date', type: 'text' },
    { key: '_view.venue', label: 'Venue', type: 'text', hideOnMobile: true },
    { key: '_view.tickets', label: 'Ticket Status', type: 'text', hideOnMobile: true },
    { key: '_view.vip', label: 'VIP Status', type: 'text', hideOnMobile: true },
    { key: 'artistIds', label: 'Artists', type: 'count', align: 'center' },
    { key: 'updatedAt', label: 'Updated', type: 'date', sortable: true },
  ],
  decorate: (r) => ({
    date: r.dateStatus === 'tba' || !r.startDate ? 'Date TBA' : r.startDate,
    venue: [r.venue.name, r.venue.city].filter(Boolean).join(', ') || 'Not set',
    tickets:
      r.tickets.providerMode === 'external' && r.tickets.providerUrl
        ? 'External provider'
        : r.tickets.tiers.length
          ? `${r.tickets.tiers.length} tiers · provider not set`
          : 'Not configured',
    vip: r.vip.enabled ? `On request · ${r.vip.booths.length} booths` : 'Off',
  }),
  actions: ['view', 'edit', 'duplicate', 'preview', 'archive', 'delete'],
  hasDetail: true,
  statusKey: 'status',
  publicPath: (r) => (r.slug ? `/events/${encodeURIComponent(r.slug)}` : null),
  empty: { title: 'No events yet.', description: 'Create your first event.' },
  newRecord: () => ({
    name: { en: '' },
    slug: '',
    status: 'draft',
    featured: false,
    phase: 'upcoming',
    dateStatus: 'tba',
    scheduleStatus: 'tbc',
    venue: { name: '', city: '', region: '', country: '', address: '', mapUrl: '', image: null },
    tickets: { providerMode: 'none', providerUrl: '', tiers: [] },
    vip: { enabled: false, packageName: '', price: null, capacity: null, includedBottles: null, availabilityMode: 'on-request', booths: [], bottles: [] },
    artistIds: [],
    albumIds: [],
    faqs: [],
    seo: { index: true, follow: true },
  }),
  form: {
    titleKey: 'name',
    tabs: ['Overview', 'Schedule', 'Venue', 'Tickets', 'VIP Tables', 'Artists', 'Gallery', 'FAQ'],
    seo: true,
    publish: { statuses: PUBLISH_OPTIONS, statusKey: 'status' },
    sections: [
      section('overview', 'Overview', [
        f.loc('name', 'Event name', { required: true, maxLength: 80 }),
        f.slug('slug', 'name'),
        f.loc('eyebrow', 'Eyebrow', { width: 'half', maxLength: 40 }),
        f.locArea('shortDescription', 'Short description', { maxLength: 240 }),
        f.locArea('longDescription', 'Long description'),
        f.media('heroImage', 'Hero image'),
        f.media('posterImage', 'Poster image'),
        f.toggle('featured', 'Featured event'),
        f.select('phase', 'Listing', opts(['upcoming', 'Upcoming'], ['past', 'Past'])),
      ], { tab: 'Overview' }),
      section('schedule', 'Date & schedule', [
        f.select('dateStatus', 'Date status', opts(['tba', 'TBA'], ['confirmed', 'Confirmed']), { required: true }),
        f.select('scheduleStatus', 'Schedule status', opts(['tbc', 'TBC'], ['confirmed', 'Confirmed'])),
        f.date('startDate', 'Start date', { required: true, showWhen: { key: 'dateStatus', in: ['confirmed'] } }),
        f.time('startTime', 'Start time', { showWhen: { key: 'dateStatus', in: ['confirmed'] } }),
        f.date('endDate', 'End date', { afterKey: 'startDate', showWhen: { key: 'dateStatus', in: ['confirmed'] } }),
        f.time('endTime', 'End time', { showWhen: { key: 'dateStatus', in: ['confirmed'] } }),
      ], { tab: 'Schedule', description: 'Dates stay hidden on the site while the status is TBA.' }),
      section('venue', 'Venue', [
        f.text('venue.name', 'Venue name', { width: 'half' }),
        f.text('venue.city', 'City', { width: 'half' }),
        f.text('venue.region', 'Region', { width: 'third' }),
        f.text('venue.country', 'Country', { width: 'third' }),
        f.url('venue.mapUrl', 'Map URL', { width: 'third' }),
        f.textarea('venue.address', 'Address'),
        f.media('venue.image', 'Venue image'),
      ], { tab: 'Venue' }),
      section('tickets', 'Tickets', [
        f.select('tickets.providerMode', 'Ticket provider', opts(['none', 'Not connected'], ['external', 'External provider'])),
        f.url('tickets.providerUrl', 'Provider URL', { width: 'half', required: true, showWhen: { key: 'tickets.providerMode', in: ['external'] } }),
        f.repeater('tickets.tiers', 'Ticket tiers', [
          f.text('name', 'Tier name', { required: true, width: 'half' }),
          f.money('price', 'Price'),
          f.text('badge', 'Badge', { width: 'half' }),
          f.number('sortOrder', 'Sort order', { min: 0 }),
          f.toggle('online', 'Purchasable online'),
          f.toggle('door', 'Purchasable at door'),
        ], { itemLabelKey: 'name', itemNoun: 'Tier' }),
      ], { tab: 'Tickets', description: 'Sales happen on the provider; no ticket inventory is managed here.' }),
      section('vip', 'VIP tables', [
        f.toggle('vip.enabled', 'Enable VIP requests'),
        f.select('vip.availabilityMode', 'Availability', opts(['on-request', 'On request'], ['managed', 'Managed by backend'])),
        f.text('vip.packageName', 'Package name', { width: 'half', showWhen: { key: 'vip.enabled', in: [true] } }),
        f.money('vip.price', 'Package price', { showWhen: { key: 'vip.enabled', in: [true] } }),
        f.number('vip.capacity', 'Guests per booth', { min: 1, showWhen: { key: 'vip.enabled', in: [true] } }),
        f.number('vip.includedBottles', 'Included bottles', { min: 0, showWhen: { key: 'vip.enabled', in: [true] } }),
        f.repeater('vip.booths', 'Booths', [
          f.text('code', 'Booth code', { required: true, width: 'half' }),
          f.text('zone', 'Zone', { width: 'half' }),
        ], { itemLabelKey: 'code', itemNoun: 'Booth', showWhen: { key: 'vip.enabled', in: [true] } }),
        f.repeater('vip.bottles', 'Bottle options', [
          f.text('name', 'Bottle', { required: true, width: 'half' }),
          f.toggle('enabled', 'Offered'),
        ], { itemLabelKey: 'name', itemNoun: 'Bottle', showWhen: { key: 'vip.enabled', in: [true] } }),
      ], { tab: 'VIP Tables' }),
      section('artists', 'Artists', [f.multi('artistIds', 'Lineup', { optionSource: 'artists' })], { tab: 'Artists' }),
      section('gallery', 'Gallery', [f.multi('albumIds', 'Related albums', { optionSource: 'gallery' })], { tab: 'Gallery' }),
      section('faq', 'Event FAQ', [
        f.repeater('faqs', 'Questions', [
          f.text('question', 'Question', { required: true }),
          f.textarea('answer', 'Answer', { required: true }),
        ], { itemLabelKey: 'question', itemNoun: 'Question' }),
      ], { tab: 'FAQ' }),
    ],
  },
};
