'use client';

import Link from 'next/link';
import { AlertTriangle, CheckCircle2, ExternalLink, XCircle } from 'lucide-react';
import type { SetupCheck, SetupStatus } from '@/lib/admin/events/setup-status';

const ICONS = {
  ok: <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />,
  blocking: <XCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-rave-red" />,
  warning: <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />,
} as const;

const LEVEL_LABEL = { ok: 'Done', blocking: 'Needs action', warning: 'Check' } as const;

export function SetupBadge({ status }: { status: SetupStatus }) {
  return status.live
    ? <span data-setup-badge="live" className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">Live on site</span>
    : <span data-setup-badge="not-live" className="rounded-full border border-rave-red/50 bg-rave-red/10 px-3 py-1 text-xs font-semibold text-rave-red">Not showing yet</span>;
}

function CheckRow({ item }: { item: SetupCheck }) {
  return (
    <li data-setup-check={item.id} data-level={item.level} className="flex items-start gap-3 py-2">
      {ICONS[item.level]}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-white"><span className="sr-only">{LEVEL_LABEL[item.level]}: </span>{item.title}</p>
        {item.level !== 'ok' && <p className="mt-0.5 text-xs leading-relaxed text-admin-muted">{item.detail}</p>}
      </div>
      {item.action && item.level !== 'ok' && (
        <Link href={item.action.href} className="shrink-0 rounded-[8px] bg-rave-red px-3 py-1.5 text-xs font-semibold text-white hover:bg-rave-red2">
          {item.action.label}
        </Link>
      )}
    </li>
  );
}

/**
 * What visitors currently see for this event, and the next thing to fix.
 * Passing checks are collapsed into one line in compact mode.
 */
export default function EventSetupChecklist({ status, compact = false }: { status: SetupStatus; compact?: boolean }) {
  const open = status.checks.filter((item) => item.level !== 'ok');
  const done = status.checks.filter((item) => item.level === 'ok');
  return (
    <div data-setup-status={status.mode} data-live={status.live ? 'true' : 'false'}>
      <div className="flex flex-wrap items-center gap-3">
        <SetupBadge status={status} />
        <p className="text-sm text-white">{status.headline}</p>
        <a href={status.publicHref} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-xs text-admin-muted underline hover:text-white">
          View public page <ExternalLink aria-hidden className="h-3 w-3" />
        </a>
      </div>
      <ul className="mt-3 divide-y divide-admin-border">
        {open.map((item) => <CheckRow key={item.id} item={item} />)}
        {compact
          ? done.length > 0 && <li className="flex items-start gap-3 py-2 text-xs text-admin-muted">{ICONS.ok}<span>{done.map((item) => item.title).join(' · ')}</span></li>
          : done.map((item) => <CheckRow key={item.id} item={item} />)}
      </ul>
    </div>
  );
}
