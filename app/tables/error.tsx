'use client';

import Link from 'next/link';
import { useEffect } from 'react';

/**
 * Doubles as the route's error boundary and as the error state the page
 * renders when the repository cannot supply content. No fallback to local
 * content: a failed load is shown as a failure, never as local prices that
 * might no longer be correct.
 */
export default function TablesError({
  error,
  reset,
  errorMessage,
}: {
  error?: Error & { digest?: string };
  reset?: () => void;
  errorMessage?: string;
}) {
  useEffect(() => {
    if (error) console.error('/tables render failed', error);
  }, [error]);

  const message = errorMessage ?? 'Something went wrong while loading VIP table information.';

  return (
    <main className="flex min-h-screen items-center justify-center bg-rave-black text-white">
      <div className="mx-auto w-full max-w-xl px-6 py-20 text-center">
        <span className="font-heading text-xs uppercase tracking-[0.3em] text-rave-red">
          VIP Tables
        </span>
        <h1 className="mt-3 mb-4 font-heading text-3xl font-black uppercase sm:text-4xl">
          We couldn&apos;t load VIP tables
        </h1>
        <p className="mb-8 text-base leading-relaxed text-rave-muted">{message}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {reset && (
            <button
              type="button"
              onClick={reset}
              className="rounded-[14px] bg-gradient-to-r from-rave-red to-rave-red2 px-6 py-3 font-heading text-sm font-bold uppercase tracking-wider text-white"
            >
              Try Again
            </button>
          )}
          <Link
            href="/"
            className="rounded-[14px] border border-white/15 px-6 py-3 font-heading text-sm font-bold uppercase tracking-wider text-white transition-colors hover:border-white/40"
          >
            Back Home
          </Link>
        </div>
      </div>
    </main>
  );
}
