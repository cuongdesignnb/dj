'use client';

import type { ReactNode } from 'react';
import RichTextEditor from '@/components/admin/form/RichTextEditor';
import { dollarsToMinor } from '@/lib/admin/events/vip-package';
import { TIER_AVAILABILITY, formatMoney, minorToDollars } from '@/lib/admin/events/tickets';

type Row = Record<string, unknown>;

const inputClass = 'mt-1 w-full rounded border border-admin-border bg-admin-bg px-3 py-2 text-sm text-white aria-[invalid=true]:border-rave-red';

function Field({ id, label, help, error, children }: { id: string; label: string; help?: string; error?: string; children: ReactNode }) {
  return (
    <div className="text-xs text-admin-muted">
      <label htmlFor={id} className="block text-sm text-white">{label}</label>
      {children}
      {error ? <p id={`${id}-error`} className="mt-1 text-xs text-[#FF6B82]">{error}</p> : help ? <p id={`${id}-help`} className="mt-1">{help}</p> : null}
    </div>
  );
}

function Toggle({ id, checked, onChange, label, help }: { id: string; checked: boolean; onChange: (value: boolean) => void; label: string; help: string }) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 rounded-[10px] border border-admin-border bg-admin-bg/60 p-3">
      <input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-rave-red" />
      <span><span className="block text-sm text-white">{label}</span><span className="block text-xs text-admin-muted">{help}</span></span>
    </label>
  );
}

const text = (value: unknown) => (value === null || value === undefined ? '' : String(value));

/** Visual ticket tier form: dollars instead of cents, labelled options instead of codes. */
export default function TicketTierFields({ row, update, errors = {}, idPrefix }: { row: Row; update: (key: string, value: unknown) => void; errors?: Record<string, string>; idPrefix: string }) {
  const id = (key: string) => `${idPrefix}-${key}`;
  const aria = (key: string, help = true) => ({ id: id(key), 'aria-invalid': errors[key] ? true : undefined, 'aria-describedby': errors[key] ? `${id(key)}-error` : help ? `${id(key)}-help` : undefined });
  const currency = typeof row.currency === 'string' && row.currency ? row.currency : 'AUD';
  const priceText = typeof row._priceDollars === 'string' ? row._priceDollars : minorToDollars(row.priceMinor);
  const priceMinor = dollarsToMinor(priceText);
  const availability = TIER_AVAILABILITY.find((option) => option.value === row.availabilityStatus) ?? TIER_AVAILABILITY[TIER_AVAILABILITY.length - 1];
  const priceHelp = priceText.trim() === '' ? 'Enter dollars, e.g. 45.00.' : priceMinor === null ? 'Not a valid amount. Use dollars and cents, e.g. 45.00.' : `Shown as ${formatMoney(priceMinor, currency)}.`;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field id={id('name')} label="Tier name *" help="e.g. General Admission, Early Bird, VIP." error={errors.name}>
          <input {...aria('name')} value={text(row.name)} onChange={(event) => update('name', event.target.value)} className={inputClass} />
        </Field>
        <Field id={id('badge')} label="Badge (optional)" help="Short label on the card, e.g. Best value." error={errors.badge}>
          <input {...aria('badge')} value={text(row.badge)} maxLength={120} onChange={(event) => update('badge', event.target.value)} className={inputClass} />
        </Field>
        <div className="text-xs text-admin-muted md:col-span-2">
          <span className="mb-1 block text-sm text-white">Description</span>
          <RichTextEditor id={id('description')} ariaLabel="Tier description" mode="inline" value={text(row.description)} onChange={(markdown) => update('description', markdown)} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field id={id('price')} label={`Price (${currency}) *`} help={priceHelp} error={errors.priceMinor}>
          <input id={id('price')} aria-invalid={errors.priceMinor || (priceText.trim() !== '' && priceMinor === null) ? true : undefined} aria-describedby={errors.priceMinor ? `${id('price')}-error` : `${id('price')}-help`} inputMode="decimal" placeholder="45.00" value={priceText} onChange={(event) => update('_priceDollars', event.target.value)} className={inputClass} />
        </Field>
        <Field id={id('currency')} label="Currency" help="3-letter code, e.g. AUD." error={errors.currency}>
          <input {...aria('currency')} value={currency} maxLength={3} onChange={(event) => update('currency', event.target.value.toUpperCase())} className={inputClass} />
        </Field>
        <Field id={id('availabilityStatus')} label="Availability" help={availability.help} error={errors.availabilityStatus}>
          <select {...aria('availabilityStatus')} value={availability.value} onChange={(event) => update('availabilityStatus', event.target.value)} className={inputClass}>
            {TIER_AVAILABILITY.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </Field>
        <Field id={id('capacity')} label="Capacity (optional)" help="Total tickets for this tier. Blank = no limit." error={errors.capacity}>
          <input {...aria('capacity')} type="number" min={1} step={1} value={text(row.capacity)} onChange={(event) => update('capacity', event.target.value)} className={inputClass} />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field id={id('minQuantity')} label="Minimum per order" help="Usually 1." error={errors.minQuantity}>
          <input {...aria('minQuantity')} type="number" min={0} step={1} value={text(row.minQuantity ?? 1)} onChange={(event) => update('minQuantity', event.target.value)} className={inputClass} />
        </Field>
        <Field id={id('maxQuantity')} label="Maximum per order (optional)" help="Blank = no limit per order." error={errors.maxQuantity}>
          <input {...aria('maxQuantity')} type="number" min={1} step={1} value={text(row.maxQuantity)} onChange={(event) => update('maxQuantity', event.target.value)} className={inputClass} />
        </Field>
        <Field id={id('defaultQuantity')} label="Pre-selected quantity (optional)" help="Quantity already chosen when the page opens." error={errors.defaultQuantity}>
          <input {...aria('defaultQuantity')} type="number" min={0} step={1} value={text(row.defaultQuantity)} onChange={(event) => update('defaultQuantity', event.target.value)} className={inputClass} />
        </Field>
        <Field id={id('sortOrder')} label="Display order" help="Lower numbers show first." error={errors.sortOrder}>
          <input {...aria('sortOrder')} type="number" min={0} step={1} value={text(row.sortOrder ?? 0)} onChange={(event) => update('sortOrder', event.target.value)} className={inputClass} />
        </Field>
      </div>

      <div data-tour="tier-toggles" className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Toggle id={id('enabled')} checked={row.enabled !== false} onChange={(value) => update('enabled', value)} label="Show on tickets page" help="Off hides this tier from the public page." />
        <Toggle id={id('highlighted')} checked={row.highlighted === true} onChange={(value) => update('highlighted', value)} label="Highlight" help="Feature this tier's card." />
        <Toggle id={id('purchasableOnline')} checked={row.purchasableOnline === true} onChange={(value) => update('purchasableOnline', value)} label="Sell online" help="Needs Online sales enabled in Ticket Settings." />
        <Toggle id={id('purchasableAtDoor')} checked={row.purchasableAtDoor === true} onChange={(value) => update('purchasableAtDoor', value)} label="Sell at the door" help="Needs Door sales enabled in Ticket Settings." />
      </div>
    </div>
  );
}
