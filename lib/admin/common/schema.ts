// Serializable descriptions of admin tables and forms.
//
// Everything here is plain data so a Server Component can hand it to the
// client-side DataTable and form engine. Behaviour (matching, defaults) lives
// in the resource definitions on the server.

export interface Option {
  value: string;
  label: string;
}

export type FieldType =
  | 'text'
  | 'textarea'
  | 'slug'
  | 'number'
  | 'money'
  | 'select'
  | 'multiselect'
  | 'toggle'
  | 'date'
  | 'time'
  | 'datetime'
  | 'url'
  | 'email'
  | 'media'
  | 'svgMedia'
  | 'mediaList'
  | 'localizedText'
  | 'localizedTextarea'
  | 'blocks'
  | 'repeater'
  | 'tags'
  | 'secret'
  | 'permissions'
  | 'readonly';

/** Where a select's options come from when they depend on other records. */
export type OptionSource = 'artists' | 'events' | 'gallery' | 'products' | 'roles';

export interface FieldConfig {
  /** Dot path into the record, e.g. "venue.name". */
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  help?: string;
  placeholder?: string;
  options?: Option[];
  optionSource?: OptionSource;
  min?: number;
  max?: number;
  maxLength?: number;
  /** For slug fields: the title field it is generated from. */
  slugFrom?: string;
  /** For repeaters: the fields of each row, and which one labels the row. */
  itemFields?: FieldConfig[];
  itemLabelKey?: string;
  itemNoun?: string;
  /** Show only when another field has one of these values. */
  showWhen?: { key: string; in: (string | boolean)[] };
  /** Must be on or after this other date field. */
  afterKey?: string;
  width?: 'full' | 'half' | 'third';
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  /** Tab this section belongs to; forms without tabs ignore it. */
  tab?: string;
  fields: FieldConfig[];
}

export interface FormSchema {
  tabs?: string[];
  sections: FormSection[];
  /** Publishing statuses offered in the side panel, or null for none. */
  publish: { statuses: Option[]; statusKey: string } | null;
  /** Adds the shared SEO panel bound to `seo.*`. */
  seo: boolean;
  /** Field used as the page title in the header. */
  titleKey: string;
}

export type ColumnType =
  | 'title'
  | 'text'
  | 'status'
  | 'date'
  | 'datetime'
  | 'money'
  | 'image'
  | 'bool'
  | 'count'
  | 'list'
  | 'localized';

export interface ColumnConfig {
  key: string;
  label: string;
  type: ColumnType;
  sortable?: boolean;
  /** Secondary text under a title column. */
  subKey?: string;
  /** Hidden on narrow screens' stacked cards. */
  hideOnMobile?: boolean;
  align?: 'left' | 'right' | 'center';
}

export interface FilterConfig {
  key: string;
  label: string;
  options: Option[];
}

export type RowAction = 'view' | 'edit' | 'duplicate' | 'preview' | 'archive' | 'delete';

export const PUBLISH_OPTIONS: Option[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'preview', label: 'Preview' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

export const LEGAL_STATUS_OPTIONS: Option[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'Review' },
  { value: 'published', label: 'Published' },
];
