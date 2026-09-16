'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Crown, LogIn, MapPin, Ticket } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { faqReveal, faqStagger } from '@/lib/animations';
import type { FaqCategory, FaqCategoryItem, FaqIcon } from '@/lib/support/faq-types';

const ICONS: Record<FaqIcon, LucideIcon> = {
  ticket: Ticket,
  entry: LogIn,
  crown: Crown,
  pin: MapPin,
};

/** Category toggles: a column on desktop, a wrapped grid on small screens. */
export default function FaqCategories({
  categories,
  active,
  onSelect,
  controls,
  counts,
}: {
  categories: FaqCategoryItem[];
  active: FaqCategory | null;
  onSelect: (id: FaqCategory) => void;
  controls: string;
  counts: Record<FaqCategory, number>;
}) {
  return (
    <motion.div
      role="group"
      aria-label="FAQ categories"
      variants={faqStagger}
      className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-1 lg:gap-4"
    >
      {categories.map((category) => {
        const Icon = ICONS[category.icon];
        const pressed = category.id === active;
        return (
          <motion.button
            key={category.id}
            type="button"
            variants={faqReveal}
            aria-pressed={pressed}
            aria-controls={controls}
            onClick={() => onSelect(category.id)}
            className={`relative flex min-h-[56px] items-center gap-3 overflow-hidden rounded-[10px] border px-4 text-left text-base font-medium transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black lg:min-h-[68px] lg:px-5 lg:text-lg ${
              pressed
                ? 'border-rave-red text-white'
                : 'border-white/[0.14] bg-rave-deep/80 text-white/90 hover:border-white/35 hover:text-white'
            }`}
          >
            {pressed && (
              <motion.span
                aria-hidden
                layoutId="faq-category-active"
                transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                className="absolute inset-0 -z-0 bg-rave-red shadow-[0_0_24px_rgba(255,23,61,0.35)]"
              />
            )}
            <Icon aria-hidden className="relative h-6 w-6 shrink-0 lg:h-7 lg:w-7" strokeWidth={1.6} />
            <span className="relative flex-1">
              {category.label}
              <span className="sr-only">, {counts[category.id]} questions</span>
            </span>
            <ArrowRight aria-hidden className="relative hidden h-5 w-5 shrink-0 sm:block" />
          </motion.button>
        );
      })}
    </motion.div>
  );
}
