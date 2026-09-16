// Shared admin model types.

export type PublishStatus = 'draft' | 'preview' | 'published' | 'archived';
export type LegalStatus = 'draft' | 'review' | 'published';

/** One value per language. English is the source language. */
export interface LocalizedString {
  en?: string;
  vi?: string;
}

export interface LocalizedContent<T> {
  en: T;
  vi?: T;
}

export type LanguageCode = 'en' | 'vi';

/** A reference to an item in the media library, with the alt text used here. */
export interface MediaRef {
  mediaId?: string | null;
  src: string;
  alt: string;
}

export interface SeoFields {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: MediaRef | null;
  index?: boolean;
  follow?: boolean;
}

export type SortDirection = 'asc' | 'desc';

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface ListParams extends PaginationParams {
  search?: string;
  sort?: string;
  direction?: SortDirection;
  /** Filter key → value, exactly as they appear in the URL. */
  filters?: Record<string, string>;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminApiError {
  code?: string;
  message: string;
  fieldErrors?: Record<string, string>;
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: AdminApiError };

export interface AuditEntry {
  id: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId?: string;
  entityLabel?: string;
  createdAt: string;
}

export interface AdminTask {
  id: string;
  title: string;
  module: string;
  dueAt: string;
  status: 'open' | 'done';
}

/** Anything stored by an admin repository. */
export interface AdminRecord {
  id: string;
  updatedAt?: string;
  [key: string]: unknown;
}
