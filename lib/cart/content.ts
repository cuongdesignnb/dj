import type { ShopBenefit } from '@/lib/shop/types';

// Page copy for /cart and /checkout/result. Claims stay within what the site
// can actually back up: no security promises, no shipping promises.

export const CART_CONTENT = {
  hero: {
    eyebrow: 'Merchandise Cart',
    title: 'YOUR CART',
    description:
      'Review your selected Connection Rave merchandise before checkout. Limited drops. A brighter tomorrow starts with what you wear.',
    visual: { src: '/assets/hero-crowd.jpg', alt: '' },
    sideNotes: ['MUSIC', 'PEOPLE', 'CULTURE', 'A BRIGHTER', 'TOMORROW'],
  },
  benefits: [
    {
      id: 'checkout',
      title: 'Checkout Ready',
      description: 'Your cart is ready to continue once checkout is enabled.',
      icon: 'card',
    },
    {
      id: 'quantities',
      title: 'Easy Quantity Updates',
      description: 'Change quantities or remove items before checkout.',
      icon: 'box',
    },
    {
      id: 'collections',
      title: 'Limited Collections',
      description: 'Selected merchandise may be released in focused drops.',
      icon: 'timer',
    },
  ] satisfies ShopBenefit[],
};

export const RESULT_CONTENT = {
  finalCta: {
    title: 'SEE YOU IN THE MOVEMENT',
    description: 'More than merch — it’s music, people and a brighter tomorrow.',
    primary: { label: 'View Lineup', href: '/lineup' },
    secondary: { label: 'Back to Shop', href: '/shop' },
    background: { src: '/assets/hero-crowd.jpg', alt: '' },
  },
  sideNotes: ['MUSIC', 'PEOPLE', 'CULTURE', 'A BRIGHTER', 'TOMORROW'],
};
