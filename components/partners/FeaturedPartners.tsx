'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { NavigationLink as Link } from '@/components/shared/NavigationFeedback';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { PartnerLogo } from '@/components/shared/Sponsors';
import Container from '@/components/ui/Container';
import PartnersSectionHeading from './PartnersSectionHeading';
import { partnerReveal, partnerStagger } from '@/lib/animations';
import type { PartnerProfile } from '@/lib/partners/types';
import RichText from '@/components/shared/RichText';

interface Props {
  partners: PartnerProfile[];
}

export default function FeaturedPartners({ partners }: Props) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduced = useReducedMotion();

  if (partners.length === 0) return null;

  return (
    <section
      ref={ref}
      className="relative py-16 md:py-24 bg-rave-deep"
      aria-labelledby="featured-partners-title"
    >
      <Container>
        <PartnersSectionHeading
          eyebrow="FEATURED PARTNERS"
          title="FEATURED PARTNERS"
          context="REAL PARTNERS × REAL IMPACT × A BRIGHTER TOMORROW"
        />

        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={partnerStagger}
          className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-5"
        >
          {partners.map((p) => {
            const ctaHref = p.href ?? '/contact?type=partnership';
            const ctaLabel = 'View Collaboration';
            return (
              <motion.article
                key={p.id}
                variants={partnerReveal}
                whileHover={reduced ? undefined : { y: -6 }}
                transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                className="group relative overflow-hidden rounded-[20px] border border-white/[0.08] bg-rave-panel/40"
              >
                <div className="grid grid-cols-1 md:grid-cols-5 items-stretch">
                  {/* Logo column */}
                  <div className="md:col-span-2 p-7 sm:p-9 flex flex-col gap-5 justify-between bg-rave-panel/60">
                    <motion.div
                      variants={partnerReveal}
                      className="relative h-12 sm:h-14 w-full max-w-[220px] grid place-items-start"
                    >
                      <PartnerLogo logo={p.logo} name={p.name} className="max-h-full w-auto object-contain opacity-95 group-hover:drop-shadow-[0_0_14px_rgb(var(--rave-accent-rgb)/0.45)] transition" />
                    </motion.div>
                    {p.tagline && (
                      <motion.div
                        variants={partnerReveal}
                        className="font-heading uppercase tracking-[0.25em] text-[10px] sm:text-xs text-rave-red"
                      >
                        {p.tagline}
                      </motion.div>
                    )}
                  </div>

                  {/* Visual / description column */}
                  {p.image && (
                    <div className="md:col-span-3 relative min-h-[220px]">
                      <Image
                        src={p.image.src}
                        alt={p.image.alt}
                        fill
                        sizes="(max-width: 1024px) 100vw, 30vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.035]"
                      />
                      <div
                        aria-hidden
                        className="absolute inset-0"
                        style={{
                          background:
                            'linear-gradient(135deg, rgb(var(--rave-deep-rgb)/0.85) 0%, rgb(var(--rave-deep-rgb)/0.5) 35%, rgb(var(--rave-deep-rgb)/0.10) 70%, rgb(var(--rave-deep-rgb)/0.95) 100%), linear-gradient(120deg, rgb(var(--rave-accent-rgb)/0.18), transparent 60%)',
                          mixBlendMode: 'normal',
                        }}
                      />
                      <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-between">
                        <motion.div
                          variants={partnerReveal}
                          className="text-rave-muted text-sm sm:text-[15px] leading-relaxed max-w-md"
                        >
                          <RichText text={p.description} />
                        </motion.div>
                        <motion.div variants={partnerReveal}>
                          <Link
                            href={ctaHref}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[14px] border border-rave-red/60 text-white font-heading uppercase tracking-wider text-xs sm:text-sm font-semibold hover:bg-rave-red/15 hover:border-rave-red transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-deep"
                          >
                            <span>{ctaLabel}</span>
                            <motion.span
                              whileHover={reduced ? undefined : { x: 3 }}
                              className="inline-flex"
                              aria-hidden
                            >
                              <ArrowRight className="w-4 h-4" />
                            </motion.span>
                          </Link>
                        </motion.div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      </Container>
    </section>
  );
}
