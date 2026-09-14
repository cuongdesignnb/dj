'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
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
import { aboutReveal, aboutStagger, aboutCardLift } from '@/lib/animations';
import type { AboutValueItem } from '@/lib/about/types';

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
  values: AboutValueItem[];
}

export default function AboutValues({ values }: Props) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduced = useReducedMotion();

  return (
    <section
      ref={ref}
      id="values"
      className="relative py-16 md:py-24 bg-rave-black"
      aria-labelledby="values-title"
    >
      <Container>
        <AboutSectionHeading
          eyebrow="WHAT DEFINES US"
          title="WHAT DEFINES US"
          context="MUSIC × PEOPLE × PLACE × PURPOSE"
        />

        <motion.ul
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={aboutStagger}
          className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {values.map((value) => {
            const Icon = ICON_MAP[value.icon] ?? Sparkles;
            const inner = (
              <motion.article
                variants={aboutReveal}
                whileHover={reduced ? undefined : 'hover'}
                animate="rest"
                className="group relative h-full overflow-hidden rounded-[18px] border border-white/[0.08] bg-rave-panel/45"
              >
                {/* Background image */}
                {value.image && (
                  <div className="absolute inset-0 overflow-hidden">
                    <motion.div
                      variants={aboutCardLift}
                      className="absolute inset-0"
                    >
                      <Image
                        src={value.image.src}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 100vw, 25vw"
                        className="object-cover opacity-50 group-hover:opacity-70 transition-opacity duration-500"
                      />
                    </motion.div>
                    <div
                      aria-hidden
                      className="absolute inset-0"
                      style={{
                        background:
                          'linear-gradient(180deg, rgba(11,11,18,0.30) 0%, rgba(11,11,18,0.50) 50%, rgba(11,11,18,0.95) 100%)',
                      }}
                    />
                  </div>
                )}

                <div className="relative z-10 p-6 flex flex-col gap-4 h-full min-h-[260px]">
                  <div className="flex items-center justify-between">
                    <motion.span
                      variants={aboutCardLift}
                      className="w-11 h-11 grid place-items-center rounded-xl bg-white/[0.06] border border-white/[0.08] text-rave-red"
                    >
                      <Icon className="w-5 h-5" aria-hidden />
                    </motion.span>

                    {value.href && (
                      <span
                        className={`w-9 h-9 grid place-items-center rounded-full border ${
                          value.spotlight
                            ? 'border-rave-red bg-rave-red/15 text-rave-red shadow-[0_0_20px_rgba(255,23,61,0.4)]'
                            : 'border-white/15 text-white/80'
                        } group-hover:text-rave-red group-hover:border-rave-red/60 transition-colors`}
                      >
                        <motion.span
                          whileHover={reduced ? undefined : { x: 2 }}
                          className="inline-flex"
                          aria-hidden
                        >
                          <ArrowRight className="w-4 h-4" />
                        </motion.span>
                      </span>
                    )}
                  </div>

                  <h3 className="font-heading uppercase tracking-wider text-white text-lg sm:text-xl font-bold">
                    {value.title}
                  </h3>
                  <p className="text-rave-muted text-sm leading-relaxed">{value.description}</p>
                </div>

                {value.spotlight && (
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-[inherit] pointer-events-none"
                    style={{
                      boxShadow:
                        '0 0 0 1px rgba(255,23,61,0.30), 0 0 26px rgba(255,23,61,0.20), inset 0 0 22px rgba(255,23,61,0.08)',
                    }}
                  />
                )}
              </motion.article>
            );

            return (
              <li
                key={value.id}
                className={`relative ${value.spotlight ? 'sm:-translate-y-2' : ''}`}
              >
                {value.href ? (
                  <Link
                    href={value.href}
                    aria-label={value.title}
                    className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black rounded-[18px]"
                  >
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </motion.ul>
      </Container>
    </section>
  );
}
