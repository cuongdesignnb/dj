import { f, opts, section } from '@/lib/admin/common/fields';
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
  answersConfirmed: boolean;
  sortOrder: number;
  updatedAt: string;
  [key: string]: unknown;
}

export const FAQ_CATEGORY_OPTIONS = [
  { value: 'tickets', label: 'Tickets' },
  { value: 'entry', label: 'Entry' },
  { value: 'vip-tables', label: 'VIP Tables' },
  { value: 'venue', label: 'Venue' },
];

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
  seed: () => [],
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
  newRecord: () => ({ category: 'tickets', question: { en: '' }, answer: { en: '' }, keywords: [], published: false, answersConfirmed: false, sortOrder: 10 }),
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
        f.toggle('answersConfirmed', 'Answers confirmed by organiser', { help: 'Only enable this when every visible answer is final and eligible for FAQ rich results.' }),
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
  seed: () => [],
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
  seed: () => [],
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
  seed: () => [],
  searchFields: ['title'],
  defaultSort: { key: 'dueAt', direction: 'asc' },
  filters: [],
  columns: [],
  actions: [],
  hasDetail: false,
  empty: { title: 'Nothing queued.', description: '' },
};
