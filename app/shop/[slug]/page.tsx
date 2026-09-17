import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';

import Header from '@/components/home/Header';
import EventsMotion from '@/components/events/EventsMotion';
import EventsFooter from '@/components/events/EventsFooter';
import EventsBreadcrumb from '@/components/events/EventsBreadcrumb';
import FinalCtaSection from '@/components/shared/FinalCtaSection';
import Container from '@/components/ui/Container';
import ProductGallery from '@/components/shop/ProductGallery';
import ProductInfo from '@/components/shop/ProductInfo';
import ShopBenefits from '@/components/shop/ShopBenefits';
import ProductDetails from '@/components/shop/ProductDetails';
import RelatedProducts from '@/components/shop/RelatedProducts';
import CartButton from '@/components/shop/CartButton';

import { getShopRepository } from '@/lib/shop/repository';
import { getRelatedProducts, sortedImages } from '@/lib/shop/helpers';
import type { Product, ShopPageData } from '@/lib/shop/types';
import ShopError from '../error';
import { buildMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema } from '@/lib/seo/breadcrumbs';
import { jsonLd, productSchema } from '@/lib/seo/structured-data';
import { getPublicSlugRedirect } from '@/server/services/slug-history';

/**
 * Only the slugs generateStaticParams returns are routable; anything else is a
 * real router 404. Without this an unknown slug renders the not-found UI but
 * Next caches that prerender and answers 200. Products added to a future API
 * become reachable on the next build.
 */
export const dynamicParams = true;
export const dynamic = 'force-dynamic';

type Loaded =
  | { product: Product | null; page: ShopPageData; all: Product[] }
  | { error: { message: string } };

async function loadProduct(slug: string): Promise<Loaded> {
  const selection = getShopRepository();
  if (!selection.ok) return { error: { message: selection.error.message } };

  const [product, page] = await Promise.all([
    selection.repository.getProductBySlug(slug),
    selection.repository.getShopPage(),
  ]);
  if (!product.ok) return { error: { message: product.error.message } };
  if (!page.ok) return { error: { message: page.error.message } };

  return { product: product.data, page: page.data, all: page.data.products };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const selection = getShopRepository();
  const result = selection.ok ? await selection.repository.getProductBySlug(slug) : null;
  const product = result?.ok ? result.data : null;

  if (!product) {
    return buildMetadata({ title: 'Product Not Found', description: 'This merchandise item is not available.', path: `/shop/${slug}`, indexable: false });
  }

  const title = `${product.seoTitle ?? product.title} | Connection Rave Merchandise`;
  const description = product.seoDescription ?? product.excerpt;
  const image = sortedImages(product)[0]?.image;

  return buildMetadata({ title, description, path: `/shop/${product.slug}`, canonicalOverride: product.canonicalOverride, image: image ? { url: image.src, alt: image.alt, width: image.width, height: image.height } : null, indexable: product.status === 'active' && product.indexable !== false, follow: product.followLinks });
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await loadProduct(slug);

  if ('error' in result) {
    return <ShopError errorMessage={result.error.message} />;
  }
  if (!result.product) {
    const redirectSlug = await getPublicSlugRedirect('product', slug);
    if (redirectSlug) permanentRedirect(`/shop/${encodeURIComponent(redirectSlug)}`);
    notFound();
  }

  const { product, page, all } = result;
  const related = getRelatedProducts(product, all, 4);
  const breadcrumbs = breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Merchandise', path: '/shop' }, { name: product.title, path: `/shop/${product.slug}` }]);
  const productJsonLd = productSchema({ title: product.title, description: product.description ?? product.excerpt, path: `/shop/${product.slug}`, image: sortedImages(product)[0]?.image.src ?? null, status: product.status, priceMinor: product.price.amountMinor, currency: product.price.currency });

  return (
    <EventsMotion>
      <Header />
      <main id="main" className="min-h-screen bg-rave-black text-white">
        <EventsBreadcrumb
          trail={[
            { label: 'Home', href: '/' },
            { label: 'Merchandise', href: '/shop' },
            { label: product.title },
          ]}
        />

        <section aria-label={product.title} className="bg-rave-black pb-12 pt-6 md:pb-16">
          <Container>
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,52fr)_minmax(0,48fr)] lg:gap-8">
              <ProductGallery images={sortedImages(product)} productTitle={product.title} />
              <ProductInfo product={product} />
            </div>
          </Container>
        </section>

        <ShopBenefits benefits={page.productBenefits} label="Why this product" />

        <ProductDetails product={product} />

        <RelatedProducts products={related} />

        <FinalCtaSection
          cta={{
            title: page.finalCta.title,
            subtitle: page.finalCta.description,
            primary: page.finalCta.primary,
            secondary: page.finalCta.secondary,
            background: page.finalCta.background,
          }}
          titleId="product-cta-title"
        />
        {[breadcrumbs, productJsonLd].filter(Boolean).map((schema, index) => <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) ?? '' }} />)}
      </main>
      <EventsFooter footer={page.footer} />
      <CartButton />
    </EventsMotion>
  );
}
