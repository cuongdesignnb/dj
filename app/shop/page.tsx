import Header from '@/components/home/Header';
import EventsMotion from '@/components/events/EventsMotion';
import EventsFooter from '@/components/events/EventsFooter';
import FinalCtaSection from '@/components/shared/FinalCtaSection';
import ShopHero from '@/components/shop/ShopHero';
import ShopCatalog from '@/components/shop/ShopCatalog';
import ShopBenefits from '@/components/shop/ShopBenefits';
import CartButton from '@/components/shop/CartButton';

import { getShopRepository } from '@/lib/shop/repository';
import { parseProductFilter } from '@/lib/shop/helpers';
import type { ShopPageData } from '@/lib/shop/types';
import ShopError from './error';
import { buildMetadata } from '@/lib/seo/metadata';
import { getContentSeo } from '@/lib/seo/content';
import { publicApiBaseUrl } from '@/lib/api/public';
import { fetchPublicListingContent, listingEmpty, listingFilter, listingSection } from '@/lib/cms/public-page';

async function loadShop(): Promise<{ data: ShopPageData } | { error: { message: string } }> {
  const selection = getShopRepository();
  if (!selection.ok) return { error: { message: selection.error.message } };

  const result = await selection.repository.getShopPage();
  if (!result.ok) return { error: { message: result.error.message } };

  return { data: result.data };
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const filter = Array.isArray(params.category) ? params.category[0] : params.category;
  const result = await loadShop();
  const hasActive = 'data' in result && result.data.products.some((product) => product.status === 'active' && product.indexable !== false);
  const [seo, listing] = await Promise.all([
    getContentSeo('shop', { title: 'Merchandise | Connection Rave', description: 'Explore published Connection Rave merchandise, apparel, accessories, posters and collectibles.' }),
    fetchPublicListingContent(publicApiBaseUrl(), 'shop-list'),
  ]);
  return buildMetadata({
    title: listing?.seo?.title ?? seo.title,
    description: listing?.seo?.description ?? seo.description,
    image: listing?.seo?.ogImage?.src
      ? { url: listing.seo.ogImage.src, alt: listing.seo.ogImage.alt, width: listing.seo.ogImage.width, height: listing.seo.ogImage.height }
      : undefined,
    path: '/shop',
    canonicalOverride: seo.canonicalOverride,
    follow: listing?.seo?.follow ?? seo.follow,
    indexable: !filter && hasActive && (listing?.seo?.index ?? seo.indexable),
  });
}

/** Server Component. Filters, featured Add to Cart and the cart are the islands. */
export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [params, result] = await Promise.all([searchParams, loadShop()]);

  if ('error' in result) {
    return <ShopError errorMessage={result.error.message} />;
  }

  const data = result.data;
  const filter = listingFilter(data.content, 'product-filter', {
    label: 'Filter merchandise by category',
    options: ['All', 'Apparel', 'Accessories', 'Posters', 'Collectibles'],
  });
  const browseSection = listingSection(data.content, 'browse', {
    title: 'Browse Merchandise',
    description: 'Same People — A Brighter Tomorrow',
  });
  const featuredSection = listingSection(data.content, 'featured', {
    title: 'Featured Drop',
    description: 'Limited Quantities — Exclusive Designs',
  });
  const catalogSection = listingSection(data.content, 'catalog', {
    title: 'All Merchandise',
    description: 'Wear the Movement',
  });
  const benefitsSection = listingSection(data.content, 'benefits', {
    title: 'Why We Create',
    description: 'Music Connects Us All',
  });
  const emptyState = listingEmpty(data.content, {
    title: 'The merchandise collection is being prepared.',
    description: 'New products will appear here.',
    cta: { label: 'Back home', href: '/' },
  });

  return (
    <EventsMotion>
      <Header />
      <main id="main" className="min-h-screen bg-rave-black text-white">
        <ShopHero hero={data.hero} />

        <div id="catalogue">
          <ShopCatalog
            products={data.products}
            featured={data.featuredProduct}
            featuredHighlights={data.featuredHighlights}
            initialFilter={parseProductFilter(params.category)}
            browseSection={browseSection}
            featuredSection={featuredSection}
            catalogSection={catalogSection}
            filterLabel={filter.label}
            filterOptions={filter.options}
            emptyState={emptyState}
          />
        </div>

        {benefitsSection.enabled !== false && (
          <ShopBenefits
            benefits={data.benefits}
            title={benefitsSection.title}
            context={benefitsSection.description}
            titleId="why-we-create-title"
          />
        )}

        <FinalCtaSection
          cta={{
            title: data.finalCta.title,
            subtitle: data.finalCta.description,
            primary: data.finalCta.primary,
            secondary: data.finalCta.secondary,
            background: data.finalCta.background,
          }}
          titleId="shop-cta-title"
        />
      </main>
      <EventsFooter footer={data.footer} />
      <CartButton />
    </EventsMotion>
  );
}
