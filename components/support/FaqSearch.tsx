'use client';

import { useId } from 'react';
import { ArrowRight, Search, X } from 'lucide-react';

/**
 * Search box in the FAQ hero. Filtering happens as you type; submitting moves
 * the reader to the results.
 */
export default function FaqSearch({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const inputId = useId();

  return (
    <form
      role="search"
      method="get"
      action="/faq"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="flex w-full max-w-lg items-center gap-2 rounded-[12px] border border-white/20 bg-black/60 p-1.5 pl-4 backdrop-blur-sm focus-within:border-rave-red"
    >
      <Search aria-hidden className="h-5 w-5 shrink-0 text-white/70" />
      <label htmlFor={inputId} className="sr-only">
        Search your question
      </label>
      <input
        id={inputId}
        type="search"
        name="q"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search your question"
        autoComplete="off"
        maxLength={80}
        className="min-h-[44px] min-w-0 flex-1 bg-transparent text-base text-white placeholder:text-white/50 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] text-white/70 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red"
        >
          <X aria-hidden className="h-4 w-4" />
        </button>
      )}
      <button
        type="submit"
        aria-label="Show matching questions"
        className="grid h-12 w-14 shrink-0 place-items-center rounded-[10px] bg-rave-red text-white transition-colors hover:bg-rave-red2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <ArrowRight aria-hidden className="h-5 w-5" />
      </button>
    </form>
  );
}
