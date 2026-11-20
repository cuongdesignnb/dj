'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Container from '../ui/Container';
import SectionTitle from './SectionTitle';
import RichText from '@/components/shared/RichText';
import { NavigationLink } from '@/components/shared/NavigationFeedback';
import { fadeUp, staggerContainer } from '@/lib/animations';
import type { HomeMedia, HomeSectionCopy } from './types';

/** Who Connection is. Copy and image from Admin › Content › Homepage › About Connection. */
export default function AboutConnection({ copy, image, stats }: { copy: HomeSectionCopy; image: HomeMedia | null; stats: Array<{ value: number; label: string }> }) {
  const shown = stats.filter((stat) => stat.value > 0);
  return (
    <section id="about-connection" data-home-section="about" className="relative scroll-mt-24 overflow-hidden bg-rave-deep py-20 md:py-28">
      <Container>
        <div className={`grid grid-cols-1 items-center gap-10 lg:gap-16 ${image ? 'lg:grid-cols-2' : ''}`}>
          {image && (
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="relative aspect-[4/3] overflow-hidden rounded-[22px] border border-white/[0.08]">
              <Image src={image.src} alt={image.alt} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-tr from-rave-black/50 via-transparent to-transparent" />
            </motion.div>
          )}
          <div className={image ? '' : 'mx-auto max-w-3xl text-center'}>
            <SectionTitle eyebrow={copy.eyebrow} title={copy.title} align={image ? 'left' : 'center'} />
            {copy.description && (
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="-mt-4 text-base leading-relaxed text-white/85 md:text-lg">
                <RichText text={copy.description} />
              </motion.div>
            )}
            {shown.length > 0 && (
              <motion.dl variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className={`mt-8 grid grid-cols-2 gap-4 ${shown.length >= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                {shown.map((stat) => (
                  <motion.div key={stat.label} variants={fadeUp} className="rounded-2xl border border-white/[0.08] bg-rave-panel/60 p-5">
                    <dt className="font-heading text-[11px] uppercase tracking-[0.22em] text-rave-muted">{stat.label}</dt>
                    <dd className="mt-1 font-heading text-4xl font-black text-white">{stat.value}</dd>
                  </motion.div>
                ))}
              </motion.dl>
            )}
            {copy.ctaLabel && copy.ctaHref && (
              <NavigationLink href={copy.ctaHref} className={`mt-8 inline-flex min-h-[46px] items-center gap-2 rounded-full border border-white/[0.16] px-6 font-heading text-xs font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:border-rave-red hover:bg-rave-red/10`}>
                {copy.ctaLabel} <ArrowRight aria-hidden className="h-4 w-4" />
              </NavigationLink>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
