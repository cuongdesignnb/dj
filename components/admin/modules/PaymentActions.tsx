'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, RotateCcw } from 'lucide-react';
import { paymentAction } from '@/app/admin/actions';
import { buttonClass } from '../ui/buttonClass';
import { inputClass } from '../form/FieldInput';
import { useToast } from '../ui/Toast';

export default function PaymentActions({ id, status, canEdit }: { id: string; status: string; canEdit: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [busy, start] = useTransition();
  const run = (action: 'reconcile' | 'refund') => start(async () => {
    const result = await paymentAction(id, action, action === 'refund' && amount ? Number(amount) : undefined, reason);
    if (result.ok) {
      toast('success', result.message ?? 'Saved.');
      router.refresh();
    } else toast('error', result.error.message);
  });
  return (
    <section aria-labelledby="payment-actions" className="rounded-[12px] border border-admin-border bg-admin-panel/90 p-4 sm:p-5">
      <h2 id="payment-actions" className="font-heading text-sm font-semibold uppercase tracking-[0.25em] text-white">Square actions</h2>
      {!canEdit ? <p className="mt-3 text-sm text-admin-muted">Your role can view payments but not reconcile or refund them.</p> : <div className="mt-4 space-y-3">
        <button type="button" disabled={busy} onClick={() => run('reconcile')} className={buttonClass.secondary}><RefreshCw aria-hidden className="h-4 w-4" /> Reconcile from Square</button>
        <div className="border-t border-admin-border pt-3">
          <label htmlFor="refund-amount" className="text-xs uppercase tracking-wider text-admin-muted">Partial amount in minor units (optional)</label>
          <input id="refund-amount" value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="numeric" className={`${inputClass} mt-1`} placeholder="Full refund if blank" />
          <label htmlFor="refund-reason" className="mt-3 block text-xs uppercase tracking-wider text-admin-muted">Reason</label>
          <input id="refund-reason" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={200} className={`${inputClass} mt-1`} placeholder="Optional" />
          <button type="button" disabled={busy || !['completed', 'paid'].includes(status)} onClick={() => run('refund')} className={`${buttonClass.ghost} mt-3`}><RotateCcw aria-hidden className="h-4 w-4" /> Request Square refund</button>
        </div>
      </div>}
    </section>
  );
}
