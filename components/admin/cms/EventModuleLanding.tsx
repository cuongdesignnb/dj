'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import type { AdminRecord } from '@/lib/admin/common/types';
import type { SetupStatus } from '@/lib/admin/events/setup-status';
import EventSetupChecklist from './EventSetupChecklist';

type Module = 'tickets' | 'vip';
type Loaded = { status: SetupStatus } | { error: true };

const LINKS: Record<Module, Array<[string, string]>> = {
  tickets: [['tickets', 'Ticket Settings'], ['tickets/tiers', 'Ticket Tiers'], ['tickets/content', 'Ticket Page Content']],
  vip: [['vip', 'VIP Settings'], ['vip/packages', 'VIP Packages'], ['vip/booths', 'Booth / Club Map'], ['vip/bottles', 'Bottle Options'], ['vip/tables-content', 'Tables Page Content'], ['vip/booking-content', 'Booking Page Content']],
};

function eventName(event: AdminRecord) {
  return String((event.name as Record<string, unknown> | undefined)?.en ?? event.slug ?? event.id);
}

function EventCard({ event, module }: { event: AdminRecord; module: Module }) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/v1/admin/events/${event.id}/${module}/readiness`, { headers: { accept: 'application/json' } })
      .then(async (response) => {
        if (!response.ok) throw new Error('Status unavailable');
        const payload = await response.json();
        if (!payload?.data?.status) throw new Error('Status unavailable');
        if (!cancelled) setLoaded({ status: payload.data.status });
      })
      .catch(() => { if (!cancelled) setLoaded({ error: true }); });
    return () => { cancelled = true; };
  }, [event.id, module]);

  return (
    <li data-event-card={String(event.slug ?? event.id)} className="rounded-[12px] border border-admin-border bg-admin-panel/80 p-5">
      <div className="flex items-center gap-3">
        <CalendarDays className="h-5 w-5 text-rave-red" />
        <span className="font-heading text-lg uppercase text-white">{eventName(event)}</span>
      </div>
      <div className="mt-4">
        {!loaded ? <p className="text-sm text-admin-muted">Checking what visitors see…</p>
          : 'error' in loaded ? <p role="alert" className="text-sm text-admin-muted">Could not check this event’s public page.</p>
            : <EventSetupChecklist status={loaded.status} compact />}
      </div>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-admin-border pt-4">
        {LINKS[module].map(([path, label]) => (
          <Link key={path} href={`/admin/events/${event.id}/${path}`} className="rounded border border-admin-border px-3 py-2 text-sm text-white hover:border-rave-red/60">{label}</Link>
        ))}
      </div>
    </li>
  );
}

/** Published events first: those are the ones visitors can reach. */
function publishedFirst(events: AdminRecord[]) {
  return [...events].sort((a, b) => Number(String(b.status).toLowerCase() === 'published') - Number(String(a.status).toLowerCase() === 'published'));
}

export default function EventModuleLanding({ events, module }: { events: AdminRecord[]; module: Module }) {
  return (
    <section className="space-y-5">
      <div>
        <h1 className="font-heading text-2xl font-bold uppercase text-white">{module === 'tickets' ? 'Ticketing' : 'VIP / Tables'}</h1>
        <p className="mt-1 text-sm text-admin-muted">
          Each event has its own {module === 'tickets' ? 'ticket tiers and Tickets page' : 'VIP packages, booths and VIP pages'}. The status shows what visitors see right now; use the red button to fix the next missing step.
        </p>
      </div>
      {events.length === 0
        ? <p className="rounded border border-admin-border bg-admin-panel p-5 text-admin-muted">No events found.</p>
        : <ul className="grid grid-cols-1 gap-4 xl:grid-cols-2">{publishedFirst(events).map((event) => <EventCard key={String(event.id)} event={event} module={module} />)}</ul>}
    </section>
  );
}
