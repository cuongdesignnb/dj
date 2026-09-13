import Container from '@/components/ui/Container';

export default function Loading() {
  // Skeleton with same proportions as /event so layout doesn't jump.
  return (
    <main
      className="min-h-screen bg-rave-black text-white"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading event details"
    >
      <div className="h-[84px]" />
      <Container>
        <div className="pt-6">
          <div className="h-3 w-32 rounded-full bg-white/[0.06]" />
        </div>
        <div className="pt-16 pb-16 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <div className="aspect-[3/4] rounded-2xl bg-white/[0.04] border border-white/[0.06]" />
          </div>
          <div className="lg:col-span-7 flex flex-col gap-5">
            <div className="h-3 w-40 rounded-full bg-rave-red/30" />
            <div className="h-12 w-3/4 rounded-md bg-white/[0.06]" />
            <div className="h-4 w-full rounded-md bg-white/[0.04]" />
            <div className="h-4 w-5/6 rounded-md bg-white/[0.04]" />
            <div className="h-4 w-2/3 rounded-md bg-white/[0.04]" />
            <div className="flex gap-3 mt-3">
              <div className="h-10 w-32 rounded-full bg-rave-red/20" />
              <div className="h-10 w-40 rounded-full bg-white/[0.04]" />
            </div>
          </div>
        </div>
        <div className="h-40 rounded-2xl bg-white/[0.03]" />
        <div className="h-40 rounded-2xl bg-white/[0.03] mt-6" />
        <div className="h-40 rounded-2xl bg-white/[0.03] mt-6" />
      </Container>
    </main>
  );
}
