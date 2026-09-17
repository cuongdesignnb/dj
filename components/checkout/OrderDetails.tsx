import Image from 'next/image';
import { CalendarDays, CircleCheck, Clock, CircleX, Mail, PackageCheck, Receipt, Truck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { optionLabel } from '@/lib/cart/input';
import type { OrderProgressStep, OrderStatus, VerifiedOrder } from '@/lib/checkout/types';
import { formatMoney } from '@/lib/shop/pricing';
import { ORDER_STATUS_LABELS } from './resultCopy';

const STATUS_ICONS: Record<OrderStatus, LucideIcon> = {
  paid: CircleCheck,
  processing: CircleCheck,
  pending: Clock,
  failed: CircleX,
  cancelled: CircleX,
};

const STEP_ICONS: LucideIcon[] = [PackageCheck, Truck, Mail];

const DATE_FORMAT = new Intl.DateTimeFormat('en-AU', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: process.env.NEXT_PUBLIC_EVENT_TIME_ZONE ?? 'UTC',
});

function Info({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[12px] border border-white/[0.08] bg-rave-deep/80 p-4">
      <Icon aria-hidden className="mt-0.5 h-6 w-6 shrink-0 text-white/80" strokeWidth={1.6} />
      <div className="min-w-0">
        <dt className="text-xs text-rave-muted">{label}</dt>
        <dd className="mt-1 text-sm font-semibold text-white">{children}</dd>
      </div>
    </div>
  );
}

function stepStateLabel(state: OrderProgressStep['state']) {
  return state === 'done' ? 'Complete' : state === 'active' ? 'In progress' : 'Upcoming';
}

/** Verified order: reference, date, status, email state, lines and next steps. */
export default function OrderDetails({ order }: { order: VerifiedOrder }) {
  const StatusIcon = STATUS_ICONS[order.status];
  const good = order.status === 'paid' || order.status === 'processing';
  const showSteps = order.progress.length > 0 && order.status !== 'failed' && order.status !== 'cancelled';

  return (
    <div className="flex flex-col gap-5">
      <section
        aria-labelledby="order-details-title"
        className="rounded-[20px] border border-white/[0.08] bg-rave-panel/70 p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2
            id="order-details-title"
            className="font-heading text-3xl font-black uppercase tracking-tight text-white sm:text-4xl"
          >
            Order Details
          </h2>
          <p className="font-heading text-xs uppercase tracking-[0.3em] text-rave-muted">
            Order #{order.orderNumber}
          </p>
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Info icon={Receipt} label="Order Number">
            {order.orderNumber}
          </Info>
          <Info icon={CalendarDays} label="Order Date">
            <time dateTime={order.createdAt}>{DATE_FORMAT.format(new Date(order.createdAt))}</time>
          </Info>
          <Info icon={StatusIcon} label="Status">
            <span className={good ? 'text-rave-red' : 'text-white'}>
              {ORDER_STATUS_LABELS[order.status]}
            </span>
          </Info>
          <Info icon={Mail} label="Email">
            {order.confirmationEmailSent ? (
              <>
                Confirmation sent
                <span className="block text-xs font-normal text-rave-muted">to your email</span>
              </>
            ) : (
              <>
                Not sent yet
                <span className="block text-xs font-normal text-rave-muted">
                  {good ? 'will follow by email' : 'no confirmation for this checkout'}
                </span>
              </>
            )}
          </Info>
        </dl>

        <h3 className="mt-7 font-heading text-sm uppercase tracking-[0.3em] text-white/80">
          Items Ordered
        </h3>

        {/* Table from md up; stacked rows below, so nothing scrolls sideways. */}
        <table className="mt-3 hidden w-full border-collapse text-left md:table">
          <thead>
            <tr className="bg-white/[0.05] font-heading text-xs uppercase tracking-wider text-white/70">
              <th scope="col" className="rounded-l-[8px] px-3 py-2 font-medium">Product</th>
              <th scope="col" className="px-3 py-2 font-medium">Details</th>
              <th scope="col" className="px-3 py-2 text-center font-medium">Qty</th>
              <th scope="col" className="rounded-r-[8px] px-3 py-2 text-right font-medium">Price</th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((line) => {
              const options = [line.sizeLabel && `Size: ${line.sizeLabel}`, line.colorLabel && `Color: ${line.colorLabel}`].filter(Boolean);
              return (
                <tr key={line.id} className="border-b border-white/[0.08]">
                  <td className="px-3 py-3">
                    <span className="relative block h-20 w-24 overflow-hidden rounded-[8px] border border-white/10 bg-rave-deep">
                      {line.image && (
                        <Image src={line.image.src} alt="" fill sizes="96px" className="object-cover object-[center_40%]" />
                      )}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-heading text-lg font-bold uppercase text-white">{line.title}</p>
                    {options.map((o) => (
                      <p key={o as string} className="text-sm text-rave-muted">
                        {o}
                      </p>
                    ))}
                  </td>
                  <td className="px-3 py-3 text-center text-white">{line.quantity}</td>
                  <td className="px-3 py-3 text-right font-heading text-xl font-bold text-white">
                    {formatMoney(line.lineTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <ul className="mt-3 flex flex-col divide-y divide-white/[0.08] md:hidden">
          {order.lines.map((line) => {
            const options = optionLabel(line);
            return (
              <li key={line.id} className="flex gap-3 py-3">
                <span className="relative block h-20 w-20 shrink-0 overflow-hidden rounded-[8px] border border-white/10 bg-rave-deep">
                  {line.image && (
                    <Image src={line.image.src} alt="" fill sizes="80px" className="object-cover object-[center_40%]" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-base font-bold uppercase text-white">{line.title}</p>
                  {options && <p className="text-sm text-rave-muted">{options}</p>}
                  <p className="mt-1 flex justify-between text-sm text-white">
                    <span>Qty {line.quantity}</span>
                    <span className="font-heading text-lg font-bold">{formatMoney(line.lineTotal)}</span>
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {showSteps && (
        <section
          aria-labelledby="next-steps-title"
          className="rounded-[20px] border border-white/[0.08] bg-rave-panel/70 p-5 sm:p-6"
        >
          <h2
            id="next-steps-title"
            className="font-heading text-3xl font-black uppercase tracking-tight text-white"
          >
            Next Steps
          </h2>
          <ol className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {order.progress.map((step, i) => {
              const Icon = STEP_ICONS[i % STEP_ICONS.length];
              return (
                <li
                  key={step.id}
                  className={`relative rounded-[14px] border p-4 ${
                    step.state === 'done' ? 'border-rave-red/40' : 'border-white/[0.08]'
                  } bg-rave-deep/80`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <Icon aria-hidden className="h-8 w-8 text-rave-red" strokeWidth={1.5} />
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] ${
                        step.state === 'done'
                          ? 'border-rave-red text-rave-red'
                          : step.state === 'active'
                            ? 'border-white/50 text-white'
                            : 'border-white/20 text-white/50'
                      }`}
                    >
                      {stepStateLabel(step.state)}
                    </span>
                  </div>
                  <h3 className="mt-3 font-heading text-base font-semibold text-white">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-rave-muted">{step.description}</p>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </div>
  );
}
