'use client';

import { useState } from 'react';

const inputClass = 'w-full rounded-[10px] border border-white/[0.12] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-rave-red/70 focus:ring-2 focus:ring-rave-red/20';

export default function ContactForm() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setMessage(null);
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/v1/contact', {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify({
          fullName: String(form.get('fullName') ?? ''),
          email: String(form.get('email') ?? ''),
          phone: String(form.get('phone') ?? '') || null,
          enquiryType: String(form.get('enquiryType') ?? '') || null,
          message: String(form.get('message') ?? ''),
          locale: 'en',
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(String(payload?.error?.message ?? 'Your message could not be sent. Please try again.'));
        return;
      }
      event.currentTarget.reset();
      setMessage('Thanks — your message has been received.');
    } catch {
      setError('The contact service could not be reached. Please try again shortly.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {message && <p role="status" className="rounded-[10px] border border-emerald-400/30 bg-emerald-400/[0.08] px-4 py-3 text-sm text-emerald-200">{message}</p>}
      {error && <p role="alert" className="rounded-[10px] border border-rave-red/40 bg-rave-red/[0.08] px-4 py-3 text-sm text-[#FF8A9C]">{error}</p>}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm text-white/90">Name<input className={`${inputClass} mt-2`} name="fullName" required minLength={2} maxLength={160} autoComplete="name" /></label>
        <label className="text-sm text-white/90">Email<input className={`${inputClass} mt-2`} type="email" name="email" required maxLength={320} autoComplete="email" /></label>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm text-white/90">Phone <span className="text-white/40">(optional)</span><input className={`${inputClass} mt-2`} name="phone" maxLength={40} autoComplete="tel" /></label>
        <label className="text-sm text-white/90">Enquiry type<select className={`${inputClass} mt-2`} name="enquiryType" defaultValue="general"><option value="general">General enquiry</option><option value="partnership">Partnership</option><option value="tickets">Tickets</option><option value="vip-tables">VIP tables</option><option value="media">Media</option></select></label>
      </div>
      <label className="block text-sm text-white/90">Message<textarea className={`${inputClass} mt-2 min-h-36 resize-y`} name="message" required minLength={5} maxLength={5000} /></label>
      <button type="submit" disabled={pending} className="inline-flex min-h-12 items-center justify-center rounded-[10px] bg-rave-red px-7 font-heading text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:bg-rave-red2 disabled:cursor-not-allowed disabled:opacity-60">{pending ? 'Sending…' : 'Send message'}</button>
    </form>
  );
}
