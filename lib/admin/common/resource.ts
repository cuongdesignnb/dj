import type { PermissionModule } from '@/lib/admin/auth/permissions';
import type { Matcher } from './repository';
import type { ColumnConfig, FilterConfig, FormSchema, RowAction } from './schema';
import type { AdminRecord } from './types';

export type ResourceKey =
  | 'events'
  | 'artists'
  | 'products'
  | 'orders'
  | 'payments'
  | 'ticket-purchases'
  | 'vip-bookings'
  | 'discounts'
  | 'news'
  | 'gallery'
  | 'media'
  | 'partners'
  | 'staff'
  | 'roles'
  | 'faq'
  | 'legal'
  | 'audit'
  | 'tasks';

export type SingletonKey =
  | 'content-home'
  | 'content-about'
  | 'content-contact'
  | 'settings-site'
  | 'settings-social'
  | 'settings-languages'
  | 'settings-integrations'
  | 'shipping';

/**
 * Everything the generic list, detail and form screens need to know about a
 * module. Adding a module means writing one of these — not new screens.
 */
export interface ResourceDefinition<T extends AdminRecord = AdminRecord> {
  key: ResourceKey;
  label: string;
  singular: string;
  description: string;
  /** Sidebar group, used in breadcrumbs. */
  group: string;
  basePath: string;
  /** Backend path under /api/v1/admin. */
  apiPath: string;
  permission: PermissionModule;
  titleKey: string;
  columns: ColumnConfig[];
  filters: FilterConfig[];
  seed: () => T[];
  searchFields: string[];
  matchers?: Record<string, Matcher<T>>;
  idPrefix: string;
  defaultSort?: { key: string; direction: 'asc' | 'desc' };
  /** Absent when records are not created or edited here (orders, audit). */
  form?: FormSchema;
  newRecord?: () => Partial<T>;
  actions: RowAction[];
  hasDetail: boolean;
  /** Public page for a record, or null when there is none to preview. */
  publicPath?: (record: T) => string | null;
  empty: { title: string; description: string };
  /** The status field archive/publish actions write to. */
  statusKey?: string;
  /** Derived display values for the table, merged under `_view`. Never stored. */
  decorate?: (record: T) => Record<string, unknown>;
}

export interface SingletonDefinition<T extends object = Record<string, unknown>> {
  key: SingletonKey;
  label: string;
  description: string;
  group: string;
  path: string;
  apiPath: string;
  permission: PermissionModule;
  seed: () => T;
  form: FormSchema;
}
