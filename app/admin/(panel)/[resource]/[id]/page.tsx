import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ExternalLink, Pencil } from 'lucide-react';
import AdminPageHeader from '@/components/admin/layout/AdminPageHeader';
import OrderActions from '@/components/admin/modules/OrderActions';
import PaymentActions from '@/components/admin/modules/PaymentActions';
import AdminCard from '@/components/admin/ui/AdminCard';
import { buttonClass } from '@/components/admin/ui/buttonClass';
import { PageReveal } from '@/components/admin/ui/Reveal';
import { AccessDenied, ErrorState } from '@/components/admin/ui/States';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import { can } from '@/lib/admin/auth/session';
import type { Permission } from '@/lib/admin/auth/permissions';
import type { ResourceKey } from '@/lib/admin/common/resource';
import { formatDate, textOf } from '@/lib/admin/common/table';
import type { AdminRecord } from '@/lib/admin/common/types';
import { gate, loadOptionSets } from '@/lib/admin/page-data';
import { ROUTED_RESOURCES, getRepository, getResource } from '@/lib/admin/registry';
import { formatMoney } from '@/lib/money';
import type { Money } from '@/lib/money';

type Props = { params: Promise<{ resource: string; id: string }> };
type Json = Record<string, unknown>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const definition = getResource((await params).resource);
  return { title: definition ? definition.singular : 'Not found' };
}

const money = (value: unknown) => (value && typeof value === 'object' ? formatMoney(value as Money) : 'Not set');
const arr = (value: unknown) => (Array.isArray(value) ? (value as Json[]) : []);
const obj = (value: unknown) => (value && typeof value === 'object' ? (value as Json) : {});
const str = (value: unknown, empty = 'Not set') => {
  const t = textOf(value);
  return t === '—' ? empty : t;
};

function Facts({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs uppercase tracking-wider text-admin-muted">{label}</dt>
          <dd className="mt-0.5 break-words text-white">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Thumb({ src, alt, className = 'aspect-[4/3]' }: { src?: unknown; alt?: unknown; className?: string }) {
  if (typeof src !== 'string' || !src) {
    return <div className={`grid place-items-center rounded-[10px] border border-dashed border-admin-border text-xs text-admin-muted ${className}`}>No image</div>;
  }
  return (
    <div className={`relative overflow-hidden rounded-[10px] border border-admin-border bg-admin-deep ${className}`}>
      <Image src={src} alt={String(alt ?? '')} fill sizes="(min-width: 1280px) 360px, 90vw" className="object-cover" />
    </div>
  );
}

function EventDetail({ record, artistNames }: { record: AdminRecord; artistNames: Map<string, string> }) {
  const venue = obj(record.venue);
  const tickets = obj(record.tickets);
  const vip = obj(record.vip);
  const hero = obj(record.heroImage);
  const date =
    record.dateStatus === 'confirmed' && record.startDate
      ? `${formatDate(record.startDate)}${record.startTime ? `, ${record.startTime}` : ''}`
      : 'To be announced';
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-5">
        <AdminCard title="Overview" titleId="d-overview">
          <Facts
            items={[
              ['Status', <StatusBadge key="s" value={String(record.status)} />],
              ['Featured', record.featured ? 'Yes' : 'No'],
              ['Date', date],
              ['Schedule', record.scheduleStatus === 'confirmed' ? 'Confirmed' : 'To be confirmed'],
              ['Venue', [venue.name, venue.city, venue.region].filter(Boolean).join(', ') || 'Not set'],
              ['Slug', `/${String(record.slug)}`],
            ]}
          />
          <p className="mt-4 text-sm text-white/80">{str(record.shortDescription, 'No description yet.')}</p>
        </AdminCard>
        <AdminCard title="Ticket Tiers" titleId="d-tickets">
          {arr(tickets.tiers).length === 0 ? (
            <p className="text-sm text-admin-muted">No ticket tiers yet.</p>
          ) : (
            <ul className="divide-y divide-admin-border text-sm">
              {arr(tickets.tiers).map((t, i) => (
                <li key={i} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="text-white">
                    {String(t.name)} {t.badge ? <span className="ml-1 text-xs text-admin-muted">{String(t.badge)}</span> : null}
                  </span>
                  <span className="text-admin-muted">
                    {money(t.price)} · {[t.online && 'Online', t.door && 'At the door'].filter(Boolean).join(', ') || 'Not on sale'}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-admin-muted">
            {tickets.providerMode === 'external' && tickets.providerUrl
              ? `Sales handled by the ticket provider: ${String(tickets.providerUrl)}`
              : 'No ticket provider connected. Availability is not tracked here.'}
          </p>
        </AdminCard>
        <AdminCard title="VIP Tables" titleId="d-vip">
          {!vip.enabled ? (
            <p className="text-sm text-admin-muted">VIP tables are off for this event.</p>
          ) : (
            <Facts
              items={[
                ['Package', str(vip.packageName)],
                ['Price', money(vip.price)],
                ['Capacity', vip.capacity ? `${String(vip.capacity)} guests` : 'Not set'],
                ['Included bottles', vip.includedBottles ? String(vip.includedBottles) : 'Not set'],
                ['Booths', String(arr(vip.booths).length)],
                ['Availability', vip.availabilityMode === 'managed' ? 'Managed by booking system' : 'On request'],
              ]}
            />
          )}
        </AdminCard>
        <AdminCard title="Lineup" titleId="d-lineup">
          {arr(record.artistIds).length === 0 ? (
            <p className="text-sm text-admin-muted">No artists assigned.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {(record.artistIds as string[]).map((id) => (
                <li key={id}>
                  <Link href={`/admin/artists/${id}`} className="inline-flex rounded-full border border-admin-border px-3 py-1 text-sm text-white hover:border-rave-red/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red">
                    {artistNames.get(id) ?? id}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>
      <div className="space-y-5">
        <Thumb src={hero.src} alt={hero.alt} className="aspect-[16/10]" />
        <AdminCard title="Updated" titleId="d-updated">
          <p className="text-sm text-white">{formatDate(record.updatedAt, true)}</p>
        </AdminCard>
      </div>
    </div>
  );
}

function ArtistDetail({ record }: { record: AdminRecord }) {
  const portrait = obj(record.portrait);
  const links = Object.entries(obj(record.links)).filter(([, v]) => typeof v === 'string' && v);
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      <Thumb src={portrait.src} alt={portrait.alt} className="aspect-[4/5]" />
      <div className="space-y-5">
        <AdminCard title="Profile" titleId="d-profile">
          <Facts
            items={[
              ['Status', <StatusBadge key="s" value={String(record.status)} />],
              ['Featured', record.featured ? 'Yes' : 'No'],
              ['Country', str(record.country)],
              ['Genres', arr(record.genres).length ? (record.genres as string[]).join(', ') : 'Not set'],
              ['Set time', record.setTimeStatus === 'confirmed' && record.setTime ? String(record.setTime) : 'To be announced'],
              ['Updated', formatDate(record.updatedAt, true)],
            ]}
          />
        </AdminCard>
        <AdminCard title="Biography" titleId="d-bio">
          <p className="whitespace-pre-line text-sm text-white/85">{str(record.bio, 'No biography yet. Add the artist’s own words when they supply them.')}</p>
        </AdminCard>
        <AdminCard title="Links" titleId="d-links">
          {links.length === 0 ? (
            <p className="text-sm text-admin-muted">No links added.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {links.map(([k, v]) => (
                <li key={k}>
                  <span className="capitalize text-admin-muted">{k}: </span>
                  <span className="break-all text-white">{String(v)}</span>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>
    </div>
  );
}

function ProductDetail({ record }: { record: AdminRecord }) {
  const images = arr(record.images);
  const variants = arr(record.variants);
  const first = obj(images[0]?.image);
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="space-y-3">
        <Thumb src={first.src} alt={first.alt} className="aspect-square" />
        {images.length > 1 && (
          <ul className="grid grid-cols-4 gap-2">
            {images.slice(1, 5).map((img, i) => {
              const m = obj(img.image);
              return (
                <li key={i}>
                  <Thumb src={m.src} alt={m.alt} className="aspect-square" />
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="space-y-5">
        <AdminCard title="Product" titleId="d-product">
          <Facts
            items={[
              ['Status', <StatusBadge key="s" value={String(record.status)} />],
              ['Price', money(record.price)],
              ['Stock', <StatusBadge key="k" value={String(record.stockStatus ?? 'unknown')} />],
              ['Sizes', arr(record.sizes).length ? (record.sizes as string[]).join(', ') : 'Not set'],
              ['Colours', arr(record.colors).length ? (record.colors as string[]).join(', ') : 'Not set'],
              ['Updated', formatDate(record.updatedAt, true)],
            ]}
          />
          <p className="mt-4 text-sm text-white/80">{str(record.excerpt, 'No summary yet.')}</p>
        </AdminCard>
        <AdminCard title="Variants" titleId="d-variants">
          {variants.length === 0 ? (
            <p className="text-sm text-admin-muted">No variants defined.</p>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <caption className="sr-only">Variants</caption>
                <thead>
                  <tr className="border-b border-admin-border text-left text-xs uppercase tracking-wider text-admin-muted">
                    <th scope="col" className="py-2 pr-3 font-medium">SKU</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Size</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Colour</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Price</th>
                    <th scope="col" className="py-2 font-medium">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v, i) => (
                    <tr key={i} className="border-b border-admin-border/60 last:border-0">
                      <td className="py-2 pr-3 font-mono text-xs text-white/85">{str(v.sku, '—')}</td>
                      <td className="py-2 pr-3 text-white/85">{str(v.size, '—')}</td>
                      <td className="py-2 pr-3 text-white/85">{str(v.color, '—')}</td>
                      <td className="py-2 pr-3 text-white/85">{v.priceOverride ? money(v.priceOverride) : 'Base price'}</td>
                      <td className="py-2">
                        <StatusBadge value={String(v.stockStatus || 'unknown')} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-xs text-admin-muted">Stock is not tracked live. Quantities come from the backend once it is connected.</p>
        </AdminCard>
      </div>
    </div>
  );
}

function OrderDetail({ record, canEdit }: { record: AdminRecord; canEdit: boolean }) {
  const lines = arr(record.lines);
  const notes = arr(record.notes);
  const timeline = arr(record.timeline);
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-5">
        <AdminCard title="Items" titleId="d-items">
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[460px] text-sm">
              <caption className="sr-only">Order items</caption>
              <thead>
                <tr className="border-b border-admin-border text-left text-xs uppercase tracking-wider text-admin-muted">
                  <th scope="col" className="py-2 pr-3 font-medium">Item</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">Qty</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">Price</th>
                  <th scope="col" className="py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={i} className="border-b border-admin-border/60">
                    <td className="py-2.5 pr-3">
                      <span className="text-white">{String(l.title)}</span>
                      <span className="block text-xs text-admin-muted">{String(l.variant)}</span>
                    </td>
                    <td className="py-2.5 pr-3 text-right text-white/85">{String(l.quantity)}</td>
                    <td className="py-2.5 pr-3 text-right text-white/85">{money(l.unitPrice)}</td>
                    <td className="py-2.5 text-right text-white">{money(l.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="text-sm">
                <tr>
                  <th scope="row" colSpan={3} className="pt-3 pr-3 text-right font-normal text-admin-muted">Subtotal</th>
                  <td className="pt-3 text-right text-white">{money(record.subtotal)}</td>
                </tr>
                <tr>
                  <th scope="row" colSpan={3} className="pt-1 pr-3 text-right font-normal text-admin-muted">Shipping</th>
                  <td className="pt-1 text-right text-white/85">{record.shipping ? money(record.shipping) : 'Not calculated'}</td>
                </tr>
                <tr>
                  <th scope="row" colSpan={3} className="pt-2 pr-3 text-right font-semibold text-white">Total</th>
                  <td className="pt-2 text-right font-semibold text-white">{money(record.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </AdminCard>
        <AdminCard title="Timeline" titleId="d-timeline">
          <ol className="space-y-2 text-sm">
            {timeline.map((t, i) => (
              <li key={i} className="flex flex-wrap justify-between gap-2">
                <span className="text-white">{String(t.label)}</span>
                <span className="text-xs text-admin-muted">{formatDate(t.at, true)}</span>
              </li>
            ))}
          </ol>
        </AdminCard>
        <AdminCard title="Notes" titleId="d-notes">
          {notes.length === 0 ? (
            <p className="text-sm text-admin-muted">No notes yet.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {notes.map((n, i) => (
                <li key={i}>
                  <p className="whitespace-pre-line text-white">{String(n.body)}</p>
                  <p className="text-xs text-admin-muted">
                    {String(n.author)} · {formatDate(n.at, true)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>
      <div className="space-y-5">
        <AdminCard title="Summary" titleId="d-summary">
          <Facts
            items={[
              ['Payment', <StatusBadge key="p" value={String(record.paymentStatus)} />],
              ['Fulfilment', <StatusBadge key="f" value={String(record.fulfillmentStatus)} />],
              ['Placed', formatDate(record.createdAt, true)],
              ['Items', String(record.itemCount)],
            ]}
          />
        </AdminCard>
        <AdminCard title="Customer" titleId="d-customer">
          <p className="text-sm text-white">{String(record.customerName)}</p>
          <p className="break-all text-sm text-admin-muted">{String(record.email)}</p>
          <p className="mt-2 text-xs text-admin-muted">The shipping address comes from the order backend once checkout is connected.</p>
        </AdminCard>
        <OrderActions
          id={record.id}
          paymentStatus={String(record.paymentStatus)}
          fulfillmentStatus={String(record.fulfillmentStatus)}
          canEdit={canEdit}
        />
      </div>
    </div>
  );
}

function PaymentDetail({ record, canEdit }: { record: AdminRecord; canEdit: boolean }) {
  const refunds = arr(record.refunds);
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-5">
        <AdminCard title="Provider record" titleId="d-provider-payment"><Facts items={[
          ['Provider', String(record.provider ?? 'Square')],
          ['Square payment', String(record.providerPaymentId ?? record.id)],
          ['Square order', String(record.providerOrderId || 'Not set')],
          ['Checkout intent', String(record.checkoutIntentId || 'Not set')],
          ['Location', String(record.locationId || 'Not set')],
          ['Paid at', record.paidAt ? formatDate(record.paidAt, true) : 'Not completed'],
        ]} /></AdminCard>
        <AdminCard title="Refunds" titleId="d-refunds">
          {refunds.length === 0 ? <p className="text-sm text-admin-muted">No refunds recorded.</p> : <ul className="space-y-2 text-sm">{refunds.map((refund, index) => <li key={index} className="flex justify-between gap-3 border-b border-admin-border pb-2"><span>{String(refund.status)}</span><span>{money({ amountMinor: Number(refund.amountMinor), currency: String(record.amount && typeof record.amount === 'object' ? (record.amount as Record<string, unknown>).currency : record.currency ?? 'AUD') })}</span></li>)}</ul>}
        </AdminCard>
      </div>
      <div className="space-y-5"><AdminCard title="Amount" titleId="d-payment-amount"><Facts items={[
        ['Status', <StatusBadge key="s" value={String(record.status)} />],
        ['Amount', money(record.amount)],
        ['Created', formatDate(record.createdAt, true)],
      ]} /></AdminCard><PaymentActions id={String(record.id)} status={String(record.status)} canEdit={canEdit} /></div>
    </div>
  );
}

function TicketPurchaseDetail({ record }: { record: AdminRecord }) {
  return <div className="grid grid-cols-1 gap-5 lg:grid-cols-2"><AdminCard title="Customer and hold" titleId="d-ticket-purchase"><Facts items={[
    ['Customer', String(record.customerName ?? 'Not set')],
    ['Email', String(record.customerEmail ?? 'Not set')],
    ['Status', <StatusBadge key="s" value={String(record.status)} />],
    ['Quantity', String(record.quantity ?? 0)],
    ['Issued QR tickets', String(record.issuedCount ?? 0)],
    ['Expires', formatDate(record.expiresAt, true)],
  ]} /></AdminCard><AdminCard title="Amount" titleId="d-ticket-amount"><Facts items={[
    ['Total', money(record.amount)],
    ['Event', String(record.eventId ?? 'Not set')],
    ['Created', formatDate(record.createdAt, true)],
  ]} /></AdminCard></div>;
}

function VipBookingDetail({ record }: { record: AdminRecord }) {
  return <div className="grid grid-cols-1 gap-5 lg:grid-cols-2"><AdminCard title="VIP booking" titleId="d-vip-booking"><Facts items={[
    ['Customer', String(record.customerName ?? 'Not set')],
    ['Email', String(record.customerEmail ?? 'Not set')],
    ['Status', <StatusBadge key="s" value={String(record.status)} />],
    ['Event', String(record.eventId ?? 'Not set')],
    ['Package', String(record.vipPackageId ?? 'Not set')],
    ['Booth', String(record.boothId || 'Not selected')],
    ['Expires', formatDate(record.expiresAt, true)],
  ]} /></AdminCard><AdminCard title="Amount" titleId="d-vip-amount"><Facts items={[
    ['Due now', money(record.amount)],
    ['Total package', money(record.total)],
    ['Created', formatDate(record.createdAt, true)],
  ]} /></AdminCard></div>;
}

export default async function ResourceDetailPage({ params }: Props) {
  const { resource, id } = await params;
  const definition = getResource(resource);
  if (!definition || !ROUTED_RESOURCES.includes(resource as ResourceKey)) notFound();
  if (!definition.hasDetail) redirect(`${definition.basePath}/${encodeURIComponent(id)}/edit`);

  const { session, allowed } = await gate(`${definition.permission}.view` as Permission);
  if (!allowed) return <AccessDenied />;

  const result = await (await getRepository(definition.key)).get(decodeURIComponent(id));
  if (!result.ok) {
    return <ErrorState title={`Could not load this ${definition.singular.toLowerCase()}`} message={result.error.message} />;
  }
  const record = result.data;
  if (!record) notFound();

  const title = textOf(record[definition.titleKey]);
  const canEdit = can(session, `${definition.permission}.edit` as Permission);
  const publicPath = definition.actions.includes('preview') ? definition.publicPath?.(record) : null;
  const artistNames =
    definition.key === 'events'
      ? new Map((await loadOptionSets(['artists'])).artists.map((o) => [o.value, o.label]))
      : new Map<string, string>();

  return (
    <PageReveal>
      <AdminPageHeader
        eyebrow={definition.singular}
        title={title}
        trail={[
          { label: 'Dashboard', href: '/admin' },
          { label: definition.label, href: definition.basePath },
          { label: title },
        ]}
        actions={
          <>
            {publicPath && (
              <a href={publicPath} target="_blank" rel="noopener noreferrer" className={buttonClass.secondary}>
                <ExternalLink aria-hidden className="h-4 w-4" /> View on site<span className="sr-only"> (opens in a new tab)</span>
              </a>
            )}
            {definition.form && canEdit && (
              <Link href={`${definition.basePath}/${record.id}/edit`} className={buttonClass.primary}>
                <Pencil aria-hidden className="h-4 w-4" /> Edit
              </Link>
            )}
            {definition.key === 'events' && (
              <div className="flex flex-wrap gap-2">
                <Link href={`/admin/events/${record.id}/tickets`} className={buttonClass.secondary}>Manage Tickets</Link>
                <Link href={`/admin/events/${record.id}/vip`} className={buttonClass.secondary}>Manage VIP Tables</Link>
                <Link href={`/admin/events/${record.id}/edit#artists`} className={buttonClass.ghost}>Manage Lineup</Link>
                <Link href={`/admin/events/${record.id}/edit#gallery`} className={buttonClass.ghost}>Manage Gallery</Link>
              </div>
            )}
          </>
        }
      />
      {definition.key === 'events' ? (
        <EventDetail record={record} artistNames={artistNames} />
      ) : definition.key === 'artists' ? (
        <ArtistDetail record={record} />
      ) : definition.key === 'products' ? (
        <ProductDetail record={record} />
      ) : definition.key === 'payments' ? (
        <PaymentDetail record={record} canEdit={canEdit} />
      ) : definition.key === 'ticket-purchases' ? (
        <TicketPurchaseDetail record={record} />
      ) : definition.key === 'vip-bookings' ? (
        <VipBookingDetail record={record} />
      ) : (
        <OrderDetail record={record} canEdit={canEdit} />
      )}
    </PageReveal>
  );
}
