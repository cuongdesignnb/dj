'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';
import { sendTestEmailAction } from '@/app/admin/actions';
import { buttonClass } from '../ui/Dialog';
import { useToast } from '../ui/Toast';

const TEMPLATES: Array<[value: string, label: string]> = [
  ['test', 'Test email (check the settings work)'],
  ['contact', 'Preview: new contact message (to the team)'],
  ['contact-reply', 'Preview: contact auto-reply (to the visitor)'],
  ['booking', 'Preview: new VIP table request (to the team)'],
  ['booking-reply', 'Preview: VIP request auto-reply (to the guest)'],
  ['review', 'Preview: review waiting for approval (to the team)'],
  ['newsletter', 'Preview: newsletter signup (to the team)'],
];

const field = 'min-h-[42px] rounded-[8px] border border-admin-border bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-white/40';

/** "Send test email" under Settings › Email (SMTP). Uses the saved settings, not unsaved edits. */
export default function EmailTestPanel({ canEdit, defaultTo }: { canEdit: boolean; defaultTo: string }) {
  const router = useRouter();
  const toast = useToast();
  const [to, setTo] = useState(defaultTo);
  const [template, setTemplate] = useState('test');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();

  const send = async () => {
    setBusy(true);
    setError(null);
    const result = await sendTestEmailAction(to, template);
    setBusy(false);
    if (result.ok) toast('success', result.message ?? 'Test email sent.');
    else {
      setError(result.error.message);
      toast('error', result.error.message);
    }
    start(() => router.refresh());
  };

  return (
    <section aria-labelledby="email-test" data-email-test="" className="mt-6 rounded-[12px] border border-admin-border bg-admin-panel/90 p-4 sm:p-5">
      <h2 id="email-test" className="font-heading text-base font-semibold uppercase tracking-[0.08em] text-white">Send a test email</h2>
      <p className="mt-1 text-sm text-admin-muted">Save your changes first — the test uses the saved settings. Previews fill each template with sample data marked “Sample”.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="flex flex-col gap-1.5 text-sm text-white/85">
          Email to send
          <select value={template} onChange={(event) => setTemplate(event.target.value)} disabled={!canEdit || busy} className={field}>
            {TEMPLATES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-white/85">
          Send to
          <input type="email" value={to} onChange={(event) => setTo(event.target.value)} disabled={!canEdit || busy} placeholder="you@example.com" className={field} />
        </label>
        <button type="button" onClick={send} disabled={!canEdit || busy || !to.trim()} className={buttonClass.primary}>
          <Send aria-hidden className="h-4 w-4" /> {busy ? 'Sending…' : template === 'test' ? 'Send test email' : 'Send preview'}
        </button>
      </div>
      {error && <p role="alert" data-email-test-error="" className="mt-3 text-sm text-red-300">{error}</p>}
    </section>
  );
}
