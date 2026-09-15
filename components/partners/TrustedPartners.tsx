'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import Container from '@/components/ui/Container';
import PartnersSectionHeading from './PartnersSectionHeading';
import { partnerReveal, partnerStagger } from '@/lib/animations';
import type { PartnerProfile } from '@/lib/partners/types';

interface Props {
  partners: PartnerProfile[];
}

export default function TrustedPartners({ partners }: Props) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduced = useReducedMotion();

  if (partners.length === 0) return null;

  return (
    <section
      ref={ref}
      className="relative py-12 md:py-16 bg-rave-deep"
      aria-labelledby="trusted-partners-title"
    >
      <Container>
        <PartnersSectionHeading
          eyebrow="TRUSTED BY PARTNERS"
          title="TRUSTED BY PARTNERS"
          context="A STRONGER TOMORROW × TOGETHER"
        />

        <motion.ul
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={partnerStagger}
          className="mt-10 grid grid-cols-2 sm:flex sm:flex-wrap sm:justify-center sm:items-center gap-x-10 gap-y-6 sm:gap-x-12 lg:gap-x-16"
        >
          {partners.map((p) => (
            <li key={p.id}>
              <motion.div
                variants={partnerReveal}
                whileHover={reduced ? undefined : { scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                className="relative h-10 sm:h-12 w-auto min-w-[110px] flex items-center justify-center"
              >
                <Image
                  src={p.logo.src}
                  alt={p.logo.alt}
                  width={p.logo.width ?? 200}
                  height={p.logo.height ?? 60}
                  className="max-h-full w-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
                />
              </motion.div>
            </li>
          ))}
        </motion.ul>
      </Container>
    </section>
  );
}
