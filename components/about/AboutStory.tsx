'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import Container from '@/components/ui/Container';
import AboutSectionHeading from './AboutSectionHeading';
import {
  aboutImageReveal,
  aboutReveal,
  aboutStagger,
} from '@/lib/animations';
import type { AboutStoryData } from '@/lib/about/types';

interface Props {
  story: AboutStoryData;
}

export default function AboutStory({ story }: Props) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduced = useReducedMotion();

  return (
    <section
      ref={ref}
      id="our-story"
      className="relative py-16 md:py-24 bg-rave-deep"
      aria-labelledby="story-title"
    >
      <Container>
        <div className="mb-10 md:mb-14">
          <AboutSectionHeading
            eyebrow={story.eyebrow}
            title="OUR STORY"
            context=""
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          {/* Image with reveal */}
          <motion.figure
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            variants={aboutImageReveal}
            className="lg:col-span-6 relative aspect-[16/10] lg:aspect-auto rounded-[20px] overflow-hidden border border-white/[0.08]"
          >
            <Image
              src={story.image.src}
              alt={story.image.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(7,7,13,0.10) 0%, rgba(7,7,13,0.0) 40%, rgba(7,7,13,0.7) 100%), linear-gradient(120deg, rgba(255,23,61,0.10), transparent 60%)',
                mixBlendMode: 'screen',
              }}
            />
            {story.imageOverlayLabels && story.imageOverlayLabels.length > 0 && (
              <div
                aria-hidden
                className="absolute left-5 bottom-5 flex flex-col gap-1 font-heading uppercase tracking-[0.25em] text-[10px] sm:text-xs text-white/70"
              >
                {story.imageOverlayLabels.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
            )}
          </motion.figure>

          {/* Content */}
          <motion.div
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            variants={aboutStagger}
            className="lg:col-span-6 flex flex-col"
          >
            <motion.span
              variants={aboutReveal}
              className="font-heading uppercase tracking-[0.25em] text-xs sm:text-sm text-rave-red font-semibold"
            >
              {story.eyebrow}
            </motion.span>

            <motion.h3
              id="story-title"
              variants={aboutReveal}
              className="font-heading text-3xl sm:text-4xl md:text-5xl font-black uppercase leading-[1.05] text-white mt-3"
            >
              {story.title}
            </motion.h3>

            <div className="flex flex-col gap-4 mt-6">
              {story.paragraphs.map((p, i) => (
                <motion.p
                  key={i}
                  variants={aboutReveal}
                  className="text-rave-muted text-base md:text-lg leading-relaxed"
                >
                  {p}
                </motion.p>
              ))}
            </div>

            {/* Quote card */}
            <motion.figure
              variants={aboutReveal}
              className="relative mt-8 p-6 sm:p-7 rounded-[18px] border border-white/[0.08] bg-rave-panel/55 backdrop-blur"
            >
              <span
                aria-hidden
                className={`absolute top-3 left-4 font-heading text-5xl leading-none text-rave-red ${
                  reduced ? '' : 'animate-pulse-glow'
                }`}
                style={{ textShadow: '0 0 18px rgba(255,23,61,0.55)' }}
              >
                “
              </span>
              <blockquote className="font-heading text-xl sm:text-2xl md:text-[28px] leading-snug text-white italic pt-3">
                {story.quote.text}
              </blockquote>
              {story.quote.footer && (
                <figcaption className="mt-4 font-heading uppercase tracking-[0.25em] text-[10px] sm:text-xs text-rave-muted">
                  {story.quote.footer}
                </figcaption>
              )}
            </motion.figure>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
