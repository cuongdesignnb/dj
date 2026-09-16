'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, UserCheck, UserX } from 'lucide-react';
import { staffAction } from '@/app/admin/actions';
import { ConfirmDialog, buttonClass } from '../ui/Dialog';
import { useToast } from '../ui/Toast';

type Action = 'invite' | 'resend' | 'disable' | 'enable';

/** Access controls for one staff member. Email is only ever sent by the backend. */
export default function StaffActions({ id, status, self }: { id: string; status: string; self: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<Action | null>(null);
  const [confirm, setConfirm] = useState<Action | null>(null);
  const [, start] = useTransition();

  const run = async (action: Action) => {
    setBusy(action);
    const result = await staffAction(id, action);
    setBusy(null);
    setConfirm(null);
    if (result.ok) {
      toast('success', result.message ?? 'Done.');
      start(() => router.refresh());
    } else {
      toast(result.error.code === 'unavailable' ? 'warning' : 'error', result.error.message);
    }
  };

  return (
    <section aria-labelledby="staff-access" className="rounded-[12px] border border-admin-border bg-admin-panel/90 p-4 sm:p-5">
      <h2 id="staff-access" className="font-heading text-base font-semibold uppercase tracking-[0.08em] text-white">
        Access
      </h2>
      <div className="mt-4 flex flex-col gap-2">
        {status === 'invited' && (
          <button type="button" disabled={!!busy} onClick={() => run('resend')} className={buttonClass.secondary}>
            <Mail aria-hidden className="h-4 w-4" /> {busy === 'resend' ? 'Sending…' : 'Resend invitation'}
          </button>
        )}
        {status === 'disabled' ? (
          <button type="button" disabled={!!busy} onClick={() => setConfirm('enable')} className={buttonClass.secondary}>
            <UserCheck aria-hidden className="h-4 w-4" /> Restore access
          </button>
        ) : (
          !self && (
            <button type="button" disabled={!!busy} onClick={() => setConfirm('disable')} className={buttonClass.danger}>
              <UserX aria-hidden className="h-4 w-4" /> Disable access
            </button>
          )
        )}
        {self && <p className="text-xs text-admin-muted">You cannot disable your own account.</p>}
      </div>
      <ConfirmDialog
        open={!!confirm}
        busy={!!busy}
        tone={confirm === 'enable' ? 'primary' : 'danger'}
        title={confirm === 'enable' ? 'Restore access?' : 'Disable access?'}
        consequence={
          confirm === 'enable'
            ? 'This person will be able to sign in again with their current role.'
            : 'This person will no longer be able to sign in. Their past changes stay in the activity log.'
        }
        confirmLabel={confirm === 'enable' ? 'Restore' : 'Disable'}
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm && run(confirm)}
      />
    </section>
  );
}
