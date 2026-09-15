'use client';

import type { ReactElement } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Container from '@/components/ui/Container';
import { footerLinks, siteNav } from '@/lib/data';
import { fadeUp, staggerContainer } from '@/lib/animations';
import type { PartnersFooterContact } from '@/lib/partners/types';

interface Props {
  contact: PartnersFooterContact;
  legalTermsHref: string | null;
  legalPrivacyHref: string | null;
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
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
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

export default function PartnersFooter({
  contact,
  legalTermsHref,
  legalPrivacyHref,
}: Props) {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-white/[0.06] bg-rave-black">
      <div className="absolute inset-0 bg-rave-grid opacity-10 pointer-events-none" aria-hidden />

      <Container className="relative z-10">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="py-12 md:py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8"
        >
          <motion.div variants={fadeUp}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full border-2 border-rave-red/50 grid place-items-center animate-border-glow">
                <span className="font-heading text-rave-red font-bold text-lg leading-none">C</span>
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-bold tracking-wider text-white leading-tight">
                  {siteNav.brandName}
                </span>
                <span className="text-[9px] tracking-[0.3em] text-rave-muted uppercase">
                  {siteNav.tagline}
                </span>
              </div>
            </div>
            <p className="text-sm text-rave-muted leading-relaxed mb-5">
              Uniting music, energy and people for unforgettable experiences.
            </p>
            <div className="flex items-center gap-3" aria-label="Social links">
              {contact.socials
                .filter((s) => s.url)
                .map((social) => {
                  const Icon = SOCIAL_ICON[social.platform];
                  return Icon ? (
                    <motion.a
                      key={social.id}
                      href={social.url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.platform}
                      className="w-9 h-9 rounded-xl bg-white/5 border border-white/[0.08] flex items-center justify-center text-rave-muted hover:text-rave-red hover:border-rave-red/30 hover:bg-rave-red/10 transition-all duration-300"
                      whileHover={{ scale: 1.12, rotate: 4 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon className="w-4 h-4" />
                    </motion.a>
                  ) : null;
                })}
            </div>
          </motion.div>

          <motion.div variants={fadeUp}>
            <h4 className="font-heading text-sm uppercase tracking-[0.2em] text-white font-semibold mb-4">
              Quick Links
            </h4>
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

          <motion.div variants={fadeUp}>
            <h4 className="font-heading text-sm uppercase tracking-[0.2em] text-white font-semibold mb-4">
              Contact
            </h4>
            <ul className="flex flex-col gap-2.5 text-sm text-rave-muted">
              {contact.email ? (
                <li>
                  <motion.a
                    href={`mailto:${contact.email}`}
                    className="hover:text-white transition-colors"
                    whileHover={{ x: 4 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    {contact.email}
                  </motion.a>
                </li>
              ) : (
                <li>
                  <span className="opacity-70">Contact details to be confirmed.</span>
                </li>
              )}
              {contact.phone && (
                <motion.li
                  whileHover={{ x: 4, color: '#fff' }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  {contact.phone}
                </motion.li>
              )}
              {contact.address && (
                <motion.li
                  whileHover={{ x: 4, color: '#fff' }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  {contact.address}
                </motion.li>
              )}
            </ul>
          </motion.div>

          <motion.div variants={fadeUp}>
            <h4 className="font-heading text-sm uppercase tracking-[0.2em] text-white font-semibold mb-4">
              Music Connects Us All
            </h4>
            <p className="text-sm text-rave-muted leading-relaxed">
              A nightlife and entertainment brand creating immersive music experiences that bring
              together sound, people and culture.
            </p>
          </motion.div>
        </motion.div>

        <motion.div
          className="border-t border-white/[0.06] py-6 flex flex-col sm:flex-row items-center justify-between gap-3"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-xs text-rave-muted/60">
            © {year} Connection Rave. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {legalTermsHref ? (
              <Link
                href={legalTermsHref}
                className="text-xs text-rave-muted/60 hover:text-white transition-colors"
              >
                Terms & Conditions
              </Link>
            ) : (
              <span className="text-xs text-rave-muted/40">Terms & Conditions</span>
            )}
            <span aria-hidden className="text-rave-muted/30">|</span>
            {legalPrivacyHref ? (
              <Link
                href={legalPrivacyHref}
                className="text-xs text-rave-muted/60 hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
            ) : (
              <span className="text-xs text-rave-muted/40">Privacy Policy</span>
            )}
          </div>
        </motion.div>
      </Container>
    </footer>
  );
}
