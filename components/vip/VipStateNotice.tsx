import Header from '@/components/home/Header';
import PageHero from '@/components/shared/PageHero';
import Container from '@/components/ui/Container';
import { NavigationLink as Link } from '@/components/shared/NavigationFeedback';
import type { VipPageState } from '@/lib/vip/types';
import AdminFixLink from '@/components/shared/AdminFixLink';

export const vipStateMessages = {
  'vip-disabled': 'VIP table information is not available yet.',
  'booking-disabled': 'VIP booking requests are not available yet.',
  'no-active-package': 'VIP package details are being prepared.',
  'not-configured': 'VIP page information is being prepared.',
  'no-booths': 'Booth selection is not available yet.',
  'no-availability': 'No VIP tables are currently available.',
  'invalid-response': 'We received data this page could not read.',
  'service-unavailable': "We couldn't reach the VIP service. Please try again shortly.",
  'event-not-found': 'This event could not be found.',
} as const;

/** Admin screen that resolves each closed state for this event; null for outages. */
const VIP_FIX: Partial<Record<VipPageState['kind'], [string, string]>> = {
  'vip-disabled': ['vip', 'Turn on VIP in Admin'],
  'booking-disabled': ['vip', 'Open VIP settings in Admin'],
  'not-configured': ['vip', 'See what is missing in Admin'],
  'no-active-package': ['vip/packages', 'Add a VIP package in Admin'],
  'no-booths': ['vip/booths', 'Add booths in Admin'],
  'no-availability': ['vip/booths', 'Edit booths in Admin'],
};

export function VipAvailabilityNotice({ state }: { state: VipPageState }) {
  if (state.kind === 'ready') return null;
  const event = 'event' in state ? state.event : null;
  const fix = VIP_FIX[state.kind];
  return <div role="status" data-vip-state={state.kind} className="mx-auto max-w-[1280px] rounded-2xl border border-white/10 bg-rave-panel/60 px-6 py-8">
    <h2 className="font-heading text-2xl uppercase text-white">{vipStateMessages[state.kind]}</h2>
    {state.kind === 'no-booths' && state.canRequest && <p className="mt-3 text-rave-muted">You can send a request without choosing a booth. The team will review it; no table is reserved.</p>}
    {event && fix && <AdminFixLink href={`/admin/events/${event.id}/${fix[0]}`} label={fix[1]} className="justify-start" />}
  </div>;
}

/** Use the CMS hero without its potentially booking-open CTAs or notes in closed states. */
export default function VipStateNotice({ state, page }: { state: VipPageState; page: 'tables' | 'booking' }) {
  const event = 'event' in state ? state.event : 'data' in state ? state.data.event : null;
  const raw = 'content' in state ? state.content[page] : null;
  const hero = raw?.hero && typeof raw.hero === 'object' ? raw.hero as Record<string, unknown> : null;
  const titles = [hero?.titleLine1, hero?.titleLine2, hero?.title].filter((v): v is string => typeof v === 'string' && Boolean(v));
  return <>
    <Header />
    <main id="main" className="min-h-screen bg-rave-black pb-20 text-white">
      <PageHero crumbs={[{ label: 'Home', href: '/' }, { label: page === 'tables' ? 'VIP Tables' : 'Book Now' }]}
        eyebrow={event?.title ?? 'VIP'} titleLines={titles.length ? titles : [page === 'tables' ? 'VIP TABLES' : 'VIP BOOKING REQUEST']}
        description="" titleId={`${page}-hero-title`} meta={[]} visual={event?.image ?? { src: '', alt: '' }} sideNotes={[]} />
      <Container><VipAvailabilityNotice state={state} /><Link href="/events" className="mt-6 inline-block text-rave-muted underline">Explore events</Link></Container>
    </main>
  </>;
}
