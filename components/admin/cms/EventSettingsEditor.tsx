'use client';

import { useEffect, useRef, useState } from 'react';
import { Save } from 'lucide-react';
import { useToast } from '@/components/admin/ui/Toast';
import EventReadiness from './EventReadiness';
import ApiErrorNotice from '@/components/admin/ui/ApiErrorNotice';
import { apiRequest } from '@/lib/api/client';
import type { AdminApiError } from '@/lib/admin/common/types';
import { packageChoiceLabel, type PackageChoice } from '@/lib/admin/events/vip-package';
import { SALE_STATUS_LABELS, VIP_PAYMENT_LABELS, isoToLocalInput, localInputToIso } from '@/lib/admin/events/tickets';

type Mode = 'tickets' | 'vip';
type SettingsData = Record<string, string | number | boolean | null | undefined>;

export default function EventSettingsEditor({ eventId, mode }: { eventId: string; mode: Mode }) {
  const toast = useToast();
  const [data, setData] = useState<SettingsData | null>(null);
  const [csrf, setCsrf] = useState('');
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const [packages, setPackages] = useState<PackageChoice[]>([]);
  const [error, setError] = useState<AdminApiError>();
  const inFlight = useRef(false);
  const endpoint = `/api/v1/admin/events/${eventId}/${mode}/settings`;
  useEffect(() => {
    let cancelled = false;
    Promise.all([apiRequest<{ csrfToken: string }>('', '/api/v1/auth/session'), apiRequest<SettingsData>('', endpoint), mode === 'vip' ? apiRequest<PackageChoice[]>('', `/api/v1/admin/events/${eventId}/vip/packages`) : Promise.resolve(null)]).then(([session, result, choices]) => {
      if (cancelled) return;
      if (!session.ok || !result.ok || (choices && !choices.ok)) {
        const failure = !session.ok ? session.error : !result.ok ? result.error : choices && !choices.ok ? choices.error : undefined;
        setError(failure); toast('error', failure?.message ?? 'Could not load event settings.'); return;
      }
      setCsrf(session.data.csrfToken ?? ''); setData(result.data); setPackages(choices?.data ?? []); setError(undefined);
    });
    return () => { cancelled = true; };
  }, [endpoint, eventId, mode, toast]);
  const set = (key: string, value: string | number | boolean | null) => setData((current) => current ? { ...current, [key]: value } : current);
  const save = async () => {
    if (!data || inFlight.current) return;
    inFlight.current = true; setBusy(true); setError(undefined);
    try {
      const result = await apiRequest<SettingsData>('', endpoint, { method: 'PATCH', csrfToken: csrf, body: data });
      if (!result.ok) { setError(result.error); toast('error', result.error.message); return; }
      setData(result.data); setRevision((value) => value + 1); toast('success', 'Event settings saved.');
    } finally { inFlight.current = false; setBusy(false); }
  };
  if (!data) return <div className="rounded-[14px] border border-admin-border bg-admin-panel p-6 text-admin-muted"><ApiErrorNotice error={error} />{!error && 'Loading settings…'}</div>;
  const selectedPackage = packages.find((pkg) => pkg.id === data.defaultPackageId);
  const ticket = mode === 'tickets';
  const fields = ticket ? [
    ['ticketingEnabled', 'Ticketing enabled', 'boolean'], ['saleStatus', 'Sale status', 'select'], ['currency', 'Currency', 'text'], ['onlineSalesEnabled', 'Online sales enabled', 'boolean'], ['doorSalesEnabled', 'Door sales enabled', 'boolean'], ['capacityTracking', 'Capacity tracking', 'boolean'], ['saleStart', 'Sale opens (your local time)', 'datetime-local'], ['saleEnd', 'Sale closes (your local time)', 'datetime-local'], ['squarePaymentEnabled', 'Square payment enabled', 'boolean'], ['externalProviderEnabled', 'External provider enabled', 'boolean'], ['providerName', 'Provider name', 'text'], ['providerUrl', 'Provider URL', 'url'], ['providerEventId', 'Provider event ID', 'text'],
  ] as const : [
    ['vipEnabled', 'VIP enabled', 'boolean'], ['paymentMode', 'Payment mode', 'selectVip'], ['availabilityMode', 'Availability mode', 'text'], ['bookingEnabled', 'Booking enabled', 'boolean'], ['defaultPackageId', 'Default package', 'package'], ['requestExpiryMinutes', 'Request expiry minutes', 'number'], ['boothHoldMinutes', 'Booth hold minutes', 'number'], ['currency', 'Currency', 'text'], ['squarePaymentEnabled', 'Square payment enabled', 'boolean'],
  ] as const;
  // Field errors use the labels editors see, not API keys.
  const labelled = error?.fieldErrors ? { ...error, fieldErrors: Object.fromEntries(Object.entries(error.fieldErrors).map(([key, message]) => [fields.find(([field]) => field === key)?.[1] ?? key, message])) } : error;
  return <section className="space-y-5"><ApiErrorNotice error={labelled} /><EventReadiness eventId={eventId} mode={mode} revision={revision} /><div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="font-heading text-2xl font-bold uppercase text-white">{ticket ? 'Ticket Settings' : 'VIP Settings'}</h1><p className="mt-1 text-sm text-admin-muted">Event-scoped operational settings are stored with the event, not in page copy.</p></div><button type="button" data-tour="settings-save" disabled={busy || !csrf} onClick={() => void save()} className="inline-flex min-h-[42px] items-center gap-2 rounded-[9px] bg-rave-red px-4 text-sm font-semibold text-white"><Save className="h-4 w-4" /> Save settings</button></div><fieldset disabled={busy} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{fields.map(([key, label, type]) => <label key={key} className="rounded-[12px] border border-admin-border bg-admin-panel/80 p-4"><span className="mb-2 block text-sm text-white">{label}</span>{type === 'package' ? <><select aria-label={label} aria-describedby={data.defaultPackageId && (!selectedPackage || !selectedPackage.enabled) ? 'default-package-warning' : undefined} aria-invalid={Boolean(error?.fieldErrors?.defaultPackageId)} value={String(data.defaultPackageId ?? '')} onChange={(event) => { const id = event.target.value; const pkg = packages.find((item) => item.id === id); setData((current) => current ? { ...current, defaultPackageId: id || null, ...(pkg ? { paymentMode: pkg.paymentMode } : {}) } : current); }} className="w-full rounded border border-admin-border bg-admin-bg px-3 py-2 text-sm text-white"><option value="">None</option>{data.defaultPackageId && !selectedPackage && <option value={String(data.defaultPackageId)}>Unavailable package (saved selection)</option>}{packages.map((pkg) => <option key={pkg.id} value={pkg.id}>{packageChoiceLabel(pkg)}</option>)}</select>{data.defaultPackageId && (!selectedPackage || !selectedPackage.enabled) && <p id="default-package-warning" role="status" className="mt-3 text-sm text-amber-200">{selectedPackage ? 'The selected default package is disabled. Enable it in VIP Packages before public VIP can be ready.' : 'The saved default package is unavailable for this event. Choose an existing package.'} No other package is selected automatically.</p>}</> : type === 'boolean' ? <input type="checkbox" checked={data[key] === true} onChange={(event) => set(key, event.target.checked)} className="h-5 w-5 accent-rave-red" /> : type === 'select' ? <select aria-label={label} value={String(data[key] ?? '')} onChange={(event) => set(key, event.target.value)} className="w-full rounded border border-admin-border bg-admin-bg px-3 py-2 text-sm text-white">{Object.entries(SALE_STATUS_LABELS).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select> : type === 'selectVip' ? <select aria-label={label} value={String(data[key] ?? '')} onChange={(event) => set(key, event.target.value)} className="w-full rounded border border-admin-border bg-admin-bg px-3 py-2 text-sm text-white">{Object.entries(VIP_PAYMENT_LABELS).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select> : type === 'datetime-local' ? <input type="datetime-local" aria-label={label} aria-invalid={Boolean(error?.fieldErrors?.[key]) || undefined} value={isoToLocalInput(data[key])} onChange={(event) => set(key, localInputToIso(event.target.value))} className="w-full rounded border border-admin-border bg-admin-bg px-3 py-2 text-sm text-white" /> : <input type={type} aria-label={label} value={String(data[key] ?? '')} onChange={(event) => set(key, type === 'number' ? Number(event.target.value) : event.target.value)} className="w-full rounded border border-admin-border bg-admin-bg px-3 py-2 text-sm text-white" />}</label>)}</fieldset></section>;
}
