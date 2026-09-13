import Link from 'next/link';

export default function EventNotFound() {
  return (
    <main className="min-h-screen bg-rave-black text-white flex items-center justify-center">
      <div className="mx-auto w-full max-w-xl px-6 text-center py-20">
        <span className="font-heading uppercase tracking-[0.3em] text-xs text-rave-red">
          404 · Event Not Found
        </span>
        <h1 className="font-heading text-3xl sm:text-4xl font-black uppercase mt-3 mb-4">
          This event is not available
        </h1>
        <p className="text-rave-muted text-base leading-relaxed mb-8">
          We couldn&apos;t find an event at this URL. It may have been moved,
          unpublished, or hasn&apos;t been announced yet.
        </p>
        <Link
          href="/"
          className="inline-flex px-6 py-3 rounded-[14px] bg-gradient-to-r from-rave-red to-rave-red2 text-white font-heading uppercase tracking-wider text-sm font-bold"
        >
          Back Home
        </Link>
      </div>
    </main>
  );
}
