'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function EventError({
  error,
  reset,
  errorMessage,
}: {
  error?: Error & { digest?: string };
  reset?: () => void;
  errorMessage?: string;
}) {
  useEffect(() => {
    // Surface to browser console for debugging without exposing to UI.
    if (error) console.error('/event render failed', error);
  }, [error]);

  const message =
    errorMessage ?? 'Something went wrong while loading this event.';

  return (
    <main className="min-h-screen bg-rave-black text-white flex items-center justify-center">
      <div className="mx-auto w-full max-w-xl px-6 text-center py-20">
        <span className="font-heading uppercase tracking-[0.3em] text-xs text-rave-red">
          Event Details
        </span>
        <h1 className="font-heading text-3xl sm:text-4xl font-black uppercase mt-3 mb-4">
          We couldn&apos;t load this event
        </h1>
        <p className="text-rave-muted text-base leading-relaxed mb-8">{message}</p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {reset && (
            <button
              type="button"
              onClick={reset}
              className="px-6 py-3 rounded-[14px] bg-gradient-to-r from-rave-red to-rave-red2 text-white font-heading uppercase tracking-wider text-sm font-bold"
            >
              Try Again
            </button>
          )}
          <Link
            href="/"
            className="px-6 py-3 rounded-[14px] border border-white/15 text-white hover:border-white/40 transition-colors font-heading uppercase tracking-wider text-sm font-bold"
          >
            Back Home
          </Link>
        </div>
      </div>
    </main>
  );
}
