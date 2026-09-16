'use client';

import { useDeferredValue, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { MessageCircleQuestion } from 'lucide-react';
import Container from '@/components/ui/Container';
import RingHero from '@/components/shared/RingHero';
import SectionHeading from '@/components/shop/SectionHeading';
import { faqStagger } from '@/lib/animations';
import { searchFaq } from '@/lib/support/faq-search';
import type { FaqCategory, FaqPageData } from '@/lib/support/faq-types';
import FaqAccordion from './FaqAccordion';
import FaqCategories from './FaqCategories';
import FaqSearch from './FaqSearch';

const RESULTS_ID = 'faq-results';

/**
 * Hero search, categories and questions for /faq. While a search is active it
 * looks across every category, and the category filter steps aside.
 */
export default function FaqBrowser({
  data,
  initialQuery = '',
}: {
  data: FaqPageData;
  initialQuery?: string;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const resultsRef = useRef<HTMLHeadingElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: '-60px' });

  const categories = useMemo(
    () => [...data.categories].sort((a, b) => a.sortOrder - b.sortOrder),
    [data.categories],
  );
  const firstWithItems =
    categories.find((c) => data.items.some((i) => i.category === c.id))?.id ?? categories[0]?.id ?? null;

  const [query, setQuery] = useState(initialQuery);
  const [active, setActive] = useState<FaqCategory | null>(firstWithItems);
  const deferredQuery = useDeferredValue(query);
  const searching = deferredQuery.trim().length > 0;

  const counts = useMemo(() => {
    const result = {} as Record<FaqCategory, number>;
    for (const c of categories) result[c.id] = data.items.filter((i) => i.category === c.id).length;
    return result;
  }, [categories, data.items]);

  const visible = useMemo(
    () =>
      searching
        ? searchFaq(data.items, categories, deferredQuery)
        : data.items.filter((item) => item.category === active),
    [searching, data.items, categories, deferredQuery, active],
  );

  const labelFor = (id: FaqCategory) => categories.find((c) => c.id === id)?.label ?? id;
  const activeLabel = active ? labelFor(active) : '';

  const selectCategory = (id: FaqCategory) => {
    setActive(id);
    setQuery('');
  };

  const showResults = () => {
    resultsRef.current?.scrollIntoView({ block: 'start' });
    resultsRef.current?.focus({ preventScroll: true });
  };

  const empty = data.items.length === 0;

  return (
    <>
      <RingHero
        crumbs={[{ label: 'Home', href: '/' }, { label: 'FAQ' }]}
        eyebrow={data.hero.eyebrow}
        title={data.hero.title}
        description={data.hero.description}
        visual={data.hero.visual}
        sideNotes={data.hero.sideNotes}
        titleId="faq-hero-title"
      >
        <FaqSearch value={query} onChange={setQuery} onSubmit={showResults} />
      </RingHero>

      <section
        ref={sectionRef}
        aria-labelledby="faq-categories-title"
        className="bg-rave-black py-12 md:py-16"
      >
        <Container>
          <SectionHeading
            id="faq-categories-title"
            title="FAQ Categories"
            context="Real Questions — Real Experiences"
          />

          {empty ? (
            <div className="mt-8 rounded-[18px] border border-white/[0.08] bg-rave-panel/60 px-6 py-14 text-center">
              <MessageCircleQuestion aria-hidden className="mx-auto h-10 w-10 text-rave-red" />
              <p className="mt-4 font-heading text-xl uppercase tracking-[0.1em] text-white">
                FAQ information is being prepared.
              </p>
              <p className="mt-2 text-sm text-rave-muted">
                Please{' '}
                <Link href="/contact" className="text-white underline underline-offset-2 hover:text-rave-red">
                  contact us
                </Link>{' '}
                for assistance.
              </p>
            </div>
          ) : (
            <motion.div
              variants={faqStagger}
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
              className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,26fr)_minmax(0,74fr)]"
            >
              <FaqCategories
                categories={categories}
                active={searching ? null : active}
                onSelect={selectCategory}
                controls={RESULTS_ID}
                counts={counts}
              />

              <div
                id={RESULTS_ID}
                className="rounded-[14px] border border-white/[0.08] bg-rave-panel/60 p-3 sm:p-4"
              >
                <h2
                  ref={resultsRef}
                  tabIndex={-1}
                  className="scroll-mt-[110px] px-1 pb-3 font-heading text-sm uppercase tracking-[0.2em] text-rave-muted focus:outline-none"
                >
                  {searching ? `Results for “${deferredQuery.trim()}”` : `${activeLabel} questions`}
                </h2>
                <p role="status" aria-live="polite" className="sr-only">
                  {searching
                    ? visible.length === 0
                      ? 'No matching questions found.'
                      : `${visible.length} ${visible.length === 1 ? 'question' : 'questions'} found.`
                    : ''}
                </p>

                {visible.length > 0 ? (
                  <FaqAccordion
                    // Remount per view so the default-open answer matches it.
                    key={searching ? `search:${deferredQuery}` : `cat:${active}`}
                    items={visible}
                    defaultOpenId={searching ? null : visible[0]?.id}
                    categoryLabel={searching ? (item) => labelFor(item.category) : undefined}
                  />
                ) : (
                  <div className="rounded-[12px] border border-white/[0.08] px-5 py-10 text-center">
                    <p className="font-heading text-lg uppercase tracking-[0.08em] text-white">
                      {searching ? 'No matching questions found.' : 'No questions in this category yet.'}
                    </p>
                    <p className="mt-2 text-sm text-rave-muted">
                      Try another keyword or{' '}
                      <Link href="/contact" className="text-white underline underline-offset-2 hover:text-rave-red">
                        contact us
                      </Link>
                      .
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </Container>
      </section>
    </>
  );
}
