import { f, opts, section } from '@/lib/admin/common/fields';
import type { ResourceDefinition } from '@/lib/admin/common/resource';

// Discount codes are configured here but nothing applies them until the
// promotions service exists; the list page says so.

export interface AdminDiscount {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  active: boolean;
  startsAt: string;
  endsAt: string;
  productIds: string[];
  usageLimit: number | null;
  usageCount: number;
  updatedAt: string;
  [key: string]: unknown;
}

export const discountsDefinition: ResourceDefinition<AdminDiscount> = {
  key: 'discounts',
  label: 'Discount Codes',
  singular: 'Discount Code',
  description: 'Configure promo codes for the promotions service.',
  group: 'Merchandise',
  basePath: '/admin/discounts',
  apiPath: 'discounts',
  permission: 'products',
  titleKey: 'code',
  idPrefix: 'discount',
  seed: () => [],
  searchFields: ['code'],
  matchers: { active: (r, v) => String(r.active) === v },
  defaultSort: { key: 'code', direction: 'asc' },
  filters: [
    { key: 'active', label: 'Status', options: opts(['true', 'Active'], ['false', 'Inactive']) },
    { key: 'type', label: 'Type', options: opts(['percentage', 'Percentage'], ['fixed', 'Fixed amount']) },
  ],
  columns: [
    { key: 'code', label: 'Code', type: 'title', sortable: true },
    { key: '_view.type', label: 'Type', type: 'text' },
    { key: '_view.value', label: 'Value', type: 'text', align: 'right' },
    { key: 'active', label: 'Active', type: 'bool' },
    { key: '_view.starts', label: 'Starts', type: 'text', hideOnMobile: true },
    { key: '_view.ends', label: 'Ends', type: 'text', hideOnMobile: true },
    { key: '_view.usage', label: 'Usage', type: 'text', hideOnMobile: true },
  ],
  decorate: (r) => ({
    type: r.type === 'percentage' ? 'Percentage' : 'Fixed amount',
    value: r.type === 'percentage' ? `${r.value}%` : `$${r.value}`,
    starts: r.startsAt || 'Not set',
    ends: r.endsAt || 'No end date',
    usage: `${r.usageCount}${r.usageLimit ? ` / ${r.usageLimit}` : ''}`,
  }),
  actions: ['edit', 'duplicate', 'delete'],
  hasDetail: false,
  empty: { title: 'No discount codes yet.', description: 'Create a code for the promotions service to apply.' },
  newRecord: () => ({ code: '', type: 'percentage', value: 10, active: false, startsAt: '', endsAt: '', productIds: [], usageLimit: null, usageCount: 0 }),
  form: {
    titleKey: 'code',
    seo: false,
    publish: null,
    sections: [
      section('code', 'Code', [
        { key: 'code', label: 'Code', type: 'text', required: true, width: 'half', maxLength: 32, help: 'Letters, numbers and hyphens.' },
        f.toggle('active', 'Active'),
        f.select('type', 'Type', opts(['percentage', 'Percentage'], ['fixed', 'Fixed amount (AUD)']), { required: true }),
        f.number('value', 'Value', { required: true, min: 0, max: 100000 }),
      ]),
      section('window', 'Availability', [
        f.date('startsAt', 'Starts'),
        f.date('endsAt', 'Ends', { afterKey: 'startsAt' }),
        f.number('usageLimit', 'Usage limit', { min: 1, help: 'Leave empty for no limit.' }),
        f.multi('productIds', 'Eligible products', { optionSource: 'products', help: 'Leave empty for all products.' }),
      ]),
    ],
  },
};
