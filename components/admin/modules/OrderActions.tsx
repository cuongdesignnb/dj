'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { PackageCheck, RotateCcw, Truck } from 'lucide-react';
import { updateOrder } from '@/app/admin/actions';
import { inputClass } from '../form/FieldInput';
import { ConfirmDialog, buttonClass } from '../ui/Dialog';
import { useToast } from '../ui/Toast';

type Step = 'processing' | 'shipped';

/**
 * Fulfilment controls. Refunds go through the payment provider, which is not
 * connected, so the refund control is shown disabled with the reason.
 */
export default function OrderActions({
  id,
  paymentStatus,
  fulfillmentStatus,
  canEdit,
}: {
  id: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [confirm, setConfirm] = useState<Step | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState<string | null>(null);
  const [, start] = useTransition();
  const paid = paymentStatus === 'paid';

  const run = async (action: Step | 'note') => {
    setBusy(true);
    const result = await updateOrder(id, action, action === 'note' ? note : undefined);
    setBusy(false);
    setConfirm(null);
    if (result.ok) {
      toast('success', result.message ?? 'Saved.');
      if (action === 'note') setNote('');
      setNoteError(null);
      start(() => router.refresh());
    } else {
      if (action === 'note') setNoteError(result.error.fieldErrors?.note ?? result.error.message);
      toast('error', result.error.message);
    }
  };

  return (
    <div className="space-y-5">
      <section aria-labelledby="fulfilment" className="rounded-[12px] border border-admin-border bg-admin-panel/90 p-4 sm:p-5">
        <h2 id="fulfilment" className="font-heading text-sm font-semibold uppercase tracking-[0.25em] text-white">
          Fulfilment
        </h2>
        {!canEdit ? (
          <p className="mt-3 text-sm text-admin-muted">Your role can view orders but not update them.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              disabled={busy || !paid || fulfillmentStatus !== 'unfulfilled'}
              onClick={() => setConfirm('processing')}
              className={buttonClass.secondary}
            >
              <PackageCheck aria-hidden className="h-4 w-4" /> Mark processing
            </button>
            <button
              type="button"
              disabled={busy || !paid || !['unfulfilled', 'processing'].includes(fulfillmentStatus)}
              onClick={() => setConfirm('shipped')}
              className={buttonClass.primary}
            >
              <Truck aria-hidden className="h-4 w-4" /> Mark shipped
            </button>
            <button type="button" disabled className={buttonClass.ghost} aria-describedby="refund-note">
              <RotateCcw aria-hidden className="h-4 w-4" /> Refund
            </button>
            <p id="refund-note" className="text-xs text-admin-muted">
              Refunds are issued through the payment provider, which is not connected.
            </p>
            {!paid && <p className="text-xs text-admin-warning">Only paid orders can move to fulfilment.</p>}
          </div>
        )}
      </section>

      {canEdit && (
        <section aria-labelledby="add-note" className="rounded-[12px] border border-admin-border bg-admin-panel/90 p-4 sm:p-5">
          <h2 id="add-note" className="font-heading text-sm font-semibold uppercase tracking-[0.25em] text-white">
            Internal note
          </h2>
          <form
            className="mt-3 space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              void run('note');
            }}
          >
            <label htmlFor="order-note" className="sr-only">
              Note
            </label>
            <textarea
              id="order-note"
              rows={3}
              value={note}
              maxLength={1000}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Only staff can see this."
              aria-invalid={noteError ? true : undefined}
              aria-describedby={noteError ? 'order-note-error' : undefined}
              className={inputClass}
            />
            {noteError && (
              <p id="order-note-error" className="text-xs text-[#FF6B82]">
                {noteError}
              </p>
            )}
            <button type="submit" disabled={busy} className={buttonClass.secondary}>
              Add note
            </button>
          </form>
        </section>
      )}

      <ConfirmDialog
        open={!!confirm}
        busy={busy}
        tone="primary"
        title={confirm === 'shipped' ? 'Mark as shipped?' : 'Mark as processing?'}
        consequence={
          confirm === 'shipped'
            ? 'The order is recorded as shipped. No shipping label is created and the customer is not emailed from here.'
            : 'The order is recorded as being prepared.'
        }
        confirmLabel={confirm === 'shipped' ? 'Mark shipped' : 'Mark processing'}
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm && run(confirm)}
      />
    </div>
  );
}
