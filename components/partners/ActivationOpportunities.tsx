'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import {
  Monitor,
  AudioLines,
  Users,
  Sparkles,
  Globe,
  Camera,
  type LucideIcon,
} from 'lucide-react';
import Container from '@/components/ui/Container';
import PartnersSectionHeading from './PartnersSectionHeading';
import { partnerReveal, partnerStagger, partnerImageReveal } from '@/lib/animations';
import type { ActivationLead, ActivationOpportunity } from '@/lib/partners/types';

const ICON_MAP: Record<string, LucideIcon> = {
  Monitor,
  AudioLines,
  Users,
  Sparkles,
  Globe,
  Camera,
};

interface Props {
  lead: ActivationLead;
  opportunities: ActivationOpportunity[];
}

export default function ActivationOpportunities({ lead, opportunities }: Props) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduced = useReducedMotion();

  return (
    <section
      ref={ref}
      className="relative py-16 md:py-24 bg-rave-black"
      aria-labelledby="activation-opps-title"
    >
      <Container>
        <PartnersSectionHeading
          eyebrow="ACTIVATION OPPORTUNITIES"
          title="ACTIVATION OPPORTUNITIES"
          context="CREATIVE IDEAS × MEMORABLE MOMENTS × REAL CONNECTIONS"
        />

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 items-stretch">
          {/* Left: large visual with title */}
          <motion.figure
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            variants={partnerImageReveal}
            className="relative aspect-[16/12] lg:aspect-auto rounded-[20px] overflow-hidden border border-white/[0.08] min-h-[280px]"
          >
            <Image
              src={lead.image.src}
              alt={lead.image.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(7,7,13,0.30) 0%, rgba(7,7,13,0.55) 60%, rgba(7,7,13,0.92) 100%), linear-gradient(120deg, rgba(255,23,61,0.18), transparent 60%)',
              }}
            />
            <motion.div
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
              variants={partnerStagger}
              className="absolute inset-0 p-7 sm:p-9 flex flex-col justify-end"
            >
              <motion.h3
                variants={partnerReveal}
                className="font-heading text-3xl sm:text-4xl md:text-[44px] font-black uppercase leading-[0.95] text-white max-w-md"
              >
                {lead.title}
              </motion.h3>
              <motion.span
                variants={partnerReveal}
                aria-hidden
                className="block origin-left h-[2px] w-12 mt-5 mb-4 rounded-full bg-gradient-to-r from-rave-red to-rave-magenta"
                style={{ boxShadow: '0 0 18px rgba(255,23,61,0.55)' }}
              />
              <motion.p
                variants={partnerReveal}
                className="text-rave-muted text-base sm:text-lg leading-relaxed max-w-md"
              >
                {lead.description}
              </motion.p>
            </motion.div>
          </motion.figure>

          {/* Right: 6 cards in 2 columns x 3 rows */}
          <motion.ul
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            variants={partnerStagger}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4"
          >
            {opportunities.map((op) => {
              const Icon = ICON_MAP[op.icon] ?? Sparkles;
              return (
                <li key={op.id} className="h-full">
                  <motion.article
                    variants={partnerReveal}
                    whileHover={reduced ? undefined : { y: -3, scale: 1.01 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                    className="group h-full flex items-start gap-3 p-5 rounded-[14px] border border-white/[0.08] bg-rave-panel/35 hover:border-rave-red/45 hover:bg-rave-panel/60 transition-colors"
                  >
                    <motion.span
                      aria-hidden
                      initial={false}
                      whileHover={reduced ? undefined : { scale: 1.1, rotate: -4 }}
                      transition={{ type: 'spring', stiffness: 320, damping: 16 }}
                      className="w-10 h-10 grid place-items-center rounded-lg bg-rave-red/15 border border-rave-red/40 text-rave-red flex-shrink-0"
                    >
                      <Icon className="w-5 h-5" />
                    </motion.span>
                    <div>
                      <h3 className="font-heading uppercase tracking-wider text-white font-bold text-sm sm:text-base">
                        {op.title}
                      </h3>
                      <p className="text-rave-muted text-xs sm:text-sm leading-relaxed mt-1.5">
                        {op.description}
                      </p>
                    </div>
                  </motion.article>
                </li>
              );
            })}
          </motion.ul>
        </div>
      </Container>
    </section>
  );
}
