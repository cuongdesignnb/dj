import Header from '@/components/home/Header';
import EventsMotion from '@/components/events/EventsMotion';
import EventsFooter from '@/components/events/EventsFooter';
import PageHero from '@/components/shared/PageHero';
import FinalCtaSection from '@/components/shared/FinalCtaSection';
import NewsBrowser from '@/components/news/NewsBrowser';

import { getNewsRepository } from '@/lib/news/repository';
import { parseNewsFilter } from '@/lib/news/helpers';
import type { NewsPageData } from '@/lib/news/types';
import NewsError from './error';
import { buildMetadata } from '@/lib/seo/metadata';
import { getContentSeo } from '@/lib/seo/content';
import { publicApiBaseUrl } from '@/lib/api/public';
import { fetchPublicListingContent, listingEmpty, listingFilter, listingSection } from '@/lib/cms/public-page';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const filter = Array.isArray(params.category) ? params.category[0] : params.category;
  const result = await loadNews();
  const hasPublished = 'data' in result && result.data.articles.some((article) => article.status === 'published' && article.indexable !== false);
  const [seo, listing] = await Promise.all([
    getContentSeo('news', { title: 'News & Stories | Connection Rave', description: 'Read published Connection Rave announcements, event updates, artist stories and community features.' }),
    fetchPublicListingContent(publicApiBaseUrl(), 'news-list'),
  ]);
  return buildMetadata({
    title: listing?.seo?.title ?? seo.title,
    description: listing?.seo?.description ?? seo.description,
    image: listing?.seo?.ogImage?.src
      ? { url: listing.seo.ogImage.src, alt: listing.seo.ogImage.alt, width: listing.seo.ogImage.width, height: listing.seo.ogImage.height }
      : undefined,
    path: '/news',
    canonicalOverride: seo.canonicalOverride,
    follow: listing?.seo?.follow ?? seo.follow,
    indexable: !filter && hasPublished && (listing?.seo?.index ?? seo.indexable),
  });
}

async function loadNews(): Promise<
  { data: NewsPageData } | { error: { message: string } }
> {
  const selection = getNewsRepository();
  if (!selection.ok) {
    return { error: { message: selection.error.message } };
  }

  const result = await selection.repository.getNewsPage();
  if (!result.ok) {
    return { error: { message: result.error.message } };
  }

  return { data: result.data };
}

/** Server Component. Only the filter, featured block and grid are interactive. */
export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [params, result] = await Promise.all([searchParams, loadNews()]);

  if ('error' in result) {
    return <NewsError errorMessage={result.error.message} />;
  }

  const data = result.data;
  const initialFilter = parseNewsFilter(params.category);
  const filter = listingFilter(data.content, 'category-filter', {
    label: 'Filter news by category',
    options: ['All News', 'Announcements', 'Event Updates', 'Artist Stories', 'Community', 'Press'],
  });
  const browseSection = listingSection(data.content, 'browse', {
    title: 'Browse News',
    description: 'Real Stories — A Brighter Tomorrow',
  });
  const featuredSection = listingSection(data.content, 'featured', {
    title: 'Featured Story',
  });
  const latestSection = listingSection(data.content, 'latest', {
    title: 'Latest News',
    description: 'All Stories — Same People, Brighter Tomorrow',
  });
  const emptyState = listingEmpty(data.content, {
    title: 'New stories are being prepared.',
    description: 'Updates will appear here.',
    cta: { label: 'Back home', href: '/' },
  });

  return (
    <EventsMotion>
      <Header />
      <main id="main" className="min-h-screen bg-rave-black text-white">
        <PageHero
          crumbs={[{ label: 'Home', href: '/' }, { label: data.content?.hero?.breadcrumb ?? 'News' }]}
          eyebrow={data.hero.eyebrow}
          titleLines={data.hero.titleLines}
          description={data.hero.description}
          titleId="news-hero-title"
          meta={[]}
          visual={{ src: data.hero.visual.src, alt: data.hero.visual.alt }}
          actions={[
            { ...data.hero.primaryCta, tone: 'primary' },
            { ...data.hero.secondaryCta, tone: 'secondary' },
          ]}
          sideNotes={data.hero.sideNotes}
          footNotes={data.content?.hero?.footNotes}
        />

        <NewsBrowser
          articles={data.articles}
          featured={data.featuredArticle}
          initialFilter={initialFilter}
          browseSection={browseSection}
          featuredSection={featuredSection}
          latestSection={latestSection}
          filterLabel={filter.label}
          filterOptions={filter.options}
          emptyState={emptyState}
        />

        <FinalCtaSection
          cta={{
            title: data.finalCta.title,
            subtitle: data.finalCta.description,
            primary: data.finalCta.primary,
            secondary: data.finalCta.secondary,
            background: data.finalCta.background,
          }}
          titleId="news-cta-title"
        />
      </main>
      <EventsFooter footer={data.footer} />
    </EventsMotion>
  );
}
