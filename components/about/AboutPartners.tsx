'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import Container from '@/components/ui/Container';
import AboutSectionHeading from './AboutSectionHeading';
import { aboutReveal, aboutStagger } from '@/lib/animations';
import type { PartnerItem } from '@/lib/about/types';

interface Props {
  partners: PartnerItem[];
}

export default function AboutPartners({ partners }: Props) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduced = useReducedMotion();

  if (partners.length === 0) return null;

  return (
    <section
      ref={ref}
      id="partners"
      className="relative py-16 md:py-24 bg-rave-deep"
      aria-labelledby="partners-title"
    >
      <Container>
        <AboutSectionHeading
          eyebrow="IN PARTNERSHIP WITH"
          title="IN PARTNERSHIP WITH"
          context="SHARED VISION × STRONGER TOGETHER"
        />

        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={aboutStagger}
          className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10"
        >
          {partners.map((partner, i) => {
            const inner = (
              <motion.article
                variants={aboutReveal}
                whileHover={reduced ? undefined : { y: -4 }}
                transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                className="group h-full flex flex-col sm:flex-row items-start gap-5 sm:gap-7 p-6 sm:p-8 rounded-[18px] border border-white/[0.08] bg-rave-panel/40 hover:border-rave-red/30 transition-colors"
              >
                <div className="relative flex-shrink-0 w-full sm:w-[180px] h-20 sm:h-[100px] grid place-items-center">
                  <Image
                    src={partner.logo.src}
                    alt={partner.logo.alt}
                    width={partner.logo.width ?? 240}
                    height={partner.logo.height ?? 80}
                    className={`max-h-full w-auto object-contain opacity-60 group-hover:opacity-100 transition-opacity ${
                      reduced ? '' : 'group-hover:drop-shadow-[0_0_18px_rgba(255,23,61,0.45)]'
                    }`}
                  />
                  {!reduced && (
                    <span
                      aria-hidden
                      className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{
                        background:
                          'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.10) 50%, transparent 70%)',
                      }}
                    />
                  )}
                </div>
                <div className="flex flex-col">
                  <h3 className="font-heading uppercase tracking-wider text-white font-bold text-lg">
                    {partner.name}
                  </h3>
                  {partner.description && (
                    <p className="text-rave-muted text-sm leading-relaxed mt-2">
                      {partner.description}
                    </p>
                  )}
                </div>
              </motion.article>
            );

            return (
              <div key={partner.id} className="relative">
                {partner.href ? (
                  <Link
                    href={partner.href}
                    aria-label={partner.name}
                    className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-deep rounded-[18px]"
                  >
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
                {i === 0 && partners.length > 1 && (
                  <motion.span
                    aria-hidden
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="hidden md:block absolute top-6 -right-5 w-px h-24 bg-white/10 origin-top"
                  />
                )}
              </div>
            );
          })}
        </motion.div>
      </Container>
    </section>
  );
}
