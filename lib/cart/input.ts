import { primaryImage } from '@/lib/shop/helpers';
import type { ProductSelection } from '@/lib/shop/helpers';
import { unitPrice } from '@/lib/shop/pricing';
import type { Product, ProductVariant } from '@/lib/shop/types';
import type { CartLineInput } from './types';

const PLACEHOLDER_IMAGE = { src: '/merch/tee-front.svg', alt: '' };

/** Builds the cart input for a product and an already-validated selection. */
export function cartInputFor(
  product: Product,
  selection: ProductSelection,
  variant: ProductVariant | null,
  quantity: number,
): CartLineInput {
  return {
    productId: product.id,
    productSlug: product.slug,
    variantId: variant?.id ?? null,
    quantity,
    title: product.title,
    image: primaryImage(product)?.image ?? PLACEHOLDER_IMAGE,
    sizeLabel: product.sizes.find((s) => s.id === selection.sizeId)?.label ?? null,
    colorLabel: product.colors.find((c) => c.id === selection.colorId)?.name ?? null,
    unitPrice: unitPrice(product, variant),
  };
}

/** "Size L / Black" style label for a line. */
export function optionLabel(line: { sizeLabel?: string | null; colorLabel?: string | null }) {
  return [line.sizeLabel, line.colorLabel].filter(Boolean).join(' / ');
}
