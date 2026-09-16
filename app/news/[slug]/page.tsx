import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import Header from '@/components/home/Header';
import EventsMotion from '@/components/events/EventsMotion';
import EventsFooter from '@/components/events/EventsFooter';
import PageHero from '@/components/shared/PageHero';
import FinalCtaSection from '@/components/shared/FinalCtaSection';
import Container from '@/components/ui/Container';
import ArticleBody from '@/components/news/ArticleBody';
import ArticleSidebar from '@/components/news/ArticleSidebar';
import RelatedStories from '@/components/news/RelatedStories';

import { getNewsRepository } from '@/lib/news/repository';
import {
  categoryLabel,
  latestStories,
  readingTimeLabel,
  relatedStories,
  statusLabel,
} from '@/lib/news/helpers';
import type { NewsArticle } from '@/lib/news/types';
import NewsError from '../error';

/**
 * Only the slugs generateStaticParams returns are routable; anything else is a
 * real router 404. Without this an unknown slug renders the not-found UI but
 * Next caches that prerender and answers 200 — the page looks right while the
 * status lies. Articles added to a future API become reachable on the next
 * build.
 */
export const dynamicParams = true;

export async function generateStaticParams() {
  const selection = getNewsRepository();
  if (!selection.ok) return [];

  const result = await selection.repository.getArticles();
  if (!result.ok) return [];

  return result.data.map((article) => ({ slug: article.slug }));
}

async function loadArticle(
  slug: string,
): Promise<{ article: NewsArticle | null } | { error: { message: string } }> {
  const selection = getNewsRepository();
  if (!selection.ok) {
    return { error: { message: selection.error.message } };
  }

  const result = await selection.repository.getArticleBySlug(slug);
  if (!result.ok) {
    return { error: { message: result.error.message } };
  }

  return { article: result.data };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await loadArticle(slug);

  if ('error' in result || !result.article) {
    return {
      title: 'Story Not Found | Connection Rave',
      description: 'This article is not available.',
      robots: { index: false, follow: true },
    };
  }

  const article = result.article;
  const title = `${article.seoTitle ?? article.title} | Connection Rave`;
  const description = article.seoDescription ?? article.excerpt;

  // No NewsArticle JSON-LD and no publishedTime: this is preview editorial with
  // no publication date, and structured data would assert one.
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      images: article.heroImage.src
        ? [{ url: article.heroImage.src, alt: article.heroImage.alt }]
        : [],
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await loadArticle(slug);

  if ('error' in result) {
    return <NewsError errorMessage={result.error.message} />;
  }
  if (!result.article) {
    notFound();
  }

  const article = result.article;

  const selection = getNewsRepository();
  const all = selection.ok ? await selection.repository.getArticles() : null;
  const articles = all?.ok ? all.data : [];
  const latest = latestStories(articles, article);
  const related = relatedStories(articles, article);
  const page = selection.ok ? await selection.repository.getNewsPage() : null;

  return (
    <EventsMotion>
      <Header />
      <main id="main" className="min-h-screen bg-rave-black text-white">
        <PageHero
          crumbs={[
            { label: 'Home', href: '/' },
            { label: 'News', href: '/news' },
            { label: article.title },
          ]}
          eyebrow={article.featured ? 'Feature Story' : categoryLabel(article.category)}
          titleLines={[article.title]}
          description={article.excerpt}
          titleId="article-hero-title"
          meta={[
            { icon: 'globe', label: categoryLabel(article.category) },
            { icon: 'time', label: readingTimeLabel(article) },
            // Reads "Article Preview" rather than implying a publication.
            { icon: 'date', label: statusLabel(article) },
          ]}
          visual={{ src: article.heroImage.src, alt: article.heroImage.alt }}
          sideNotes={['MUSIC', 'PEOPLE', 'CULTURE', 'A BRIGHTER TOMORROW']}
        />

        <section aria-labelledby="article-body-title" className="bg-rave-black py-16 md:py-24">
          <Container>
            <h2 id="article-body-title" className="sr-only">
              {article.title}
            </h2>

            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
              {/* Server-rendered prose, so the article is in the initial HTML. */}
              <article className="max-w-[760px]">
                <ArticleBody blocks={article.body} />

                {article.tags.length > 0 && (
                  <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-white/[0.08] pt-6">
                    <span className="font-heading text-[11px] uppercase tracking-[0.22em] text-rave-muted">
                      Key Topics
                    </span>
                    <ul className="flex flex-wrap gap-2.5">
                      {article.tags.map((tag) => (
                        <li
                          key={tag}
                          className="rounded-full border border-rave-red/40 bg-rave-red/[0.07] px-3.5 py-1.5 font-heading text-[11px] uppercase tracking-[0.1em] text-rave-red"
                        >
                          {/* Stored clean; the hash is presentation. */}
                          {`#${tag.replace(/\s+/g, '')}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>

              <ArticleSidebar article={article} latest={latest} />
            </div>
          </Container>
        </section>

        <RelatedStories articles={related} />

        <FinalCtaSection
          cta={{
            title: 'STAY CLOSE TO THE STORY',
            subtitle:
              'Get the latest news, behind the scenes and exclusive content from Connection Rave. Be part of what is next.',
            primary: { label: 'Explore Gallery', href: '/gallery' },
            secondary: { label: 'Get Tickets', href: '/tickets' },
            background: page?.ok ? page.data.finalCta.background : undefined,
          }}
          titleId="article-cta-title"
        />
      </main>
      <EventsFooter footer={page?.ok ? page.data.footer : { email: null, phone: null, socials: [], legalTermsHref: '/terms', legalPrivacyHref: '/privacy' }} />
    </EventsMotion>
  );
}
