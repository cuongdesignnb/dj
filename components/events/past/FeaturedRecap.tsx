'use client';

import { useRef } from 'react';
import Image from 'next/image';
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
import { CalendarDays, Images, MapPin, Sparkles, SquarePlay } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Container from '@/components/ui/Container';
import { eventImageReveal, eventsReveal, eventsStagger } from '@/lib/animations';
import type { ArchiveContentType, PastEventSummary } from '@/lib/events/listing-types';
import EventAction from '../EventAction';
import EventsSectionHeading from '../EventsSectionHeading';
import { archiveDateLabel, archiveLocationLabel, contentTypeLabel } from '../labels';
import ArchiveEventVisual from './ArchiveEventVisual';

const CONTENT_ICON: Record<ArchiveContentType, LucideIcon> = {
  recap: SquarePlay,
  gallery: Images,
  highlights: Sparkles,
};

export default function FeaturedRecap({
  recap,
}: {
  recap: PastEventSummary | null | undefined;
}) {
  const ref = useRef<HTMLElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduced = useReducedMotion();

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [2, -2]), {
    stiffness: 90,
    damping: 16,
  });
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-3, 3]), {
    stiffness: 90,
    damping: 16,
  });

  if (!recap) {
    return (
      <section
        ref={ref}
        aria-labelledby="featured-recap-title"
        className="bg-rave-black py-16 md:py-24"
      >
        <Container>
          <EventsSectionHeading title="FEATURED RECAP" titleId="featured-recap-title" />
          <div className="mt-8 rounded-[18px] border border-white/[0.08] bg-rave-panel/60 px-6 py-12 text-center">
            <p className="text-sm text-rave-muted sm:text-base">
              No featured recap yet. Published recaps and galleries will appear here.
            </p>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section
      ref={ref}
      aria-labelledby="featured-recap-title"
      className="relative bg-rave-black py-16 md:py-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: 'radial-gradient(60% 50% at 20% 30%, rgba(255,23,61,0.10), transparent 60%)',
        }}
      />

      <Container>
        <EventsSectionHeading title="FEATURED RECAP" titleId="featured-recap-title" />

        <motion.div
          variants={eventsStagger}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="mt-9 grid grid-cols-1 items-center gap-8 md:grid-cols-2 lg:gap-12"
        >
          {/* Poster */}
          <motion.div
            ref={posterRef}
            variants={eventImageReveal}
            style={reduced ? undefined : { rotateX, rotateY, transformPerspective: 1000 }}
            onMouseMove={(e) => {
              if (reduced) return;
              const rect = posterRef.current?.getBoundingClientRect();
              if (!rect) return;
              pointerX.set((e.clientX - rect.left) / rect.width - 0.5);
              pointerY.set((e.clientY - rect.top) / rect.height - 0.5);
            }}
            onMouseLeave={() => {
              pointerX.set(0);
              pointerY.set(0);
            }}
            className="relative aspect-[4/5] overflow-hidden rounded-[18px] border border-rave-red/30 shadow-[0_30px_80px_rgba(255,23,61,0.22)]"
          >
            {recap.image.src ? (
              <Image
                src={recap.image.src}
                alt={recap.image.alt}
                fill
                sizes="(max-width: 768px) 100vw, 46vw"
                className="object-cover"
              />
            ) : (
              <ArchiveEventVisual title={recap.title} subtitle={recap.subtitle} size="feature" />
            )}
          </motion.div>

          {/* Info */}
          <div className="flex flex-col gap-5">
            <motion.div variants={eventsReveal}>
              <span className="inline-flex items-center rounded-lg border border-rave-red/70 bg-rave-red/12 px-3 py-1.5 font-heading text-[11px] font-semibold uppercase tracking-[0.22em] text-white">
                Past Event
              </span>
            </motion.div>

            <motion.p
              variants={eventsReveal}
              className="flex items-center gap-2 font-heading text-xs uppercase tracking-[0.24em] text-rave-red sm:text-sm"
            >
              <MapPin aria-hidden className="h-4 w-4" />
              {archiveLocationLabel(recap)}
            </motion.p>

            <motion.div variants={eventsReveal}>
              <h3 className="font-heading text-4xl font-black uppercase leading-[1.02] tracking-tight text-white sm:text-5xl lg:text-6xl">
                {recap.title}
              </h3>
              {recap.subtitle && (
                <p className="mt-2 font-heading text-sm uppercase tracking-[0.34em] text-rave-muted sm:text-base">
                  {recap.subtitle}
                </p>
              )}
            </motion.div>

            <motion.p
              variants={eventsReveal}
              className="flex items-center gap-2 text-sm text-rave-muted"
            >
              <CalendarDays aria-hidden className="h-4 w-4 shrink-0 text-rave-red" />
              {archiveDateLabel(recap)}
            </motion.p>

            {recap.excerpt && (
              <motion.p
                variants={eventsReveal}
                className="max-w-xl text-sm leading-relaxed text-rave-muted sm:text-base"
              >
                {recap.excerpt}
              </motion.p>
            )}

            {recap.contentTypes.length > 0 && (
              <motion.ul variants={eventsStagger} className="flex flex-wrap gap-2.5">
                {recap.contentTypes.map((type) => {
                  const Icon = CONTENT_ICON[type];
                  return (
                    <motion.li
                      key={type}
                      variants={{
                        hidden: { opacity: 0, scale: 0.94 },
                        visible: { opacity: 1, scale: 1, transition: { duration: 0.35 } },
                      }}
                      className="inline-flex items-center gap-2 rounded-[14px] border border-white/[0.10] bg-white/[0.03] px-3.5 py-2 font-heading text-[11px] uppercase tracking-[0.12em] text-rave-muted"
                    >
                      <Icon aria-hidden className="h-3.5 w-3.5 text-rave-red" />
                      {contentTypeLabel(type)}
                    </motion.li>
                  );
                })}
              </motion.ul>
            )}

            {recap.genres && recap.genres.length > 0 && (
              <motion.ul variants={eventsStagger} className="flex flex-wrap gap-2.5">
                {recap.genres.map((genre) => (
                  <motion.li
                    key={genre}
                    variants={{
                      hidden: { opacity: 0, scale: 0.94 },
                      visible: { opacity: 1, scale: 1, transition: { duration: 0.35 } },
                    }}
                    className="rounded-lg border border-white/[0.12] bg-white/[0.03] px-3.5 py-1.5 font-heading text-xs uppercase tracking-[0.14em] text-rave-muted"
                  >
                    {genre}
                  </motion.li>
                ))}
              </motion.ul>
            )}

            <motion.div variants={eventsReveal} className="flex flex-wrap items-start gap-3 pt-1">
              <EventAction
                action={{
                  label: 'View Recap',
                  href: recap.recapHref ?? null,
                  unavailableNote: recap.recapHref ? undefined : 'Recap page coming soon',
                }}
              />
              <EventAction
                action={{
                  label: 'See Gallery',
                  href: recap.galleryHref ?? null,
                  unavailableNote: recap.galleryHref ? undefined : 'Gallery coming soon',
                }}
                tone="secondary"
                icon={<Images aria-hidden className="h-4 w-4" />}
              />
            </motion.div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
