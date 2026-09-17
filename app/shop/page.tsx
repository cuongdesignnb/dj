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
  const seo = await getContentSeo('shop', { title: 'Merchandise | Connection Rave', description: 'Explore published Connection Rave merchandise, apparel, accessories, posters and collectibles.' });
  return buildMetadata({ ...seo, path: '/shop', indexable: !filter && hasActive && seo.indexable });
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

  return (
    <EventsMotion>
      <Header />
      <main id="main" className="min-h-screen bg-rave-black text-white">
        <ShopHero hero={data.hero} />

        <ShopCatalog
          products={data.products}
          featured={data.featuredProduct}
          featuredHighlights={data.featuredHighlights}
          initialFilter={parseProductFilter(params.category)}
        />

        <ShopBenefits
          benefits={data.benefits}
          title="Why We Create"
          context="Music Connects Us All"
          titleId="why-we-create-title"
        />

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
