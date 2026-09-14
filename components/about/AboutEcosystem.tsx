'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Container from '@/components/ui/Container';
import AboutSectionHeading from './AboutSectionHeading';
import { aboutReveal, aboutStagger } from '@/lib/animations';
import type { AboutEcosystemItem } from '@/lib/about/types';

interface Props {
  items: AboutEcosystemItem[];
}

export default function AboutEcosystem({ items }: Props) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduced = useReducedMotion();

  return (
    <section
      ref={ref}
      id="ecosystem"
      className="relative py-16 md:py-24 bg-rave-deep"
      aria-labelledby="ecosystem-title"
    >
      <Container>
        <AboutSectionHeading
          eyebrow="OUR WORLD"
          title="A WIDER ECOSYSTEM"
          context="EVENTS × ARTISTS × MERCHANDISE × PARTNERSHIPS"
        />

        <motion.ul
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={aboutStagger}
          className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5"
        >
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                aria-label={`${item.title} — ${item.subtitle}`}
                className="group block relative aspect-[3/4] sm:aspect-[4/5] rounded-[18px] overflow-hidden border border-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-deep"
              >
                <motion.div
                  variants={aboutReveal}
                  className="absolute inset-0"
                >
                  <Image
                    src={item.image.src}
                    alt={item.image.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 transition-opacity duration-500"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(7,7,13,0.10) 0%, rgba(7,7,13,0.55) 60%, rgba(7,7,13,0.95) 100%), linear-gradient(120deg, rgba(255,23,61,0.18), rgba(139,44,255,0.10) 60%, transparent 100%)',
                    }}
                  />
                </motion.div>

                <div className="absolute inset-0 flex flex-col justify-between p-5 sm:p-6 z-10">
                  <motion.div
                    variants={aboutReveal}
                    className="font-heading uppercase tracking-[0.3em] text-[10px] sm:text-xs text-rave-red"
                  >
                    {item.title}
                  </motion.div>
                  <div className="flex items-end justify-between gap-3">
                    <motion.div variants={aboutReveal}>
                      <h3 className="font-heading uppercase tracking-wider text-white font-black text-2xl sm:text-3xl">
                        {item.title}
                      </h3>
                      <p className="text-rave-muted text-xs sm:text-sm mt-1 max-w-[16ch]">
                        {item.subtitle}
                      </p>
                    </motion.div>
                    <motion.span
                      variants={aboutReveal}
                      whileHover={reduced ? undefined : { rotate: 45 }}
                      className="w-10 h-10 grid place-items-center rounded-full border border-white/15 bg-white/[0.06] text-white/85 group-hover:border-rave-red group-hover:text-rave-red transition-colors"
                      aria-hidden
                    >
                      <ArrowRight className="w-4 h-4" />
                    </motion.span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </motion.ul>
      </Container>
    </section>
  );
}
