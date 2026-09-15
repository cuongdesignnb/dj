'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import Container from '@/components/ui/Container';
import NeonButton from '@/components/home/NeonButton';
import { partnerReveal, partnerStagger } from '@/lib/animations';
import type { PartnersFinalCta } from '@/lib/partners/types';

interface Props {
  cta: PartnersFinalCta;
}

export default function PartnersCTA({ cta }: Props) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduced = useReducedMotion();

  return (
    <section
      ref={ref}
      className="relative overflow-hidden py-20 md:py-32"
      aria-labelledby="partners-final-cta-title"
    >
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
          variants={partnerStagger}
          className="text-center flex flex-col items-center"
        >
          <motion.h2
            id="partners-final-cta-title"
            variants={partnerReveal}
            className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase leading-[0.95] text-white max-w-5xl"
          >
            {cta.title}
          </motion.h2>

          {cta.description && (
            <motion.p
              variants={partnerReveal}
              className="text-rave-muted text-base sm:text-lg leading-relaxed mt-5 max-w-3xl"
            >
              {cta.description}
            </motion.p>
          )}

          <motion.div
            variants={partnerReveal}
            className="flex flex-wrap items-center justify-center gap-3 mt-8"
          >
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
