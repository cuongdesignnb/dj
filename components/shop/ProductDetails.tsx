import Image from 'next/image';
import Container from '@/components/ui/Container';
import type { Product } from '@/lib/shop/types';
import { shopIcon } from './icons';

/**
 * Product details beside the collection story. Server-rendered: this is the
 * copy search engines and no-JS readers should get in the initial HTML.
 */
export default function ProductDetails({ product }: { product: Product }) {
  const hasStory = product.collectionHighlights.length > 0;

  return (
    <section aria-label="Product information" className="bg-rave-black pb-16 md:pb-20">
      <Container>
        <div className={`grid grid-cols-1 gap-5 ${hasStory ? 'lg:grid-cols-2' : ''}`}>
          <div
            aria-labelledby="product-details-title"
            role="region"
            className="rounded-[20px] border border-white/[0.08] bg-rave-panel/70 p-6 sm:p-8"
          >
            <h2
              id="product-details-title"
              className="font-heading text-3xl font-black uppercase tracking-tight text-white sm:text-4xl"
            >
              Product Details
            </h2>

            {product.detailSections.length > 0 ? (
              <ul className="mt-6 divide-y divide-white/[0.08]">
                {product.detailSections.map((section) => {
                  const Icon = shopIcon(section.icon, 'file');
                  return (
                    <li key={section.title} className="flex gap-4 py-5 first:pt-0 last:pb-0">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[12px] border border-white/15">
                        <Icon aria-hidden className="h-5 w-5 text-white" />
                      </span>
                      <div>
                        <h3 className="font-heading text-base font-semibold text-white">
                          {section.title}
                        </h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-rave-muted">
                          {section.body}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-6 text-sm text-rave-muted">
                Product details will be confirmed with final specifications.
              </p>
            )}
          </div>

          {hasStory && (
            <div
              role="region"
              aria-labelledby="collection-story-title"
              className="relative isolate overflow-hidden rounded-[20px] border border-white/[0.08] p-6 sm:p-8"
            >
              <Image
                src="/assets/hero-crowd.jpg"
                alt=""
                fill
                loading="lazy"
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="-z-10 object-cover opacity-40"
              />
              <div
                aria-hidden
                className="absolute inset-0 -z-10"
                style={{
                  background:
                    'linear-gradient(90deg, rgba(3,3,5,0.96) 0%, rgba(3,3,5,0.85) 55%, rgba(40,4,12,0.7) 100%)',
                }}
              />

              <h2
                id="collection-story-title"
                className="font-heading text-3xl font-black uppercase leading-[1.05] tracking-tight text-white sm:text-4xl"
              >
                Why It Belongs
                <br />
                In the Collection
              </h2>

              <ul className="mt-6 flex flex-col gap-6 xl:pr-36">
                {product.collectionHighlights.map((item) => {
                  const Icon = shopIcon(item.icon);
                  return (
                    <li key={item.title} className="flex max-w-md gap-4">
                      <Icon aria-hidden className="h-8 w-8 shrink-0 text-rave-red" strokeWidth={1.6} />
                      <div>
                        <h3 className="font-heading text-base font-bold uppercase tracking-[0.04em] text-white">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-rave-muted">
                          {item.description}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div
                aria-hidden
                className="pointer-events-none absolute bottom-6 right-6 hidden flex-col gap-1 text-right font-heading text-sm uppercase tracking-[0.28em] text-white/60 xl:flex"
              >
                <span>Music</span>
                <span>People</span>
                <span>Culture</span>
                <span>A Brighter</span>
                <span>Tomorrow</span>
              </div>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
