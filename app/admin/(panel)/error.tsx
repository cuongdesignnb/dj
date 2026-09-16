'use client';

import { useEffect } from 'react';
import { CircleAlert, RefreshCw } from 'lucide-react';
import { buttonClass } from '@/components/admin/ui/buttonClass';

/** Admin error boundary. Shows a plain message and a retry; no stack traces. */
export default function AdminError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error('Admin page failed', error);
  }, [error]);

  return (
    <div role="alert" className="flex flex-col items-center justify-center rounded-[12px] border border-rave-red/30 bg-rave-red/[0.04] px-6 py-16 text-center">
      <CircleAlert aria-hidden className="h-10 w-10 text-rave-red" strokeWidth={1.5} />
      <h1 className="mt-3 font-heading text-2xl font-bold uppercase tracking-wide text-white">This page could not load</h1>
      <p className="mt-2 max-w-md text-sm text-admin-muted">
        Something went wrong while loading this screen. Your saved work is not affected.
        {error.digest ? ` Reference: ${error.digest}` : ''}
      </p>
      <button type="button" onClick={() => unstable_retry()} className={`${buttonClass.secondary} mt-6`}>
        <RefreshCw aria-hidden className="h-4 w-4" /> Try again
      </button>
    </div>
  );
}
