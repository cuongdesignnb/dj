'use client';

import { useId, useState, useTransition } from 'react';
import { X } from 'lucide-react';
import { validatePromoCode } from '@/app/cart/actions';
import { sessionCartAdapter } from '@/lib/cart/adapter';
import type { Money, PromoResult } from '@/lib/cart/types';

/**
 * Promo code entry. The code is only kept — and a discount only shown — when
 * the promotions service accepts it. Without that service, Apply says so.
 */
export default function PromoCodeForm({
  appliedCode,
  onDiscount,
}: {
  appliedCode: string | null;
  onDiscount: (discount: Money | null) => void;
}) {
  const inputId = useId();
  const messageId = useId();
  const [code, setCode] = useState('');
  const [result, setResult] = useState<PromoResult | null>(null);
  const [pending, startTransition] = useTransition();

  const apply = () => {
    const value = code.trim();
    if (!value) {
      setResult({ valid: false, code: '', message: 'Enter a promo code.' });
      return;
    }
    startTransition(async () => {
      const outcome = await validatePromoCode(value);
      setResult(outcome);
      if (outcome.valid) {
        sessionCartAdapter.setPromoCode(outcome.code);
        onDiscount(outcome.discount ?? null);
        setCode('');
      }
    });
  };

  const remove = () => {
    sessionCartAdapter.setPromoCode(null);
    onDiscount(null);
    setResult(null);
  };

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-white">
        Promo Code
      </label>

      {appliedCode ? (
        <div className="mt-2 flex items-center justify-between gap-3 rounded-[10px] border border-rave-red/40 bg-rave-red/10 px-3 py-2">
          <span className="font-heading text-sm uppercase tracking-wider text-white">
            {appliedCode}
            <span className="ml-2 normal-case tracking-normal text-rave-muted">
              applied at checkout
            </span>
          </span>
          <button
            type="button"
            onClick={remove}
            aria-label={`Remove promo code ${appliedCode}`}
            className="grid h-11 w-11 place-items-center rounded-full text-white/70 hover:text-rave-red focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red"
          >
            <X aria-hidden className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <form
          method="post"
          onSubmit={(event) => {
            event.preventDefault();
            apply();
          }}
          className="mt-2 flex gap-2"
        >
          <input
            id={inputId}
            name="promo"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Enter code"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={32}
            aria-describedby={messageId}
            aria-invalid={result && !result.valid ? true : undefined}
            className="min-h-[48px] min-w-0 flex-1 rounded-[10px] border border-white/15 bg-white/[0.03] px-3 text-sm text-white placeholder:text-white/40 focus:border-rave-red focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red/60"
          />
          <button
            type="submit"
            disabled={pending}
            className="min-h-[48px] rounded-[10px] border border-white/30 px-5 font-heading text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:border-rave-red/60 hover:bg-rave-red/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red disabled:cursor-wait disabled:opacity-60"
          >
            {pending ? 'Checking…' : 'Apply'}
          </button>
        </form>
      )}

      <p
        id={messageId}
        role="status"
        aria-live="polite"
        className={`mt-2 min-h-[1rem] text-xs ${result && !result.valid ? 'text-rave-red' : 'text-rave-muted'}`}
      >
        {result?.message ?? (result?.valid ? 'Promo code accepted.' : '')}
      </p>
    </div>
  );
}
