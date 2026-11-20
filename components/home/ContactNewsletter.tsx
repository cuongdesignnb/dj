'use client';

import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Mail, MapPin, Phone } from 'lucide-react';
import Container from '../ui/Container';
import SectionTitle from './SectionTitle';
import { NavigationLink } from '@/components/shared/NavigationFeedback';
import { fadeUp } from '@/lib/animations';
import type { HomeFooterData, HomeSectionCopy } from './types';

/** Ways to reach the team, and the newsletter sign-up. */
export default function ContactNewsletter({ copy, footer }: { copy: HomeSectionCopy; footer: HomeFooterData }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState('sending');
    try {
      const response = await fetch('/api/v1/newsletter/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ email, source: 'homepage' }),
      });
      setState(response.ok ? 'success' : 'error');
      if (response.ok) setEmail('');
    } catch {
      setState('error');
    }
  };

  const details = [
    footer.email ? { Icon: Mail, label: footer.email, href: `mailto:${footer.email}` } : null,
    footer.phone ? { Icon: Phone, label: footer.phone, href: `tel:${footer.phone.replace(/\s+/g, '')}` } : null,
    footer.address ? { Icon: MapPin, label: footer.address, href: null } : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <section id="contact" data-home-section="contact" className="relative scroll-mt-24 overflow-hidden bg-rave-black py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(circle at 80% 20%, rgb(var(--rave-accent-rgb)/0.12), transparent 55%)' }} />
      <Container className="relative z-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionTitle eyebrow={copy.eyebrow} title={copy.title} subtitle={copy.description || undefined} align="left" />
            {details.length > 0 && (
              <ul className="-mt-4 flex flex-col gap-3">
                {details.map(({ Icon, label, href }) => (
                  <li key={label} className="flex items-start gap-3 text-white/85">
                    <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rave-red/30 bg-rave-red/10 text-rave-red"><Icon className="h-4 w-4" /></span>
                    {href ? <a href={href} className="mt-2 hover:text-white">{label}</a> : <span className="mt-2">{label}</span>}
                  </li>
                ))}
              </ul>
            )}
            <NavigationLink href={copy.ctaHref || '/contact'} className="mt-8 inline-flex min-h-[46px] items-center gap-2 rounded-full border border-white/[0.16] px-6 font-heading text-xs font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:border-rave-red hover:bg-rave-red/10">
              {copy.ctaLabel || 'Contact us'} <ArrowRight aria-hidden className="h-4 w-4" />
            </NavigationLink>
          </div>

          <motion.div id="newsletter" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="scroll-mt-24 self-start rounded-[22px] border border-rave-red/30 bg-rave-panel/70 p-6 shadow-[0_0_40px_rgb(var(--rave-accent-rgb)/0.1)] sm:p-8">
            <p className="font-heading text-[11px] uppercase tracking-[0.25em] text-rave-red">Newsletter</p>
            <h3 className="mt-2 font-heading text-2xl font-black uppercase text-white sm:text-3xl">Never miss a night</h3>
            <p className="mt-2 text-sm text-rave-muted">New events, lineups and ticket releases, straight to your inbox.</p>
            {state === 'success' ? (
              <p role="status" data-newsletter-done="" className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200">You&apos;re subscribed. See you on the dancefloor.</p>
            ) : (
              <form onSubmit={(event) => void submit(event)} className="mt-6 flex flex-col gap-3 sm:flex-row">
                <label className="sr-only" htmlFor="home-newsletter-email">Email</label>
                <input
                  id="home-newsletter-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="min-h-[50px] flex-1 rounded-full border border-white/[0.12] bg-rave-black/60 px-5 text-sm text-white placeholder:text-white/40 focus:border-rave-red focus:outline-none"
                />
                <button type="submit" disabled={state === 'sending'} className="min-h-[50px] rounded-full bg-gradient-to-r from-rave-red to-rave-red2 px-7 font-heading text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:brightness-110 disabled:opacity-60">
                  {state === 'sending' ? 'Joining…' : 'Subscribe'}
                </button>
              </form>
            )}
            {state === 'error' && <p role="alert" className="mt-3 text-sm text-rose-300">Could not subscribe. Please check the email and try again.</p>}
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
