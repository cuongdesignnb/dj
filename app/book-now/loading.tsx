import Container from '@/components/ui/Container';

/**
 * Skeleton mirroring the /book-now layout so nothing jumps when content lands.
 */
export default function Loading() {
  return (
    <main
      className="min-h-screen bg-rave-black text-white"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading booking form"
    >
      <div className="h-[84px]" />
      <Container>
        <div className="pt-6">
          <div className="h-3 w-32 rounded-full bg-white/[0.06]" />
        </div>

        <div className="grid grid-cols-1 gap-10 pb-16 pt-10 lg:grid-cols-12">
          <div className="flex flex-col gap-5 lg:col-span-7">
            <div className="h-3 w-40 rounded-full bg-rave-red/30" />
            <div className="h-12 w-3/4 rounded-md bg-white/[0.06]" />
            <div className="h-12 w-2/3 rounded-md bg-white/[0.06]" />
            <div className="h-4 w-full rounded-md bg-white/[0.04]" />
            <div className="h-4 w-5/6 rounded-md bg-white/[0.04]" />
            <div className="mt-3 flex gap-3">
              <div className="h-11 w-40 rounded-[14px] bg-rave-red/20" />
              <div className="h-11 w-40 rounded-[14px] bg-white/[0.04]" />
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-10 w-32 rounded-[14px] bg-white/[0.04]" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="aspect-[4/5] rounded-[20px] border border-white/[0.06] bg-white/[0.04]" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex flex-col gap-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-44 rounded-[18px] bg-white/[0.04]" />
            ))}
          </div>
          <div className="h-[520px] rounded-[20px] bg-white/[0.04]" />
        </div>

        <div className="grid grid-cols-1 gap-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-[18px] bg-white/[0.03]" />
          ))}
        </div>
      </Container>
    </main>
  );
}
