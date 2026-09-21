'use client';

import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { useToast } from '@/components/admin/ui/Toast';

type Mode = 'tickets' | 'vip';

export default function EventSettingsEditor({ eventId, mode }: { eventId: string; mode: Mode }) {
  const toast = useToast();
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [csrf, setCsrf] = useState('');
  const [busy, setBusy] = useState(false);
  const endpoint = `/api/v1/admin/events/${eventId}/${mode}/settings`;
  useEffect(() => {
    Promise.all([fetch('/api/v1/auth/session').then((response) => response.json()), fetch(endpoint).then((response) => response.json())]).then(([session, payload]) => { setCsrf(session?.data?.csrfToken ?? ''); setData(payload?.data ?? null); }).catch(() => toast('error', 'Could not load event settings.'));
  }, [endpoint, toast]);
  const set = (key: string, value: any) => setData((current) => current ? { ...current, [key]: value } : current);
  const save = async () => {
    if (!data) return;
    setBusy(true);
    const response = await fetch(endpoint, { method: 'PATCH', headers: { 'content-type': 'application/json', 'x-csrf-token': csrf }, body: JSON.stringify(data) });
    const payload = await response.json().catch(() => null);
    setBusy(false);
    if (!response.ok) toast('error', payload?.message ?? 'Could not save settings.'); else { setData(payload?.data ?? data); toast('success', 'Event settings saved.'); }
  };
  if (!data) return <div className="rounded-[14px] border border-admin-border bg-admin-panel p-6 text-admin-muted">Loading settings…</div>;
  const ticket = mode === 'tickets';
  const fields = ticket ? [
    ['ticketingEnabled', 'Ticketing enabled', 'boolean'], ['saleStatus', 'Sale status', 'select'], ['currency', 'Currency', 'text'], ['onlineSalesEnabled', 'Online sales enabled', 'boolean'], ['doorSalesEnabled', 'Door sales enabled', 'boolean'], ['capacityTracking', 'Capacity tracking', 'boolean'], ['saleStart', 'Global sale start', 'datetime-local'], ['saleEnd', 'Global sale end', 'datetime-local'], ['squarePaymentEnabled', 'Square payment enabled', 'boolean'], ['externalProviderEnabled', 'External provider enabled', 'boolean'], ['providerName', 'Provider name', 'text'], ['providerUrl', 'Provider URL', 'url'], ['providerEventId', 'Provider event ID', 'text'],
  ] as const : [
    ['vipEnabled', 'VIP enabled', 'boolean'], ['paymentMode', 'Payment mode', 'selectVip'], ['availabilityMode', 'Availability mode', 'text'], ['bookingEnabled', 'Booking enabled', 'boolean'], ['defaultPackageId', 'Default package ID', 'text'], ['requestExpiryMinutes', 'Request expiry minutes', 'number'], ['boothHoldMinutes', 'Booth hold minutes', 'number'], ['currency', 'Currency', 'text'], ['squarePaymentEnabled', 'Square payment enabled', 'boolean'],
  ] as const;
  return <section className="space-y-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="font-heading text-2xl font-bold uppercase text-white">{ticket ? 'Ticket Settings' : 'VIP Settings'}</h1><p className="mt-1 text-sm text-admin-muted">Event-scoped operational settings are stored with the event, not in page copy.</p></div><button type="button" disabled={busy} onClick={() => void save()} className="inline-flex min-h-[42px] items-center gap-2 rounded-[9px] bg-rave-red px-4 text-sm font-semibold text-white"><Save className="h-4 w-4" /> Save settings</button></div><div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{fields.map(([key, label, type]) => <label key={key} className="rounded-[12px] border border-admin-border bg-admin-panel/80 p-4"><span className="mb-2 block text-sm text-white">{label}</span>{type === 'boolean' ? <input type="checkbox" checked={data[key] === true} onChange={(event) => set(key, event.target.checked)} className="h-5 w-5 accent-rave-red" /> : type === 'select' ? <select value={data[key] ?? ''} onChange={(event) => set(key, event.target.value)} className="w-full rounded border border-admin-border bg-admin-bg px-3 py-2 text-sm text-white"><option>COMING_SOON</option><option>ON_SALE</option><option>PAUSED</option><option>SOLD_OUT</option><option>ENDED</option></select> : type === 'selectVip' ? <select value={data[key] ?? ''} onChange={(event) => set(key, event.target.value)} className="w-full rounded border border-admin-border bg-admin-bg px-3 py-2 text-sm text-white"><option>REQUEST_ONLY</option><option>FULL_PAYMENT</option><option>DEPOSIT</option></select> : <input type={type} value={data[key] ?? ''} onChange={(event) => set(key, type === 'number' ? Number(event.target.value) : event.target.value)} className="w-full rounded border border-admin-border bg-admin-bg px-3 py-2 text-sm text-white" />}</label>)}</div></section>;
}
