import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

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

/**
 * Only the slugs generateStaticParams returns are routable; anything else is a
 * real router 404. Without this an unknown slug renders the not-found UI but
 * Next caches that prerender and answers 200. Products added to a future API
 * become reachable on the next build.
 */
export const dynamicParams = true;

export async function generateStaticParams() {
  const selection = getShopRepository();
  if (!selection.ok) return [];

  const result = await selection.repository.getProducts();
  if (!result.ok) return [];

  return result.data.map((product) => ({ slug: product.slug }));
}

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
    return {
      title: 'Product Not Found | Connection Rave',
      description: 'This merchandise item is not available.',
      robots: { index: false, follow: true },
    };
  }

  const title = `${product.seoTitle ?? product.title} | Connection Rave Merchandise`;
  const description = product.seoDescription ?? product.excerpt;
  const image = sortedImages(product)[0]?.image;

  // No Product/Offer JSON-LD: there is no confirmed availability, SKU or
  // shipping to describe. Preview products stay out of search results until
  // they can actually be bought.
  return {
    title,
    description,
    robots: product.status === 'preview' ? { index: false, follow: true } : undefined,
    openGraph: {
      title,
      description,
      images: image ? [{ url: image.src, alt: image.alt }] : [],
    },
  };
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
    notFound();
  }

  const { product, page, all } = result;
  const related = getRelatedProducts(product, all, 4);

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
      </main>
      <EventsFooter footer={page.footer} />
      <CartButton />
    </EventsMotion>
  );
}
