'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { CircleAlert, ExternalLink, Eye, Save, Send } from 'lucide-react';
import { saveRecord, saveSingleton } from '@/app/admin/actions';
import type { ActionResult } from '@/app/admin/actions';
import { getPath, sameValue, setPath, slugify } from '@/lib/admin/common/paths';
import type { FieldConfig, FormSchema, FormSection, Option } from '@/lib/admin/common/schema';
import { validateValues } from '@/lib/admin/common/validation';
import { ConfirmDialog, buttonClass } from '../ui/Dialog';
import StatusBadge from '../ui/StatusBadge';
import { useToast } from '../ui/Toast';
import FieldInput, { inputClass, isVisible, widthClass } from './FieldInput';
import type { FieldContext, MediaChoice } from './FieldInput';

type Values = Record<string, unknown>;

export type FormTarget =
  | { kind: 'resource'; resourceKey: string; id: string | null; basePath: string }
  | { kind: 'singleton'; key: string };

const SEO_TAB = 'SEO';

const SEO_FIELDS: FieldConfig[] = [
  { key: 'seo.title', label: 'Meta title', type: 'text', maxLength: 70, help: 'Leave empty to use the title.' },
  { key: 'seo.description', label: 'Meta description', type: 'textarea', maxLength: 170 },
  { key: 'seo.canonical', label: 'Canonical URL', type: 'url', help: 'Only set when this content lives at another address.' },
  { key: 'seo.ogImage', label: 'Social share image', type: 'media' },
  { key: 'seo.index', label: 'Allow search indexing', type: 'toggle' },
  { key: 'seo.follow', label: 'Allow following links', type: 'toggle' },
];

const LOCALIZED = new Set(['localizedText', 'localizedTextarea']);

function textOf(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object' && !Array.isArray(v)) return String((v as { en?: string }).en ?? '');
  return '';
}

function hasLocalized(fields: FieldConfig[]): boolean {
  return fields.some((f) => LOCALIZED.has(f.type) || (f.itemFields ? hasLocalized(f.itemFields) : false));
}

function SerpPreview({ title, url, description }: { title: string; url: string; description: string }) {
  return (
    <div className="rounded-[10px] border border-admin-border bg-white p-4 text-left" aria-label="Search result preview">
      <p className="truncate text-xs text-[#4d5156]">{url}</p>
      <p className="mt-1 line-clamp-1 text-lg leading-snug text-[#1a0dab]">{title || 'Untitled'}</p>
      <p className="mt-1 line-clamp-2 text-sm text-[#4d5156]">{description || 'No description yet. Search engines will pick text from the page.'}</p>
    </div>
  );
}

function Panel({ title, description, children, id }: { title: string; description?: string; children: ReactNode; id?: string }) {
  return (
    <section aria-labelledby={id} className="rounded-[12px] border border-admin-border bg-admin-panel/90 p-4 sm:p-5">
      <h2 id={id} className="font-heading text-base font-semibold uppercase tracking-[0.08em] text-white">
        {title}
      </h2>
      {description && <p className="mt-1 text-sm text-admin-muted">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/**
 * The single form engine behind every create/edit screen. It renders the
 * module's schema, tracks unsaved changes, validates as the server will, and
 * keeps saving separate from publishing.
 */
export default function ResourceForm({
  schema,
  initial,
  target,
  canEdit,
  canPublish,
  optionSets,
  media,
  previewHref,
  publicUrl,
  updatedLabel,
  aside,
  submitLabel,
}: {
  schema: FormSchema;
  initial: Values;
  target: FormTarget;
  canEdit: boolean;
  canPublish: boolean;
  optionSets: Record<string, Option[]>;
  media: MediaChoice[];
  previewHref?: string | null;
  /** Public address prefix for the search preview, e.g. "/news/". */
  publicUrl?: string;
  updatedLabel?: string;
  aside?: ReactNode;
  submitLabel?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState<Values>(initial);
  const [saved, setSaved] = useState<Values>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [language, setLanguage] = useState<'en' | 'vi'>('en');
  const [saving, setSaving] = useState<null | 'save' | 'publish'>(null);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [leaveTo, setLeaveTo] = useState<string | null>(null);
  const [, startRefresh] = useTransition();
  const creating = target.kind === 'resource' && target.id === null;
  const slugTouched = useRef(!creating || !!initial.slug);
  const formRef = useRef<HTMLFormElement>(null);

  const tabs = useMemo(() => {
    if (!schema.tabs?.length) return null;
    return schema.seo ? [...schema.tabs, SEO_TAB] : schema.tabs;
  }, [schema]);
  const [tab, setTab] = useState(tabs?.[0] ?? '');

  const dirty = !sameValue(values, saved);
  const readOnly = !canEdit;
  const statusKey = schema.publish?.statusKey;
  const savedStatus = statusKey ? String(saved[statusKey] ?? 'draft') : null;
  const multilingual = useMemo(() => hasLocalized(schema.sections.flatMap((s) => s.fields)), [schema]);

  const ctx: FieldContext = { language, optionSets, media, readOnly, errors };

  // --- unsaved changes guard -------------------------------------------------
  useEffect(() => {
    if (!dirty) return;
    const onUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const anchor = (e.target as HTMLElement).closest?.('a[href]') as HTMLAnchorElement | null;
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      e.preventDefault();
      e.stopPropagation();
      setLeaveTo(url.pathname + url.search);
    };
    window.addEventListener('beforeunload', onUnload);
    document.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('beforeunload', onUnload);
      document.removeEventListener('click', onClick, true);
    };
  }, [dirty]);

  const change = useCallback(
    (key: string, value: unknown) => {
      setValues((current) => {
        let next = setPath(current, key, value);
        // New records: the slug follows the title until someone edits it.
        if (!slugTouched.current) {
          const slugField = schema.sections.flatMap((s) => s.fields).find((f) => f.type === 'slug' && f.slugFrom === key);
          if (slugField) next = setPath(next, slugField.key, slugify(textOf(getPath(next, key))));
        }
        return next;
      });
      setErrors((current) => {
        if (!current[key]) return current;
        const rest = { ...current };
        delete rest[key];
        return rest;
      });
    },
    [schema],
  );

  const sectionOf = (key: string): FormSection | null =>
    schema.sections.find((s) => s.fields.some((f) => f.key === key)) ?? null;

  const reveal = (fieldErrors: Record<string, string>) => {
    const first = Object.keys(fieldErrors)[0];
    if (!first) return;
    if (tabs) setTab(first.startsWith('seo.') ? SEO_TAB : sectionOf(first)?.tab ?? tabs[0]);
    if (first.startsWith('seo.') || LOCALIZED.has(sectionOf(first)?.fields.find((f) => f.key === first)?.type ?? '')) setLanguage('en');
    window.requestAnimationFrame(() => {
      const box = formRef.current?.querySelector<HTMLElement>(`[data-field="${CSS.escape(first)}"]`);
      box?.scrollIntoView({ block: 'center' });
      box?.querySelector<HTMLElement>('input, textarea, select, button')?.focus({ preventScroll: true });
    });
  };

  const submit = async (intent: 'save' | 'publish') => {
    if (readOnly || saving) return;
    const clientErrors = validateValues(schema, values);
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      toast('error', 'Some fields need attention.');
      reveal(clientErrors);
      return;
    }
    setSaving(intent);
    let result: ActionResult<{ id: string; record: Values }>;
    if (target.kind === 'resource') {
      result = await saveRecord(target.resourceKey, target.id, values, intent);
    } else {
      const r = await saveSingleton(target.key, values);
      result = r.ok ? { ok: true, data: { id: target.key, record: r.data }, message: r.message } : r;
    }
    setSaving(null);
    if (!result.ok) {
      const fieldErrors = result.error.fieldErrors ?? {};
      setErrors(fieldErrors);
      toast('error', result.error.message);
      reveal(fieldErrors);
      return;
    }
    setErrors({});
    const record = result.data.record;
    setValues(record);
    setSaved(record);
    toast('success', result.message ?? 'Saved.');
    if (target.kind === 'resource' && target.id === null) {
      router.replace(`${target.basePath}/${result.data.id}/edit`);
    } else {
      startRefresh(() => router.refresh());
    }
  };

  const onFormKey = (e: KeyboardEvent<HTMLFormElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      void submit('save');
    }
  };

  const statusOptions = (schema.publish?.statuses ?? []).filter((o) => o.value !== 'published' || savedStatus === 'published');

  const renderFields = (fields: FieldConfig[]) => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {fields.map((field) =>
        isVisible(field, values) ? (
          <div key={field.key} className={widthClass(field)}>
            <FieldInput
              field={field}
              path={field.key}
              value={getPath(values, field.key)}
              values={values}
              ctx={ctx}
              onChange={(v) => change(field.key, v)}
              onSlugEdited={() => {
                slugTouched.current = true;
              }}
            />
          </div>
        ) : null,
      )}
    </div>
  );

  const seoPanel = schema.seo ? (
    <Panel title="SEO" description="How this page appears in search results and when shared." id="panel-seo">
      <div className="space-y-4">
        <SerpPreview
          title={String(getPath(values, 'seo.title') || textOf(getPath(values, schema.titleKey)))}
          url={publicUrl !== undefined ? `${publicUrl}${String(values.slug ?? '')}` : previewHref && !previewHref.startsWith('/admin') ? previewHref : `/${String(values.slug ?? '')}`}
          description={String(getPath(values, 'seo.description') || textOf(values.excerpt) || '')}
        />
        {renderFields(SEO_FIELDS)}
      </div>
    </Panel>
  ) : null;

  const visibleSections = tabs ? schema.sections.filter((s) => (s.tab ?? tabs[0]) === tab) : schema.sections;
  const errorList = Object.entries(errors);
  const title = textOf(getPath(values, schema.titleKey));

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!tabs) return;
    let next = index;
    if (e.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;
    e.preventDefault();
    setTab(tabs[next]);
    document.getElementById(`tab-${next}`)?.focus();
  };

  const primaryLabel = submitLabel ?? (creating ? 'Save Draft' : statusKey && savedStatus !== 'published' ? 'Save Draft' : 'Save Changes');

  return (
    <form ref={formRef} noValidate onKeyDown={onFormKey} onSubmit={(e) => { e.preventDefault(); void submit('save'); }} className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-5">
        {readOnly && (
          <p className="rounded-[10px] border border-admin-border bg-white/[0.03] px-4 py-3 text-sm text-admin-muted">
            You can view this but your role cannot change it.
          </p>
        )}

        {errorList.length > 0 && (
          <div role="alert" className="rounded-[10px] border border-rave-red/40 bg-rave-red/[0.06] px-4 py-3 text-sm">
            <p className="flex items-center gap-2 font-semibold text-white">
              <CircleAlert aria-hidden className="h-4 w-4 text-rave-red" /> {errorList.length === 1 ? '1 field needs attention' : `${errorList.length} fields need attention`}
            </p>
            <ul className="mt-2 space-y-1">
              {errorList.map(([key, message]) => (
                <li key={key}>
                  <button type="button" onClick={() => reveal({ [key]: message })} className="text-left text-[#FF8A9C] underline-offset-2 hover:underline focus:outline-none focus-visible:underline">
                    {message}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(tabs || multilingual) && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            {tabs ? (
              <div role="tablist" aria-label="Form sections" className="flex flex-wrap gap-1">
                {tabs.map((name, index) => {
                  const active = name === tab;
                  const hasError = errorList.some(([key]) => (key.startsWith('seo.') ? SEO_TAB : sectionOf(key)?.tab ?? tabs[0]) === name);
                  return (
                    <button
                      key={name}
                      id={`tab-${index}`}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      aria-controls="form-tabpanel"
                      tabIndex={active ? 0 : -1}
                      onClick={() => setTab(name)}
                      onKeyDown={(e) => onTabKey(e, index)}
                      className={`relative min-h-[40px] whitespace-nowrap rounded-[8px] px-3.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red ${
                        active ? 'bg-rave-red/15 text-white shadow-[inset_0_-2px_0_#FF173D]' : 'text-admin-muted hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {name}
                      {hasError && (
                        <>
                          <span aria-hidden className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-rave-red align-middle" />
                          <span className="sr-only"> (has errors)</span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <span />
            )}
            {multilingual && (
              <div role="group" aria-label="Content language" className="inline-flex shrink-0 rounded-[8px] border border-admin-border p-0.5">
                {(['en', 'vi'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    aria-pressed={language === lang}
                    onClick={() => setLanguage(lang)}
                    className={`min-h-[34px] rounded-[6px] px-3 text-xs font-semibold uppercase tracking-wider focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red ${
                      language === lang ? 'bg-white/10 text-white' : 'text-admin-muted hover:text-white'
                    }`}
                  >
                    {lang === 'en' ? 'English' : 'Tiếng Việt'}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {multilingual && language === 'vi' && (
          <p className="rounded-[10px] border border-admin-warning/30 bg-admin-warning/[0.06] px-4 py-2.5 text-xs text-admin-warning">
            Editing Vietnamese. Empty fields fall back to English on the public site.
          </p>
        )}

        <div id="form-tabpanel" role={tabs ? 'tabpanel' : undefined} aria-labelledby={tabs ? `tab-${tabs.indexOf(tab)}` : undefined} className="space-y-5">
          {tab === SEO_TAB
            ? seoPanel
            : visibleSections.map((section) => (
                <Panel key={section.id} title={section.title} description={section.description} id={`section-${section.id}`}>
                  {renderFields(section.fields)}
                </Panel>
              ))}
          {!tabs && seoPanel}
        </div>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-[88px] xl:self-start" aria-label="Save and publish">
        <section className="rounded-[12px] border border-admin-border bg-admin-panel/90 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-heading text-base font-semibold uppercase tracking-[0.08em] text-white">{schema.publish ? 'Publishing' : 'Save'}</h2>
            {savedStatus && <StatusBadge value={savedStatus} />}
          </div>
          <p className="mt-1 truncate text-sm text-white/80">{title || (creating ? 'New item' : 'Untitled')}</p>

          {schema.publish && statusKey && (
            <label className="mt-4 block">
              <span className="mb-1.5 block text-sm font-medium text-white/90">Status</span>
              <select
                value={String(values[statusKey] ?? 'draft')}
                disabled={readOnly}
                onChange={(e) => change(statusKey, e.target.value)}
                className={inputClass}
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-admin-muted">Saving never publishes. Use Publish to go live.</span>
            </label>
          )}

          <dl className="mt-4 space-y-1.5 text-xs">
            <div className="flex justify-between gap-2">
              <dt className="text-admin-muted">Changes</dt>
              <dd aria-live="polite" className={dirty ? 'text-admin-warning' : 'text-admin-success'}>
                {dirty ? 'Unsaved changes' : creating ? 'Not saved yet' : 'All changes saved'}
              </dd>
            </div>
            {updatedLabel && !creating && (
              <div className="flex justify-between gap-2">
                <dt className="text-admin-muted">Last updated</dt>
                <dd className="text-white/80">{updatedLabel}</dd>
              </div>
            )}
          </dl>

          {!readOnly && (
            <div className="mt-5 flex flex-col gap-2">
              <button type="submit" disabled={!!saving || (!dirty && !creating)} aria-busy={saving === 'save' || undefined} className={schema.publish ? buttonClass.secondary : buttonClass.primary}>
                <Save aria-hidden className="h-4 w-4" />
                {saving === 'save' ? 'Saving…' : primaryLabel}
              </button>
              {schema.publish && canPublish && (
                <button type="button" disabled={!!saving} onClick={() => setConfirmPublish(true)} aria-busy={saving === 'publish' || undefined} className={buttonClass.primary}>
                  <Send aria-hidden className="h-4 w-4" />
                  {saving === 'publish' ? 'Publishing…' : savedStatus === 'published' ? 'Update Published' : 'Publish'}
                </button>
              )}
              {schema.publish && !canPublish && <p className="text-xs text-admin-muted">Your role can save drafts but not publish.</p>}
            </div>
          )}

          {previewHref && (
            <a
              href={previewHref}
              target={previewHref.startsWith('/admin') ? undefined : '_blank'}
              rel="noopener noreferrer"
              className={`${buttonClass.ghost} mt-2 w-full`}
            >
              {previewHref.startsWith('/admin') ? <Eye aria-hidden className="h-4 w-4" /> : <ExternalLink aria-hidden className="h-4 w-4" />}
              {previewHref.startsWith('/admin') ? 'Preview' : 'View on site'}
              {!previewHref.startsWith('/admin') && <span className="sr-only"> (opens in a new tab)</span>}
            </a>
          )}
          {!readOnly && <p className="mt-3 hidden text-center text-[11px] text-admin-muted lg:block">Ctrl + S saves</p>}
        </section>
        {aside}
      </aside>

      <ConfirmDialog
        open={confirmPublish}
        tone="primary"
        title={savedStatus === 'published' ? 'Update the live version?' : 'Publish now?'}
        entity={title || undefined}
        consequence={
          savedStatus === 'published'
            ? 'Your current changes will replace what visitors see.'
            : 'It will become visible on the public site once the site reads published content.'
        }
        confirmLabel={savedStatus === 'published' ? 'Update' : 'Publish'}
        busy={saving === 'publish'}
        onCancel={() => setConfirmPublish(false)}
        onConfirm={async () => {
          await submit('publish');
          setConfirmPublish(false);
        }}
      />
      <ConfirmDialog
        open={!!leaveTo}
        title="Discard unsaved changes?"
        consequence="You have changes that have not been saved. Leaving this page will lose them."
        confirmLabel="Discard and leave"
        onCancel={() => setLeaveTo(null)}
        onConfirm={() => {
          const to = leaveTo;
          setSaved(values);
          setLeaveTo(null);
          if (to) router.push(to);
        }}
      />
    </form>
  );
}
