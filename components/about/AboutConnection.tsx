'use client';

import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import {
  Music,
  Users,
  Heart,
  Sparkles,
  Disc3,
  Headphones,
  MapPin,
  Calendar,
  type LucideIcon,
} from 'lucide-react';
import Container from '@/components/ui/Container';
import AboutSectionHeading from './AboutSectionHeading';
import { aboutReveal, aboutStagger } from '@/lib/animations';
import type { AboutConnectionItem } from '@/lib/about/types';

const ICON_MAP: Record<string, LucideIcon> = {
  Music,
  Users,
  Heart,
  Sparkles,
  Disc3,
  Headphones,
  MapPin,
  Calendar,
};

interface Props {
  items: AboutConnectionItem[];
}

export default function AboutConnection({ items }: Props) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduced = useReducedMotion();

  return (
    <section
      ref={ref}
      id="why-connect"
      className="relative py-16 md:py-24 bg-rave-black"
      aria-labelledby="why-connect-title"
    >
      <Container>
        <AboutSectionHeading
          eyebrow="WHY PEOPLE CONNECT"
          title="WHY PEOPLE CONNECT"
          context="REAL PEOPLE × GENUINE MOMENTS × LASTING IMPACT"
        />

        <motion.ul
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={aboutStagger}
          className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
        >
          {items.map((item) => {
            const Icon = ICON_MAP[item.icon] ?? Sparkles;
            return (
              <li key={item.id}>
                <motion.article
                  variants={aboutReveal}
                  whileHover={reduced ? undefined : { y: -4 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                  className="group h-full flex items-start gap-4 p-6 sm:p-7 rounded-[18px] border border-white/[0.08] bg-rave-panel/30 hover:border-rave-red/40 hover:bg-rave-panel/55 transition-colors"
                >
                  <motion.span
                    aria-hidden
                    initial={false}
                    whileHover={reduced ? undefined : { scale: 1.15 }}
                    className="w-11 h-11 grid place-items-center rounded-xl bg-rave-red/15 border border-rave-red/35 text-rave-red flex-shrink-0"
                  >
                    <Icon className="w-5 h-5" />
                  </motion.span>
                  <div>
                    <h3 className="font-heading uppercase tracking-wider text-white text-base sm:text-lg font-bold">
                      {item.title}
                    </h3>
                    <p className="text-rave-muted text-sm leading-relaxed mt-2">
                      {item.description}
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
