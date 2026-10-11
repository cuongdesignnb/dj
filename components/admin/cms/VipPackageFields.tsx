'use client';

import Image from 'next/image';
import { assignedBottleIds, type BottleChoice } from '@/lib/admin/events/vip-package';
import RichTextEditor from '@/components/admin/form/RichTextEditor';

export default function VipPackageFields({ row, bottles, update, errors = {} }: {
  row: Record<string, unknown>; bottles: BottleChoice[];
  update: (key: string, value: unknown) => void; errors?: Record<string, string>;
}) {
  const inputClass = 'mt-1 w-full rounded border border-admin-border bg-admin-bg px-3 py-2 text-sm text-white';
  const selected = assignedBottleIds(row);
  const currency = typeof row.currency === 'string' ? row.currency : 'AUD';
  const moneyValue = (displayKey: string, key: string) => typeof row[displayKey] === 'string' ? row[displayKey] as string : typeof row[key] === 'number' ? (row[key] / 100).toFixed(2) : '';
  return <>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <label className="text-xs text-admin-muted">Package Name<input value={String(row.name ?? '')} onChange={(event) => update('name', event.target.value)} aria-invalid={Boolean(errors.name)} className={inputClass} /></label>
      <div className="text-xs text-admin-muted md:col-span-2"><span className="mb-1 block">Description</span><RichTextEditor id={`package-description-${String(row.id ?? 'new')}`} ariaLabel="Package description" value={String(row.description ?? '')} onChange={(markdown) => update('description', markdown)} /></div>
      <label className="text-xs text-admin-muted">Price ({currency} dollars)<input inputMode="decimal" value={moneyValue('_priceDollars', 'priceMinor')} onChange={(event) => update('_priceDollars', event.target.value)} aria-invalid={Boolean(errors.priceMinor)} className={inputClass} /><span className="mt-1 block">Enter dollars, e.g. 3200.00. Stored as integer cents.</span></label>
      <label className="text-xs text-admin-muted">Deposit ({currency} dollars)<input inputMode="decimal" value={moneyValue('_depositDollars', 'depositAmountMinor')} onChange={(event) => update('_depositDollars', event.target.value)} aria-invalid={Boolean(errors.depositAmountMinor)} className={inputClass} /><span className="mt-1 block">Optional; leave blank for no deposit.</span></label>
      <label className="text-xs text-admin-muted">Currency<input value={currency} onChange={(event) => update('currency', event.target.value.toUpperCase())} maxLength={3} className={inputClass} /></label>
      {([['capacity', 'Capacity', 1], ['includedBottleCount', 'Included Bottles', 0], ['minBottleSelection', 'Minimum bottle selections', 0], ['maxBottleSelection', 'Maximum bottle selections', 0], ['sortOrder', 'Display order', 0]] as const).map(([key, label, min]) => <label key={key} className="text-xs text-admin-muted">{label}<input type="number" min={min} step={1} value={typeof row[key] === 'number' ? row[key] : ''} onChange={(event) => update(key, event.target.value === '' ? null : Number(event.target.value))} aria-invalid={Boolean(errors[key])} className={inputClass} /></label>)}
      <label className="text-xs text-admin-muted">Payment Mode<select value={String(row.paymentMode ?? 'REQUEST_ONLY')} onChange={(event) => update('paymentMode', event.target.value)} className={inputClass}><option value="REQUEST_ONLY">Request only — no payment confirmation</option><option value="FULL_PAYMENT">Full payment</option><option value="DEPOSIT">Deposit</option></select></label>
      <label className="flex items-center gap-3 text-sm text-white"><input type="checkbox" checked={row.enabled === true} onChange={(event) => update('enabled', event.target.checked)} className="h-5 w-5 accent-rave-red" />Enabled</label>
    </div>
    <fieldset aria-label="Package Bottle Options" className="mt-5 rounded-lg border border-admin-border p-4">
      <legend className="px-2 text-sm font-semibold text-white">Bottle Options</legend>
      <p className="mb-4 text-xs text-admin-muted">Choose existing library bottle options for this package. This does not rename or duplicate bottles. Guests may choose up to the package limit, not all assigned options.</p>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{bottles.map((bottle) => <label key={bottle.id} className="flex items-center gap-3 rounded-lg border border-admin-border bg-admin-bg p-3 text-sm text-white">
        <input type="checkbox" checked={selected.includes(bottle.id)} onChange={(event) => update('bottleOptionIds', event.target.checked ? [...selected, bottle.id] : selected.filter((id) => id !== bottle.id))} className="h-4 w-4 shrink-0 accent-rave-red" />
        {bottle.media?.publicUrl && <Image src={bottle.media.publicUrl} alt={bottle.media.altText || bottle.name} width={44} height={44} className="h-11 w-11 rounded object-contain" />}
        <span>{bottle.name}<span className={`mt-1 block text-xs ${bottle.enabled ? 'text-admin-muted' : 'text-amber-200'}`}>{bottle.enabled ? 'Enabled' : 'Disabled — not selectable by guests'}</span></span>
      </label>)}</div>
      {!bottles.length && <p className="text-sm text-admin-muted">No bottle options exist yet. Add them in Bottle Options before assigning.</p>}
      {selected.some((id) => !bottles.some((bottle) => bottle.id === id)) && <p className="mt-3 text-sm text-amber-200">An assigned bottle is unavailable. Its saved relation is retained until you explicitly change the selection.</p>}
    </fieldset>
  </>;
}
