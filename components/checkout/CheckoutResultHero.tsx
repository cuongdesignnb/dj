'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import { Check, Clock, LoaderCircle, SearchX, TriangleAlert, X } from 'lucide-react';
import Container from '@/components/ui/Container';
import EventsBreadcrumb from '@/components/events/EventsBreadcrumb';
import { eventHeroLineReveal, shopReveal, shopStagger } from '@/lib/animations';
import type { CheckoutResultStatus } from '@/lib/checkout/types';
import type { ResultTone } from './resultCopy';

export interface HeroStep {
  id: string;
  label: string;
  state: 'done' | 'active' | 'pending';
}

const STATE_TEXT: Record<HeroStep['state'], string> = {
  done: 'complete',
  active: 'in progress',
  pending: 'not yet',
};

function StatusIcon({ status }: { status: CheckoutResultStatus }) {
  const cls = 'h-16 w-16 sm:h-20 sm:w-20';
  switch (status) {
    case 'paid':
    case 'processing':
      return <Check aria-hidden className={cls} strokeWidth={2.5} />;
    case 'pending':
      return <Clock aria-hidden className={cls} strokeWidth={2} />;
    case 'verifying':
      return (
        <LoaderCircle aria-hidden className={`${cls} animate-spin motion-reduce:animate-none`} strokeWidth={2} />
      );
    case 'not-found':
      return <SearchX aria-hidden className={cls} strokeWidth={2} />;
    case 'network-error':
      return <TriangleAlert aria-hidden className={cls} strokeWidth={2} />;
    default:
      return <X aria-hidden className={cls} strokeWidth={2.5} />;
  }
}

/**
 * Result hero. The ring only glows red for a verified success; waiting and
 * problem states use a quiet ring, so nothing celebrates an unconfirmed order.
 */
export default function CheckoutResultHero({
  status,
  tone,
  title,
  body,
  steps,
  sideNotes,
}: {
  status: CheckoutResultStatus;
  tone: ResultTone;
  title: string;
  body: string;
  steps: HeroStep[];
  sideNotes: string[];
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const success = tone === 'success';

  const ring = success
    ? 'border-rave-red text-rave-red shadow-[0_0_70px_rgba(255,23,61,0.75),inset_0_0_40px_rgba(255,23,61,0.45)]'
    : tone === 'problem'
      ? 'border-white/40 text-white/85'
      : 'border-white/30 text-white/80';

  return (
    <>
      <EventsBreadcrumb
        trail={[
          { label: 'Home', href: '/' },
          { label: 'Merchandise', href: '/shop' },
          { label: 'Order Result' },
        ]}
      />
      <section
        ref={ref}
        aria-labelledby="result-hero-title"
        className="relative isolate overflow-hidden border-b border-white/[0.06] bg-rave-black"
      >
        <div aria-hidden className="absolute inset-y-0 left-0 -z-10 w-full md:w-[48%]">
          <Image
            src="/assets/hero-crowd.jpg"
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, 48vw"
            className={`object-cover ${success ? 'opacity-60' : 'opacity-35 grayscale-[40%]'}`}
          />
          <div
            className="absolute inset-0"
            style={{
              background: success
                ? 'linear-gradient(90deg, rgba(3,3,5,0.2) 0%, rgba(3,3,5,0.55) 60%, #030305 100%), radial-gradient(circle at 45% 40%, rgba(255,23,61,0.35), transparent 55%)'
                : 'linear-gradient(90deg, rgba(3,3,5,0.45) 0%, rgba(3,3,5,0.75) 60%, #030305 100%)',
            }}
          />
        </div>
        <div
          aria-hidden
          className="absolute inset-0 -z-10 md:hidden"
          style={{ background: 'linear-gradient(180deg, rgba(3,3,5,0.3) 0%, #030305 70%)' }}
        />

        <Container>
          <motion.div
            variants={shopStagger}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className="grid grid-cols-1 items-center gap-8 py-10 md:grid-cols-[minmax(0,40fr)_minmax(0,60fr)] md:py-14"
          >
            <div className="flex justify-center md:justify-start md:pl-[8%]">
              <motion.div
                aria-hidden
                initial={{ scale: 0.6, opacity: 0 }}
                animate={inView ? { scale: 1, opacity: 1 } : undefined}
                transition={
                  success
                    ? { type: 'spring', stiffness: 220, damping: 14, delay: 0.2 }
                    : { duration: 0.4, delay: 0.1 }
                }
                className={`grid h-36 w-36 place-items-center rounded-full border-[5px] bg-black/40 sm:h-44 sm:w-44 ${ring}`}
              >
                <StatusIcon status={status} />
              </motion.div>
            </div>

            <div>
              <motion.p
                variants={shopReveal}
                className="inline-block rounded-[6px] border border-rave-red px-3 py-1 font-heading text-xs font-semibold uppercase tracking-[0.26em] text-rave-red"
              >
                Merchandise Checkout
              </motion.p>
              <h1
                id="result-hero-title"
                className="mt-4 overflow-hidden font-heading text-5xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-6xl md:text-7xl"
              >
                <motion.span variants={eventHeroLineReveal} className="block">
                  {title}
                </motion.span>
              </h1>
              <motion.p
                role="status"
                variants={shopReveal}
                className="mt-4 max-w-xl text-base leading-relaxed text-white/85 md:text-lg"
              >
                {body}
              </motion.p>

              {steps.length > 0 && (
                <motion.ol
                  variants={shopStagger}
                  aria-label="Order status"
                  className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-4"
                >
                  {steps.map((step, i) => (
                    <motion.li key={step.id} variants={shopReveal} className="flex items-center gap-3">
                      {i > 0 && (
                        <span
                          aria-hidden
                          className={`hidden h-[2px] w-10 rounded-full sm:block ${
                            step.state === 'done' ? 'bg-rave-red' : 'bg-white/20'
                          }`}
                        />
                      )}
                      <span
                        aria-hidden
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 ${
                          step.state === 'done'
                            ? 'border-rave-red text-rave-red shadow-[0_0_14px_rgba(255,23,61,0.45)]'
                            : step.state === 'active'
                              ? 'border-white/60 text-white'
                              : 'border-white/20 text-white/30'
                        }`}
                      >
                        {step.state === 'done' ? (
                          <Check className="h-5 w-5" strokeWidth={3} />
                        ) : step.state === 'active' ? (
                          <Clock className="h-4 w-4" />
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-current" />
                        )}
                      </span>
                      <span
                        className={`max-w-[7rem] text-sm leading-tight ${
                          step.state === 'pending' ? 'text-white/50' : 'text-white'
                        }`}
                      >
                        {step.label}
                        <span className="sr-only"> ({STATE_TEXT[step.state]})</span>
                      </span>
                    </motion.li>
                  ))}
                </motion.ol>
              )}
            </div>
          </motion.div>

          <div
            aria-hidden
            className="pointer-events-none absolute right-6 top-8 hidden flex-col gap-1.5 text-right font-heading text-xs uppercase tracking-[0.3em] text-white/75 xl:flex"
          >
            {sideNotes.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
          <p
            aria-hidden
            className="pb-5 text-right font-heading text-[10px] uppercase tracking-[0.3em] text-white/50"
          >
            Same People — A Brighter Tomorrow
          </p>
        </Container>
      </section>
    </>
  );
}
