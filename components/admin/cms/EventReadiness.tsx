'use client';
import { useEffect, useState } from 'react';
import type { SetupStatus } from '@/lib/admin/events/setup-status';
import EventSetupChecklist from './EventSetupChecklist';

type Readiness = { status?: SetupStatus; facts: Record<string, string | number | boolean>; warnings: string[] };
export default function EventReadiness({ eventId, mode, revision }: { eventId: string; mode: 'vip' | 'tickets'; revision: number }) {
  const [data, setData] = useState<Readiness | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/v1/admin/events/${eventId}/${mode}/readiness`).then(async (response) => {
      if (!response.ok) throw new Error('Readiness unavailable');
      return response.json();
    }).then((payload) => { if (!cancelled) { setData(payload.data); setError(false); } })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [eventId, mode, revision]);
  return <section aria-label={`${mode === 'vip' ? 'VIP' : 'Ticket'} readiness`} className="rounded-xl border border-admin-border bg-admin-panel p-5">
    <h2 className="font-heading text-xl uppercase text-white">Public page readiness</h2>
    {error ? <p role="alert" className="mt-3 text-admin-muted">Could not load readiness. Your settings have not been changed.</p> : data ? <>
      {data.status && <div className="mt-4"><EventSetupChecklist status={data.status} /></div>}
      <details className="mt-4 rounded-lg border border-admin-border p-4">
        <summary className="cursor-pointer text-sm text-admin-muted">Technical details</summary>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Object.entries(data.facts).map(([label, value]) => <div key={label}><dt className="text-xs text-admin-muted">{label}</dt><dd className="mt-1 text-sm text-white">{typeof value === 'boolean' ? value ? 'Yes' : 'No' : value}</dd></div>)}</dl>
        {data.warnings.length > 0 && <ul className="mt-4 list-disc space-y-2 rounded-lg bg-amber-400/10 p-5 pl-9 text-sm text-amber-200">{data.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>}
      </details>
    </> : <p className="mt-3 text-admin-muted">Checking public page readiness…</p>}
  </section>;
}
