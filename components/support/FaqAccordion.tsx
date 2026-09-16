'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { faqAccordionTransition } from '@/lib/animations';
import type { FaqItem } from '@/lib/support/faq-types';

/**
 * Question list for /faq. Several answers can be open at once, matching the
 * shared accordion on /tickets and /tables. Each question is a button that
 * owns its answer panel through aria-controls.
 */
export default function FaqAccordion({
  items,
  defaultOpenId,
  categoryLabel,
}: {
  items: FaqItem[];
  defaultOpenId?: string | null;
  /** Shows each item's category, used for search results across categories. */
  categoryLabel?: (item: FaqItem) => string;
}) {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState<Set<string>>(
    () => new Set(defaultOpenId ? [defaultOpenId] : []),
  );

  const toggle = (id: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => {
        const isOpen = open.has(item.id);
        const buttonId = `faq-q-${item.id}`;
        const panelId = `faq-a-${item.id}`;
        return (
          <li
            key={item.id}
            className={`overflow-hidden rounded-[12px] border transition-colors duration-300 ${
              isOpen ? 'border-rave-red/80 bg-rave-red/[0.07]' : 'border-white/[0.1] bg-rave-deep/80'
            }`}
          >
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={isOpen ? panelId : undefined}
                onClick={() => toggle(item.id)}
                className="flex min-h-[64px] w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-medium text-white transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-rave-red sm:text-lg"
              >
                <span>
                  {categoryLabel && (
                    <span className="mb-1 block font-heading text-[11px] uppercase tracking-[0.2em] text-rave-red">
                      {categoryLabel(item)}
                    </span>
                  )}
                  {item.question}
                </span>
                {/* Plus that becomes a minus: the vertical bar folds away. */}
                <span
                  aria-hidden
                  className={`relative block h-5 w-5 shrink-0 ${isOpen ? 'text-rave-red' : 'text-white'}`}
                >
                  <span className="absolute left-0 top-1/2 h-0.5 w-5 -translate-y-1/2 rounded-full bg-current" />
                  <motion.span
                    animate={{ scaleY: isOpen ? 0 : 1, rotate: isOpen ? 90 : 0 }}
                    transition={faqAccordionTransition}
                    className="absolute left-1/2 top-0 h-5 w-0.5 -translate-x-1/2 rounded-full bg-current"
                  />
                </span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  animate={reduced ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
                  exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={reduced ? { duration: 0.1 } : faqAccordionTransition}
                  className="overflow-hidden"
                >
                  <p className="mx-5 border-t border-white/10 pb-5 pt-4 text-base leading-relaxed text-white/80">
                    {item.answer}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
