'use client';

import { useRef } from 'react';
import Image from 'next/image';
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
import { ArrowDown, ArrowRight, CalendarDays, Clock, ExternalLink, MapPin, Music2, Ticket } from 'lucide-react';
import Container from '@/components/ui/Container';
import EventsBreadcrumb from '@/components/events/EventsBreadcrumb';
import { NavigationLink } from '@/components/shared/NavigationFeedback';
import { eventHeroLineReveal, ticketReveal, ticketStagger } from '@/lib/animations';
import { formatMoney } from '@/lib/tickets/pricing';
import type { TicketEventInfo, TicketProviderAction, TicketTier, TicketsHeroContent } from '@/lib/tickets/types';
import RichText from '@/components/shared/RichText';

const sameText = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export default function TicketsHero({
  event,
  content,
  visual,
  tiers = [],
  provider = null,
}: {
  event: TicketEventInfo;
  content: TicketsHeroContent;
  visual: { src: string; alt: string };
  tiers?: TicketTier[];
  provider?: TicketProviderAction | null;
}) {
  const ref = useRef<HTMLElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const reduced = useReducedMotion();

  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const rotX = useSpring(useTransform(tiltY, [-0.5, 0.5], [3, -3]), { stiffness: 90, damping: 16 });
  const rotY = useSpring(useTransform(tiltX, [-0.5, 0.5], [-4, 4]), { stiffness: 90, damping: 16 });

  const providerUrl = provider?.mode === 'external-link' && provider.checkoutUrl ? provider.checkoutUrl : null;
  const providerName = provider?.providerName || 'the ticket provider';
  const onlineTiers = tiers.filter((tier) => tier.purchasableOnline);
  const cheapest = onlineTiers.reduce<TicketTier | null>((low, tier) => (!low || tier.price.amountMinor < low.price.amountMinor ? tier : low), null);
  const lineup = event.lineup ?? [];

  const details = [
    {
      Icon: CalendarDays,
      label: 'Date',
      value: event.dateStatus === 'confirmed' && event.date ? event.date : 'Date to be announced',
    },
    {
      Icon: Clock,
      label: 'Time',
      value: event.scheduleStatus === 'confirmed' && event.schedule ? event.schedule : 'Schedule to be confirmed',
    },
    { Icon: MapPin, label: 'Venue', value: event.venue || 'Venue to be confirmed', note: event.address },
    ...(lineup.length ? [{ Icon: Music2, label: 'Lineup', value: lineup.join(' · ') }] : []),
  ];
  // A description that only repeats the title adds nothing.
  const description = content.description && !sameText(content.description, content.title) ? content.description : '';

  const primaryClass =
    'inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rave-red to-rave-red2 px-7 font-heading text-sm font-bold uppercase tracking-[0.14em] text-white shadow-[0_0_24px_rgb(var(--rave-accent-rgb)/0.4)] transition hover:brightness-110';
  const secondaryClass =
    'inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-white/[0.16] px-6 font-heading text-sm font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:border-rave-red hover:bg-rave-red/10';

  return (
    <>
      <EventsBreadcrumb trail={[{ label: 'Home', href: '/' }, { label: content.breadcrumb }]} />

      <section
        ref={ref}
        aria-labelledby="tickets-hero-title"
        data-tickets-hero=""
        className="relative isolate overflow-hidden bg-rave-black pb-16 pt-6 md:pb-24 md:pt-10"
      >
        {/* The poster itself, blurred, tints the whole section. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-20 opacity-[0.22]">
          <Image src={visual.src} alt="" fill sizes="100vw" className="scale-110 object-cover blur-3xl" />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(circle at 12% 18%, rgb(var(--rave-accent-rgb)/0.16), transparent 55%), linear-gradient(180deg, rgb(var(--rave-black-rgb)/0.55) 0%, rgb(var(--rave-black-rgb)/0.85) 70%, rgb(var(--rave-black-rgb)) 100%)',
          }}
        />

        <Container>
          <motion.div
            variants={ticketStagger}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14"
          >
            <div className="order-2 lg:order-1 lg:col-span-7">
              <motion.p
                variants={ticketReveal}
                className="font-heading text-xs font-semibold uppercase tracking-[0.28em] text-rave-red sm:text-sm"
              >
                {content.eyebrow || event.title}
              </motion.p>

              <motion.h1
                id="tickets-hero-title"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
                }}
                className="mt-4 font-heading text-4xl font-black uppercase leading-[1.02] tracking-tight text-white sm:text-5xl md:text-6xl"
              >
                <span className="block overflow-hidden"><motion.span variants={eventHeroLineReveal} className="block">{content.title}</motion.span></span>
              </motion.h1>

              {description && (
                <motion.div
                  variants={ticketReveal}
                  className="mt-5 max-w-xl text-base leading-relaxed text-rave-muted md:text-lg"
                >
                  <RichText text={description} />
                </motion.div>
              )}

              <motion.dl
                variants={ticketReveal}
                data-ticket-event-details=""
                className="mt-8 divide-y divide-white/[0.08] overflow-hidden rounded-[18px] border border-white/[0.10] bg-rave-panel/50 backdrop-blur-sm"
              >
                {details.map(({ Icon, label, value, note }) => (
                  <div key={label} className="flex items-start gap-4 px-5 py-4">
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rave-red/30 bg-rave-red/10">
                      <Icon aria-hidden className="h-[18px] w-[18px] text-rave-red" />
                    </span>
                    <div className="min-w-0">
                      <dt className="font-heading text-[11px] uppercase tracking-[0.22em] text-rave-muted/80">{label}</dt>
                      <dd className="mt-1 font-heading text-base font-semibold uppercase tracking-wide text-white sm:text-lg">{value}</dd>
                      {note && <dd className="mt-0.5 text-sm text-rave-muted">{note}</dd>}
                    </div>
                  </div>
                ))}
              </motion.dl>

              <motion.div variants={ticketReveal} className="mt-8 flex flex-wrap items-center gap-3">
                {onlineTiers.length > 0 ? (
                  <a href="#ticket-options" className={primaryClass}>
                    <Ticket aria-hidden className="h-4 w-4" />
                    Choose tickets
                    <ArrowDown aria-hidden className="h-4 w-4" />
                  </a>
                ) : providerUrl ? (
                  <a href={providerUrl} target="_blank" rel="noopener noreferrer" data-hero-buy="" className={primaryClass}>
                    <Ticket aria-hidden className="h-4 w-4" />
                    Buy tickets on {providerName}
                    <ExternalLink aria-hidden className="h-4 w-4" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                ) : null}
                {onlineTiers.length > 0 && providerUrl && (
                  <a href={providerUrl} target="_blank" rel="noopener noreferrer" className={secondaryClass}>
                    Or buy on {providerName}
                    <ExternalLink aria-hidden className="h-4 w-4" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                )}
                <NavigationLink href={`/events/${encodeURIComponent(event.slug)}`} className={secondaryClass}>
                  Event details
                  <ArrowRight aria-hidden className="h-4 w-4" />
                </NavigationLink>
              </motion.div>

              {(cheapest || (providerUrl && onlineTiers.length === 0)) && (
                <motion.p variants={ticketReveal} className="mt-4 text-sm text-rave-muted">
                  {cheapest
                    ? <>Tickets from <span className="font-semibold text-white">{formatMoney(cheapest.price)}</span></>
                    : <>Checkout is completed securely on {providerName}.</>}
                </motion.p>
              )}
            </div>

            <motion.div variants={ticketReveal} className="order-1 lg:order-2 lg:col-span-5">
              <motion.div
                ref={visualRef}
                data-ticket-poster=""
                style={reduced ? undefined : { rotateX: rotX, rotateY: rotY, transformPerspective: 1200 }}
                onMouseMove={(e) => {
                  if (reduced) return;
                  const rect = visualRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  tiltX.set((e.clientX - rect.left) / rect.width - 0.5);
                  tiltY.set((e.clientY - rect.top) / rect.height - 0.5);
                }}
                onMouseLeave={() => {
                  tiltX.set(0);
                  tiltY.set(0);
                }}
                className="relative mx-auto aspect-[4/5] w-full max-w-[460px] overflow-hidden rounded-[22px] border border-white/[0.10] bg-rave-panel shadow-[0_30px_80px_rgb(var(--rave-accent-rgb)/0.22)]"
              >
                {/* Posters come in any shape: the whole image is shown, a blurred copy fills the rest. */}
                <Image src={visual.src} alt="" aria-hidden fill sizes="(max-width: 1024px) 90vw, 460px" className="scale-110 object-cover opacity-50 blur-xl" />
                <Image
                  src={visual.src}
                  alt={visual.alt || `${event.title} poster`}
                  fill
                  priority
                  sizes="(max-width: 1024px) 90vw, 460px"
                  className="object-contain"
                />

                {!reduced && (
                  <motion.div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.16) 50%, transparent 65%)',
                    }}
                    initial={{ x: '-120%' }}
                    animate={inView ? { x: '120%' } : { x: '-120%' }}
                    transition={{ duration: 1.5, delay: 0.7, ease: 'easeInOut' }}
                  />
                )}
              </motion.div>

              {content.sideNotes.length > 0 && (
                <ul className="mx-auto mt-5 flex max-w-[460px] flex-wrap justify-center gap-2 font-heading text-[10px] uppercase tracking-[0.22em] text-rave-muted sm:text-xs">
                  {content.sideNotes.map((line) => (
                    <li key={line} className="rounded-full border border-white/[0.10] px-3 py-1">{line}</li>
                  ))}
                </ul>
              )}
            </motion.div>
          </motion.div>
        </Container>
      </section>
    </>
  );
}
