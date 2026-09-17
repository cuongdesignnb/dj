'use client';

import Script from 'next/script';
import { useCallback, useRef, useState } from 'react';

type SquareCard = {
  attach(selector: string): Promise<void>;
  tokenize(): Promise<{ status?: string; token?: string; errors?: Array<{ message?: string }> }>;
};

type SquarePayments = {
  card(): Promise<SquareCard>;
};

declare global {
  interface Window {
    Square?: { payments(applicationId: string, locationId: string): Promise<SquarePayments> };
  }
}

type Props = {
  checkoutId: string;
  amountMinor: number;
  currency: string;
  applicationId: string | null;
  locationId: string | null;
  scriptUrl: string;
};

function newIdempotencyKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return `pay_${Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('')}`.slice(0, 45);
}

export default function SquarePaymentForm({ checkoutId, amountMinor, currency, applicationId, locationId, scriptUrl }: Props) {
  const cardRef = useRef<SquareCard | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Loading secure card fields…');

  const initialize = useCallback(async () => {
    if (!applicationId || !locationId || !window.Square) {
      setMessage('Square Sandbox is not configured for this environment yet.');
      return;
    }
    try {
      const payments = await window.Square.payments(applicationId, locationId);
      const card = await payments.card();
      await card.attach('#square-card-container');
      cardRef.current = card;
      setReady(true);
      setMessage('');
    } catch {
      setMessage('Secure card fields could not be loaded. Please try again.');
    }
  }, [applicationId, locationId]);

  async function submit() {
    if (!cardRef.current || busy) return;
    setBusy(true);
    setMessage('Contacting Square securely…');
    try {
      const tokenResult = await cardRef.current.tokenize();
      if (tokenResult.status !== 'OK' || !tokenResult.token) {
        setMessage(tokenResult.errors?.[0]?.message ?? 'The card details could not be verified.');
        setBusy(false);
        return;
      }
      const response = await fetch(`/api/v1/checkout/intent/${encodeURIComponent(checkoutId)}/pay`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ sourceId: tokenResult.token, idempotencyKey: newIdempotencyKey() }),
      });
      const body = (await response.json().catch(() => null)) as { data?: { status?: string }; error?: { message?: string } } | null;
      if (!response.ok) throw new Error(body?.error?.message ?? 'Square could not process the payment.');
      const status = body?.data?.status;
      if (status === 'COMPLETED' || status === 'PENDING' || status === 'APPROVED') {
        window.location.assign(`/checkout/result?checkout_id=${encodeURIComponent(checkoutId)}`);
        return;
      }
      setMessage('Payment was not completed. Please try another card.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Payment could not be completed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-[20px] border border-white/[0.08] bg-rave-panel/80 p-5 sm:p-7">
      <Script src={scriptUrl} strategy="afterInteractive" onReady={() => void initialize()} />
      <p className="font-heading text-xs uppercase tracking-[0.28em] text-rave-red">Square secure checkout</p>
      <p className="mt-3 font-heading text-3xl font-black uppercase text-white">
        {(amountMinor / 100).toFixed(2)} {currency}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-rave-muted">Your card details are tokenized by Square. This site does not store card numbers or CVV.</p>
      <div id="square-card-container" className="mt-6 min-h-[120px] rounded-[12px] bg-white p-4" />
      <button type="button" onClick={submit} disabled={!ready || busy} className="mt-5 inline-flex min-h-[54px] w-full items-center justify-center rounded-[12px] bg-gradient-to-r from-rave-red to-rave-red2 px-6 font-heading text-base font-semibold uppercase tracking-wider text-white disabled:cursor-not-allowed disabled:opacity-50">
        {busy ? 'Processing…' : 'Pay securely'}
      </button>
      <p role="status" aria-live="polite" className="mt-3 text-sm text-rave-muted">{message}</p>
    </div>
  );
}
