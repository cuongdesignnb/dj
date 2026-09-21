'use client';

import { useEffect, useMemo, useState } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/components/admin/ui/Toast';

type FieldType = 'text' | 'textarea' | 'number' | 'boolean' | 'json';
type Field = { path: string; label: string; type?: FieldType; help?: string };

const fieldsFor = (key: string): Field[] => {
  const kind = key.startsWith('tickets:') ? 'tickets' : key.startsWith('tables:') ? 'tables' : key.startsWith('booking:') ? 'booking' : key === 'global-content' ? 'global' : 'listing';
  if (kind === 'tickets') return [
    { path: 'hero.eyebrow', label: 'Hero eyebrow' }, { path: 'hero.title', label: 'Hero title' }, { path: 'hero.description', label: 'Hero description', type: 'textarea' }, { path: 'hero.image', label: 'Hero image', type: 'json' }, { path: 'hero.sideNotes', label: 'Hero side notes', type: 'json' }, { path: 'hero.footNotes', label: 'Hero foot notes', type: 'json' },
    { path: 'selector.eyebrow', label: 'Selector eyebrow' }, { path: 'selector.title', label: 'Selector title' }, { path: 'selector.description', label: 'Selector description', type: 'textarea' }, { path: 'selector.aside', label: 'Selector aside' }, { path: 'selector.emptyTitle', label: 'Empty state title' }, { path: 'selector.emptyDescription', label: 'Empty state description', type: 'textarea' },
    { path: 'trustItems', label: 'Trust items', type: 'json' }, { path: 'infoItems', label: 'Information cards', type: 'json' }, { path: 'faq', label: 'FAQ repeater', type: 'json' }, { path: 'provider.unavailableNote', label: 'Provider unavailable note', type: 'textarea' },
    { path: 'finalCta.title', label: 'Final CTA title' }, { path: 'finalCta.subtitle', label: 'Final CTA subtitle', type: 'textarea' }, { path: 'finalCta.primary.label', label: 'Primary CTA label' }, { path: 'finalCta.primary.href', label: 'Primary CTA URL' }, { path: 'finalCta.secondary.label', label: 'Secondary CTA label' }, { path: 'finalCta.secondary.href', label: 'Secondary CTA URL' },
    { path: 'seo.title', label: 'SEO title' }, { path: 'seo.description', label: 'SEO description', type: 'textarea' }, { path: 'seo.index', label: 'Indexable', type: 'boolean' }, { path: 'seo.follow', label: 'Follow links', type: 'boolean' },
  ];
  if (kind === 'tables') return [
    { path: 'hero.eyebrow', label: 'Hero eyebrow' }, { path: 'hero.titleLine1', label: 'Hero title line 1' }, { path: 'hero.titleLine2', label: 'Hero title line 2' }, { path: 'hero.description', label: 'Hero description', type: 'textarea' }, { path: 'hero.image', label: 'Hero image', type: 'json' }, { path: 'hero.sideNotes', label: 'Hero side notes', type: 'json' }, { path: 'hero.footNotes', label: 'Hero foot notes', type: 'json' },
    { path: 'map.eyebrow', label: 'Map eyebrow' }, { path: 'map.title', label: 'Map title' }, { path: 'map.description', label: 'Map description', type: 'textarea' }, { path: 'map.disclaimer', label: 'Map disclaimer', type: 'textarea' }, { path: 'map.stageLabel', label: 'Stage label' }, { path: 'infoTitle', label: 'VIP information title' }, { path: 'infoContext', label: 'VIP information context' }, { path: 'infoItems', label: 'VIP information cards', type: 'json' }, { path: 'faqContext', label: 'FAQ context' }, { path: 'faq', label: 'FAQ repeater', type: 'json' },
    { path: 'finalCta.title', label: 'Final CTA title' }, { path: 'finalCta.subtitle', label: 'Final CTA subtitle', type: 'textarea' }, { path: 'finalCta.primary.label', label: 'Primary CTA label' }, { path: 'finalCta.primary.href', label: 'Primary CTA URL' }, { path: 'finalCta.secondary.label', label: 'Secondary CTA label' }, { path: 'finalCta.secondary.href', label: 'Secondary CTA URL' }, { path: 'seo.title', label: 'SEO title' }, { path: 'seo.description', label: 'SEO description', type: 'textarea' }, { path: 'seo.index', label: 'Indexable', type: 'boolean' }, { path: 'seo.follow', label: 'Follow links', type: 'boolean' },
  ];
  if (kind === 'booking') return [
    { path: 'hero.eyebrow', label: 'Hero eyebrow' }, { path: 'hero.titleLine1', label: 'Hero title line 1' }, { path: 'hero.titleLine2', label: 'Hero title line 2' }, { path: 'hero.description', label: 'Hero description', type: 'textarea' }, { path: 'hero.image', label: 'Hero image', type: 'json' }, { path: 'hero.sideNotes', label: 'Hero side notes', type: 'json' }, { path: 'hero.footNotes', label: 'Hero foot notes', type: 'json' },
    { path: 'tabs.tickets', label: 'Ticket tab label' }, { path: 'tabs.vip', label: 'VIP tab label' }, { path: 'form.heading', label: 'Form heading' }, { path: 'form.description', label: 'Form description', type: 'textarea' }, { path: 'form.nameLabel', label: 'Name label' }, { path: 'form.emailLabel', label: 'Email label' }, { path: 'form.phoneLabel', label: 'Phone label' }, { path: 'form.groupSizeLabel', label: 'Group size label' }, { path: 'form.boothLabel', label: 'Booth label' }, { path: 'form.bottleLabel', label: 'Bottle label' }, { path: 'form.specialRequestLabel', label: 'Special request label' }, { path: 'form.submitLabel', label: 'Submit label' }, { path: 'bookingNotes', label: 'Booking notes', type: 'json' }, { path: 'notesTitle', label: 'Booking notes title' }, { path: 'notesContext', label: 'Booking notes context' }, { path: 'processSteps', label: 'Process steps', type: 'json' }, { path: 'faq', label: 'FAQ repeater', type: 'json' }, { path: 'faqContext', label: 'FAQ context' },
    { path: 'finalCta.title', label: 'Final CTA title' }, { path: 'finalCta.subtitle', label: 'Final CTA subtitle', type: 'textarea' }, { path: 'finalCta.primary.label', label: 'Primary CTA label' }, { path: 'finalCta.primary.href', label: 'Primary CTA URL' }, { path: 'finalCta.secondary.label', label: 'Secondary CTA label' }, { path: 'finalCta.secondary.href', label: 'Secondary CTA URL' }, { path: 'seo.title', label: 'SEO title' }, { path: 'seo.description', label: 'SEO description', type: 'textarea' }, { path: 'seo.index', label: 'Indexable', type: 'boolean' }, { path: 'seo.follow', label: 'Follow links', type: 'boolean' },
  ];
  if (kind === 'global') return [{ path: 'tagline', label: 'Brand tagline' }, { path: 'footerDescription', label: 'Footer description', type: 'textarea' }, { path: 'ageNotice', label: '18+ notice' }, { path: 'genericCtaFallback', label: 'Generic CTA', type: 'json' }, { path: 'copyright', label: 'Copyright' }, { path: 'emptyCopy', label: 'Global empty copy' }, { path: 'seo.title', label: 'SEO title' }, { path: 'seo.description', label: 'SEO description', type: 'textarea' }, { path: 'seo.index', label: 'Indexable', type: 'boolean' }, { path: 'seo.follow', label: 'Follow links', type: 'boolean' }];
  return [{ path: 'hero.eyebrow', label: 'Hero eyebrow' }, { path: 'hero.title', label: 'Hero title' }, { path: 'hero.titleLine1', label: 'Hero title line 1' }, { path: 'hero.titleLine2', label: 'Hero title line 2' }, { path: 'hero.description', label: 'Hero description', type: 'textarea' }, { path: 'hero.image', label: 'Hero image', type: 'json' }, { path: 'hero.sideNotes', label: 'Hero side notes', type: 'json' }, { path: 'hero.footNotes', label: 'Hero foot notes', type: 'json' }, { path: 'hero.primary', label: 'Hero primary CTA', type: 'json' }, { path: 'hero.secondary', label: 'Hero secondary CTA', type: 'json' }, { path: 'filters', label: 'Filter labels', type: 'json' }, { path: 'sections', label: 'Featured/info sections', type: 'json' }, { path: 'emptyState', label: 'Empty state', type: 'json' }, { path: 'finalCta', label: 'Final CTA', type: 'json' }, { path: 'seo.title', label: 'SEO title' }, { path: 'seo.description', label: 'SEO description', type: 'textarea' }, { path: 'seo.index', label: 'Indexable', type: 'boolean' }, { path: 'seo.follow', label: 'Follow links', type: 'boolean' }];
};

function getPath(value: Record<string, any>, path: string): any { return path.split('.').reduce((current, key) => current?.[key], value); }
function setPath(value: Record<string, any>, path: string, next: any) { const keys = path.split('.'); const copy = structuredClone(value); let cursor = copy; keys.slice(0, -1).forEach((key) => { if (!cursor[key] || typeof cursor[key] !== 'object') cursor[key] = {}; cursor = cursor[key]; }); cursor[keys[keys.length - 1]] = next; return copy; }

export default function CmsEditor({ contentKey, title, description }: { contentKey: string; title: string; description?: string }) {
  const toast = useToast();
  const [draft, setDraft] = useState<Record<string, any> | null>(null);
  const [status, setStatus] = useState('DRAFT');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const fields = useMemo(() => fieldsFor(contentKey), [contentKey]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([fetch('/api/v1/auth/session', { credentials: 'include' }).then((response) => response.json()), fetch(`/api/v1/admin/page-content/${encodeURIComponent(contentKey)}`, { credentials: 'include' }).then((response) => response.json())]).then(([sessionPayload, payload]) => {
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
    const response = await fetch(`/api/v1/admin/page-content/${encodeURIComponent(contentKey)}`, { method: 'PATCH', credentials: 'include', headers: { 'content-type': 'application/json', ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}) }, body: JSON.stringify({ data: draft, status: nextStatus, locale: 'en' }) });
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
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">{fields.map((field) => { const value = getPath(draft, field.path); const type = field.type ?? (typeof value === 'boolean' ? 'boolean' : field.path.toLowerCase().includes('description') ? 'textarea' : 'text'); const id = `cms-${field.path.replaceAll('.', '-')}`; return <label key={field.path} htmlFor={id} className="rounded-[12px] border border-admin-border bg-admin-panel/80 p-4"><span className="mb-2 block text-sm font-medium text-white">{field.label}</span>{type === 'boolean' ? <input id={id} type="checkbox" checked={value === true} onChange={(event) => setDraft(setPath(draft, field.path, event.target.checked))} className="h-5 w-5 accent-rave-red" /> : type === 'json' ? <textarea id={id} value={JSON.stringify(value ?? null, null, 2)} onChange={(event) => { try { setDraft(setPath(draft, field.path, JSON.parse(event.target.value))); } catch { /* keep the draft until JSON is complete */ } }} rows={7} className="w-full rounded-[8px] border border-admin-border bg-admin-bg px-3 py-2 font-mono text-xs text-white focus:border-rave-red focus:outline-none" /> : type === 'textarea' ? <textarea id={id} value={value ?? ''} onChange={(event) => setDraft(setPath(draft, field.path, event.target.value))} rows={4} className="w-full rounded-[8px] border border-admin-border bg-admin-bg px-3 py-2 text-sm text-white focus:border-rave-red focus:outline-none" /> : <input id={id} type={type === 'number' ? 'number' : 'text'} value={value ?? ''} onChange={(event) => setDraft(setPath(draft, field.path, type === 'number' ? Number(event.target.value) : event.target.value))} className="w-full rounded-[8px] border border-admin-border bg-admin-bg px-3 py-2 text-sm text-white focus:border-rave-red focus:outline-none" />}{field.help && <span className="mt-1 block text-xs text-admin-muted">{field.help}</span>}</label>; })}</div>
    <p className="flex items-center gap-2 text-xs text-admin-muted"><RotateCcw className="h-3.5 w-3.5" /> EN is stored here; VI falls back to EN until a translated draft is saved.</p>
  </section>;
}
