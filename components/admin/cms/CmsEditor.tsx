'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { useToast } from '@/components/admin/ui/Toast';

type JsonRecord = Record<string, unknown>;
type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'boolean'
  | 'media'
  | 'string-list'
  | 'info-list'
  | 'faq-list'
  | 'steps-list'
  | 'filters'
  | 'sections'
  | 'action'
  | 'cta'
  | 'empty-state'
  | 'seo';
type Field = { path: string; label: string; type?: FieldType; help?: string; wide?: boolean };

const textField = (path: string, label: string, type: FieldType = 'text', extra: Partial<Field> = {}): Field => ({ path, label, type, ...extra });

function fieldsFor(key: string): Field[] {
  const kind = key.startsWith('tickets:')
    ? 'tickets'
    : key.startsWith('tables:')
      ? 'tables'
      : key.startsWith('booking:')
        ? 'booking'
        : key === 'global-content'
          ? 'global'
          : 'listing';

  const hero = (titlePath = 'hero.title', titleLabel = 'Hero title'): Field[] => [
    textField('hero.breadcrumb', 'Hero breadcrumb'),
    textField('hero.eyebrow', 'Hero eyebrow'),
    textField(titlePath, titleLabel),
    ...(titlePath === 'hero.title'
      ? [textField('hero.titleLine1', 'Hero title line 1'), textField('hero.titleLine2', 'Hero title line 2')]
      : []),
    textField('hero.description', 'Hero description', 'textarea'),
    textField('hero.image', 'Hero image', 'media', { wide: true, help: 'Set the image URL and accessible alt text.' }),
    textField('hero.sideNotes', 'Hero side notes', 'string-list', { wide: true }),
    textField('hero.footNotes', 'Hero foot notes', 'string-list', { wide: true }),
  ];

  const cta = (path = 'finalCta', label = 'Final CTA'): Field[] => [
    textField(path, label, 'cta', { wide: true }),
  ];

  const seo = (): Field[] => [textField('seo', 'SEO settings', 'seo', { wide: true })];

  if (kind === 'tickets') {
    return [
      ...hero(),
      textField('selector.eyebrow', 'Selector eyebrow'),
      textField('selector.title', 'Selector title'),
      textField('selector.description', 'Selector description', 'textarea'),
      textField('selector.aside', 'Selector aside'),
      textField('selector.emptyTitle', 'Selector empty-state title'),
      textField('selector.emptyDescription', 'Selector empty-state description', 'textarea'),
      textField('trustItems', 'Trust items', 'info-list', { wide: true }),
      textField('infoItems', 'Information cards', 'info-list', { wide: true }),
      textField('faq', 'Frequently asked questions', 'faq-list', { wide: true }),
      textField('provider.unavailableNote', 'Provider unavailable note', 'textarea'),
      ...cta(),
      ...seo(),
    ];
  }

  if (kind === 'tables') {
    return [
      ...hero('hero.titleLine1', 'Hero title line 1'),
      textField('hero.titleLine2', 'Hero title line 2'),
      textField('map.eyebrow', 'Map eyebrow'),
      textField('map.title', 'Map title'),
      textField('map.description', 'Map description', 'textarea'),
      textField('map.disclaimer', 'Map disclaimer', 'textarea'),
      textField('map.stageLabel', 'Stage label'),
      textField('map.background', 'Map background', 'media', { wide: true }),
      textField('infoTitle', 'VIP information title'),
      textField('infoContext', 'VIP information context'),
      textField('infoItems', 'VIP information cards', 'info-list', { wide: true }),
      textField('faqContext', 'FAQ context'),
      textField('faq', 'Frequently asked questions', 'faq-list', { wide: true }),
      ...cta(),
      ...seo(),
    ];
  }

  if (kind === 'booking') {
    return [
      ...hero('hero.titleLine1', 'Hero title line 1'),
      textField('hero.titleLine2', 'Hero title line 2'),
      textField('tabs.tickets', 'Ticket tab label'),
      textField('tabs.vip', 'VIP tab label'),
      textField('form.heading', 'Form heading'),
      textField('form.description', 'Form description', 'textarea'),
      textField('form.nameLabel', 'Name label'),
      textField('form.emailLabel', 'Email label'),
      textField('form.phoneLabel', 'Phone label'),
      textField('form.groupSizeLabel', 'Group size label'),
      textField('form.boothLabel', 'Booth label'),
      textField('form.bottleLabel', 'Bottle label'),
      textField('form.specialRequestLabel', 'Special request label'),
      textField('form.submitLabel', 'Submit label'),
      textField('bookingNotes', 'Booking notes', 'info-list', { wide: true }),
      textField('notesTitle', 'Booking notes title'),
      textField('notesContext', 'Booking notes context'),
      textField('processSteps', 'Booking process steps', 'steps-list', { wide: true }),
      textField('faq', 'Frequently asked questions', 'faq-list', { wide: true }),
      textField('faqContext', 'FAQ context'),
      ...cta(),
      ...seo(),
    ];
  }

  if (kind === 'global') {
    return [
      textField('tagline', 'Brand tagline'),
      textField('footerDescription', 'Footer description', 'textarea'),
      textField('ageNotice', '18+ notice'),
      textField('genericCtaFallback', 'Generic CTA fallback', 'action'),
      textField('copyright', 'Copyright'),
      textField('emptyCopy', 'Global empty copy'),
      ...seo(),
    ];
  }

  return [
    textField('hero.breadcrumb', 'Hero breadcrumb'),
    textField('hero.eyebrow', 'Hero eyebrow'),
    textField('hero.title', 'Hero title'),
    textField('hero.titleLine1', 'Hero title line 1'),
    textField('hero.titleLine2', 'Hero title line 2'),
    textField('hero.description', 'Hero description', 'textarea'),
    textField('hero.image', 'Hero image', 'media', { wide: true }),
    textField('hero.sideNotes', 'Hero side notes', 'string-list', { wide: true }),
    textField('hero.footNotes', 'Hero foot notes', 'string-list', { wide: true }),
    textField('hero.primary', 'Hero primary CTA', 'action'),
    textField('hero.secondary', 'Hero secondary CTA', 'action'),
    textField('filters', 'Filters', 'filters', { wide: true, help: 'Add a filter group and edit its visible labels.' }),
    textField('sections', 'Page sections', 'sections', { wide: true, help: 'Control each section title, context and visibility.' }),
    textField('emptyState', 'Empty state', 'empty-state', { wide: true }),
    ...cta(),
    ...seo(),
  ];
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {};
}

function asRecords(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.map(asRecord) : [];
}

function asStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function stringValue(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

function getPath(value: JsonRecord, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => asRecord(current)[key], value);
}

function setPath(value: JsonRecord, path: string, next: unknown): JsonRecord {
  const copy = structuredClone(value) as JsonRecord;
  const keys = path.split('.');
  let cursor = copy;
  keys.slice(0, -1).forEach((key) => {
    const current = cursor[key];
    cursor[key] = current && typeof current === 'object' && !Array.isArray(current) ? structuredClone(current) : {};
    cursor = cursor[key] as JsonRecord;
  });
  cursor[keys[keys.length - 1]] = next;
  return copy;
}

function updateRecord(record: unknown, key: string, value: unknown): JsonRecord {
  return { ...asRecord(record), [key]: value };
}

const inputClass = 'w-full rounded-[8px] border border-admin-border bg-admin-bg px-3 py-2 text-sm text-white focus:border-rave-red focus:outline-none';
const textareaClass = `${inputClass} min-h-24 resize-y`;
const cardClass = 'rounded-[10px] border border-admin-border/80 bg-admin-bg/60 p-3';

function TextInput({ value, onChange, multiline = false, type = 'text', placeholder }: { value: unknown; onChange: (value: string) => void; multiline?: boolean; type?: 'text' | 'number'; placeholder?: string }) {
  if (multiline) return <textarea value={stringValue(value)} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={textareaClass} rows={4} />;
  return <input type={type} value={stringValue(value)} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={inputClass} />;
}

function SmallLabel({ children }: { children: ReactNode }) {
  return <span className="mb-1 block text-xs font-medium text-admin-muted">{children}</span>;
}

function MediaEditor({ value, onChange }: { value: unknown; onChange: (value: unknown) => void }) {
  const media = asRecord(value);
  return (
    <div className={`${cardClass} space-y-3`}>
      <div className="grid gap-3 md:grid-cols-2">
        <label><SmallLabel>Image URL</SmallLabel><TextInput value={media.src} onChange={(next) => onChange(updateRecord(media, 'src', next))} placeholder="/assets/hero.jpg" /></label>
        <label><SmallLabel>Alt text</SmallLabel><TextInput value={media.alt} onChange={(next) => onChange(updateRecord(media, 'alt', next))} placeholder="Describe the image" /></label>
        <label><SmallLabel>Width (optional)</SmallLabel><TextInput value={media.width} type="number" onChange={(next) => onChange(updateRecord(media, 'width', next ? Number(next) : undefined))} /></label>
        <label><SmallLabel>Height (optional)</SmallLabel><TextInput value={media.height} type="number" onChange={(next) => onChange(updateRecord(media, 'height', next ? Number(next) : undefined))} /></label>
      </div>
      <button type="button" onClick={() => onChange(null)} className="text-xs text-admin-muted underline hover:text-white">Clear image</button>
    </div>
  );
}

function StringListEditor({ value, onChange }: { value: unknown; onChange: (value: string[]) => void }) {
  const items = asStrings(value);
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={`${index}-${item}`} className="flex gap-2">
          <input value={item} onChange={(event) => onChange(items.map((current, itemIndex) => itemIndex === index ? event.target.value : current))} className={inputClass} />
          <button type="button" aria-label="Remove item" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} className="rounded-[8px] border border-admin-border px-3 text-admin-muted hover:border-rose-400/60 hover:text-rose-200"><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, ''])} className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-rave-red hover:text-white"><Plus className="h-3.5 w-3.5" /> Add line</button>
    </div>
  );
}

function ActionEditor({ value, onChange }: { value: unknown; onChange: (value: unknown) => void }) {
  const action = asRecord(value);
  return <div className="grid gap-3 md:grid-cols-2"><label><SmallLabel>Label</SmallLabel><TextInput value={action.label} onChange={(next) => onChange(updateRecord(action, 'label', next))} /></label><label><SmallLabel>Link</SmallLabel><TextInput value={action.href} onChange={(next) => onChange(updateRecord(action, 'href', next))} placeholder="/events" /></label></div>;
}

function InfoListEditor({ value, onChange }: { value: unknown; onChange: (value: JsonRecord[]) => void }) {
  const items = asRecords(value);
  const update = (index: number, next: JsonRecord) => onChange(items.map((item, itemIndex) => itemIndex === index ? next : item));
  return <div className="space-y-3">
    {items.map((item, index) => <div key={`${index}-${stringValue(item.title)}`} className={cardClass}>
      <div className="mb-3 flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wide text-rave-red">Card {index + 1}</span><button type="button" aria-label="Remove card" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} className="text-admin-muted hover:text-rose-200"><Trash2 className="h-4 w-4" /></button></div>
      <div className="grid gap-3 md:grid-cols-2">
        <label><SmallLabel>Title</SmallLabel><TextInput value={item.title} onChange={(next) => update(index, updateRecord(item, 'title', next))} /></label>
        <label><SmallLabel>Icon key</SmallLabel><TextInput value={item.icon} onChange={(next) => update(index, updateRecord(item, 'icon', next))} placeholder="Music" /></label>
        <label className="md:col-span-2"><SmallLabel>Description</SmallLabel><TextInput value={item.description} multiline onChange={(next) => update(index, updateRecord(item, 'description', next))} /></label>
        <label><SmallLabel>Action label (optional)</SmallLabel><TextInput value={item.ctaLabel} onChange={(next) => update(index, updateRecord(item, 'ctaLabel', next))} /></label>
        <label><SmallLabel>Action link (optional)</SmallLabel><TextInput value={item.ctaUrl} onChange={(next) => update(index, updateRecord(item, 'ctaUrl', next))} /></label>
      </div>
      <label className="mt-3 flex items-center gap-2 text-xs text-admin-muted"><input type="checkbox" checked={item.enabled !== false} onChange={(event) => update(index, updateRecord(item, 'enabled', event.target.checked))} className="h-4 w-4 accent-rave-red" /> Show this card</label>
    </div>)}
    <button type="button" onClick={() => onChange([...items, { title: '', description: '', icon: '', enabled: true }])} className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-rave-red hover:text-white"><Plus className="h-3.5 w-3.5" /> Add card</button>
  </div>;
}

function FaqListEditor({ value, onChange }: { value: unknown; onChange: (value: JsonRecord[]) => void }) {
  const items = asRecords(value);
  const update = (index: number, next: JsonRecord) => onChange(items.map((item, itemIndex) => itemIndex === index ? next : item));
  return <div className="space-y-3">
    {items.map((item, index) => <div key={`${index}-${stringValue(item.question)}`} className={cardClass}>
      <div className="mb-3 flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wide text-rave-red">Question {index + 1}</span><button type="button" aria-label="Remove question" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} className="text-admin-muted hover:text-rose-200"><Trash2 className="h-4 w-4" /></button></div>
      <label className="block"><SmallLabel>Question</SmallLabel><TextInput value={item.question} onChange={(next) => update(index, updateRecord(item, 'question', next))} /></label>
      <label className="mt-3 block"><SmallLabel>Answer</SmallLabel><TextInput value={item.answer} multiline onChange={(next) => update(index, updateRecord(item, 'answer', next))} /></label>
      <label className="mt-3 flex items-center gap-2 text-xs text-admin-muted"><input type="checkbox" checked={item.enabled !== false} onChange={(event) => update(index, updateRecord(item, 'enabled', event.target.checked))} className="h-4 w-4 accent-rave-red" /> Show this question</label>
    </div>)}
    <button type="button" onClick={() => onChange([...items, { question: '', answer: '', enabled: true }])} className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-rave-red hover:text-white"><Plus className="h-3.5 w-3.5" /> Add question</button>
  </div>;
}

function StepsListEditor({ value, onChange }: { value: unknown; onChange: (value: JsonRecord[]) => void }) {
  const items = asRecords(value);
  const update = (index: number, next: JsonRecord) => onChange(items.map((item, itemIndex) => itemIndex === index ? next : item));
  return <div className="space-y-3">
    {items.map((item, index) => <div key={`${index}-${stringValue(item.title)}`} className={cardClass}>
      <div className="mb-3 flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wide text-rave-red">Step {index + 1}</span><button type="button" aria-label="Remove step" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} className="text-admin-muted hover:text-rose-200"><Trash2 className="h-4 w-4" /></button></div>
      <label className="block"><SmallLabel>Title</SmallLabel><TextInput value={item.title} onChange={(next) => update(index, updateRecord(item, 'title', next))} /></label>
      <label className="mt-3 block"><SmallLabel>Description</SmallLabel><TextInput value={item.description} multiline onChange={(next) => update(index, updateRecord(item, 'description', next))} /></label>
    </div>)}
    <button type="button" onClick={() => onChange([...items, { title: '', description: '' }])} className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-rave-red hover:text-white"><Plus className="h-3.5 w-3.5" /> Add step</button>
  </div>;
}

function FiltersEditor({ value, onChange }: { value: unknown; onChange: (value: JsonRecord[]) => void }) {
  const items = asRecords(value);
  const update = (index: number, next: JsonRecord) => onChange(items.map((item, itemIndex) => itemIndex === index ? next : item));
  return <div className="space-y-3">
    {items.map((item, index) => {
      const options = asStrings(item.options);
      return <div key={`${index}-${stringValue(item.key)}`} className={cardClass}>
        <div className="mb-3 flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wide text-rave-red">Filter {index + 1}</span><button type="button" aria-label="Remove filter" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} className="text-admin-muted hover:text-rose-200"><Trash2 className="h-4 w-4" /></button></div>
        <div className="grid gap-3 md:grid-cols-2">
          <label><SmallLabel>Internal key</SmallLabel><TextInput value={item.key} onChange={(next) => update(index, updateRecord(item, 'key', next))} placeholder="category-filter" /></label>
          <label><SmallLabel>Accessible label</SmallLabel><TextInput value={item.label} onChange={(next) => update(index, updateRecord(item, 'label', next))} placeholder="Filter by category" /></label>
        </div>
        <div className="mt-3"><SmallLabel>Visible options</SmallLabel><StringListEditor value={options} onChange={(next) => update(index, updateRecord(item, 'options', next))} /></div>
      </div>;
    })}
    <button type="button" onClick={() => onChange([...items, { key: '', label: '', options: [] }])} className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-rave-red hover:text-white"><Plus className="h-3.5 w-3.5" /> Add filter</button>
  </div>;
}

function SectionsEditor({ value, onChange }: { value: unknown; onChange: (value: JsonRecord[]) => void }) {
  const items = asRecords(value);
  const update = (index: number, next: JsonRecord) => onChange(items.map((item, itemIndex) => itemIndex === index ? next : item));
  return <div className="space-y-3">
    {items.map((item, index) => <div key={`${index}-${stringValue(item.key)}`} className={cardClass}>
      <div className="mb-3 flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wide text-rave-red">Section {index + 1}</span><button type="button" aria-label="Remove section" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} className="text-admin-muted hover:text-rose-200"><Trash2 className="h-4 w-4" /></button></div>
      <div className="grid gap-3 md:grid-cols-2">
        <label><SmallLabel>Internal key</SmallLabel><TextInput value={item.key} onChange={(next) => update(index, updateRecord(item, 'key', next))} placeholder="all-events" /></label>
        <label><SmallLabel>Eyebrow</SmallLabel><TextInput value={item.eyebrow} onChange={(next) => update(index, updateRecord(item, 'eyebrow', next))} /></label>
        <label><SmallLabel>Title</SmallLabel><TextInput value={item.title} onChange={(next) => update(index, updateRecord(item, 'title', next))} /></label>
        <label className="md:col-span-2"><SmallLabel>Context / description</SmallLabel><TextInput value={item.description} multiline onChange={(next) => update(index, updateRecord(item, 'description', next))} /></label>
      </div>
      <label className="mt-3 flex items-center gap-2 text-xs text-admin-muted"><input type="checkbox" checked={item.enabled !== false} onChange={(event) => update(index, updateRecord(item, 'enabled', event.target.checked))} className="h-4 w-4 accent-rave-red" /> Show this section</label>
    </div>)}
    <button type="button" onClick={() => onChange([...items, { key: '', title: '', description: '', enabled: true }])} className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-rave-red hover:text-white"><Plus className="h-3.5 w-3.5" /> Add section</button>
  </div>;
}

function CtaEditor({ value, onChange }: { value: unknown; onChange: (value: unknown) => void }) {
  const cta = asRecord(value);
  return <div className="space-y-3">
    <label><SmallLabel>Title</SmallLabel><TextInput value={cta.title} onChange={(next) => onChange(updateRecord(cta, 'title', next))} /></label>
    <label><SmallLabel>Subtitle</SmallLabel><TextInput value={cta.subtitle} multiline onChange={(next) => onChange(updateRecord(cta, 'subtitle', next))} /></label>
    <div className="grid gap-3 md:grid-cols-2"><div><SmallLabel>Primary action</SmallLabel><ActionEditor value={cta.primary} onChange={(next) => onChange(updateRecord(cta, 'primary', next))} /></div><div><SmallLabel>Secondary action</SmallLabel><ActionEditor value={cta.secondary} onChange={(next) => onChange(updateRecord(cta, 'secondary', next))} /></div></div>
    <div><SmallLabel>Background image</SmallLabel><MediaEditor value={cta.background} onChange={(next) => onChange(updateRecord(cta, 'background', next))} /></div>
  </div>;
}

function EmptyStateEditor({ value, onChange }: { value: unknown; onChange: (value: unknown) => void }) {
  const state = asRecord(value);
  return <div className="space-y-3"><label><SmallLabel>Title</SmallLabel><TextInput value={state.title} onChange={(next) => onChange(updateRecord(state, 'title', next))} /></label><label><SmallLabel>Description</SmallLabel><TextInput value={state.description} multiline onChange={(next) => onChange(updateRecord(state, 'description', next))} /></label><div><SmallLabel>Optional call to action</SmallLabel><ActionEditor value={state.cta} onChange={(next) => onChange(updateRecord(state, 'cta', next))} /></div></div>;
}

function SeoEditor({ value, onChange }: { value: unknown; onChange: (value: unknown) => void }) {
  const seo = asRecord(value);
  return <div className="space-y-3"><div className="grid gap-3 md:grid-cols-2"><label><SmallLabel>SEO title</SmallLabel><TextInput value={seo.title} onChange={(next) => onChange(updateRecord(seo, 'title', next))} /></label><label><SmallLabel>SEO description</SmallLabel><TextInput value={seo.description} multiline onChange={(next) => onChange(updateRecord(seo, 'description', next))} /></label></div><div className="flex flex-wrap gap-5 text-sm text-admin-muted"><label className="flex items-center gap-2"><input type="checkbox" checked={seo.index !== false} onChange={(event) => onChange(updateRecord(seo, 'index', event.target.checked))} className="h-4 w-4 accent-rave-red" /> Index this page</label><label className="flex items-center gap-2"><input type="checkbox" checked={seo.follow !== false} onChange={(event) => onChange(updateRecord(seo, 'follow', event.target.checked))} className="h-4 w-4 accent-rave-red" /> Follow links</label></div><div><SmallLabel>Social preview image</SmallLabel><MediaEditor value={seo.ogImage} onChange={(next) => onChange(updateRecord(seo, 'ogImage', next))} /></div></div>;
}

function StructuredField({ type, value, onChange }: { type: FieldType; value: unknown; onChange: (value: unknown) => void }) {
  switch (type) {
    case 'media': return <MediaEditor value={value} onChange={onChange} />;
    case 'string-list': return <StringListEditor value={value} onChange={onChange} />;
    case 'info-list': return <InfoListEditor value={value} onChange={onChange} />;
    case 'faq-list': return <FaqListEditor value={value} onChange={onChange} />;
    case 'steps-list': return <StepsListEditor value={value} onChange={onChange} />;
    case 'filters': return <FiltersEditor value={value} onChange={onChange} />;
    case 'sections': return <SectionsEditor value={value} onChange={onChange} />;
    case 'action': return <ActionEditor value={value} onChange={onChange} />;
    case 'cta': return <CtaEditor value={value} onChange={onChange} />;
    case 'empty-state': return <EmptyStateEditor value={value} onChange={onChange} />;
    case 'seo': return <SeoEditor value={value} onChange={onChange} />;
    default: return null;
  }
}

export default function CmsEditor({ contentKey, title, description }: { contentKey: string; title: string; description?: string }) {
  const toast = useToast();
  const [draft, setDraft] = useState<JsonRecord | null>(null);
  const [status, setStatus] = useState('DRAFT');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const fields = useMemo(() => fieldsFor(contentKey), [contentKey]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetch('/api/v1/auth/session', { credentials: 'include' }).then((response) => response.json()),
      fetch(`/api/v1/admin/page-content/${encodeURIComponent(contentKey)}`, { credentials: 'include' }).then((response) => response.json()),
    ]).then(([sessionPayload, payload]) => {
      if (cancelled) return;
      setCsrfToken(sessionPayload?.data?.csrfToken ?? null);
      const record = payload?.data;
      setDraft(record?.data ?? null);
      setStatus(record?.status ?? 'DRAFT');
    }).catch(() => toast('error', 'Could not load page content.')).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [contentKey, toast]);

  const save = async (nextStatus: 'DRAFT' | 'PUBLISHED') => {
    if (!draft) return;
    setBusy(true);
    const response = await fetch(`/api/v1/admin/page-content/${encodeURIComponent(contentKey)}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'content-type': 'application/json', ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}) },
      body: JSON.stringify({ data: draft, status: nextStatus, locale: 'en' }),
    });
    const payload = await response.json().catch(() => null);
    setBusy(false);
    if (!response.ok) { toast('error', payload?.message ?? 'Could not save page content.'); return; }
    setStatus(payload?.data?.status ?? nextStatus);
    toast('success', nextStatus === 'PUBLISHED' ? 'Published page content.' : 'Saved draft.');
  };

  if (loading) return <div className="rounded-[14px] border border-admin-border bg-admin-panel p-6 text-admin-muted">Loading page content…</div>;
  if (!draft) return <div className="rounded-[14px] border border-rose-400/30 bg-admin-panel p-6 text-rose-200">Page content has not been seeded yet.</div>;

  return <section className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="font-heading text-2xl font-bold uppercase tracking-wide text-white">{title}</h1>{description && <p className="mt-1 text-sm text-admin-muted">{description}</p>}<p className="mt-2 text-xs uppercase tracking-[0.18em] text-admin-muted">Key: {contentKey} · {status}</p></div><div className="flex gap-2"><button type="button" disabled={busy} onClick={() => void save('DRAFT')} className="inline-flex min-h-[42px] items-center gap-2 rounded-[9px] border border-admin-border px-4 text-sm text-white hover:bg-white/5"><Save className="h-4 w-4" /> Save draft</button><button type="button" disabled={busy} onClick={() => void save('PUBLISHED')} className="inline-flex min-h-[42px] items-center gap-2 rounded-[9px] bg-rave-red px-4 text-sm font-semibold text-white hover:bg-rave-red2"><Save className="h-4 w-4" /> Publish</button></div></div>
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">{fields.map((field) => {
      const value = getPath(draft, field.path);
      const type = field.type ?? (typeof value === 'boolean' ? 'boolean' : field.path.toLowerCase().includes('description') ? 'textarea' : 'text');
      const id = `cms-${field.path.replaceAll('.', '-')}`;
      const update = (next: unknown) => setDraft(setPath(draft, field.path, next));
      return <div key={field.path} className={`${field.wide || !['text', 'textarea', 'number', 'boolean'].includes(type) ? 'xl:col-span-2' : ''} rounded-[12px] border border-admin-border bg-admin-panel/80 p-4`}>
        <label htmlFor={id} className="mb-2 block text-sm font-medium text-white">{field.label}</label>
        {type === 'boolean' ? <input id={id} type="checkbox" checked={value === true} onChange={(event) => update(event.target.checked)} className="h-5 w-5 accent-rave-red" /> : ['media', 'string-list', 'info-list', 'faq-list', 'steps-list', 'filters', 'sections', 'action', 'cta', 'empty-state', 'seo'].includes(type) ? <StructuredField type={type} value={value} onChange={update} /> : <TextInput value={value} multiline={type === 'textarea'} type={type === 'number' ? 'number' : 'text'} onChange={(next) => update(type === 'number' ? Number(next) : next)} />}
        {field.help && <span className="mt-2 block text-xs text-admin-muted">{field.help}</span>}
      </div>;
    })}</div>
    <p className="flex items-center gap-2 text-xs text-admin-muted"><RotateCcw className="h-3.5 w-3.5" /> EN is stored here; VI falls back to EN until a translated draft is saved.</p>
  </section>;
}
