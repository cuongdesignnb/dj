'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Container from '@/components/ui/Container';
import { ticketReveal, ticketStagger } from '@/lib/animations';
import type { TicketsFinalCta } from '@/lib/tickets/types';

export default function TicketsCTA({ cta }: { cta: TicketsFinalCta }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['-6%', '6%']);

  return (
    <section
      ref={ref}
      aria-labelledby="tickets-cta-title"
      className="relative isolate overflow-hidden bg-rave-black py-20 md:py-28"
    >
      {cta.background?.src && (
        <motion.div
          aria-hidden
          style={reduced ? undefined : { y: backgroundY }}
          className="absolute inset-0 -z-10 scale-110"
        >
          <Image
            src={cta.background.src}
            alt=""
            fill
            aria-hidden
            loading="lazy"
            sizes="100vw"
            className="object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(3,3,5,0.94) 0%, rgba(3,3,5,0.86) 45%, rgba(3,3,5,0.80) 100%)',
            }}
          />
        </motion.div>
      )}

      <Container>
        <motion.div
          variants={ticketStagger}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.25fr_1fr] lg:gap-12"
        >
          <div>
            <motion.h2
              id="tickets-cta-title"
              variants={ticketReveal}
              className="font-heading text-3xl font-black uppercase leading-[1.03] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-[52px]"
            >
              {cta.title}
            </motion.h2>
            {cta.subtitle && (
              <motion.p
                variants={ticketReveal}
                className="mt-4 text-sm leading-relaxed text-rave-muted sm:text-base"
              >
                {cta.subtitle}
              </motion.p>
            )}
          </div>

          <motion.div
            variants={ticketReveal}
            className="flex flex-wrap items-start gap-3 lg:justify-end"
          >
            <Link
              href={cta.primary.href}
              className="group/cta inline-flex items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-rave-red to-rave-red2 px-6 py-3.5 font-heading text-sm font-semibold uppercase tracking-wider text-white shadow-[0_0_22px_rgba(255,23,61,0.35)] transition-all duration-300 hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black sm:text-base"
            >
              <span>{cta.primary.label}</span>
              <ArrowRight aria-hidden className="h-4 w-4 transition-transform group-hover/cta:translate-x-1" />
            </Link>

            {cta.secondary && (
              <Link
                href={cta.secondary.href}
                className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-white/15 bg-white/[0.02] px-6 py-3.5 font-heading text-sm font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:border-rave-red/60 hover:bg-rave-red/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black sm:text-base"
              >
                {cta.secondary.label}
              </Link>
            )}
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
