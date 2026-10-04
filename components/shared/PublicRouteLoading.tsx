import Container from '@/components/ui/Container';
import { RouteLoadingMarker } from './NavigationFeedback';

export default function PublicRouteLoading({ label }: { label: string }) {
  return <main aria-busy="true" aria-label={`Loading ${label}`} data-route-loading className="min-h-screen bg-rave-black pb-16 pt-32 text-white">
    <RouteLoadingMarker />
    <Container><p role="status" className="font-heading text-sm uppercase tracking-widest text-rave-muted">Loading {label}…</p><div aria-hidden className="mt-8 space-y-5"><div className="h-3 w-32 rounded bg-rave-red/30" /><div className="h-12 w-2/3 rounded bg-white/10" /><div className="h-5 w-3/4 rounded bg-white/5" /><div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((id) => <div key={id} className="aspect-[4/3] rounded-2xl border border-white/10 bg-white/5" />)}</div></div></Container>
  </main>;
}
