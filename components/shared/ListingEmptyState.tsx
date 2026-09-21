'use client';

import Link from 'next/link';
import type { PublicListingEmptyState } from '@/lib/cms/public-page';

export default function ListingEmptyState({
  state,
  fallbackTitle,
  fallbackDescription,
  className = '',
}: {
  state?: PublicListingEmptyState;
  fallbackTitle: string;
  fallbackDescription: string;
  className?: string;
}) {
  const title = state?.title ?? fallbackTitle;
  const description = state?.description ?? fallbackDescription;

  return (
    <div className={`text-center ${className}`}>
      <p className="font-heading text-xl uppercase tracking-[0.12em] text-white sm:text-2xl">
        {title}
      </p>
      <p className="mt-3 text-sm text-rave-muted sm:text-base">{description}</p>
      {state?.cta && (
        <Link
          href={state.cta.href}
          className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-[12px] border border-white/25 px-5 font-heading text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:border-rave-red/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red"
        >
          {state.cta.label}
        </Link>
      )}
    </div>
  );
}
