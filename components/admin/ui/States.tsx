'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { CircleAlert, Inbox, Lock, RefreshCw } from 'lucide-react';

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[12px] border border-dashed border-white/15 px-6 py-14 text-center">
      <Inbox aria-hidden className="h-9 w-9 text-admin-muted" strokeWidth={1.5} />
      <p className="mt-3 font-heading text-lg uppercase tracking-wide text-white">{title}</p>
      {description && <p className="mt-1 text-sm text-admin-muted">{description}</p>}
      {action && (
        <Link
          href={action.href}
          className="mt-5 inline-flex min-h-[40px] items-center rounded-[8px] bg-rave-red px-4 text-sm font-semibold text-white hover:bg-rave-red2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

/** Failure with a retry that re-runs the server render. No stack traces. */
export function ErrorState({ message, title = 'Something went wrong' }: { message: string; title?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div role="alert" className="flex flex-col items-center justify-center rounded-[12px] border border-rave-red/30 bg-rave-red/[0.04] px-6 py-12 text-center">
      <CircleAlert aria-hidden className="h-9 w-9 text-rave-red" strokeWidth={1.5} />
      <p className="mt-3 font-heading text-lg uppercase tracking-wide text-white">{title}</p>
      <p className="mt-1 max-w-md text-sm text-admin-muted">{message}</p>
      <button
        type="button"
        onClick={() => start(() => router.refresh())}
        disabled={pending}
        className="mt-5 inline-flex min-h-[40px] items-center gap-2 rounded-[8px] border border-white/20 px-4 text-sm font-medium text-white hover:border-rave-red/60 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red"
      >
        <RefreshCw aria-hidden className={`h-4 w-4 ${pending ? 'animate-spin motion-reduce:animate-none' : ''}`} />
        {pending ? 'Retrying…' : 'Retry'}
      </button>
    </div>
  );
}

export function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center rounded-[12px] border border-admin-border px-6 py-16 text-center">
      <Lock aria-hidden className="h-9 w-9 text-admin-muted" strokeWidth={1.5} />
      <p className="mt-3 font-heading text-lg uppercase tracking-wide text-white">No access</p>
      <p className="mt-1 text-sm text-admin-muted">Your role does not include this area. Ask an administrator for access.</p>
    </div>
  );
}

export function LoadingSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div aria-hidden className="animate-pulse space-y-3 motion-reduce:animate-none">
      <div className="h-10 w-1/3 rounded-md bg-white/[0.05]" />
      <div className="h-12 rounded-md bg-white/[0.04]" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-14 rounded-md bg-white/[0.03]" />
      ))}
    </div>
  );
}
