'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Ticket, Zap, Flame, Clock, ShieldCheck, BadgeCheck, Users, ChevronRight } from 'lucide-react';
import Container from '../ui/Container';
import SectionTitle from './SectionTitle';
import NeonButton from './NeonButton';
import { ticketTiers, trustItems } from '@/lib/data';
import { fadeUp, staggerContainer, bounceIn } from '@/lib/animations';

const iconMap: Record<string, React.ElementType> = {
  ShieldCheck,
  BadgeCheck,
  Users,
};

const cardIcons = [Ticket, Zap, Flame];
const featureIcons = [Ticket, Flame, Clock];

// Animated counter component
function AnimatedCounter({ value, duration = 2000 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (isInView && !hasAnimated.current) {
      hasAnimated.current = true;
      let start = 0;
      const end = value;
      const incrementTime = (duration / end) * 0.8;

      const timer = setInterval(() => {
        start += 1;
        setCount(start);
        if (start >= end) clearInterval(timer);
      }, incrementTime);

      return () => clearInterval(timer);
    }
  }, [isInView, value, duration]);

  return <span ref={ref}>{count}</span>;
}

// Price with counter animation
function AnimatedPrice({ price, isNeon = false }: { price: string; isNeon?: boolean }) {
  const numericValue = parseInt(price.replace(/[^0-9]/g, ''), 10);
  const prefix = price.match(/^[^0-9]*/)?.[0] || '';

  return (
    <motion.span
      className={`font-heading text-5xl sm:text-6xl font-black ${isNeon ? 'text-rave-red text-neon-text' : 'text-white'}`}
      initial={{ opacity: 0, scale: 0.5 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
    >
      {prefix}<AnimatedCounter value={numericValue} />
    </motion.span>
  );
}

export default function TicketsSection() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden bg-rave-black">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-rave-grid opacity-15 pointer-events-none" />

      {/* Side spotlights - animated */}
      <motion.div
        className="absolute top-1/4 -left-32 w-64 h-96 bg-rave-red/5 rounded-full blur-[100px]"
        animate={{
          x: [-10, 10, -10],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-1/4 -right-32 w-64 h-96 bg-rave-purple/5 rounded-full blur-[100px]"
        animate={{
          x: [10, -10, 10],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Glowing top divider - animated */}
      <div
        className="absolute top-0 left-0 right-0 h-px animate-border-glow"
        style={{
          background: 'linear-gradient(to right, transparent, rgba(255, 23, 61, 0.5), transparent)',
        }}
      />

      <Container className="relative z-10">
        <SectionTitle
          eyebrow="Tickets & Pricing"
          title="Get Your Tickets"
          subtitle="Choose your tier. Lock it in. Be part of the night."
        />

        {/* Urgency bar */}
        <motion.div
          variants={bounceIn}
          className="flex justify-center mb-10 md:mb-14 select-none"
        >
          <div
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-rave-red/10 border border-rave-red/30 animate-border-glow"
          >
            <motion.span
              animate={{ rotate: [-15, 15, -15] }}
              transition={{ duration: 0.4, repeat: Infinity }}
              className="text-lg"
            >
              ⚡
            </motion.span>
            <span className="font-heading uppercase tracking-[0.12em] text-xs sm:text-sm text-rave-red font-bold">
              Final Release Selling Fast — Limited Spots Remaining
            </span>
            <motion.span
              animate={{ rotate: [15, -15, 15] }}
              transition={{ duration: 0.4, repeat: Infinity }}
              className="text-lg"
            >
              ⚡
            </motion.span>
          </div>
        </motion.div>

        {/* Ticket Cards Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-14"
        >
          {ticketTiers.map((tier, index) => {
            const CardIcon = cardIcons[index % cardIcons.length];
            const isStudent = index === 0;
            const isFinalRelease = index === 1;
            const isAtDoor = index === 2;

            return (
              <motion.div
                key={tier.name}
                variants={fadeUp}
                whileHover={{
                  y: -12,
                  scale: 1.02,
                  boxShadow: isStudent
                    ? '0 0 50px rgba(227, 28, 53, 0.5)'
                    : isFinalRelease
                    ? '0 0 45px rgba(255, 23, 61, 0.45)'
                    : '0 0 35px rgba(255, 255, 255, 0.1)',
                }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className={`relative flex flex-col rounded-2xl overflow-hidden p-6 sm:p-8 select-none ${
                  isStudent
                    ? 'bg-gradient-to-b from-[#D10A24] to-[#990B1E] border border-rave-red/50 shadow-[0_0_25px_rgba(227,28,53,0.25)] text-white'
                    : isFinalRelease
                    ? 'bg-gradient-to-b from-[#0F0F16] to-[#05050A] border border-rave-red/45 shadow-[0_0_20px_rgba(255,23,61,0.12)]'
                    : 'bg-gradient-to-b from-[#0B0B10] to-[#040408] border border-white/[0.06]'
                }`}
              >
                {/* Badge with bounce animation */}
                {tier.badge && (
                  <motion.div
                    className="absolute top-4 right-4 px-3 py-1 rounded-full bg-white/20 border border-white/30 backdrop-blur-sm"
                    initial={{ scale: 0, rotate: -10 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ type: 'spring', stiffness: 400, damping: 12 }}
                  >
                    <span className="font-heading uppercase tracking-wider text-[10px] text-white font-extrabold">
                      {tier.badge}
                    </span>
                  </motion.div>
                )}

                {/* Icon with glow effect */}
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${
                    isStudent
                      ? 'bg-white/15 border border-white/25'
                      : isFinalRelease
                      ? 'bg-rave-red/10 border border-rave-red/25 animate-border-glow'
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <CardIcon className={`w-7 h-7 ${isStudent ? 'text-white' : isFinalRelease ? 'text-rave-red' : 'text-rave-muted'}`} />
                </div>

                {/* Tier Name */}
                <motion.h3
                  className="font-heading text-xl uppercase tracking-wider text-white mb-2 font-bold"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                >
                  {tier.name}
                </motion.h3>

                {/* Price with animation */}
                <div className="mb-6 flex items-baseline gap-1">
                  <AnimatedPrice price={tier.price} isNeon={isFinalRelease} />
                  <span className={`text-xs uppercase font-heading tracking-widest ${isStudent ? 'text-white/70' : 'text-rave-muted'}`}>
                    / booking
                  </span>
                </div>

                {/* Features */}
                <div className="flex flex-col gap-3.5 mb-8 flex-1">
                  {tier.features.map((feature, i) => {
                    const FeatureIcon = featureIcons[i % featureIcons.length];
                    return (
                      <motion.div
                        key={i}
                        className="flex items-center gap-3"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                      >
                        <FeatureIcon className={`w-4 h-4 flex-shrink-0 ${isStudent ? 'text-white' : isFinalRelease ? 'text-rave-red' : 'text-rave-muted'}`} />
                        <span className={`text-sm ${isStudent ? 'text-white/90 font-medium' : 'text-white/80'}`}>{feature}</span>
                      </motion.div>
                    );
                  })}
                </div>

                {/* CTA Button */}
                {isStudent ? (
                  <NeonButton
                    href="/tickets"
                    hideChevron={true}
                    intense={true}
                    className="w-full justify-center !bg-white !text-[#D10A24] hover:!bg-white/95 !rounded-full !py-4 shadow-[0_0_20px_rgba(255,255,255,0.35)] font-bold"
                  >
                    ↳ Lock In Student&apos;s Deal
                  </NeonButton>
                ) : isFinalRelease ? (
                  <NeonButton
                    href="/tickets"
                    hideChevron={true}
                    intense={true}
                    rightIcon={<span className="text-white font-extrabold tracking-tighter ml-1 transition-transform duration-300 group-hover:translate-x-1 inline-block">»</span>}
                    className="w-full justify-center !rounded-full !py-4 shadow-[0_0_25px_rgba(255,23,61,0.5)] hover:shadow-[0_0_35px_rgba(255,23,61,0.7)]"
                  >
                    ↳ Secure your tickets
                  </NeonButton>
                ) : (
                  <div className="h-[52px] flex items-center justify-center rounded-full border border-white/5 bg-white/[0.01]">
                    <span className="text-xs text-rave-muted font-heading uppercase tracking-widest font-semibold">
                      Purchasable at the Entrance
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Trust Bar */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {trustItems.map((item, i) => {
            const TrustIcon = iconMap[item.icon] || ShieldCheck;
            return (
              <motion.div
                key={i}
                variants={fadeUp}
                className="flex items-center gap-4 p-5 rounded-xl bg-rave-panel/50 border border-white/[0.06]"
                whileHover={{
                  borderColor: 'rgba(255, 23, 61, 0.3)',
                  boxShadow: '0 0 20px rgba(255, 23, 61, 0.1)',
                }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="w-10 h-10 rounded-xl bg-rave-red/10 border border-rave-red/15 flex items-center justify-center flex-shrink-0"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <TrustIcon className="w-5 h-5 text-rave-red" />
                </motion.div>
                <div>
                  <h4 className="font-heading text-sm uppercase tracking-wider text-white font-semibold">{item.title}</h4>
                  <p className="text-xs text-rave-muted mt-0.5">{item.description}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </Container>
    </section>
  );
}
