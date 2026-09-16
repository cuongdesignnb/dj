import type {
  Product,
  ProductColor,
  ProductDetailSection,
  ProductOptionValue,
  ProductVariant,
  ShopPageData,
} from './types';

// Local merchandise catalogue — the default data source.
//
// PREVIEW CONTENT. Titles and prices follow the approved design; everything
// else is placeholder merchandising written to stand the pages up. Nothing
// here states a fabric composition, a stock level, a shipping promise or that
// a product has been manufactured, and every product is status 'preview'.
//
// Images in /merch are purpose-built mock-ups, not product photography. A
// real catalogue replaces them through the same MediaAsset fields.

const AUD = (dollars: number) => ({ amountMinor: dollars * 100, currency: 'AUD' });

const APPAREL_SIZES: ProductOptionValue[] = [
  { id: 's', label: 'S', available: null },
  { id: 'm', label: 'M', available: null },
  { id: 'l', label: 'L', available: null },
  { id: 'xl', label: 'XL', available: null },
];

const BLACK: ProductColor = { id: 'black', name: 'Black', hex: '#0B0B0F' };

/** One variant per size and colour, stock unknown. */
function variantsFor(
  slug: string,
  sizes: ProductOptionValue[],
  colors: ProductColor[],
): ProductVariant[] {
  const sizeIds = sizes.length > 0 ? sizes.map((s) => s.id) : [null];
  const colorIds = colors.length > 0 ? colors.map((c) => c.id) : [null];
  return sizeIds.flatMap((sizeId) =>
    colorIds.map((colorId) => ({
      id: [slug, sizeId, colorId].filter(Boolean).join('-'),
      sizeId,
      colorId,
      price: null,
      stockStatus: 'unknown' as const,
      stockQuantity: null,
    })),
  );
}

const CARE_TBC: ProductDetailSection = {
  title: 'Care',
  body: 'Care instructions will be confirmed with final product specifications.',
  icon: 'droplet',
};

const img = (src: string, alt: string) => ({ src, alt, width: 800, height: 800 });

const TEE: Product = {
  id: 'prod-destiny-oversized-tee',
  slug: 'destiny-oversized-tee',
  title: 'DESTINY Oversized Tee',
  category: 'apparel',
  status: 'preview',
  price: AUD(55),
  badge: 'Limited Release',
  excerpt:
    'Carry the energy. A premium oversized tee featuring the DESTINY artwork, made for those who live for the night and a brighter tomorrow.',
  description: null,
  images: [
    {
      id: 'front',
      label: 'Front',
      sortOrder: 1,
      image: img(
        '/merch/tee-front.svg',
        'Black oversized tee, front, with the DESTINY stage artwork and Connection ring mark',
      ),
    },
    {
      id: 'back',
      label: 'Back',
      sortOrder: 2,
      image: img(
        '/merch/tee-back.svg',
        'Back of the black tee printed with Music, People, Culture, A Brighter Tomorrow',
      ),
    },
    {
      id: 'artwork',
      label: 'Artwork detail',
      sortOrder: 3,
      image: img(
        '/merch/tee-artwork.svg',
        'Close-up of the DESTINY artwork: red stage arcs above a crowd silhouette',
      ),
    },
    {
      id: 'sleeve',
      label: 'Hem detail',
      sortOrder: 4,
      image: img('/merch/tee-sleeve.svg', 'Fabric close-up with the Connection wordmark'),
    },
  ],
  sizes: APPAREL_SIZES,
  colors: [BLACK],
  variants: variantsFor('destiny-oversized-tee', APPAREL_SIZES, [BLACK]),
  // The approved product page shows L preselected.
  defaultSizeId: 'l',
  featureLabels: ['Premium Cotton', 'Oversized Fit', 'Event Inspired'],
  detailSections: [
    {
      title: 'Overview',
      body: 'A relaxed event-inspired tee featuring the DESTINY artwork and Connection visual identity.',
      icon: 'file',
    },
    {
      title: 'Fit & Feel',
      body: 'Designed with an oversized silhouette and relaxed styling.',
      icon: 'shirt',
    },
    CARE_TBC,
  ],
  collectionHighlights: [
    {
      title: 'A Piece of the Movement',
      description: 'Represents the people, culture and community behind Connection.',
      icon: 'users',
    },
    {
      title: 'Iconic Event Artwork',
      description: 'Carries the signature DESTINY design and the shared energy behind it.',
      icon: 'heart',
    },
    {
      title: 'Made for What’s Next',
      description:
        'More than a tee — a reminder to keep the music, people and culture moving forward.',
      icon: 'globe',
    },
  ],
  featured: true,
  sortOrder: 1,
  seoTitle: null,
  seoDescription: null,
};

const HOODIE: Product = {
  id: 'prod-connection-hoodie',
  slug: 'connection-hoodie',
  title: 'Connection Hoodie',
  category: 'apparel',
  status: 'preview',
  price: AUD(80),
  badge: null,
  excerpt:
    'A black hoodie carrying the Connection ring mark — made for the walk home after the last track.',
  images: [
    {
      id: 'front',
      label: 'Front',
      sortOrder: 1,
      image: img('/merch/hoodie-front.svg', 'Black hoodie with the Connection ring mark on the chest'),
    },
    {
      id: 'back',
      label: 'Back',
      sortOrder: 2,
      image: img('/merch/hoodie-back.svg', 'Back of the black hoodie printed with Sound Meets Soul'),
    },
  ],
  sizes: APPAREL_SIZES,
  colors: [BLACK],
  variants: variantsFor('connection-hoodie', APPAREL_SIZES, [BLACK]),
  // No preselection: the shopper picks a size.
  defaultSizeId: null,
  featureLabels: ['Ring Mark', 'Relaxed Fit', 'Event Inspired'],
  detailSections: [
    {
      title: 'Overview',
      body: 'A hoodie built around the Connection ring mark, with Sound Meets Soul across the back.',
      icon: 'file',
    },
    {
      title: 'Fit & Feel',
      body: 'Designed for relaxed, layered styling.',
      icon: 'shirt',
    },
    CARE_TBC,
  ],
  collectionHighlights: [
    {
      title: 'Sound Meets Soul',
      description: 'The line that sits under every Connection logo, worn on the back.',
      icon: 'music',
    },
    {
      title: 'Built Around the Mark',
      description: 'The ring mark is the centre of the design, front and back.',
      icon: 'sparkles',
    },
  ],
  featured: false,
  sortOrder: 2,
};

const POSTER: Product = {
  id: 'prod-metro-city-poster',
  slug: 'metro-city-poster',
  title: 'Metro City Poster',
  category: 'posters',
  status: 'preview',
  price: AUD(25),
  badge: null,
  excerpt: 'The DESTINY stage artwork as a wall print — a reminder of the night on your wall.',
  images: [
    {
      id: 'front',
      label: 'Poster',
      sortOrder: 1,
      image: img(
        '/merch/poster.svg',
        'Framed DESTINY poster: red stage arcs, the ring mark and a crowd silhouette',
      ),
    },
  ],
  // Print size and paper are not confirmed, so no options are offered.
  sizes: [],
  colors: [],
  variants: [],
  featureLabels: ['DESTINY Artwork', 'Wall Print'],
  detailSections: [
    {
      title: 'Overview',
      body: 'The DESTINY stage artwork prepared as a poster print.',
      icon: 'file',
    },
    {
      title: 'Format',
      body: 'Print size and paper stock will be confirmed with final product specifications.',
      icon: 'star',
    },
  ],
  collectionHighlights: [
    {
      title: 'Iconic Event Artwork',
      description: 'The same stage visual that anchors the DESTINY identity.',
      icon: 'heart',
    },
  ],
  featured: false,
  sortOrder: 3,
};

const CAP: Product = {
  id: 'prod-sound-meets-soul-cap',
  slug: 'sound-meets-soul-cap',
  title: 'Sound Meets Soul Cap',
  category: 'accessories',
  status: 'preview',
  price: AUD(35),
  badge: null,
  excerpt: 'A black cap with the Connection ring mark up front and the wordmark on the side.',
  images: [
    {
      id: 'front',
      label: 'Cap',
      sortOrder: 1,
      image: img('/merch/cap.svg', 'Black cap with the red Connection ring mark on the front panel'),
    },
  ],
  sizes: [],
  colors: [BLACK],
  variants: variantsFor('sound-meets-soul-cap', [], [BLACK]),
  featureLabels: ['Ring Mark', 'Everyday Wear'],
  detailSections: [
    {
      title: 'Overview',
      body: 'A cap carrying the Connection ring mark and side wordmark.',
      icon: 'file',
    },
    CARE_TBC,
  ],
  collectionHighlights: [
    {
      title: 'Built Around the Mark',
      description: 'The ring mark, front and centre.',
      icon: 'sparkles',
    },
  ],
  featured: false,
  sortOrder: 4,
};

const TOTE: Product = {
  id: 'prod-connection-tote',
  slug: 'connection-tote',
  title: 'Connection Tote',
  category: 'accessories',
  status: 'preview',
  price: AUD(30),
  badge: null,
  excerpt: 'A black tote with the Connection ring mark and wordmark — for the everyday carry.',
  images: [
    {
      id: 'front',
      label: 'Tote',
      sortOrder: 1,
      image: img('/merch/tote.svg', 'Black tote bag with the Connection ring mark and wordmark'),
    },
  ],
  sizes: [],
  colors: [BLACK],
  variants: variantsFor('connection-tote', [], [BLACK]),
  featureLabels: ['Ring Mark', 'Everyday Carry'],
  detailSections: [
    {
      title: 'Overview',
      body: 'A tote bag carrying the Connection ring mark and wordmark.',
      icon: 'file',
    },
    CARE_TBC,
  ],
  collectionHighlights: [
    {
      title: 'A Piece of the Movement',
      description: 'The Connection identity, taken out into the day.',
      icon: 'users',
    },
  ],
  featured: false,
  sortOrder: 5,
};

const STICKERS: Product = {
  id: 'prod-rave-sticker-pack',
  slug: 'rave-sticker-pack',
  title: 'Rave Sticker Pack',
  category: 'collectibles',
  status: 'preview',
  price: AUD(15),
  badge: null,
  excerpt: 'A set of stickers drawn from the Connection and DESTINY visual identity.',
  images: [
    {
      id: 'front',
      label: 'Sticker pack',
      sortOrder: 1,
      image: img(
        '/merch/sticker-pack.svg',
        'Four stickers: the ring mark, the DESTINY wordmark, a Music People Culture tag and a stage artwork',
      ),
    },
  ],
  sizes: [],
  colors: [],
  variants: [],
  featureLabels: ['Four Designs', 'Collectible'],
  detailSections: [
    {
      title: 'Overview',
      body: 'Stickers featuring the ring mark, the DESTINY wordmark and the Music, People, Culture line.',
      icon: 'file',
    },
    {
      title: 'Format',
      body: 'Sticker sizes and finish will be confirmed with final product specifications.',
      icon: 'star',
    },
  ],
  collectionHighlights: [
    {
      title: 'Iconic Event Artwork',
      description: 'Pieces of the DESTINY identity, made to be stuck anywhere.',
      icon: 'heart',
    },
  ],
  featured: false,
  sortOrder: 6,
};

export const SHOP_PRODUCTS: Product[] = [TEE, HOODIE, POSTER, CAP, TOTE, STICKERS];

export const SHOP_MOCK: ShopPageData = {
  hero: {
    eyebrow: 'Official Merchandise',
    titleLines: ['WEAR THE', 'CONNECTION'],
    description:
      'Premium Connection Rave / DESTINY apparel and accessories. More than merch — it’s a movement. Music, people and culture, made to be worn.',
    primaryCta: { label: 'Shop Collection', href: '#browse-merchandise' },
    secondaryCta: { label: 'View Featured Product', href: `/shop/${TEE.slug}` },
    visual: { src: '/assets/hero-crowd.jpg', alt: '', width: 1600, height: 1000 },
    composition: [
      { src: '/merch/cutout-poster.svg', alt: '' },
      { src: '/merch/cutout-hoodie.svg', alt: '' },
      { src: '/merch/cutout-tee.svg', alt: '' },
      { src: '/merch/cutout-cap.svg', alt: '' },
    ],
    sideNotes: ['MUSIC', 'PEOPLE', 'CULTURE', 'CONNECTION'],
  },

  featuredProduct: TEE,
  featuredHighlights: [
    { label: 'Limited Release', icon: 'gem' },
    { label: 'Premium Cotton', icon: 'shirt' },
    { label: 'Event Inspired', icon: 'users' },
  ],
  products: SHOP_PRODUCTS,

  benefits: [
    {
      id: 'quality',
      title: 'Premium Quality',
      description: 'Thoughtful materials and finishes designed for everyday wear.',
      icon: 'gem',
    },
    {
      id: 'drops',
      title: 'Limited Drops',
      description: 'Selected designs released in focused collections.',
      icon: 'box',
    },
    {
      id: 'design',
      title: 'Event-Inspired Design',
      description: 'Visuals inspired by Connection Rave and DESTINY.',
      icon: 'music',
    },
    {
      id: 'style',
      title: 'Worldwide Style',
      description: 'A visual identity built around music, people and culture.',
      icon: 'users',
    },
  ],

  productBenefits: [
    {
      id: 'quality',
      title: 'Premium Quality',
      description: 'Thoughtful materials and finishes designed for everyday wear.',
      icon: 'gem',
    },
    {
      id: 'drop',
      title: 'Limited Drop',
      description: 'Part of a focused collection of selected designs.',
      icon: 'box',
    },
    {
      id: 'night',
      title: 'Inspired by the Night',
      description: 'More than merch — it’s a movement.',
      icon: 'music',
    },
    {
      id: 'style',
      title: 'Easy to Style',
      description: 'A clean look for everyday and for events.',
      icon: 'shirt',
    },
  ],

  finalCta: {
    title: 'MORE THAN MERCH',
    description: 'Explore the event, meet the lineup and be part of a brighter tomorrow.',
    primary: { label: 'Explore Event', href: '/event' },
    secondary: { label: 'View Lineup', href: '/lineup' },
    background: { src: '/assets/hero-crowd.jpg', alt: '', width: 1600, height: 1000 },
  },

  footer: {
    email: null,
    phone: null,
    partners: [
      {
        id: 'mcq',
        name: 'MCQ Supermarket',
        logo: { src: '/assets/logo-mcq.png', alt: 'MCQ Supermarket', width: 200, height: 64 },
      },
      {
        id: 'bihi',
        name: 'BIHI Entertainment',
        logo: { src: '/assets/logo-bihi.png', alt: 'BIHI Entertainment', width: 200, height: 64 },
      },
    ],
    socials: [
      { id: 'instagram', platform: 'instagram', url: null },
      { id: 'facebook', platform: 'facebook', url: null },
      { id: 'youtube', platform: 'youtube', url: null },
      { id: 'tiktok', platform: 'tiktok', url: null },
    ],
    legalTermsHref: '/terms',
    legalPrivacyHref: '/privacy',
  },
};
