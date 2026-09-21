'use client';

import { useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import Container from '../ui/Container';
import SectionTitle from './SectionTitle';
import NeonButton from './NeonButton';
import type { HomeArtist } from './types';
import { fadeUp, staggerContainer } from '@/lib/animations';

interface ArtistCardProps {
  artist: HomeArtist;
  index: number;
}

function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 500, damping: 50 });
  const mouseY = useSpring(y, { stiffness: 500, damping: 50 });

  const rotateX = useTransform(mouseY, [-0.5, 0.5], ['7deg', '-7deg']);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ['-7deg', '7deg']);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseXVal = (e.clientX - rect.left) / width - 0.5;
    const mouseYVal = (e.clientY - rect.top) / height - 0.5;
    x.set(mouseXVal);
    y.set(mouseYVal);
  }, [x, y]);

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.div
      ref={ref}
      className={`tilt-container ${className}`}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  );
}

function ArtistCard({ artist, index }: ArtistCardProps) {
  return (
    <motion.div
      variants={fadeUp}
      className="flex-shrink-0 w-[230px] sm:w-[250px] md:w-[270px] lg:w-[290px] group snap-start"
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.08 }}
    >
      <Link href={artist.href} className="block">
        <TiltCard>
          <motion.div
            whileHover={{
              y: -12,
              scale: 1.02,
            }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="bg-[#0B0B12] rounded-2xl overflow-hidden border border-rave-red/40 hover:border-rave-red transition-all duration-500 cursor-pointer flex flex-col select-none"
            style={{ transform: 'translateZ(20px)' }}
          >
            {/* Card Header (Black background with details) */}
            <div className="p-4 bg-rave-black border-b border-white/[0.06] flex flex-col gap-1">
              {/* Top Row: Country (orange) & Year */}
              <div className="flex items-center justify-between">
                <motion.span
                  className="text-[11px] font-heading font-extrabold uppercase tracking-widest text-[#FF8A00]"
                  whileHover={{ scale: 1.05 }}
                >
                  {artist.country}
                </motion.span>
                <span className="text-[11px] font-heading font-bold text-white/50 uppercase tracking-widest">
                  {artist.year}
                </span>
              </div>
              {/* Bottom Row: Name */}
              <motion.h3
                className="font-heading text-lg sm:text-xl font-bold uppercase tracking-wider text-white flex items-center gap-1.5 mt-0.5"
                whileHover={{ x: 4 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <span className="text-rave-red font-light">↳</span> {artist.name}
              </motion.h3>
            </div>

            {/* Card Image Body */}
            <div className="relative aspect-[4/4.5] overflow-hidden bg-rave-deep">
              {/* Image with clip-path reveal on hover */}
              <motion.div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${artist.image})` }}
                initial={{ clipPath: 'inset(100% 0 0 0)' }}
                whileInView={{ clipPath: 'inset(0% 0 0 0)' }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              />

              {/* Fallback gradient if no image */}
              <div className="absolute inset-0 bg-gradient-to-br from-rave-purple/10 via-transparent to-rave-red/10 mix-blend-overlay opacity-30 pointer-events-none" />

              {/* Bottom gradient overlay inside the image */}
              <div className="absolute inset-0 bg-gradient-to-t from-rave-black/50 to-transparent pointer-events-none" />

              {/* View Artist overlay with scale animation */}
              <motion.div
                className="absolute inset-0 bg-rave-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[1px]"
                style={{ transform: 'translateZ(30px)' }}
              >
                <motion.span
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileHover={{ scale: 1.1 }}
                  className="px-4 py-2 rounded-full bg-rave-red text-white font-heading uppercase text-xs tracking-wider shadow-lg shadow-rave-red/35"
                >
                  View Profile →
                </motion.span>
              </motion.div>

              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 animate-shimmer" />
              </div>

              {/* Neon border glow effect */}
              <div
                className="absolute inset-0 rounded-none pointer-events-none animate-border-glow"
              />
            </div>
          </motion.div>
        </TiltCard>
      </Link>
    </motion.div>
  );
}

export default function LineupPreview({ artists }: { artists: HomeArtist[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(artists.length > 1);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
    setTimeout(checkScroll, 400);
  };

  return (
    <section className="relative py-20 md:py-28 overflow-hidden bg-rave-black">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-rave-grid opacity-15 pointer-events-none" />

      {/* Ambient background lights - animated */}
      <motion.div
        className="absolute top-1/3 -left-40 w-96 h-96 bg-rave-purple/5 rounded-full blur-[120px]"
        animate={{
          x: [-20, 20, -20],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-1/3 -right-40 w-96 h-96 bg-rave-red/5 rounded-full blur-[120px]"
        animate={{
          x: [20, -20, 20],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Glowing top line */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(to right, transparent, rgba(255, 23, 61, 0.5), transparent)',
        }}
        animate={{
          opacity: [0.3, 0.8, 0.3],
        }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      <Container className="relative z-10">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 md:mb-14">
          <div>
            <SectionTitle
              eyebrow="Lineup / Music"
              title="The Artists"
              align="left"
            />
          </div>
          <motion.div
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <div
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rave-red/10 border border-rave-red/20 animate-border-glow"
            >
              <Sparkles className="w-3.5 h-3.5 text-rave-red" />
              <span className="font-heading uppercase tracking-[0.15em] text-xs text-rave-red font-semibold">
                Date to be announced
              </span>
            </div>
            <NeonButton href="/lineup" variant="ghost" className="!py-2.5 !px-5 !text-xs">
              View Full Lineup
            </NeonButton>
          </motion.div>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Scroll arrows with enhanced hover effects */}
          {canScrollLeft && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => scroll('left')}
              className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-rave-black/85 border border-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-rave-red/20 hover:border-rave-red hover:shadow-[0_0_12px_rgba(255,23,61,0.4)] transition-all duration-300"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
          )}
          {canScrollRight && (
            <motion.button
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => scroll('right')}
              className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-rave-black/85 border border-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-rave-red/20 hover:border-rave-red hover:shadow-[0_0_12px_rgba(255,23,61,0.4)] transition-all duration-300"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          )}

          {/* Edge gradients */}
          <div className="absolute top-0 left-0 bottom-0 w-8 bg-gradient-to-r from-rave-black to-transparent z-10 pointer-events-none" />
          <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-rave-black to-transparent z-10 pointer-events-none" />

          {/* Cards container */}
          <motion.div
            ref={scrollRef}
            onScroll={checkScroll}
            variants={staggerContainer}
            className="flex gap-5 overflow-x-auto scrollbar-hide pb-6 px-1 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {artists.length > 0 ? (
              artists.map((artist, index) => <ArtistCard key={artist.href} artist={artist} index={index} />)
            ) : (
              <p className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] px-6 py-10 text-center text-sm text-rave-muted">
                Artist details will be published here when confirmed.
              </p>
            )}
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
