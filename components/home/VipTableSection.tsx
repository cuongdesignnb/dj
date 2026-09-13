'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Crown, Wine, Users } from 'lucide-react';
import Container from '../ui/Container';
import SectionTitle from './SectionTitle';
import NeonButton from './NeonButton';
import { boothPackage } from '@/lib/data';
import { fadeUp, staggerContainer, parallaxDown } from '@/lib/animations';

export default function VipTableSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  // Parallax effect for background
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);

  // Spotlight glow movement
  const spotlightX = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <section ref={sectionRef} className="relative py-20 md:py-28 overflow-hidden">
      {/* Background with parallax */}
      <div className="absolute inset-0 bg-rave-black" />
      <div className="absolute inset-0 bg-rave-grid opacity-15" />

      {/* Moving spotlight */}
      <motion.div
        className="absolute top-1/2 w-[600px] h-[600px] bg-rave-red/10 rounded-full blur-[150px] -translate-x-1/2"
        style={{
          x: spotlightX,
          y: '-50%',
        }}
      />

      {/* Ambient glows */}
      <motion.div
        className="absolute top-1/3 left-1/4 w-96 h-96 bg-rave-red/5 rounded-full blur-[120px]"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-rave-purple/5 rounded-full blur-[100px]"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{ duration: 8, repeat: Infinity, delay: 1 }}
      />

      {/* Animated top divider */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(to right, transparent, rgba(255, 23, 61, 0.5), transparent)',
        }}
        animate={{
          opacity: [0.3, 0.8, 0.3],
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      <Container className="relative z-10">
        <SectionTitle
          eyebrow="Book The Table"
          title="VIP Table Bookings"
          subtitle="Reserve your booth. Choose your bottle package. Pick your preferred table location."
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8"
        >
          {/* Main Booth Package - 3 cols */}
          <motion.div variants={fadeUp} className="lg:col-span-3">
            <div className="relative rounded-2xl overflow-hidden neon-border h-full group">
              {/* Background image with parallax */}
              <motion.div
                className="absolute inset-0 bg-[url('/assets/vip-booth.jpg')] bg-cover bg-center"
                style={{ y: backgroundY }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-rave-black/95 via-rave-black/80 to-rave-black/60" />

              <div className="relative p-6 sm:p-8 lg:p-10 flex flex-col h-full min-h-[400px] justify-center">
                {/* MCQ & Connection logos */}
                <motion.div
                  className="flex items-center gap-4 mb-6 select-none"
                  initial={{ opacity: 0, y: -20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <img src="/assets/logo-mcq.png" alt="MCQ" className="h-8 w-auto object-contain" />
                  <div className="w-px h-6 bg-white/15" />
                  <img src="/assets/logo-connection.png" alt="Connection" className="h-[36px] w-auto object-contain" />
                </motion.div>

                <motion.span
                  className="font-heading uppercase tracking-[0.2em] text-xs text-rave-red font-semibold mb-2"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                >
                  {boothPackage.name}
                </motion.span>

                {/* Animated price */}
                <motion.div
                  className="mb-4"
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.4 }}
                >
                  <span className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold text-neon-red animate-neon-glow-pulse">
                    {boothPackage.price}
                  </span>
                </motion.div>

                {/* Package details with stagger */}
                <motion.div
                  className="flex items-center gap-6 mb-6"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                >
                  <motion.div
                    className="flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Users className="w-4 h-4 text-rave-red" />
                    <span className="font-heading uppercase tracking-wider text-sm text-white">{boothPackage.people}</span>
                  </motion.div>
                  <motion.div
                    className="flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Wine className="w-4 h-4 text-rave-red" />
                    <span className="font-heading uppercase tracking-wider text-sm text-white">{boothPackage.bottles}</span>
                  </motion.div>
                </motion.div>

                {/* Bottle choices */}
                <motion.div
                  className="grid grid-cols-2 gap-x-6 gap-y-2 mb-8"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                >
                  {boothPackage.choices.map((bottle, i) => (
                    <motion.div
                      key={i}
                      className="flex items-center gap-2"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.7 + i * 0.05 }}
                      whileHover={{ x: 4 }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-rave-red" />
                      <span className="text-sm text-white/70">{bottle}</span>
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8 }}
                >
                  <NeonButton
                    href="/tables"
                    variant="primary"
                    intense={true}
                    icon={<Crown className="w-5 h-5" />}
                    className="self-start"
                  >
                    Book A Table
                  </NeonButton>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Right column - 2 cols */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Bar List Card */}
            <motion.div variants={fadeUp} className="flex-1">
              <div className="relative rounded-2xl overflow-hidden neon-border-soft h-full min-h-[180px] group cursor-pointer">
                <motion.div
                  className="absolute inset-0 bg-[url('/assets/bar-list.jpg')] bg-cover bg-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.7 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-rave-black/95 via-rave-black/70 to-rave-black/40" />

                {/* Glow effect on hover */}
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: 'radial-gradient(ellipse at center, rgba(255,23,61,0.2) 0%, transparent 70%)',
                  }}
                />

                <div className="relative p-6 flex flex-col justify-end h-full">
                  <h3 className="font-heading text-xl uppercase tracking-wider text-white font-bold mb-1">Bar List</h3>
                  <p className="text-xs text-rave-muted uppercase tracking-wider mb-4">Premium Bottle Menu</p>
                  <NeonButton href="/tables" variant="ghost" className="self-start !py-2 !px-4 !text-xs">
                    View Bar List
                  </NeonButton>
                </div>
              </div>
            </motion.div>

            {/* Club Map Card */}
            <motion.div variants={fadeUp} className="flex-1">
              <div className="relative rounded-2xl overflow-hidden neon-border-soft h-full min-h-[180px] group cursor-pointer">
                <motion.div
                  className="absolute inset-0 bg-[url('/assets/club-map.jpg')] bg-cover bg-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.7 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-rave-black/95 via-rave-black/70 to-rave-black/40" />

                {/* Glow effect on hover */}
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: 'radial-gradient(ellipse at center, rgba(139,44,255,0.2) 0%, transparent 70%)',
                  }}
                />

                <div className="relative p-6 flex flex-col justify-end h-full">
                  <h3 className="font-heading text-xl uppercase tracking-wider text-white font-bold mb-1">Club Map</h3>
                  <p className="text-xs text-rave-muted uppercase tracking-wider mb-4">Table Locations</p>
                  <NeonButton href="/tables" variant="ghost" className="self-start !py-2 !px-4 !text-xs">
                    View Club Map
                  </NeonButton>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom note */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-rave-muted">
            View the bar list and floor plan above to choose your package and preferred booth location.
          </p>
          <motion.p
            className="text-xs text-rave-muted/60 mt-2 flex items-center justify-center gap-1.5"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Crown className="w-3.5 h-3.5 text-rave-red/50" />
            Secure Booking — Your booking is safe with us.
          </motion.p>
        </motion.div>
      </Container>
    </section>
  );
}
