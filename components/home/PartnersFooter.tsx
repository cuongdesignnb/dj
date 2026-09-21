'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Container from '../ui/Container';
import { footerLinks } from '@/lib/navigation';
import type { HomeFooterData, HomePartner } from './types';
import { fadeUp, staggerContainer } from '@/lib/animations';

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.88-2.89 2.89 2.89 0 012.88-2.89c.28 0 .56.04.82.11v-3.5a6.37 6.37 0 00-.82-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.73a8.19 8.19 0 004.76 1.52V6.78a4.84 4.84 0 01-1-.09z" />
    </svg>
  );
}

const socialIconMap = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
  youtube: YoutubeIcon,
};

// Marquee animation for partner logos
function MarqueeStrip({ partners }: { partners: HomePartner[] }) {
  const source = partners.length ? partners : [{ id: 'pending', label: 'Partners to be announced', href: null }];
  const doubledPartners = [...source, ...source, ...source];

  return (
    <div className="relative overflow-hidden py-4 bg-rave-panel/30">
      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-rave-deep to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-rave-deep to-transparent z-10 pointer-events-none" />

      {/* Marquee content */}
      <div className="flex animate-marquee whitespace-nowrap">
        {doubledPartners.map((p, i) => (
          <motion.span
            key={`${p.id}-${i}`}
            className="font-heading text-sm tracking-wider text-white/40 hover:text-white transition-colors duration-300 mx-8 cursor-default"
            whileHover={{ scale: 1.1, color: '#ff173d' }}
          >
            {p.label}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

export default function PartnersFooter({ footer }: { footer: HomeFooterData }) {
  const [email, setEmail] = useState('');
  const [newsletterState, setNewsletterState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const submitNewsletter = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNewsletterState('sending');
    try {
      const response = await fetch('/api/v1/newsletter/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ email }),
      });
      setNewsletterState(response.ok ? 'success' : 'error');
      if (response.ok) setEmail('');
    } catch {
      setNewsletterState('error');
    }
  };

  return (
    <footer className="relative overflow-hidden">
      {/* Partner Strip with Marquee */}
      <div className="relative border-t border-white/[0.06] bg-rave-deep">
        <MarqueeStrip partners={footer.partners} />

        <Container>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="py-10 md:py-14"
          >
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 lg:gap-16">
              {/* Powered By */}
              <motion.div
                variants={fadeUp}
                className="flex flex-col items-center gap-2 group"
              >
                <span className="text-[10px] tracking-[0.35em] uppercase text-rave-muted font-heading font-medium group-hover:text-white transition-colors">Powered by</span>
                <div className="h-9 flex items-center select-none">
                  <motion.img
                    src="/assets/logo-mcq.svg"
                    alt="MCQ Supermarket"
                    className="h-full w-auto object-contain opacity-60 group-hover:opacity-100 transition-opacity"
                    whileHover={{ scale: 1.1 }}
                  />
                </div>
              </motion.div>

              <motion.div
                className="w-px h-10 bg-white/10 hidden md:block"
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              />

              {/* Presented By */}
              <motion.div
                variants={fadeUp}
                className="flex flex-col items-center gap-2 group"
              >
                <span className="text-[10px] tracking-[0.35em] uppercase text-rave-muted font-heading font-medium group-hover:text-white transition-colors">Presented by</span>
                <div className="h-9 flex items-center select-none">
                  <motion.img
                    src="/assets/logo-bihi.svg"
                    alt="BIHI Entertainment"
                    className="h-full w-auto object-contain opacity-60 group-hover:opacity-100 transition-opacity"
                    whileHover={{ scale: 1.1 }}
                  />
                </div>
              </motion.div>

              <motion.div
                className="w-px h-10 bg-white/10 hidden md:block"
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              />

              {/* Official Partners */}
              <motion.div variants={fadeUp} className="flex flex-col items-center gap-2">
                <span className="text-[10px] tracking-[0.35em] uppercase text-rave-muted font-heading">Official Partners</span>
                <div className="flex items-center gap-4 md:gap-6">
                  {(footer.partners.length ? footer.partners : [{ id: 'pending', label: 'Partners to be announced', href: null }]).map((p) => (
                    <motion.span
                      key={p.id}
                      className="font-heading text-sm tracking-wider text-white/60 hover:text-white transition-colors uppercase cursor-default"
                      whileHover={{ scale: 1.1, color: '#ff173d' }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      {p.label}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </Container>
      </div>

      {/* Main Footer */}
      <div className="relative border-t border-white/[0.06] bg-rave-black">
        <div className="absolute inset-0 bg-rave-grid opacity-10" />

        <Container className="relative z-10">
          <div className="py-12 md:py-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
              {/* Column 1 - Brand */}
              <motion.div
                className="lg:col-span-1"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-full border-2 border-rave-red/50 flex items-center justify-center animate-border-glow"
                  >
                    <span className="text-rave-red font-heading font-bold text-lg">C</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-heading text-base font-bold tracking-wider text-white leading-tight">CONNECTION</span>
                    <span className="text-[9px] tracking-[0.3em] text-rave-muted uppercase">Sound Meets Soul</span>
                  </div>
                </div>
                <p className="text-sm text-rave-muted leading-relaxed mb-5">
                  Uniting music, energy and people for unforgettable experiences.
                </p>
                <div className="flex items-center gap-3">
                  {footer.socials.map((social, i) => {
                    const Icon = socialIconMap[social.platform];
                    return (
                    <motion.a
                      key={social.platform}
                      href={social.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={social.platform}
                      className="w-9 h-9 rounded-xl bg-white/5 border border-white/[0.08] flex items-center justify-center text-rave-muted hover:text-rave-red hover:border-rave-red/30 hover:bg-rave-red/10 transition-all duration-300"
                      whileHover={{ scale: 1.15, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + i * 0.05 }}
                    >
                      <Icon className="w-4 h-4" />
                    </motion.a>
                    );
                  })}
                </div>
              </motion.div>

              {/* Column 2 - Quick Links */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <h4 className="font-heading text-sm uppercase tracking-[0.2em] text-white font-semibold mb-4">Quick Links</h4>
                <ul className="flex flex-col gap-2.5">
                  {footerLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-rave-muted hover:text-white transition-all duration-300 inline-block"
                      >
                        <motion.span
                          className="inline-block"
                          whileHover={{ x: 4 }}
                          transition={{ type: 'spring', stiffness: 400 }}
                        >
                          {link.label}
                        </motion.span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Column 3 - Event Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <h4 className="font-heading text-sm uppercase tracking-[0.2em] text-white font-semibold mb-4">Event Info</h4>
                <ul className="flex flex-col gap-2.5 text-sm text-rave-muted">
                  <motion.li whileHover={{ x: 4, color: '#fff' }} transition={{ type: 'spring', stiffness: 400 }}>
                    Date to be announced
                  </motion.li>
                  <motion.li whileHover={{ x: 4, color: '#fff' }} transition={{ type: 'spring', stiffness: 400 }}>
                    Venue details to be confirmed
                  </motion.li>
                  <motion.li whileHover={{ x: 4, color: '#fff' }} transition={{ type: 'spring', stiffness: 400 }}>
                    Event details to be confirmed
                  </motion.li>
                  <motion.li whileHover={{ x: 4, color: '#fff' }} transition={{ type: 'spring', stiffness: 400 }}>
                    Schedule to be confirmed
                  </motion.li>
                </ul>
              </motion.div>

              {/* Column 4 - Contact */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                <h4 className="font-heading text-sm uppercase tracking-[0.2em] text-white font-semibold mb-4">Contact</h4>
                <ul className="flex flex-col gap-2.5 text-sm text-rave-muted">
                  <motion.li whileHover={{ x: 4, color: '#fff' }} transition={{ type: 'spring', stiffness: 400 }}>
                    {footer.address || 'VIP & table details to be confirmed'}
                  </motion.li>
                  <li>
                    <Link href="/contact" className="hover:text-white transition-colors">Send an enquiry</Link>
                  </li>
                  {footer.email ? <li><a href={`mailto:${footer.email}`} className="hover:text-white transition-colors">{footer.email}</a></li> : <li>Contact details to be confirmed</li>}
                  {footer.phone && <li><a href={`tel:${footer.phone}`} className="hover:text-white transition-colors">{footer.phone}</a></li>}
                </ul>
              </motion.div>

              {/* Column 5 - Newsletter */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
              >
                <h4 className="font-heading text-sm uppercase tracking-[0.2em] text-white font-semibold mb-4">Newsletter</h4>
                <p className="text-sm text-rave-muted mb-4">Stay updated on events & exclusive offers.</p>
                <form className="flex" onSubmit={submitNewsletter}>
                  <motion.input
                    type="email"
                    placeholder="Enter your email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="flex-1 min-w-0 bg-rave-panel border border-white/[0.08] rounded-l-xl px-4 py-2.5 text-sm text-white placeholder:text-rave-muted/50 focus:outline-none transition-colors"
                    aria-label="Email for newsletter"
                    whileFocus={{
                      borderColor: 'rgba(255, 23, 61, 0.5)',
                      boxShadow: '0 0 15px rgba(255, 23, 61, 0.2)',
                    }}
                  />
                  <motion.button
                    type="submit"
                    disabled={newsletterState === 'sending'}
                    className="px-4 py-2.5 bg-rave-red hover:bg-rave-red2 rounded-r-xl transition-colors flex items-center justify-center"
                    aria-label="Subscribe to newsletter"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ArrowRight className="w-4 h-4 text-white" />
                  </motion.button>
                </form>
                {newsletterState === 'success' && <p className="mt-2 text-xs text-emerald-300">You&apos;re subscribed.</p>}
                {newsletterState === 'error' && <p className="mt-2 text-xs text-rave-red">Could not subscribe. Please try again.</p>}
              </motion.div>
            </div>
          </div>

          {/* Bottom bar */}
          <motion.div
            className="border-t border-white/[0.06] py-6 flex flex-col sm:flex-row items-center justify-between gap-3"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
          >
            <p className="text-xs text-rave-muted/60">
              © Connection Rave. All Rights Reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/terms" className="text-xs text-rave-muted/60 hover:text-white transition-colors">
                <motion.span whileHover={{ color: '#fff' }}>Terms & Conditions</motion.span>
              </Link>
              <span className="text-rave-muted/30">|</span>
              <Link href="/privacy" className="text-xs text-rave-muted/60 hover:text-white transition-colors">
                <motion.span whileHover={{ color: '#fff' }}>Privacy Policy</motion.span>
              </Link>
            </div>
          </motion.div>
        </Container>
      </div>
    </footer>
  );
}
