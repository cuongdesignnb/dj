'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import Container from '@/components/ui/Container';
import { artistReveal, artistStagger } from '@/lib/animations';
import type { LineupStoryData } from '@/lib/artists/types';

export default function LineupStoryBanner({ story }: { story: LineupStoryData }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['-6%', '6%']);

  return (
    <section
      ref={ref}
      aria-labelledby="lineup-story-title"
      className="relative isolate overflow-hidden bg-rave-black py-20 md:py-28"
    >
      {story.image.src && (
        <motion.div
          aria-hidden
          style={reduced ? undefined : { y: backgroundY }}
          className="absolute inset-0 -z-10 scale-110"
        >
          <Image
            src={story.image.src}
            alt=""
            fill
            aria-hidden
            loading="lazy"
            sizes="100vw"
            className="object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(3,3,5,0.94) 0%, rgba(3,3,5,0.84) 50%, rgba(3,3,5,0.74) 100%)',
            }}
          />
        </motion.div>
      )}

      <Container>
        <motion.div
          variants={artistStagger}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.4fr_auto] lg:gap-12"
        >
          <div>
            <motion.p
              variants={artistReveal}
              className="font-heading text-[11px] uppercase tracking-[0.3em] text-rave-red sm:text-xs"
            >
              {story.eyebrow}
            </motion.p>
            <motion.h2
              id="lineup-story-title"
              variants={artistReveal}
              className="mt-4 font-heading text-3xl font-black uppercase leading-[1.03] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-[52px]"
            >
              {story.title}
            </motion.h2>
            <motion.p
              variants={artistReveal}
              className="mt-5 max-w-xl text-sm leading-relaxed text-rave-muted sm:text-base"
            >
              {story.description}
            </motion.p>
          </div>

          <motion.p
            variants={artistReveal}
            aria-hidden
            className="flex flex-col gap-1.5 font-heading text-[10px] uppercase tracking-[0.24em] text-white/70 sm:text-xs lg:text-right"
          >
            <span>People</span>
            <span>Music</span>
            <span>Culture</span>
            <span>Forever</span>
          </motion.p>
        </motion.div>
      </Container>
    </section>
  );
}
