'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Container from '@/components/ui/Container';
import EventsBreadcrumb from '@/components/events/EventsBreadcrumb';
import {
  eventHeroLineReveal,
  shopProductReveal,
  shopReveal,
  shopStagger,
} from '@/lib/animations';
import type { ShopPageData } from '@/lib/shop/types';

// Where each cut-out sits in the composition, back to front, with how far it
// drifts with the pointer. Depth sells the layering without any loop running.
const LAYERS = [
  { className: 'right-[2%] top-[4%] w-[46%]', depth: 10 },
  { className: 'left-[24%] top-[10%] w-[52%]', depth: 18 },
  { className: 'left-[-2%] top-[20%] w-[48%]', depth: 26 },
  { className: 'left-[30%] bottom-[-6%] w-[36%]', depth: 34 },
];

function Layer({
  src,
  className,
  depth,
  px,
  py,
  priority,
}: {
  src: string;
  className: string;
  depth: number;
  px: MotionValue<number>;
  py: MotionValue<number>;
  priority: boolean;
}) {
  const x = useTransform(px, (v) => v * depth);
  const y = useTransform(py, (v) => v * depth);
  return (
    <motion.div variants={shopProductReveal} className={`absolute ${className}`}>
      <motion.div style={{ x, y }} className="relative aspect-square w-full">
        <Image
          src={src}
          alt=""
          fill
          priority={priority}
          sizes="(max-width: 1024px) 50vw, 25vw"
          className="object-contain drop-shadow-[0_24px_40px_rgba(0,0,0,0.6)]"
        />
      </motion.div>
    </motion.div>
  );
}

/** Merchandise hero: copy on the left, layered product composition on the right. */
export default function ShopHero({ hero }: { hero: ShopPageData['hero'] }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const reduced = useReducedMotion();

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const px = useSpring(rawX, { stiffness: 70, damping: 18 });
  const py = useSpring(rawY, { stiffness: 70, damping: 18 });

  return (
    <>
      <EventsBreadcrumb trail={[{ label: 'Home', href: '/' }, { label: 'Merchandise' }]} />

      <section
        ref={ref}
        aria-labelledby="shop-hero-title"
        className="relative isolate overflow-hidden bg-rave-black pb-16 pt-6 md:pb-24 md:pt-8"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(circle at 12% 18%, rgba(255,23,61,0.16), transparent 55%), radial-gradient(circle at 88% 40%, rgba(255,23,61,0.14), transparent 55%)',
          }}
        />

        <Container>
          <motion.div
            variants={shopStagger}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8"
          >
            <div className="lg:col-span-5">
              <motion.p
                variants={shopReveal}
                className="font-heading text-xs font-semibold uppercase tracking-[0.3em] text-rave-red sm:text-sm"
              >
                {hero.eyebrow}
              </motion.p>

              <motion.h1
                id="shop-hero-title"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
                }}
                className="mt-4 font-heading text-5xl font-black uppercase leading-[0.98] tracking-tight text-white sm:text-6xl md:text-7xl"
              >
                {hero.titleLines.map((line, i) => (
                  <span key={line} className="block overflow-hidden">
                    <motion.span variants={eventHeroLineReveal} className="block">
                      {line}
                      {i < hero.titleLines.length - 1 && ' '}
                    </motion.span>
                  </span>
                ))}
              </motion.h1>

              <motion.p
                variants={shopReveal}
                className="mt-6 max-w-md text-base leading-relaxed text-rave-muted md:text-lg"
              >
                {hero.description}
              </motion.p>

              <motion.div variants={shopReveal} className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href={hero.primaryCta.href}
                  className="group/cta inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-rave-red to-rave-red2 px-6 font-heading text-sm font-semibold uppercase tracking-wider text-white shadow-[0_0_22px_rgba(255,23,61,0.35)] transition-all duration-300 hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black sm:text-base"
                >
                  {hero.primaryCta.label}
                  <ArrowRight aria-hidden className="h-4 w-4 transition-transform group-hover/cta:translate-x-1" />
                </Link>
                <Link
                  href={hero.secondaryCta.href}
                  className="group/cta inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[14px] border border-white/20 bg-white/[0.02] px-6 font-heading text-sm font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:border-rave-red/60 hover:bg-rave-red/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black sm:text-base"
                >
                  {hero.secondaryCta.label}
                  <ArrowRight aria-hidden className="h-4 w-4 transition-transform group-hover/cta:translate-x-1" />
                </Link>
              </motion.div>
            </div>

            <motion.div variants={shopReveal} className="lg:col-span-7">
              <div
                onPointerMove={(e) => {
                  if (reduced || e.pointerType !== 'mouse') return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  rawX.set((e.clientX - rect.left) / rect.width - 0.5);
                  rawY.set((e.clientY - rect.top) / rect.height - 0.5);
                }}
                onPointerLeave={() => {
                  rawX.set(0);
                  rawY.set(0);
                }}
                className="relative aspect-[16/12] overflow-hidden rounded-[22px] border border-white/[0.08] shadow-[0_30px_80px_rgba(255,23,61,0.18)]"
              >
                {/* Backdrop: the crowd photo pushed deep into red. */}
                <Image
                  src={hero.visual.src}
                  alt={hero.visual.alt}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  className="object-cover opacity-45"
                />
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(ellipse at 55% 35%, rgba(255,23,61,0.35), transparent 60%), linear-gradient(180deg, rgba(3,3,5,0.35) 0%, rgba(3,3,5,0.85) 100%)',
                  }}
                />

                {/* Decorative product arrangement; the copy already names the range. */}
                <motion.div aria-hidden variants={shopStagger} className="absolute inset-0">
                  {hero.composition.slice(0, LAYERS.length).map((asset, i) => (
                    <Layer
                      key={asset.src}
                      src={asset.src}
                      className={LAYERS[i].className}
                      depth={reduced ? 0 : LAYERS[i].depth}
                      px={px}
                      py={py}
                      priority={i >= 1}
                    />
                  ))}
                </motion.div>

                <div
                  aria-hidden
                  className="absolute bottom-5 right-5 hidden flex-col gap-1.5 text-right font-heading sm:flex text-[10px] uppercase tracking-[0.3em] text-white/85 sm:text-xs"
                  style={{ textShadow: '0 1px 6px rgba(0,0,0,0.85)' }}
                >
                  {hero.sideNotes.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                  <span className="ml-auto mt-1 block h-[2px] w-8 rounded-full bg-rave-red" />
                </div>

                {/* Always rendered so server and client markup match — the
                    reduced-motion preference is unknown on the server. CSS
                    hides it for reduced motion instead. */}
                <motion.div
                  aria-hidden
                  initial={{ x: '-120%' }}
                  animate={inView && !reduced ? { x: '220%' } : { x: '-120%' }}
                  transition={{ duration: 1.6, delay: 0.9, ease: 'easeInOut' }}
                  className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 motion-reduce:hidden"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        </Container>
      </section>
    </>
  );
}
