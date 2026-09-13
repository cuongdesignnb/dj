'use client';

import { motion } from 'framer-motion';
import { Calendar, Clock, AlertTriangle, Headphones, Users, Globe, Ticket } from 'lucide-react';
import Container from '../ui/Container';
import NeonButton from './NeonButton';
import { fadeUp, slideLeft, staggerContainer } from '@/lib/animations';

export default function EventOverview() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden bg-rave-black">
      {/* Background Grid - blending perfectly with black background */}
      <div className="absolute inset-0 bg-rave-grid opacity-20 pointer-events-none" />
      
      {/* Laser light highlights */}
      <div className="absolute top-1/4 -right-40 w-96 h-96 bg-rave-red/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -left-40 w-96 h-96 bg-rave-magenta/5 rounded-full blur-[120px] pointer-events-none" />

      <Container className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left: Poster (Takes 5 cols) */}
          <motion.div
            variants={slideLeft}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="lg:col-span-5 relative group"
          >
            <div className="relative rounded-2xl overflow-hidden neon-border">
              <img
                src="/assets/event-poster.jpg"
                alt="Destiny Event Poster"
                className="w-full h-auto object-cover aspect-[3/4] transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-rave-black/75 via-transparent to-transparent pointer-events-none" />
            </div>
            {/* Glow effect behind poster */}
            <div className="absolute -inset-4 bg-rave-red/10 rounded-3xl blur-3xl -z-10 opacity-75" />
          </motion.div>

          {/* Right: Info (Takes 7 cols) */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="lg:col-span-7 flex flex-col justify-center"
          >
            {/* Eyebrow and Title */}
            <motion.div variants={fadeUp} className="flex flex-col gap-2">
              <span className="font-heading uppercase tracking-[0.25em] text-sm text-rave-red font-bold">
                METRO CITY, PERTH
              </span>
              <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl font-black uppercase leading-[1.1] text-white">
                THE DESTINY EXPERIENCE
              </h2>
            </motion.div>

            {/* Glowing neon red line - pointing to Slide 3 requirement */}
            <motion.div 
              variants={fadeUp}
              className="w-28 h-[3px] bg-rave-red shadow-[0_0_12px_#ff173d] rounded-full my-6"
            />

            {/* Description Paragraphs */}
            <motion.div variants={fadeUp} className="flex flex-col gap-4 mb-6">
              <p className="text-white text-sm sm:text-base font-semibold leading-relaxed">
                Destiny is more than a party — it&apos;s a full-scale nightlife experience.
              </p>
              <p className="text-white/80 text-sm sm:text-base leading-relaxed">
                Bringing together international and local DJs, high-energy sound, and a multi-cultural crowd, this is where music, energy, and people become one.
              </p>
              <p className="text-white/80 text-sm sm:text-base leading-relaxed">
                From EDM to Hardstyle, Techno to Vinahouse — every moment is designed to move you.
              </p>
              <p className="text-rave-red font-heading uppercase tracking-wider text-sm sm:text-base font-bold">
                This isn&apos;t just a night out. This is where connection happens.
              </p>
            </motion.div>

            {/* Features Row - Slide 3 Badges */}
            <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300">
                <div className="w-8 h-8 rounded-lg bg-rave-red/10 flex items-center justify-center flex-shrink-0">
                  <Headphones className="w-4.5 h-4.5 text-rave-red" />
                </div>
                <span className="font-heading text-xs tracking-wider text-white font-semibold uppercase leading-tight">
                  INTERNATIONAL & LOCAL DJS
                </span>
              </div>
              
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300">
                <div className="w-8 h-8 rounded-lg bg-rave-red/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-4.5 h-4.5 text-rave-red" />
                </div>
                <span className="font-heading text-xs tracking-wider text-white font-semibold uppercase leading-tight">
                  1000+ CROWD ENERGY
                </span>
              </div>
              
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300">
                <div className="w-8 h-8 rounded-lg bg-rave-red/10 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-4.5 h-4.5 text-rave-red" />
                </div>
                <span className="font-heading text-xs tracking-wider text-white font-semibold uppercase leading-tight">
                  MULTI-CULTURAL EXP
                </span>
              </div>
            </motion.div>

            {/* Schedule & Urgency Details */}
            <motion.div variants={fadeUp} className="flex flex-col gap-3.5 mb-8 border-l-2 border-rave-red/40 pl-4 py-1">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-rave-red" />
                <span className="font-heading tracking-widest text-sm sm:text-base text-white uppercase font-bold">
                  Friday, 30.05.2026
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-rave-red" />
                <span className="font-heading tracking-widest text-sm sm:text-base text-white uppercase font-bold">
                  STARTING AT 9PM, ENDING 5AM
                </span>
              </div>

              <div className="flex items-center gap-3 mt-1">
                <AlertTriangle className="w-5 h-5 text-rave-red animate-pulse" />
                <span className="font-heading tracking-wider text-xs sm:text-sm text-rave-red font-black uppercase text-neon-red">
                  ⚠️ FINAL RELEASE TICKETS AVAILABLE NOW
                </span>
              </div>
            </motion.div>

            {/* CTA Button - glowing red pill style with double chevrons */}
            <motion.div variants={fadeUp} className="self-start">
              <NeonButton
                href="https://megatix.com.au"
                variant="primary"
                hideChevron={true}
                icon={
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center -ml-2 group-hover:bg-white/20 transition-colors">
                    <Ticket className="w-4 h-4 text-white" />
                  </div>
                }
                rightIcon={
                  <span className="text-white font-extrabold tracking-tighter ml-1 text-xl sm:text-2xl transition-transform duration-300 group-hover:translate-x-1 inline-block">
                    »
                  </span>
                }
                className="!px-10 !py-4.5 !rounded-full !text-base sm:!text-lg border border-white/15 hover:border-rave-red shadow-[0_0_30px_rgba(255,23,61,0.65)] hover:shadow-[0_0_40px_rgba(255,23,61,0.85)]"
              >
                GET YOUR TICKET NOW
              </NeonButton>
            </motion.div>

          </motion.div>
        </div>
      </Container>
    </section>
  );
}
