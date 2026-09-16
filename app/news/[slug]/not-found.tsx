import Link from 'next/link';
import Header from '@/components/home/Header';

/** Shown for a slug that does not match any article. */
export default function ArticleNotFound() {
  return (
    <>
      <Header />
      <main className="flex min-h-screen items-center justify-center bg-rave-black text-white">
        <div className="mx-auto w-full max-w-xl px-6 py-20 text-center">
          <span className="font-heading text-xs uppercase tracking-[0.3em] text-rave-red">
            News
          </span>
          <h1 className="mt-3 mb-4 font-heading text-3xl font-black uppercase sm:text-4xl">
            Story Not Found
          </h1>
          <p className="mb-8 text-base leading-relaxed text-rave-muted">
            This article is not available.
          </p>
          <Link
            href="/news"
            className="inline-flex items-center justify-center rounded-[14px] bg-gradient-to-r from-rave-red to-rave-red2 px-6 py-3.5 font-heading text-sm font-bold uppercase tracking-wider text-white transition-all duration-300 hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black"
          >
            Back to News
          </Link>
        </div>
      </main>
    </>
  );
}
