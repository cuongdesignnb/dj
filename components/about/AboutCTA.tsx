'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import Container from '@/components/ui/Container';
import NeonButton from '@/components/home/NeonButton';
import { aboutReveal, aboutStagger } from '@/lib/animations';
import type { AboutFinalCta } from '@/lib/about/types';

interface Props {
  cta: AboutFinalCta;
}

export default function AboutCTA({ cta }: Props) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduced = useReducedMotion();

  return (
    <section
      ref={ref}
      id="experience"
      className="relative overflow-hidden py-20 md:py-32"
      aria-labelledby="about-final-cta-title"
    >
      {/* Background image with parallax-ish overlay */}
      {cta.background && (
        <div aria-hidden className="absolute inset-0 -z-10">
          <Image
            src={cta.background.src}
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(3,3,5,0.55), rgba(3,3,5,0.85) 60%, rgba(3,3,5,0.95))',
            }}
          />
        </div>
      )}

      {/* Slow red glow */}
      {!reduced && (
        <motion.div
          aria-hidden
          className="absolute inset-0 -z-10 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: [0.25, 0.45, 0.25] } : { opacity: 0 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background:
              'radial-gradient(60% 60% at 50% 50%, rgba(255,23,61,0.32), transparent 70%)',
          }}
        />
      )}

      <Container>
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={aboutStagger}
          className="text-center flex flex-col items-center"
        >
          {cta.eyebrow && (
            <motion.span
              variants={aboutReveal}
              className="font-heading uppercase tracking-[0.32em] text-xs sm:text-sm text-rave-red font-semibold"
            >
              {cta.eyebrow}
            </motion.span>
          )}
          <motion.h2
            id="about-final-cta-title"
            variants={aboutReveal}
            className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase leading-[0.95] text-white mt-4 max-w-4xl"
          >
            {cta.title}
          </motion.h2>

          <motion.div variants={aboutReveal} className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <NeonButton href={cta.primary.href} intense>
              {cta.primary.label}
            </NeonButton>
            {cta.secondary && (
              <NeonButton href={cta.secondary.href} variant="secondary">
                {cta.secondary.label}
              </NeonButton>
            )}
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
