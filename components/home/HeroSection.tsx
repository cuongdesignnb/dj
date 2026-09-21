'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Ticket, Disc3 } from 'lucide-react';
import Image from 'next/image';
import NeonButton from './NeonButton';
import Container from '../ui/Container';
import { fadeUp, staggerContainer, bounceIn, staggerFast } from '@/lib/animations';
import GlitchText from '../ui/GlitchText';
import AudioBars from '../ui/AudioBars';
import DancingCrowd, { LaserLights, DiscoBall } from '../ui/DancingCrowd';
import DESTINYShatter from '../ui/DESTINYShatter';
import { stableUnit, stableSigned } from '@/lib/stable-visual';
import type { HomeEvent } from './types';

interface Particle {
  width: number;
  height: number;
  left: string;
  top: string;
  background: string;
  yMove: number;
  xMove: number;
  duration: number;
  delay: number;
}

function FloatingParticles() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const list: Particle[] = Array.from({ length: 30 }).map((_, index) => ({
      width: stableUnit(index + 1) * 4 + 1,
      height: stableUnit(index + 31) * 4 + 1,
      left: `${stableUnit(index + 61) * 100}%`,
      top: `${stableUnit(index + 91) * 100}%`,
      background: [
        'rgba(255,23,61,0.6)',
        'rgba(139,44,255,0.5)',
        'rgba(46,107,255,0.5)',
        'rgba(255,10,120,0.5)',
      ][Math.floor(stableUnit(index + 121) * 4)],
      yMove: -30 - stableUnit(index + 151) * 40,
      xMove: stableSigned(index + 181, 10),
      duration: 4 + stableUnit(index + 211) * 4,
      delay: stableUnit(index + 241) * 3,
    }));

    const timer = setTimeout(() => {
      setParticles(list);
    }, 50);

    return () => clearTimeout(timer);
  }, []);


  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.width,
            height: p.height,
            left: p.left,
            top: p.top,
            background: p.background,
          }}
          animate={{
            y: [0, p.yMove, 0],
            x: [0, p.xMove, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: p.delay,
          }}
        />
      ))}
    </div>
  );
}

function EnhancedLaserBeams() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[3]">
      {/* Laser 1 - Magenta Left */}
      <motion.div
        className="absolute top-0 left-1/4 w-[2px] h-[150%] bg-gradient-to-b from-rave-magenta via-rave-magenta/50 to-transparent origin-top"
        style={{ filter: 'blur(1px)' }}
        animate={{
          rotate: [-25, 20, -25],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Laser Glow Effect */}
      <motion.div
        className="absolute top-0 left-1/4 w-[8px] h-[150%] bg-gradient-to-b from-rave-magenta/20 to-transparent origin-top -translate-x-1/2"
        animate={{
          rotate: [-25, 20, -25],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Laser 2 - Blue Right */}
      <motion.div
        className="absolute top-0 right-1/4 w-[2px] h-[150%] bg-gradient-to-b from-rave-blue via-rave-blue/50 to-transparent origin-top"
        style={{ filter: 'blur(1px)' }}
        animate={{
          rotate: [25, -20, 25],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />

      {/* Laser Glow Effect 2 */}
      <motion.div
        className="absolute top-0 right-1/4 w-[8px] h-[150%] bg-gradient-to-b from-rave-blue/20 to-transparent origin-top -translate-x-1/2"
        animate={{
          rotate: [25, -20, 25],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />

      {/* Laser 3 - Red Center */}
      <motion.div
        className="absolute top-0 left-1/2 w-[3px] h-[150%] bg-gradient-to-b from-rave-red to-transparent origin-top"
        style={{ filter: 'blur(2px)' }}
        animate={{
          rotate: [-10, 15, -10],
          opacity: [0.4, 0.8, 0.4],
          scaleX: [1, 1.5, 1],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2.5 }}
      />

      {/* Laser 4 - Purple Accent */}
      <motion.div
        className="absolute top-0 left-1/3 w-[1px] h-[150%] bg-gradient-to-b from-rave-purple to-transparent origin-top"
        style={{ filter: 'blur(1px)' }}
        animate={{
          rotate: [-35, -15, -35],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />

      {/* Moving Laser Sweep */}
      <motion.div
        className="absolute top-0 w-[1px] h-[120%] bg-gradient-to-b from-white/50 to-transparent origin-top"
        animate={{
          left: ['0%', '100%'],
          opacity: [0, 0.5, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
}

function HeroBackground({ image }: { image: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <motion.div
      ref={ref}
      className="absolute inset-0"
      style={{ scale, opacity }}
    >
      {/* Hero background image with pulse */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${image})` }}
        animate={{
          scale: [1, 1.02, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Disco Ball */}
      <DiscoBall />

      {/* Laser Lights */}
      <LaserLights />

      {/* Dancing Crowd Silhouettes */}
      <DancingCrowd count={20} />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-rave-black/90 via-rave-black/60 to-rave-black" />
      <div className="absolute inset-0 bg-gradient-to-r from-rave-red/10 via-transparent to-rave-purple/10" />

      {/* Side light beams */}
      <div className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-rave-red/5 to-transparent" />
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-rave-purple/5 to-transparent" />

      {/* Animated ambient glow - bass pulse effect */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            'radial-gradient(ellipse at center, rgba(255,23,61,0.08) 0%, transparent 70%)',
            'radial-gradient(ellipse at center, rgba(255,23,61,0.12) 0%, transparent 70%)',
            'radial-gradient(ellipse at center, rgba(255,23,61,0.08) 0%, transparent 70%)',
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Intense ambient orbs - multiple floating lights */}
      <motion.div
        className="absolute w-96 h-96 rounded-full"
        style={{
          top: '20%',
          left: '10%',
          background: 'radial-gradient(circle, rgba(255,23,61,0.15) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        animate={{
          x: [0, 50, -30, 20, 0],
          y: [0, -30, 20, -20, 0],
          scale: [1, 1.2, 0.9, 1.1, 1],
          opacity: [0.4, 0.7, 0.5, 0.6, 0.4],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute w-72 h-72 rounded-full"
        style={{
          top: '30%',
          right: '15%',
          background: 'radial-gradient(circle, rgba(139,44,255,0.12) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }}
        animate={{
          x: [0, -40, 30, -20, 0],
          y: [0, 40, -30, 20, 0],
          scale: [1, 1.3, 1, 1.2, 1],
          opacity: [0.3, 0.6, 0.4, 0.5, 0.3],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      <motion.div
        className="absolute w-64 h-64 rounded-full"
        style={{
          bottom: '25%',
          left: '30%',
          background: 'radial-gradient(circle, rgba(255,10,120,0.1) 0%, transparent 70%)',
          filter: 'blur(45px)',
        }}
        animate={{
          x: [0, 30, -20, 10, 0],
          y: [0, 20, -30, 10, 0],
          scale: [1, 1.1, 0.95, 1.05, 1],
          opacity: [0.3, 0.5, 0.4, 0.5, 0.3],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      />

      {/* Aurora-like gradient overlay */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, rgba(255,23,61,0.05) 0%, rgba(139,44,255,0.05) 50%, rgba(46,107,255,0.05) 100%)',
          mixBlendMode: 'screen',
        }}
        animate={{
          opacity: [0.3, 0.6, 0.4, 0.5, 0.3],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Bottom crowd silhouette overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-rave-black to-transparent" />
    </motion.div>
  );
}

function DestinyTitle({ text }: { text: string }) {
  return (
    <motion.div
      variants={fadeUp}
      className="relative flex items-center justify-center py-2 my-0 select-none"
    >
      {/* Concentric expanding bass beats */}
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-rave-red/35"
          style={{
            width: i === 0 ? 140 : i === 1 ? 200 : i === 2 ? 280 : 350,
            height: i === 0 ? 140 : i === 1 ? 200 : i === 2 ? 280 : 350,
          }}
          animate={{
            scale: [0.8, 1.8],
            opacity: [0.4, 0],
          }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            delay: i * 0.6,
            ease: 'easeOut',
          }}
        />
      ))}

      {/* DESTINY Light Sweep & Shatter */}
      <DESTINYShatter
        text={text}
        fontSize={200}
        className="font-heading text-[80px] sm:text-[120px] md:text-[160px] lg:text-[200px] font-black uppercase leading-[0.8] tracking-wider text-white italic"
      />
    </motion.div>
  );
}

function AudioVisualizer() {
  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0 }}
      animate={{ opacity: 1, scaleY: 1 }}
      transition={{ delay: 0.8, duration: 0.5 }}
      className="flex items-center justify-center gap-2 mt-4"
    >
      <AudioBars
        count={7}
        width={5}
        height={45}
        gap={4}
        colors={['#ff173d', '#ff304f', '#ff0a78', '#8b2cff', '#ff173d']}
        minHeight={0.25}
        maxHeight={1}
      />
    </motion.div>
  );
}

export default function HeroSection({ event }: { event: HomeEvent }) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-[84px]">
      {/* Background layers */}
      <HeroBackground image={event.hero?.src || '/assets/hero-crowd.jpg'} />

      {/* Lasers */}
      <EnhancedLaserBeams />

      {/* Particles */}
      <FloatingParticles />

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-rave-grid opacity-30" />

      {/* Scan line effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-20 overflow-hidden"
        animate={{
          opacity: [0, 0.03, 0],
        }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <div
          className="w-full h-[2px] bg-gradient-to-r from-transparent via-white/50 to-transparent"
          style={{ animation: 'scanline 4s linear infinite' }}
        />
      </motion.div>

      {/* Content */}
      <Container className="relative z-10 py-16 md:py-24">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center text-center gap-4"
        >
          {/* Sponsors block - Animated entrance */}
          <motion.div
            variants={fadeUp}
            className="flex flex-row items-center justify-center gap-10 md:gap-14 mb-4"
          >
            {/* MCQ Block */}
            <motion.div
              className="flex flex-col items-center gap-2"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <span className="text-[10px] tracking-[0.35em] uppercase text-rave-muted font-heading font-semibold">Powered by</span>
              <div className="h-[44px] sm:h-[50px] flex items-center select-none">
                <Image src="/assets/logo-mcq.svg" alt="MCQ Supermarket" width={180} height={50} className="h-full w-auto object-contain" />
              </div>
              <span className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-rave-red font-heading font-extrabold mt-1">POWERED BY MCQ SUPERMARKET</span>
            </motion.div>

            <motion.div
              className="w-px h-20 bg-white/10 self-stretch"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            />

            {/* BIHI Block */}
            <motion.div
              className="flex flex-col items-center gap-2"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <span className="text-[10px] tracking-[0.35em] uppercase text-rave-muted font-heading font-semibold">Presented by</span>
              <div className="h-[44px] sm:h-[50px] flex items-center select-none">
                <Image src="/assets/logo-bihi.svg" alt="BIHI Entertainment" width={180} height={50} className="h-full w-auto object-contain" />
              </div>
              <span className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-rave-red font-heading font-extrabold mt-1">PRESENTED BY BIHI ENTERTAINMENT</span>
            </motion.div>
          </motion.div>

          {/* Tagline */}
          <motion.p
            variants={fadeUp}
            className="font-heading uppercase tracking-[0.25em] text-xs sm:text-sm text-white/90 font-medium mb-1"
          >
            {event.eyebrow || event.shortDescription || 'EVENT DETAILS'}
          </motion.p>

          {/* DESTINY wordmark with pulsing subwoofer circles */}
          <DestinyTitle text={event.title} />

          {/* Audio Visualizer */}
          <AudioVisualizer />

          {/* Paragraph description */}
          <motion.div variants={fadeUp} className="max-w-2xl mt-2 flex flex-col gap-1">
            <p className="text-sm sm:text-base md:text-lg text-white/90 leading-relaxed font-body font-medium">
              {event.description || event.shortDescription || 'Event details will be published here when confirmed.'}
            </p>
          </motion.div>

          {/* Urgency Alert Badge - Animated entrance */}
          <motion.div
            variants={bounceIn}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-rave-red/10 border border-rave-red/35 mt-1 animate-border-glow"
          >
            <motion.span
              animate={{ rotate: [-10, 10, -10] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="text-base sm:text-lg"
            >
              ⚠️
            </motion.span>
            <span className="font-heading uppercase tracking-[0.15em] text-xs sm:text-sm text-rave-red font-bold">
              {event.dateStatus.toUpperCase() === 'CONFIRMED' ? 'EVENT DETAILS CONFIRMED' : 'EVENT DETAILS TO BE CONFIRMED'}
            </span>
          </motion.div>

          {/* Pill Red Glow Button */}
          <motion.div variants={fadeUp} className="mt-4 flex flex-col items-center gap-3">
            <NeonButton
              href="/tickets"
              variant="primary"
              intense={true}
              icon={
                <motion.div
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center -ml-2"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                >
                  <Ticket className="w-4 h-4 text-white" />
                </motion.div>
              }
              rightIcon={
                <span className="text-white font-extrabold tracking-tighter ml-1 text-xl sm:text-2xl transition-transform duration-300 group-hover:translate-x-1 inline-block">
                  »
                </span>
              }
              className="!px-10 !py-4.5 !rounded-full !text-base sm:!text-lg border border-white/15 hover:border-rave-red shadow-[0_0_30px_rgba(255,23,61,0.65)] hover:shadow-[0_0_40px_rgba(255,23,61,0.85)]"
            >
              View Ticket Details
            </NeonButton>
            <motion.span
              className="font-heading uppercase tracking-[0.2em] text-[10px] sm:text-xs text-rave-muted font-bold"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {event.scheduleStatus.toUpperCase() === 'CONFIRMED' ? 'SCHEDULE CONFIRMED' : 'SCHEDULE TO BE CONFIRMED'}
            </motion.span>
          </motion.div>
        </motion.div>
      </Container>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-rave-black to-transparent z-10" />

      {/* Corner decorations */}
      <motion.div
        className="absolute top-20 left-4 w-16 h-16 border-l-2 border-t-2 border-rave-red/30"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.2 }}
      />
      <motion.div
        className="absolute top-20 right-4 w-16 h-16 border-r-2 border-t-2 border-rave-red/30"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.3 }}
      />
    </section>
  );
}
