'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import Container from '@/components/ui/Container';
import { cardStagger, cardItem, lineReveal } from '@/lib/events/motion';
import type { EventPageData, FrontendRoutes } from '@/lib/events/types';

interface Props {
  event: EventPageData;
  routes: FrontendRoutes;
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.88-2.89 2.89 2.89 0 0 1 2.88-2.89c.28 0 .56.04.82.11v-3.5a6.37 6.37 0 0 0-.82-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.73a8.19 8.19 0 0 0 4.76 1.52V6.78a4.84 4.84 0 0 1-1-.09z" />
    </svg>
  );
}

const PLATFORM_ICONS = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  youtube: YoutubeIcon,
  tiktok: TikTokIcon,
} as const;

const QUICK_LINKS: Array<{ label: string; key: keyof FrontendRoutes | 'home' | 'event' }> = [
  { label: 'Home', key: 'home' },
  { label: 'Event', key: 'event' },
  { label: 'Ticket', key: 'tickets' },
  { label: 'Table', key: 'tables' },
  { label: 'Booked Now', key: 'booking' },
];

function resolveHref(key: keyof FrontendRoutes | 'home' | 'event', routes: FrontendRoutes): string | null {
  if (key === 'home') return '/';
  if (key === 'event') return '/event';
  return routes[key] ?? null;
}

export default function EventFooter({ event, routes }: Props) {
  const reduced = useReducedMotion();
  const site = event.site;
  const socials = site.contact.socials.filter((s) => s.url && s.url.length > 0);
  const termsHref = routes.legalTerms ?? null;
  const privacyHref = routes.legalPrivacy ?? null;

  return (
    <footer className="relative bg-rave-black border-t border-white/[0.06] overflow-hidden">
      {/* Decorative grid + glow */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-rave-grid opacity-10" />
        <div className="absolute -top-32 left-1/3 w-[480px] h-[480px] rounded-full blur-[140px] bg-rave-red/10" />
      </div>

      <Container className="relative">
        <motion.div
          variants={cardStagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="py-12 md:py-14 grid grid-cols-1 md:grid-cols-12 gap-10"
        >
          {/* Brand */}
          <motion.div variants={cardItem} className="md:col-span-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-10 h-10 rounded-full border-2 border-rave-red/50 flex items-center justify-center animate-border-glow">
                <span className="text-rave-red font-heading font-bold text-lg">C</span>
              </span>
              <div className="flex flex-col">
                <span className="font-heading text-base font-bold tracking-wider text-white leading-tight">
                  {site.brandName}
                </span>
                <span className="text-[9px] tracking-[0.3em] text-rave-muted uppercase">
                  {site.tagline}
                </span>
              </div>
            </div>
            <p className="text-sm text-rave-muted leading-relaxed mb-5 max-w-sm">
              Uniting music, energy and people for unforgettable experiences.
            </p>
            {socials.length > 0 ? (
              <div className="flex items-center gap-3">
                {socials.map((s) => {
                  const Icon = PLATFORM_ICONS[s.platform];
                  if (!Icon) return null;
                  return (
                    <motion.a
                      key={s.id}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.platform}
                      className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-rave-muted hover:text-rave-red hover:border-rave-red/30 hover:bg-rave-red/10 transition-all duration-300"
                      whileHover={reduced ? undefined : { scale: 1.1, rotate: 4 }}
                      whileTap={reduced ? undefined : { scale: 0.95 }}
                    >
                      <Icon className="w-4 h-4" />
                    </motion.a>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-rave-muted/70">Social channels coming soon.</p>
            )}
          </motion.div>

          {/* Partners */}
          <motion.div variants={cardItem} className="md:col-span-4">
            <h4 className="font-heading text-sm uppercase tracking-[0.2em] text-white font-semibold mb-4">
              In Partnership With
            </h4>
            <div className="flex items-center gap-6">
              {site.partners.map((p) => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="h-8 flex items-center">
                    <Image
                      src={p.logo.src}
                      alt={p.logo.alt}
                      width={p.logo.width}
                      height={p.logo.height}
                      className="h-full w-auto object-contain opacity-80"
                    />
                  </div>
                  <span className="text-xs text-rave-muted uppercase tracking-wider">
                    {p.name}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick links */}
          <motion.div variants={cardItem} className="md:col-span-2">
            <h4 className="font-heading text-sm uppercase tracking-[0.2em] text-white font-semibold mb-4">
              Quick Links
            </h4>
            <ul className="flex flex-col gap-2.5">
              {QUICK_LINKS.map((l) => {
                const href = resolveHref(l.key, routes);
                if (!href) {
                  return (
                    <li
                      key={l.label}
                      className="text-sm text-rave-muted/50 cursor-not-allowed"
                    >
                      <span>{l.label}</span>
                      <span className="ml-2 text-[10px] uppercase tracking-[0.18em] text-rave-muted/50">
                        Soon
                      </span>
                    </li>
                  );
                }
                return (
                  <li key={l.label}>
                    <Link
                      href={href}
                      className="text-sm text-rave-muted hover:text-white transition-colors inline-flex"
                    >
                      <motion.span
                        className="inline-block"
                        whileHover={reduced ? undefined : { x: 4 }}
                        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                      >
                        {l.label}
                      </motion.span>
                    </Link>
                  </li>
                );
              })}
              <li>
                <Link
                  href="/partners"
                  className="text-sm text-rave-muted hover:text-white transition-colors inline-flex"
                >
                  <motion.span
                    className="inline-block"
                    whileHover={reduced ? undefined : { x: 4 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                  >
                    Partners
                  </motion.span>
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div variants={cardItem} className="md:col-span-2">
            <h4 className="font-heading text-sm uppercase tracking-[0.2em] text-white font-semibold mb-4">
              Contact
            </h4>
            {site.contact.email || site.contact.phone ? (
              <ul className="flex flex-col gap-2 text-sm text-rave-muted">
                {site.contact.phone && <li>{site.contact.phone}</li>}
                {site.contact.email && (
                  <li>
                    <a className="hover:text-white transition-colors" href={`mailto:${site.contact.email}`}>
                      {site.contact.email}
                    </a>
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-rave-muted/70">Contact details to be confirmed.</p>
            )}
          </motion.div>
        </motion.div>

        <motion.div
          variants={lineReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="border-t border-white/[0.06] py-6 flex flex-col sm:flex-row items-center justify-between gap-3"
        >
          <p className="text-xs text-rave-muted/60">
            © Connection Rave. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-rave-muted/60">
            {termsHref ? (
              <Link href={termsHref} className="hover:text-white transition-colors">
                Terms & Conditions
              </Link>
            ) : (
              <span className="cursor-default">Terms — coming soon</span>
            )}
            <span className="text-rave-muted/30">|</span>
            {privacyHref ? (
              <Link href={privacyHref} className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
            ) : (
              <span className="cursor-default">Privacy — coming soon</span>
            )}
          </div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-rave-muted/50">
            Music Connects Us All
          </p>
        </motion.div>
      </Container>
    </footer>
  );
}
