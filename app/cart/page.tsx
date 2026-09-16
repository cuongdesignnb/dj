import type { Metadata } from 'next';
import { connection } from 'next/server';

import Header from '@/components/home/Header';
import EventsMotion from '@/components/events/EventsMotion';
import EventsFooter from '@/components/events/EventsFooter';
import FinalCtaSection from '@/components/shared/FinalCtaSection';
import CartHero from '@/components/cart/CartHero';
import CartClient from '@/components/cart/CartClient';

import { CART_CONTENT } from '@/lib/cart/content';
import { getCheckoutMode } from '@/lib/checkout/config';
import { getShopRepository } from '@/lib/shop/repository';
import ShopError from '../shop/error';

export const metadata: Metadata = {
  title: 'Cart | Connection Rave Merchandise',
  robots: { index: false, follow: false },
};

/**
 * Server shell. The catalogue is loaded here so the client can check saved
 * lines against current prices and availability; the cart itself only exists
 * in the browser.
 */
export default async function CartPage() {
  // The checkout mode is runtime configuration, so this page renders per request.
  await connection();

  const selection = getShopRepository();
  const page = selection.ok ? await selection.repository.getShopPage() : null;
  if (!selection.ok || !page?.ok) {
    const message = !selection.ok
      ? selection.error.message
      : page && !page.ok
        ? page.error.message
        : 'Something went wrong while loading the cart.';
    return <ShopError errorMessage={message} />;
  }

  const shop = page.data;
  const { hero, benefits } = CART_CONTENT;

  return (
    <EventsMotion>
      <Header />
      <main id="main" className="min-h-screen bg-rave-black text-white">
        <CartHero
          crumbs={[
            { label: 'Home', href: '/' },
            { label: 'Merchandise', href: '/shop' },
            { label: 'Cart' },
          ]}
          eyebrow={hero.eyebrow}
          title={hero.title}
          description={hero.description}
          visual={hero.visual}
          sideNotes={hero.sideNotes}
          titleId="cart-hero-title"
        />

        <CartClient products={shop.products} mode={getCheckoutMode()} benefits={benefits} />

        <FinalCtaSection
          cta={{
            title: shop.finalCta.title,
            subtitle: shop.finalCta.description,
            primary: shop.finalCta.primary,
            secondary: shop.finalCta.secondary,
            background: shop.finalCta.background,
          }}
          titleId="cart-cta-title"
        />
      </main>
      <EventsFooter footer={shop.footer} />
    </EventsMotion>
  );
}
