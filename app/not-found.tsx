import { ArrowRight } from 'lucide-react';
import Header from '@/components/home/Header';
import EventsMotion from '@/components/events/EventsMotion';
import EventsFooter from '@/components/events/EventsFooter';
import { NavigationLink as Link } from '@/components/shared/NavigationFeedback';
import LowercasePathRedirect from '@/components/shared/LowercasePathRedirect';
import { SITE_FOOTER } from '@/lib/site-footer';

const QUICK_LINKS = [
  { href: '/events', label: 'Events' },
  { href: '/tickets', label: 'Tickets' },
  { href: '/tables', label: 'VIP Tables' },
  { href: '/lineup', label: 'Lineup' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/contact', label: 'Contact' },
];

/**
 * Site-wide 404 for unmatched URLs and for notFound() outside segments that
 * have their own page. Next.js adds `noindex` to 404 responses.
 */
export default function NotFound() {
  return (
    <EventsMotion>
      <LowercasePathRedirect />
      <Header />
      <main id="main" data-not-found="" className="relative flex min-h-[80vh] items-center justify-center overflow-hidden bg-rave-black px-6 pb-20 pt-[120px] text-white">
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-rave-red/15 blur-[120px]" />
        <div className="relative mx-auto w-full max-w-2xl text-center">
          <p aria-hidden className="font-heading text-[96px] font-black leading-none tracking-tight text-transparent sm:text-[140px]" style={{ WebkitTextStroke: '2px rgb(var(--rave-accent-rgb)/0.85)' }}>
            404
          </p>
          <h1 className="mt-4 font-heading text-3xl font-black uppercase tracking-tight sm:text-4xl">
            This page doesn&apos;t exist
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-rave-muted">
            The link may be mistyped, or the page has moved or is no longer published.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-rave-red to-rave-red2 px-7 font-heading text-sm font-bold uppercase tracking-wider text-white transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black sm:w-auto"
            >
              Back to home
            </Link>
            <Link
              href="/events"
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[14px] border border-white/20 px-7 font-heading text-sm font-bold uppercase tracking-wider text-white transition hover:border-rave-red/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red sm:w-auto"
            >
              See events <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </div>
          <nav aria-label="Popular pages" className="mt-10 border-t border-white/[0.08] pt-6">
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-3">
              {QUICK_LINKS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-rave-muted underline-offset-4 transition-colors hover:text-white hover:underline">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </main>
      <EventsFooter footer={SITE_FOOTER} />
    </EventsMotion>
  );
}
