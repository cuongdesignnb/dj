'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Container from '@/components/ui/Container';
import { shopStagger } from '@/lib/animations';
import type { Product } from '@/lib/shop/types';
import ProductCard from './ProductCard';
import SectionHeading from './SectionHeading';

/** "You May Also Like" — the list is chosen on the server, deterministically. */
export default function RelatedProducts({ products }: { products: Product[] }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  if (products.length === 0) return null;

  return (
    <section ref={ref} aria-labelledby="related-products-title" className="bg-rave-black pb-16 md:pb-24">
      <Container>
        <SectionHeading
          id="related-products-title"
          title="You May Also Like"
          context="Explore More From the Collection"
        />
        <motion.div
          variants={shopStagger}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
