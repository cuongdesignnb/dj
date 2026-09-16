// Data-driven validation shared by the form (instant feedback) and the server
// action (which re-checks). The backend remains authoritative.

import { getPath } from './paths';
import type { FieldConfig, FormSchema } from './schema';

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidUrl(value: string): boolean {
  if (value.startsWith('/')) return !value.startsWith('//');
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' || url.protocol === 'mailto:';
  } catch {
    return false;
  }
}

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object' && 'en' in (value as object)) {
    return String((value as { en?: string }).en ?? '').trim() === '';
  }
  if (typeof value === 'object' && 'src' in (value as object)) {
    return String((value as { src?: string }).src ?? '').trim() === '';
  }
  return false;
}

function visible(field: FieldConfig, values: unknown): boolean {
  if (!field.showWhen) return true;
  const current = getPath(values, field.showWhen.key);
  return field.showWhen.in.includes(current as string | boolean);
}

export function validateField(field: FieldConfig, value: unknown, values: unknown): string | null {
  if (!visible(field, values)) return null;

  if (field.required && isEmpty(value)) return `${field.label} is required.`;
  if (isEmpty(value)) return null;

  switch (field.type) {
    case 'slug':
      if (typeof value !== 'string' || !SLUG_PATTERN.test(value)) {
        return 'Use lowercase letters, numbers and single hyphens.';
      }
      break;
    case 'url':
      if (typeof value !== 'string' || !isValidUrl(value)) return 'Enter a valid URL (https://…).';
      break;
    case 'email':
      if (typeof value !== 'string' || !EMAIL_PATTERN.test(value)) return 'Enter a valid email address.';
      break;
    case 'number':
    case 'money': {
      const n = field.type === 'money' ? Number((value as { amountMinor?: number })?.amountMinor) / 100 : Number(value);
      if (!Number.isFinite(n)) return 'Enter a number.';
      if (field.min !== undefined && n < field.min) return `Must be at least ${field.min}.`;
      if (field.max !== undefined && n > field.max) return `Must be at most ${field.max}.`;
      break;
    }
    case 'date':
    case 'datetime':
      if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) return 'Enter a valid date.';
      if (field.afterKey) {
        const other = getPath(values, field.afterKey);
        if (typeof other === 'string' && other && Date.parse(value) < Date.parse(other)) {
          return 'Must be on or after the start date.';
        }
      }
      break;
    default:
      break;
  }

  if (field.maxLength) {
    const text =
      typeof value === 'string'
        ? value
        : typeof value === 'object' && value && 'en' in value
          ? String((value as { en?: string }).en ?? '')
          : '';
    if (text.length > field.maxLength) return `Keep this under ${field.maxLength} characters.`;
  }

  if (field.type === 'repeater' && Array.isArray(value) && field.itemFields) {
    for (const [index, row] of value.entries()) {
      for (const sub of field.itemFields) {
        const error = validateField(sub, getPath(row, sub.key), row);
        if (error) return `${field.itemNoun ?? 'Item'} ${index + 1}: ${error}`;
      }
    }
  }

  return null;
}

export function allFields(schema: FormSchema): FieldConfig[] {
  const fields = schema.sections.flatMap((s) => s.fields);
  if (schema.seo) {
    fields.push(
      { key: 'seo.title', label: 'Meta title', type: 'text', maxLength: 70 },
      { key: 'seo.description', label: 'Meta description', type: 'textarea', maxLength: 170 },
      { key: 'seo.canonical', label: 'Canonical URL', type: 'url' },
    );
  }
  return fields;
}

/** Field path → message, for every invalid field. */
export function validateValues(schema: FormSchema, values: unknown): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of allFields(schema)) {
    const error = validateField(field, getPath(values, field.key), values);
    if (error) errors[field.key] = error;
  }
  return errors;
}
