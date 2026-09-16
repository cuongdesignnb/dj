'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Container from '@/components/ui/Container';
import { shopReveal, shopStagger } from '@/lib/animations';
import type { ShopBenefit } from '@/lib/shop/types';
import SectionHeading from './SectionHeading';
import { SHOP_ICONS } from './icons';

/**
 * Four value cards. Used as "Why We Create" on /shop (with a heading) and as
 * the benefits row on a product page (without one).
 */
export default function ShopBenefits({
  benefits,
  title,
  context,
  titleId,
  label,
}: {
  benefits: ShopBenefit[];
  title?: string;
  context?: string;
  titleId?: string;
  /** Accessible name when there is no visible heading. */
  label?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  if (benefits.length === 0) return null;

  return (
    <section
      ref={ref}
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : label}
      className="bg-rave-black pb-16 md:pb-20"
    >
      <Container>
        {title && titleId && <SectionHeading id={titleId} title={title} context={context} />}

        <motion.ul
          variants={shopStagger}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className={`grid grid-cols-1 gap-4 ${
            benefits.length === 3 ? 'md:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4'
          } ${title ? 'mt-6' : ''}`}
        >
          {benefits.map((benefit) => {
            const Icon = SHOP_ICONS[benefit.icon];
            return (
              <motion.li
                key={benefit.id}
                variants={shopReveal}
                className="flex items-start gap-4 rounded-[16px] border border-white/[0.08] bg-rave-panel/70 p-5 transition-colors duration-300 hover:border-rave-red/40"
              >
                <motion.span
                  aria-hidden
                  initial={{ scale: 0.6, rotate: -12 }}
                  animate={inView ? { scale: 1, rotate: 0 } : undefined}
                  transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.2 }}
                  className="shrink-0"
                >
                  <Icon className="h-9 w-9 text-rave-red" strokeWidth={1.6} />
                </motion.span>
                <div>
                  <h3 className="font-heading text-base font-bold uppercase tracking-[0.04em] text-white">
                    {benefit.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-rave-muted">
                    {benefit.description}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </motion.ul>
      </Container>
    </section>
  );
}
