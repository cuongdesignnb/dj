// Small builders so module schemas read as lists of fields.

import type { FieldConfig, FormSection, Option } from './schema';

type Extra = Omit<FieldConfig, 'key' | 'label' | 'type'>;

export const f = {
  text: (key: string, label: string, extra: Extra = {}): FieldConfig => ({ key, label, type: 'text', ...extra }),
  textarea: (key: string, label: string, extra: Extra = {}): FieldConfig => ({ key, label, type: 'textarea', ...extra }),
  loc: (key: string, label: string, extra: Extra = {}): FieldConfig => ({ key, label, type: 'localizedText', ...extra }),
  locArea: (key: string, label: string, extra: Extra = {}): FieldConfig => ({ key, label, type: 'localizedTextarea', ...extra }),
  slug: (key: string, from: string): FieldConfig => ({ key, label: 'Slug', type: 'slug', slugFrom: from, required: true, width: 'half', help: 'Used in the public URL.' }),
  number: (key: string, label: string, extra: Extra = {}): FieldConfig => ({ key, label, type: 'number', width: 'half', ...extra }),
  money: (key: string, label: string, extra: Extra = {}): FieldConfig => ({ key, label, type: 'money', min: 0, width: 'half', ...extra }),
  select: (key: string, label: string, options: Option[], extra: Extra = {}): FieldConfig => ({ key, label, type: 'select', options, width: 'half', ...extra }),
  multi: (key: string, label: string, extra: Extra = {}): FieldConfig => ({ key, label, type: 'multiselect', ...extra }),
  toggle: (key: string, label: string, extra: Extra = {}): FieldConfig => ({ key, label, type: 'toggle', width: 'half', ...extra }),
  date: (key: string, label: string, extra: Extra = {}): FieldConfig => ({ key, label, type: 'date', width: 'half', ...extra }),
  time: (key: string, label: string, extra: Extra = {}): FieldConfig => ({ key, label, type: 'time', width: 'half', ...extra }),
  url: (key: string, label: string, extra: Extra = {}): FieldConfig => ({ key, label, type: 'url', placeholder: 'https://', ...extra }),
  email: (key: string, label: string, extra: Extra = {}): FieldConfig => ({ key, label, type: 'email', width: 'half', ...extra }),
  media: (key: string, label: string, extra: Extra = {}): FieldConfig => ({ key, label, type: 'media', width: 'half', ...extra }),
  tags: (key: string, label: string, extra: Extra = {}): FieldConfig => ({ key, label, type: 'tags', ...extra }),
  repeater: (key: string, label: string, itemFields: FieldConfig[], extra: Extra = {}): FieldConfig => ({ key, label, type: 'repeater', itemFields, ...extra }),
  readonly: (key: string, label: string, extra: Extra = {}): FieldConfig => ({ key, label, type: 'readonly', width: 'half', ...extra }),
};

export function section(id: string, title: string, fields: FieldConfig[], extra: Partial<FormSection> = {}): FormSection {
  return { id, title, fields, ...extra };
}

export const opts = (...pairs: [string, string][]): Option[] => pairs.map(([value, label]) => ({ value, label }));

export const YES_NO = opts(['true', 'Yes'], ['false', 'No']);

export const aud = (dollars: number) => ({ amountMinor: Math.round(dollars * 100), currency: 'AUD' });

/** Fixed demo timestamps, so server and client render the same values. */
export const DEMO_UPDATED = '2026-09-01T09:00:00.000Z';
