'use client';

import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import {
  Users,
  Heart,
  AudioWaveform,
  Radio,
  BarChart3,
  Globe,
  type LucideIcon,
} from 'lucide-react';
import Container from '@/components/ui/Container';
import PartnersSectionHeading from './PartnersSectionHeading';
import { partnerReveal, partnerStagger } from '@/lib/animations';
import type { PartnerBenefit } from '@/lib/partners/types';

const ICON_MAP: Record<string, LucideIcon> = {
  Users,
  Heart,
  AudioWaveform,
  Radio,
  BarChart3,
  Globe,
};

interface Props {
  benefits: PartnerBenefit[];
}

export default function PartnershipBenefits({ benefits }: Props) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduced = useReducedMotion();

  return (
    <section
      ref={ref}
      className="relative py-16 md:py-24 bg-rave-deep"
      aria-labelledby="why-brands-title"
    >
      <Container>
        <PartnersSectionHeading
          eyebrow="WHY BRANDS PARTNER WITH CONNECTION"
          title="WHY BRANDS PARTNER WITH CONNECTION"
          context="MORE THAN EVENTS × REAL PEOPLE × LASTING IMPACT"
        />

        <motion.ul
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={partnerStagger}
          className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5"
        >
          {benefits.map((b) => {
            const Icon = ICON_MAP[b.icon] ?? Users;
            return (
              <li key={b.id}>
                <motion.article
                  variants={partnerReveal}
                  whileHover={reduced ? undefined : { y: -4 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                  className="group h-full flex items-start gap-4 p-6 sm:p-7 rounded-[18px] border border-white/[0.08] bg-rave-panel/30 hover:border-rave-red/40 hover:bg-rave-panel/55 transition-colors"
                >
                  <motion.span
                    aria-hidden
                    initial={false}
                    whileHover={reduced ? undefined : { scale: 1.12 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    className="w-11 h-11 grid place-items-center rounded-xl bg-rave-red/15 border border-rave-red/35 text-rave-red flex-shrink-0"
                  >
                    <Icon className="w-5 h-5" />
                  </motion.span>
                  <div>
                    <h3 className="font-heading uppercase tracking-wider text-white text-base sm:text-lg font-bold">
                      {b.title}
                    </h3>
                    <p className="text-rave-muted text-sm leading-relaxed mt-2">
                      {b.description}
                    </p>
                  </div>
                </motion.article>
              </li>
            );
          })}
        </motion.ul>
      </Container>
    </section>
  );
}
