'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useInView, useReducedMotion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Music, Users, Heart, MapPin, Sparkles, Disc3, type LucideIcon } from 'lucide-react';
import Container from '@/components/ui/Container';
import NeonButton from '@/components/home/NeonButton';
import { aboutHeroLineReveal, aboutStagger, aboutReveal } from '@/lib/animations';
import type { AboutHeroData } from '@/lib/about/types';

const ICON_MAP: Record<string, LucideIcon> = {
  Music,
  Users,
  Heart,
  MapPin,
  Sparkles,
  Disc3,
};

interface Props {
  hero: AboutHeroData;
}

export default function AboutHero({ hero }: Props) {
  const ref = useRef<HTMLElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const reduced = useReducedMotion();

  // 3D tilt (desktop only). Bind to pointer relative to the visual panel.
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const rotX = useSpring(useTransform(tiltY, [-0.5, 0.5], [2, -2]), { stiffness: 90, damping: 16 });
  const rotY = useSpring(useTransform(tiltX, [-0.5, 0.5], [-3, 3]), { stiffness: 90, damping: 16 });
  const ambient = !reduced && inView;
  const heroScale = useSpring(1, { stiffness: 60, damping: 14 });

  return (
    <section
      ref={ref}
      className="relative isolate overflow-hidden pt-8 pb-16 md:pt-12 md:pb-24 bg-rave-black"
      aria-labelledby="about-hero-title"
    >
      {/* Subtle radial accent — keeps the dark feel without flooding red. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 12% 18%, rgba(255,23,61,0.16), transparent 55%), radial-gradient(circle at 90% 80%, rgba(139,44,255,0.10), transparent 60%)',
        }}
      />

      <Container>
        <motion.div
          variants={aboutStagger}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center"
        >
          {/* Left — copy */}
          <div className="lg:col-span-7">
            <motion.span
              variants={aboutReveal}
              className="font-heading uppercase tracking-[0.28em] text-xs sm:text-sm text-rave-red font-semibold"
            >
              {hero.titleLines.length > 0 ? hero.eyebrow : ''}
            </motion.span>

            <motion.h1
              id="about-hero-title"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.12, delayChildren: 0.25 } },
              }}
              className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-[64px] font-black uppercase leading-[1.02] tracking-tight text-white mt-4"
            >
              {hero.titleLines.map((line) => (
                <span key={line} className="block overflow-hidden">
                  <motion.span
                    variants={aboutHeroLineReveal}
                    className="block"
                  >
                    {line}
                  </motion.span>
                </span>
              ))}
            </motion.h1>

            <motion.p
              variants={aboutReveal}
              className="text-rave-muted text-base md:text-lg leading-relaxed mt-6 max-w-2xl"
            >
              {hero.description}
            </motion.p>

            <motion.div
              variants={aboutReveal}
              className="flex flex-wrap items-center gap-3 mt-7"
            >
              <NeonButton href={hero.primaryCta.href}>{hero.primaryCta.label}</NeonButton>
              <NeonButton href={hero.secondaryCta.href} variant="secondary">
                {hero.secondaryCta.label}
              </NeonButton>
            </motion.div>

            <motion.ul
              variants={aboutReveal}
              className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-8 text-rave-muted"
              aria-label="Brand attributes"
            >
              {hero.attributes.map((attr) => {
                const Icon = ICON_MAP[attr.icon] ?? Sparkles;
                return (
                  <li
                    key={attr.id}
                    className="flex items-center gap-2 font-heading uppercase tracking-[0.18em] text-xs"
                  >
                    <Icon className="w-3.5 h-3.5 text-rave-red" aria-hidden />
                    <span>{attr.label}</span>
                  </li>
                );
              })}
            </motion.ul>
          </div>

          {/* Right — visual */}
          <motion.div
            variants={aboutReveal}
            className="lg:col-span-5"
          >
            <motion.div
              ref={visualRef}
              style={reduced ? undefined : { rotateX: rotX, rotateY: rotY, scale: heroScale }}
              onMouseMove={(e) => {
                if (reduced) return;
                const rect = visualRef.current?.getBoundingClientRect();
                if (!rect) return;
                const px = (e.clientX - rect.left) / rect.width - 0.5;
                const py = (e.clientY - rect.top) / rect.height - 0.5;
                tiltX.set(px);
                tiltY.set(py);
              }}
              onMouseLeave={() => {
                if (reduced) return;
                tiltX.set(0);
                tiltY.set(0);
              }}
              className="relative aspect-[4/5] sm:aspect-[5/6] overflow-hidden rounded-[20px] border border-white/[0.08] shadow-[0_30px_80px_rgba(255,23,61,0.18)]"
            >
              <Image
                src={hero.visual.src}
                alt={hero.visual.alt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="object-cover"
              />
              {/* Cinematic color wash */}
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(3,3,5,0.35) 0%, rgba(3,3,5,0) 30%, rgba(3,3,5,0.65) 100%), linear-gradient(120deg, rgba(255,23,61,0.18), rgba(139,44,255,0.10) 60%, transparent 100%)',
                  mixBlendMode: 'screen',
                }}
              />

              {/* Side annotations */}
              {hero.visualAnnotations.side.length > 0 && (
                <div
                  aria-hidden
                  className="absolute top-1/2 right-3 sm:right-5 -translate-y-1/2 flex flex-col gap-2 font-heading uppercase tracking-[0.22em] text-[10px] sm:text-xs text-white/70 text-right"
                >
                  {hero.visualAnnotations.side.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </div>
              )}

              {/* Bottom labels */}
              {hero.visualAnnotations.bottom.length > 0 && (
                <div
                  aria-hidden
                  className="absolute left-4 bottom-4 right-4 flex items-center justify-between gap-2 font-heading uppercase tracking-[0.22em] text-[10px] sm:text-xs text-white/70"
                >
                  {hero.visualAnnotations.bottom.map((line, i) => (
                    <span
                      key={line}
                      className={i === 0 || i === hero.visualAnnotations.bottom.length - 1 ? '' : 'hidden sm:inline'}
                    >
                      {line}
                    </span>
                  ))}
                </div>
              )}

              {/* Center circular badge with glow */}
              {hero.badge && (
                <motion.div
                  aria-hidden
                  className="absolute inset-0 grid place-items-center"
                  animate={ambient ? { scale: [1, 1.03, 1], opacity: [0.85, 1, 0.85] } : undefined}
                  transition={ambient ? { duration: 5, repeat: Infinity, ease: 'easeInOut' } : undefined}
                >
                  <div
                    className="relative w-[42%] aspect-square"
                    style={{
                      filter: 'drop-shadow(0 0 22px rgba(255,23,61,0.55)) drop-shadow(0 0 50px rgba(255,23,61,0.30))',
                    }}
                  >
                    <Image
                      src={hero.badge.src}
                      alt=""
                      fill
                      sizes="30vw"
                      className="object-contain"
                    />
                  </div>
                </motion.div>
              )}

              {/* Slow red ambient glow */}
              {!reduced && (
                <motion.div
                  aria-hidden
                  className="absolute -inset-2 -z-10 rounded-[24px] blur-2xl"
                  style={{
                    background:
                      'radial-gradient(60% 60% at 50% 50%, rgba(255,23,61,0.45), transparent 70%)',
                  }}
                  animate={
                    ambient
                      ? { opacity: [0.35, 0.55, 0.35] }
                      : { opacity: 0 }
                  }
                  transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
