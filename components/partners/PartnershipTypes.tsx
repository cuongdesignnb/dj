'use client';

import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import {
  Crown,
  Star,
  Megaphone,
  Users,
  Heart,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import Container from '@/components/ui/Container';
import PartnersSectionHeading from './PartnersSectionHeading';
import { partnerReveal, partnerStagger } from '@/lib/animations';
import type { PartnershipType } from '@/lib/partners/types';

const ICON_MAP: Record<string, LucideIcon> = {
  Crown,
  Star,
  Megaphone,
  Users,
  Heart,
  Sparkles,
};

interface Props {
  types: PartnershipType[];
}

export default function PartnershipTypes({ types }: Props) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduced = useReducedMotion();

  return (
    <section
      ref={ref}
      className="relative py-16 md:py-24 bg-rave-black"
      aria-labelledby="partnership-types-title"
    >
      <Container>
        <PartnersSectionHeading
          eyebrow="PARTNERSHIP TYPES"
          title="PARTNERSHIP TYPES"
          context="DIFFERENT ROLES × A STRONGER SCENE"
        />

        <motion.ul
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={partnerStagger}
          className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5"
        >
          {types.map((t) => {
            const Icon = ICON_MAP[t.icon] ?? Star;
            return (
              <li key={t.id}>
                <motion.article
                  variants={partnerReveal}
                  whileHover={reduced ? undefined : { y: -8, scale: 1.015 }}
                  animate="rest"
                  transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                  className="group h-full flex flex-col gap-4 p-6 sm:p-7 rounded-[18px] border border-white/[0.08] bg-rave-panel/40 hover:border-rave-red/55 hover:shadow-[0_0_28px_rgba(255,23,61,0.18)] transition-colors"
                >
                  <motion.div
                    whileHover={reduced ? undefined : { scale: 1.08 }}
                    className="w-11 h-11 grid place-items-center rounded-xl bg-white/[0.06] border border-white/[0.08] text-rave-red"
                    aria-hidden
                  >
                    <Icon className="w-5 h-5" />
                  </motion.div>
                  <h3 className="font-heading uppercase tracking-wider text-white font-bold text-base sm:text-lg">
                    {t.title}
                  </h3>
                  <ul className="flex flex-col gap-2 mt-1">
                    {t.highlights.map((h) => (
                      <li
                        key={h}
                        className="relative pl-4 text-rave-muted text-sm leading-relaxed before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-rave-red/80"
                      >
                        {h}
                      </li>
                    ))}
                  </ul>
                </motion.article>
              </li>
            );
          })}
        </motion.ul>
      </Container>
    </section>
  );
}
