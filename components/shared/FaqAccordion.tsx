'use client';

import { useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import { Plus } from 'lucide-react';
import Container from '@/components/ui/Container';
import { ticketReveal, ticketStagger } from '@/lib/animations';

export interface FaqAccordionItem {
  id: string;
  question: string;
  answer: string;
}


/**
 * FAQ accordion, shared by /tickets, /tables and /book-now.
 *
 * Any number of items can be open at once — simpler to reason about than a
 * single-open accordion, and it never closes something the reader is mid-way
 * through. Each header is a button that owns its panel via aria-controls, so
 * keyboard and screen-reader behaviour comes for free.
 */
export default function FaqAccordion({
  items,
  title = 'Frequent Questions',
  titleId = 'faq-title',
  context = 'Get The Answers — Be Ready',
  idPrefix = 'faq',
}: {
  items: FaqAccordionItem[];
  title?: string;
  titleId?: string;
  context?: string;
  idPrefix?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduced = useReducedMotion();
  const [open, setOpen] = useState<Set<string>>(() => new Set());

  if (items.length === 0) return null;

  const toggle = (id: string) => {
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section ref={ref} aria-labelledby={titleId} className="bg-rave-black py-16 md:py-24">
      <Container>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2
              id={titleId}
              className="font-heading text-3xl font-black uppercase leading-[1.05] tracking-tight text-white sm:text-4xl md:text-5xl"
            >
              {title}
            </h2>
            <span
              aria-hidden
              className="mt-3 block h-[3px] w-20 rounded-full bg-gradient-to-r from-rave-red via-rave-magenta to-rave-red sm:w-24"
              style={{ boxShadow: '0 0 18px rgba(255,23,61,0.55)' }}
            />
          </div>
          {context && (
            <p className="font-heading text-[11px] uppercase tracking-[0.28em] text-rave-muted sm:text-xs md:pb-2">
              {context}
            </p>
          )}
        </div>

        <motion.ul
          variants={ticketStagger}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="mt-9 flex flex-col gap-3"
        >
          {items.map((item) => {
            const isOpen = open.has(item.id);
            const panelId = `${idPrefix}-panel-${item.id}`;
            const buttonId = `${idPrefix}-button-${item.id}`;

            return (
              <motion.li
                key={item.id}
                variants={ticketReveal}
                className="overflow-hidden rounded-[14px] border border-white/[0.08] bg-rave-panel/70 transition-colors duration-300 hover:border-rave-red/35"
              >
                <h3>
                  <button
                    type="button"
                    id={buttonId}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggle(item.id)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-heading text-base uppercase tracking-wide text-white transition-colors duration-200 hover:text-rave-red focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black sm:px-6 sm:py-5 sm:text-lg"
                  >
                    <span>{item.question}</span>
                    <motion.span
                      aria-hidden
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={reduced ? { duration: 0 } : { duration: 0.25 }}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/[0.12] text-rave-red"
                    >
                      <Plus className="h-4 w-4" />
                    </motion.span>
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
                      transition={{ duration: reduced ? 0.15 : 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-sm leading-relaxed text-rave-muted sm:px-6 sm:pb-6 sm:text-base">
                        {item.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </motion.ul>
      </Container>
    </section>
  );
}
