import Header from '@/components/home/Header';
import CheckoutResultHero from '@/components/checkout/CheckoutResultHero';
import { resultCopy } from '@/components/checkout/resultCopy';
import { RESULT_CONTENT } from '@/lib/cart/content';

/** Shown while the server verifies the checkout reference. */
export default function Loading() {
  const copy = resultCopy('verifying');
  return (
    <>
      <Header />
      <main className="min-h-screen bg-rave-black text-white" aria-busy="true">
        <CheckoutResultHero
          status="verifying"
          tone={copy.tone}
          title={copy.title}
          body={copy.body}
          steps={[]}
          sideNotes={RESULT_CONTENT.sideNotes}
        />
      </main>
    </>
  );
}
