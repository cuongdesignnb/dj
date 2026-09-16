import { FAQ_MOCK } from '@/lib/support/faq-mock';
import { PRIVACY_DRAFT, TERMS_DRAFT } from '@/lib/legal/mock';
import type { LegalDocument } from '@/lib/legal/types';
import { DEMO_UPDATED, f, opts, section } from '@/lib/admin/common/fields';
import type { ResourceDefinition } from '@/lib/admin/common/resource';
import { LEGAL_STATUS_OPTIONS } from '@/lib/admin/common/schema';
import type { AdminTask, AuditEntry, LegalStatus, LocalizedString, SeoFields } from '@/lib/admin/common/types';

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

export interface AdminFaq {
  id: string;
  category: string;
  question: LocalizedString;
  answer: LocalizedString;
  keywords: string[];
  published: boolean;
  sortOrder: number;
  updatedAt: string;
  [key: string]: unknown;
}

export const FAQ_CATEGORY_OPTIONS = FAQ_MOCK.categories.map((c) => ({ value: c.id, label: c.label }));

export const faqDefinition: ResourceDefinition<AdminFaq> = {
  key: 'faq',
  label: 'FAQ',
  singular: 'Question',
  description: 'Questions and answers shown on /faq.',
  group: 'Content',
  basePath: '/admin/content/faq',
  apiPath: 'faq',
  permission: 'content',
  titleKey: 'question',
  idPrefix: 'faq',
  seed: () =>
    FAQ_MOCK.items.map((item) => ({
      id: `faq_${item.id.replace(/-/g, '_')}`,
      category: item.category,
      question: { en: item.question },
      answer: { en: item.answer },
      keywords: item.keywords ?? [],
      published: item.published,
      sortOrder: item.sortOrder,
      updatedAt: DEMO_UPDATED,
    })),
  searchFields: ['question', 'answer', 'keywords'],
  matchers: { published: (r, v) => String(r.published) === v },
  defaultSort: { key: 'sortOrder', direction: 'asc' },
  filters: [
    { key: 'category', label: 'Category', options: FAQ_CATEGORY_OPTIONS },
    { key: 'published', label: 'Published', options: opts(['true', 'Published'], ['false', 'Hidden']) },
  ],
  columns: [
    { key: 'question', label: 'Question', type: 'title', sortable: true },
    { key: 'published', label: 'Published', type: 'bool' },
    { key: 'sortOrder', label: 'Order', type: 'text', align: 'center', sortable: true },
  ],
  actions: ['edit', 'duplicate', 'delete'],
  hasDetail: false,
  empty: { title: 'No questions in this category.', description: 'Add the first question.' },
  newRecord: () => ({ category: 'tickets', question: { en: '' }, answer: { en: '' }, keywords: [], published: false, sortOrder: 10 }),
  form: {
    titleKey: 'question',
    seo: false,
    publish: null,
    sections: [
      section('faq', 'Question', [
        f.select('category', 'Category', FAQ_CATEGORY_OPTIONS, { required: true }),
        f.number('sortOrder', 'Sort order', { min: 0 }),
        f.loc('question', 'Question', { required: true, maxLength: 160 }),
        f.locArea('answer', 'Answer', { required: true, help: 'Plain text. State only confirmed information.' }),
        f.tags('keywords', 'Search keywords'),
        f.toggle('published', 'Published'),
      ]),
    ],
  },
};

// ---------------------------------------------------------------------------
// Legal documents
// ---------------------------------------------------------------------------

export interface AdminLegalDocument {
  id: 'terms' | 'privacy';
  title: string;
  status: LegalStatus;
  intro: string;
  version: string;
  effectiveDate: string;
  updatedDate: string;
  sections: { id: string; navLabel: string; title: string; body: string; notice: string }[];
  seo: SeoFields;
  updatedAt: string;
  [key: string]: unknown;
}

const legal = (doc: LegalDocument): AdminLegalDocument => ({
  id: doc.type,
  title: doc.title,
  status: doc.status,
  intro: doc.intro,
  version: doc.version ?? '',
  effectiveDate: doc.effectiveDate ?? '',
  updatedDate: doc.updatedAt ?? '',
  sections: doc.sections.map((s) => ({
    id: s.id,
    navLabel: s.navLabel,
    title: s.title,
    // One paragraph per blank line.
    body: s.paragraphs.join('\n\n'),
    notice: s.notice ?? '',
  })),
  seo: { title: doc.seoTitle ?? '', description: doc.seoDescription ?? '', index: false, follow: true },
  updatedAt: DEMO_UPDATED,
});

export const legalDefinition: ResourceDefinition<AdminLegalDocument> = {
  key: 'legal',
  label: 'Legal Documents',
  singular: 'Legal document',
  description: 'Terms & Conditions and Privacy Policy.',
  group: 'Content',
  basePath: '/admin/content/legal',
  apiPath: 'legal',
  permission: 'content',
  titleKey: 'title',
  idPrefix: 'legal',
  seed: () => [legal(TERMS_DRAFT), legal(PRIVACY_DRAFT)],
  searchFields: ['title'],
  filters: [],
  columns: [
    { key: 'title', label: 'Document', type: 'title' },
    { key: 'status', label: 'Status', type: 'status' },
    { key: 'updatedAt', label: 'Updated', type: 'date' },
  ],
  actions: ['edit'],
  hasDetail: false,
  statusKey: 'status',
  publicPath: (r) => `/${r.id}`,
  empty: { title: 'No legal documents.', description: '' },
  form: {
    titleKey: 'title',
    seo: true,
    publish: { statuses: LEGAL_STATUS_OPTIONS, statusKey: 'status' },
    sections: [
      section('document', 'Document', [
        f.text('title', 'Title', { required: true, width: 'half' }),
        f.text('version', 'Version', { width: 'half', help: 'Leave empty until legal counsel assigns one.' }),
        f.date('effectiveDate', 'Effective date', { help: 'Only set a confirmed date.' }),
        f.date('updatedDate', 'Last updated'),
        f.textarea('intro', 'Introduction', { required: true }),
      ], { description: 'Legal wording comes from the organizer or counsel. This screen stores it; it does not write it.' }),
      section('sections', 'Sections', [
        f.repeater('sections', 'Sections', [
          f.text('title', 'Heading', { required: true, width: 'half' }),
          f.text('navLabel', 'Sidebar label', { width: 'half' }),
          { key: 'id', label: 'Anchor', type: 'slug', required: true, width: 'half' },
          { key: 'body', label: 'Body', type: 'textarea', required: true, help: 'Separate paragraphs with a blank line.' },
          f.text('notice', 'Highlighted notice'),
        ], { itemLabelKey: 'title', itemNoun: 'Section' }),
      ]),
    ],
  },
};

// ---------------------------------------------------------------------------
// Audit log and task queue (dashboard only)
// ---------------------------------------------------------------------------

export const auditDefinition: ResourceDefinition<AuditEntry & { [key: string]: unknown }> = {
  key: 'audit',
  label: 'Activity',
  singular: 'Activity',
  description: 'Recent changes.',
  group: 'Dashboard',
  basePath: '/admin',
  apiPath: 'audit',
  permission: 'dashboard',
  titleKey: 'action',
  idPrefix: 'audit',
  seed: () => [
    { id: 'audit_1', actorName: 'Demo Admin', action: 'updated event', entityType: 'events', entityId: 'evt_destiny', entityLabel: 'DESTINY', createdAt: '2026-09-15T08:30:00.000Z' },
    { id: 'audit_2', actorName: 'Demo Manager', action: 'added product', entityType: 'products', entityId: 'prod_connection_hoodie', entityLabel: 'Connection Hoodie', createdAt: '2026-09-14T16:05:00.000Z' },
    { id: 'audit_3', actorName: 'Demo Editor One', action: 'saved draft article', entityType: 'news', entityId: 'news_artist_spotlights_coming_soon', entityLabel: 'Artist Spotlights Coming Soon', createdAt: '2026-09-14T10:20:00.000Z' },
    { id: 'audit_4', actorName: 'Demo Editor One', action: 'updated homepage content', entityType: 'content', entityLabel: 'Homepage', createdAt: '2026-09-13T09:10:00.000Z' },
    { id: 'audit_5', actorName: 'Demo Manager', action: 'updated gallery album', entityType: 'gallery', entityId: 'album_destiny', entityLabel: 'DESTINY', createdAt: '2026-09-12T15:40:00.000Z' },
    { id: 'audit_6', actorName: 'Demo Admin', action: 'invited staff member', entityType: 'staff', entityId: 'staff_editor_2', entityLabel: 'Demo Editor Two', createdAt: '2026-09-11T12:00:00.000Z' },
    { id: 'audit_7', actorName: 'Demo Admin', action: 'saved legal draft', entityType: 'content', entityLabel: 'Privacy Policy', createdAt: '2026-09-10T08:15:00.000Z' },
  ],
  searchFields: ['actorName', 'action', 'entityLabel'],
  defaultSort: { key: 'createdAt', direction: 'desc' },
  filters: [],
  columns: [],
  actions: [],
  hasDetail: false,
  empty: { title: 'No recent activity.', description: '' },
};

export const tasksDefinition: ResourceDefinition<AdminTask & { [key: string]: unknown }> = {
  key: 'tasks',
  label: 'Content Queue',
  singular: 'Task',
  description: 'Upcoming work.',
  group: 'Dashboard',
  basePath: '/admin',
  apiPath: 'tasks',
  permission: 'dashboard',
  titleKey: 'title',
  idPrefix: 'task',
  seed: () => [
    { id: 'task_1', title: 'Confirm DESTINY date and schedule', module: 'events', dueAt: '2026-09-18T00:00:00.000Z', status: 'open' },
    { id: 'task_2', title: 'Connect ticket provider', module: 'settings', dueAt: '2026-09-19T00:00:00.000Z', status: 'open' },
    { id: 'task_3', title: 'Replace merch mock-ups with product photos', module: 'products', dueAt: '2026-09-22T00:00:00.000Z', status: 'open' },
    { id: 'task_4', title: 'Legal review: Terms & Privacy drafts', module: 'content', dueAt: '2026-09-23T00:00:00.000Z', status: 'open' },
    { id: 'task_5', title: 'Add confirmed contact details', module: 'settings', dueAt: '2026-09-24T00:00:00.000Z', status: 'open' },
    { id: 'task_6', title: 'Vietnamese translations for FAQ', module: 'content', dueAt: '2026-09-26T00:00:00.000Z', status: 'open' },
  ],
  searchFields: ['title'],
  defaultSort: { key: 'dueAt', direction: 'asc' },
  filters: [],
  columns: [],
  actions: [],
  hasDetail: false,
  empty: { title: 'Nothing queued.', description: '' },
};
