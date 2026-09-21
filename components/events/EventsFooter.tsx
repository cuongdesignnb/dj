'use client';

import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Container from '@/components/ui/Container';
import { fadeUp, staggerContainer } from '@/lib/animations';
import type { EventsFooterData } from '@/lib/events/listing-types';

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}
function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
    </svg>
  );
}
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.88-2.89 2.89 2.89 0 0 1 2.88-2.89c.28 0 .56.04.82.11v-3.5a6.37 6.37 0 0 0-.82-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.73a8.19 8.19 0 0 0 4.76 1.52V6.78a4.84 4.84 0 0 1-1-.09z" />
    </svg>
  );
}

const SOCIAL_ICON: Record<string, (props: { className?: string }) => ReactElement> = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  youtube: YoutubeIcon,
  tiktok: TikTokIcon,
};

/**
 * Footer for /events.
 *
 * Quick links mirror the primary navigation. Socials are rendered only for
 * profiles that actually have a URL configured, and contact details fall back
 * to "to be confirmed" rather than to an invented address.
 */
export default function EventsFooter({ footer }: { footer: EventsFooterData }) {
  const year = new Date().getFullYear();
  const socials = footer.socials.filter((social) => social.url);
  const partners = footer.partners ?? [];
  const [quickLinks, setQuickLinks] = useState<Array<{ id: string; labelEn: string; href: string | null }>>([]);
  const [legalLinks, setLegalLinks] = useState<Array<{ id: string; labelEn: string; href: string | null }>>([]);
  const [secondaryLinks, setSecondaryLinks] = useState<Array<{ id: string; labelEn: string; href: string | null }>>([]);
  const [global, setGlobal] = useState<{ tagline?: string; footerDescription?: string; copyright?: string }>({});
  useEffect(() => {
    Promise.all([
      fetch('/api/v1/navigation/FOOTER_QUICK').then((response) => response.json()),
      fetch('/api/v1/navigation/FOOTER_LEGAL').then((response) => response.json()),
      fetch('/api/v1/navigation/FOOTER_SECONDARY').then((response) => response.json()),
      fetch('/api/v1/page-content/global-content').then((response) => response.json()),
    ]).then(([quick, legal, secondary, content]) => {
      setQuickLinks((quick?.data?.items ?? []) as Array<{ id: string; labelEn: string; href: string | null }>);
      setLegalLinks((legal?.data?.items ?? []) as Array<{ id: string; labelEn: string; href: string | null }>);
      setSecondaryLinks((secondary?.data?.items ?? []) as Array<{ id: string; labelEn: string; href: string | null }>);
      setGlobal(content?.data?.data ?? {});
    }).catch(() => undefined);
  }, []);

  return (
    <footer className="relative border-t border-white/[0.06] bg-rave-black">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-rave-grid opacity-10" />

      <Container className="relative z-10">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className={`grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 lg:gap-8 md:py-16 ${partners.length > 0 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}
        >
          <motion.div variants={fadeUp}>
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full border-2 border-rave-red/50 animate-border-glow">
                <span className="font-heading text-lg font-bold leading-none text-rave-red">C</span>
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-bold leading-tight tracking-wider text-white">
                  CONNECTION
                </span>
                <span className="text-[9px] uppercase tracking-[0.3em] text-rave-muted">
                  {global.tagline}
                </span>
              </div>
            </div>
            <p className="mb-5 text-sm leading-relaxed text-rave-muted">
              {global.footerDescription}
            </p>
            {socials.length > 0 && (
              <div className="flex items-center gap-3" aria-label="Social links">
                {socials.map((social) => {
                  const Icon = SOCIAL_ICON[social.platform];
                  return Icon ? (
                    <motion.a
                      key={social.id}
                      href={social.url as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.platform}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/5 text-rave-muted transition-all duration-300 hover:border-rave-red/30 hover:bg-rave-red/10 hover:text-rave-red"
                      whileHover={{ scale: 1.12 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon className="h-4 w-4" />
                    </motion.a>
                  ) : null;
                })}
              </div>
            )}
          </motion.div>

          {partners.length > 0 && (
            <motion.div variants={fadeUp}>
              <h2 className="mb-4 font-heading text-sm font-semibold uppercase tracking-[0.2em] text-white">
                In Partnership With
              </h2>
              <div className="flex flex-wrap items-center gap-5">
                {partners.map((partner, index) => (
                  <div key={partner.id} className="flex items-center gap-5">
                    {index > 0 && (
                      <span aria-hidden className="font-heading text-sm text-rave-muted/50">
                        &times;
                      </span>
                    )}
                    <Image
                      src={partner.logo.src}
                      alt={partner.logo.alt || partner.name}
                      width={160}
                      height={32}
                      sizes="160px"
                      unoptimized={!partner.logo.src.startsWith('/')}
                      className="h-8 w-auto object-contain opacity-80 transition-opacity duration-300 hover:opacity-100"
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {secondaryLinks.length > 0 && (
            <motion.div variants={fadeUp}>
              <h2 className="mb-4 font-heading text-sm font-semibold uppercase tracking-[0.2em] text-white">
                More
              </h2>
              <ul className="flex flex-col gap-2.5">
                {secondaryLinks.map((link) => link.href && <li key={link.id}><Link href={link.href} className="inline-block text-sm text-rave-muted transition-colors duration-300 hover:text-white">{link.labelEn}</Link></li>)}
              </ul>
            </motion.div>
          )}

          <motion.div variants={fadeUp}>
            <h2 className="mb-4 font-heading text-sm font-semibold uppercase tracking-[0.2em] text-white">
              Quick Links
            </h2>
            <ul className="flex flex-col gap-2.5">
              {quickLinks.map((link) => link.href && (
                <li key={link.id}>
                  <Link
                    href={link.href}
                    className="inline-block text-sm text-rave-muted transition-colors duration-300 hover:text-white"
                  >
                    {link.labelEn}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={fadeUp}>
            <h2 className="mb-4 font-heading text-sm font-semibold uppercase tracking-[0.2em] text-white">
              Contact
            </h2>
            <ul className="flex flex-col gap-2.5 text-sm text-rave-muted">
              {footer.email ? (
                <li>
                  <a href={`mailto:${footer.email}`} className="transition-colors hover:text-white">
                    {footer.email}
                  </a>
                </li>
              ) : (
                <li className="opacity-70">Contact details to be confirmed.</li>
              )}
              {footer.phone && <li>{footer.phone}</li>}
            </ul>
          </motion.div>

          <motion.div variants={fadeUp}>
            <h2 className="mb-4 font-heading text-sm font-semibold uppercase tracking-[0.2em] text-white">
              Music Connects Us All
            </h2>
            <p className="text-sm leading-relaxed text-rave-muted">
              A nightlife and entertainment brand creating immersive music experiences that bring
              together sound, people and culture.
            </p>
          </motion.div>
        </motion.div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] py-6 sm:flex-row">
          <p className="text-xs text-rave-muted/60">
            {global.copyright || `© ${year}`}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {legalLinks.map((link, index) => link.href && <span key={link.id} className="flex items-center gap-4"><Link href={link.href} className="text-xs text-rave-muted/60 transition-colors hover:text-white">{link.labelEn}</Link>{index < legalLinks.length - 1 && <span aria-hidden className="text-rave-muted/30">|</span>}</span>)}
          </div>
        </div>
      </Container>
    </footer>
  );
}
