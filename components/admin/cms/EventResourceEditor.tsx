'use client';

import { useEffect, useRef, useState } from 'react';
import { GripVertical, Plus, Save, Trash2 } from 'lucide-react';
import { useToast } from '@/components/admin/ui/Toast';
import ApiErrorNotice from '@/components/admin/ui/ApiErrorNotice';
import { apiRequest } from '@/lib/api/client';
import type { AdminApiError } from '@/lib/admin/common/types';
import { packageSavePayload, type BottleChoice } from '@/lib/admin/events/vip-package';
import VipPackageFields from './VipPackageFields';
import RichTextEditor from '@/components/admin/form/RichTextEditor';

type Resource = 'tiers' | 'packages' | 'booths' | 'bottles';
type Row = Record<string, any>;

const blank = (resource: Resource): Row => resource === 'tiers' ? { name: '', description: '', priceMinor: 0, currency: 'AUD', badge: '', capacity: null, availabilityStatus: 'UNKNOWN', purchasableOnline: false, purchasableAtDoor: false, minQuantity: 1, maxQuantity: null, defaultQuantity: null, highlighted: false, sortOrder: 0, enabled: true } : resource === 'packages' ? { name: '', description: '', priceMinor: 0, depositAmountMinor: null, currency: 'AUD', capacity: 1, includedBottleCount: 0, minBottleSelection: 0, maxBottleSelection: 0, enabled: false, sortOrder: 0, paymentMode: 'REQUEST_ONLY' } : resource === 'booths' ? { code: '', label: '', zone: 'front', x: 50, y: 50, requestable: true, availabilityStatus: 'ON_REQUEST', enabled: true, sortOrder: 0 } : { name: '', mediaId: null, description: '', category: '', enabled: true, sortOrder: 0 };

export default function EventResourceEditor({ eventId, resource }: { eventId: string; resource: Resource }) {
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [bottles, setBottles] = useState<BottleChoice[]>([]);
  const [csrf, setCsrf] = useState('');
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const [loadedFor, setLoadedFor] = useState('');
  const [loadError, setLoadError] = useState<AdminApiError>();
  const [rowErrors, setRowErrors] = useState<Record<number, AdminApiError | undefined>>({});
  const endpoint = `/api/v1/admin/events/${eventId}/${resource === 'tiers' ? 'tickets' : 'vip'}/${resource}`;
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiRequest<{ csrfToken: string }>('', '/api/v1/auth/session'),
      apiRequest<Row[]>('', endpoint),
      resource === 'packages' ? apiRequest<BottleChoice[]>('', `/api/v1/admin/events/${eventId}/vip/bottles`) : Promise.resolve(null),
    ]).then(([session, result, choices]) => {
      if (cancelled) return;
      setLoadedFor(endpoint);
      if (!session.ok || !result.ok || (choices && !choices.ok)) {
        const error = !session.ok ? session.error : !result.ok ? result.error : choices && !choices.ok ? choices.error : undefined;
        setLoadError(error); toast('error', error?.message ?? 'Could not load module data.'); return;
      }
      setLoadError(undefined); setCsrf(session.data.csrfToken ?? ''); setRows(result.data);
      setBottles(choices?.data ?? []); setRowErrors({});
    });
    return () => { cancelled = true; };
  }, [endpoint, eventId, resource, toast]);
  const update = (index: number, key: string, value: unknown) => setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row));
  const save = async (index: number) => {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setRowErrors((current) => ({ ...current, [index]: undefined }));
    try {
      const row = rows[index];
      const result = await apiRequest<Row>('', row.id ? `${endpoint}/${row.id}` : endpoint, {
        method: row.id ? 'PATCH' : 'POST', csrfToken: csrf, body: resource === 'packages' ? packageSavePayload(row) : row,
      });
      if (!result.ok) { setRowErrors((current) => ({ ...current, [index]: result.error })); toast('error', result.error.message); return; }
      setRows((current) => current.map((item, rowIndex) => rowIndex === index ? result.data : item));
      toast('success', resource === 'packages' ? 'VIP package saved.' : 'Saved.');
    } finally { inFlight.current = false; setBusy(false); }
  };
  const remove = async (index: number) => {
    if (inFlight.current) return;
    const row = rows[index];
    if (!row.id) { setRows((current) => current.filter((_, rowIndex) => rowIndex !== index)); setRowErrors({}); return; }
    inFlight.current = true; setBusy(true);
    try {
      const result = await apiRequest<unknown>('', `${endpoint}/${row.id}`, { method: 'DELETE', csrfToken: csrf });
      if (!result.ok) { setRowErrors((current) => ({ ...current, [index]: result.error })); toast('error', result.error.message); return; }
      setRows((current) => current.filter((_, rowIndex) => rowIndex !== index)); setRowErrors({}); toast('success', 'Removed or disabled.');
    } finally { inFlight.current = false; setBusy(false); }
  };
  const title = resource === 'tiers' ? 'Ticket Tiers' : resource === 'packages' ? 'VIP Packages' : resource === 'booths' ? 'Booth / Club Map' : 'Bottle Options';
  const fields: Array<[string, string, string]> = resource === 'tiers' ? [['name', 'Name', 'text'], ['description', 'Description', 'text'], ['priceMinor', 'Price minor units', 'number'], ['currency', 'Currency', 'text'], ['capacity', 'Capacity', 'number'], ['availabilityStatus', 'Availability', 'text'], ['purchasableOnline', 'Online', 'boolean'], ['purchasableAtDoor', 'Door', 'boolean'], ['highlighted', 'Highlighted', 'boolean'], ['enabled', 'Enabled', 'boolean']] : resource === 'booths' ? [['code', 'Code', 'text'], ['label', 'Label', 'text'], ['zone', 'Zone', 'text'], ['x', 'X %', 'number'], ['y', 'Y %', 'number'], ['availabilityStatus', 'Availability', 'text'], ['requestable', 'Requestable', 'boolean'], ['enabled', 'Enabled', 'boolean']] : [['name', 'Name', 'text'], ['description', 'Description', 'text'], ['category', 'Category', 'text'], ['mediaId', 'Media ID', 'text'], ['enabled', 'Enabled', 'boolean']];
  if (loadedFor !== endpoint) return <div className="p-6 text-admin-muted">Loading…</div>;
  if (loadError) return <ApiErrorNotice error={loadError} />;
  return <section className="space-y-5">
    <ApiErrorNotice error={loadError} />
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="font-heading text-2xl font-bold uppercase text-white">{title}</h1><p className="mt-1 text-sm text-admin-muted">{resource === 'packages' ? 'Save package details and assign existing bottles. Request only is not a confirmed reservation or payment.' : 'CRUD and ordering are persisted through the event module API.'}</p></div><button type="button" disabled={busy || Boolean(loadError)} onClick={() => setRows((current) => [...current, blank(resource)])} className="inline-flex min-h-[42px] items-center gap-2 rounded-[9px] border border-admin-border px-4 text-sm text-white"><Plus className="h-4 w-4" /> Add {resource === 'booths' ? 'booth' : resource === 'packages' ? 'package' : resource === 'bottles' ? 'bottle' : 'tier'}</button></div>
    {resource === 'booths' && <div className="relative aspect-[16/7] overflow-hidden rounded-[14px] border border-admin-border bg-[radial-gradient(circle_at_center,rgba(255,23,61,.18),transparent_50%),#0b0b12]"><span className="absolute inset-x-0 top-1/2 border-t border-white/20" />{rows.map((row, index) => <button key={row.id ?? `new-${index}`} type="button" aria-label={`Move booth ${row.code || index + 1}`} onPointerMove={(event) => { if (event.buttons !== 1 || busy) return; const rect = event.currentTarget.parentElement?.getBoundingClientRect(); if (!rect) return; update(index, 'x', Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100))); update(index, 'y', Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100))); }} style={{ left: `${row.x ?? 50}%`, top: `${row.y ?? 50}%` }} className="absolute grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-rave-red bg-rave-red/30 text-[10px] text-white">{row.code || index + 1}</button>)}</div>}
    {rows.map((row, index) => <article key={row.id ?? `new-${index}`} data-resource-id={row.id ?? ''} aria-label={row.name || row.code || row.label || `New ${resource}`} className="rounded-[12px] border border-admin-border bg-admin-panel/80 p-5">
      <div className="mb-4 flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-sm font-semibold text-white"><GripVertical className="h-4 w-4 text-admin-muted" /> {row.name || row.code || row.label || `New ${resource}`}</span><div className="flex gap-2"><button type="button" disabled={busy || !csrf} onClick={() => void save(index)} className="inline-flex items-center gap-1 rounded border border-rave-red/50 px-3 py-2 text-sm text-white"><Save className="h-4 w-4" /> {busy ? 'Saving…' : 'Save'}</button><button type="button" disabled={busy || !csrf} onClick={() => void remove(index)} aria-label="Delete or disable" className="rounded border border-rose-400/40 p-2 text-rose-200"><Trash2 className="h-4 w-4" /></button></div></div>
      <ApiErrorNotice error={rowErrors[index]} />
      <fieldset disabled={busy}>{resource === 'packages' ? <VipPackageFields row={row} bottles={bottles} update={(key, value) => update(index, key, value)} errors={rowErrors[index]?.fieldErrors} /> : <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">{fields.map(([key, label, type]) => resource === 'tiers' && key === 'description' ? <div key={key} className="text-xs text-admin-muted md:col-span-2 xl:col-span-4"><span className="mb-1 block">{label}</span><RichTextEditor id={`tier-description-${String(row.id ?? `new-${index}`)}`} ariaLabel="Tier description" mode="inline" value={String(row.description ?? '')} onChange={(markdown) => update(index, 'description', markdown)} /></div> : <label key={key} className="text-xs text-admin-muted">{label}{type === 'boolean' ? <input type="checkbox" checked={row[key] === true} onChange={(event) => update(index, key, event.target.checked)} className="ml-2 h-4 w-4 accent-rave-red" /> : <input type={type} value={row[key] ?? ''} onChange={(event) => update(index, key, type === 'number' ? Number(event.target.value) : event.target.value)} className="mt-1 w-full rounded border border-admin-border bg-admin-bg px-2 py-2 text-sm text-white" />}</label>)}</div>}</fieldset>
    </article>)}
  </section>;
}
