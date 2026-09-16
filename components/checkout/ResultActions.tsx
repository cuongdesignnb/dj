'use client';

import { useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { sessionCartAdapter } from '@/lib/cart/adapter';
import { readCheckoutRef, writeCheckoutRef } from '@/lib/cart/storage';

export type ResultAction =
  | { kind: 'link'; label: string; href: string; tone: 'primary' | 'secondary' }
  | { kind: 'refresh'; label: string; tone: 'primary' | 'secondary' };

const TONES = {
  primary:
    'bg-gradient-to-r from-rave-red to-rave-red2 text-white shadow-[0_0_22px_rgba(255,23,61,0.35)] hover:brightness-110',
  secondary: 'border border-white/30 text-white hover:border-rave-red/60 hover:bg-rave-red/10',
};
const BASE =
  'group/cta inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[12px] px-6 font-heading text-base font-semibold uppercase tracking-wider transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-panel disabled:cursor-wait disabled:opacity-60';

/** Buttons under the summary. Refresh re-runs the server verification once. */
export function ResultActions({ actions }: { actions: ResultAction[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      {actions.map((action) =>
        action.kind === 'link' ? (
          <Link key={action.label} href={action.href} className={`${BASE} ${TONES[action.tone]}`}>
            {action.label}
            <ArrowRight aria-hidden className="h-4 w-4 transition-transform group-hover/cta:translate-x-1" />
          </Link>
        ) : (
          <button
            key={action.label}
            type="button"
            disabled={pending}
            aria-busy={pending || undefined}
            onClick={() => startTransition(() => router.refresh())}
            className={`${BASE} ${TONES[action.tone]}`}
          >
            <RefreshCw
              aria-hidden
              className={`h-4 w-4 ${pending ? 'animate-spin motion-reduce:animate-none' : ''}`}
            />
            {pending ? 'Checking…' : action.label}
          </button>
        ),
      )}
    </div>
  );
}

/**
 * Clears the cart once, after the server has verified payment. It only clears
 * the cart that started this checkout (matched by the reference stored when
 * checkout began); when the order carries no reference, a verified payment is
 * enough. Reloading is harmless — an empty cart stays empty.
 */
export function ClearCartOnPaid({ clientReference }: { clientReference: string | null }) {
  useEffect(() => {
    const stored = readCheckoutRef();
    if (clientReference && stored !== clientReference) return;
    sessionCartAdapter.clear();
    writeCheckoutRef(null);
  }, [clientReference]);

  return null;
}
