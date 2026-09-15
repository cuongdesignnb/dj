'use client';

import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import {
  Search,
  ClipboardList,
  Zap,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';
import Container from '@/components/ui/Container';
import PartnersSectionHeading from './PartnersSectionHeading';
import { partnerReveal, partnerStagger } from '@/lib/animations';
import type { CollaborationStep } from '@/lib/partners/types';

const ICON_MAP: Record<string, LucideIcon> = {
  Search,
  ClipboardList,
  Zap,
  BarChart3,
};

interface Props {
  steps: CollaborationStep[];
}

export default function CollaborationProcess({ steps }: Props) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduced = useReducedMotion();

  return (
    <section
      ref={ref}
      className="relative py-16 md:py-24 bg-rave-black"
      aria-labelledby="how-collaborate-title"
    >
      <Container>
        <PartnersSectionHeading
          eyebrow="HOW WE COLLABORATE"
          title="HOW WE COLLABORATE"
          context="FROM IDEA TO IMPACT"
        />

        <motion.ol
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={partnerStagger}
          className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 relative"
        >
          {steps.map((s, idx) => {
            const Icon = ICON_MAP[s.icon] ?? Search;
            const isLast = idx === steps.length - 1;
            return (
              <li key={s.id} className="relative">
                <motion.article
                  variants={partnerReveal}
                  className="h-full flex flex-col gap-4 p-6 sm:p-7 rounded-[18px] border border-white/[0.08] bg-rave-panel/40 hover:border-rave-red/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <motion.span
                      variants={partnerReveal}
                      className="font-heading text-rave-red text-2xl sm:text-3xl font-black tracking-tight"
                    >
                      {s.number}
                    </motion.span>
                    <motion.span
                      aria-hidden
                      initial={false}
                      whileHover={reduced ? undefined : { scale: 1.12, rotate: -6 }}
                      transition={{ type: 'spring', stiffness: 320, damping: 16 }}
                      className="w-10 h-10 grid place-items-center rounded-lg bg-rave-red/15 border border-rave-red/40 text-rave-red"
                    >
                      <Icon className="w-5 h-5" />
                    </motion.span>
                  </div>
                  <h3 className="font-heading uppercase tracking-wider text-white font-bold text-base sm:text-lg">
                    {s.title}
                  </h3>
                  <p className="text-rave-muted text-sm leading-relaxed">{s.description}</p>
                </motion.article>
                {!isLast && !reduced && (
                  <motion.span
                    aria-hidden
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: 0.2 + idx * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="hidden lg:block absolute top-[42px] right-[-12px] w-6 h-px bg-gradient-to-r from-rave-red/70 to-rave-red/20 origin-left"
                  />
                )}
              </li>
            );
          })}
        </motion.ol>
      </Container>
    </section>
  );
}
