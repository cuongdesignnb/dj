import type { Metadata } from 'next';
import Header from '@/components/home/Header';
import AboutHero from '@/components/about/AboutHero';
import AboutStory from '@/components/about/AboutStory';
import AboutValues from '@/components/about/AboutValues';
import AboutEcosystem from '@/components/about/AboutEcosystem';
import AboutConnection from '@/components/about/AboutConnection';
import AboutPartners from '@/components/about/AboutPartners';
import AboutCTA from '@/components/about/AboutCTA';
import AboutFooter from '@/components/about/AboutFooter';
import { getAboutRepository } from '@/lib/about/repository';

export const metadata: Metadata = {
  title: 'About Connection Land | Sound Meets Soul',
  description:
    'Discover Connection Land — a Perth nightlife and entertainment brand connecting music, artists, culture and unforgettable experiences.',
  openGraph: {
    title: 'About Connection Land | Sound Meets Soul',
    description:
      'A nightlife and entertainment brand creating immersive music experiences that bring together sound, people and culture.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Connection Land | Sound Meets Soul',
    description:
      'A nightlife and entertainment brand creating immersive music experiences.',
  },
};

export default async function AboutPage() {
  const repo = getAboutRepository();
  const result = await repo.getAboutPage();

  if (!result.ok) {
    // Render a minimal fallback rather than noindex-only error overlay.
    return (
      <main className="min-h-screen bg-rave-black text-white">
        <Header />
        <div className="container mx-auto max-w-3xl px-6 py-24 text-center">
          <h1 className="font-heading text-3xl sm:text-4xl uppercase font-black">
            We can&apos;t load this page right now
          </h1>
          <p className="text-rave-muted mt-4">{result.error.message}</p>
        </div>
      </main>
    );
  }

  const data = result.data;

  return (
    <main className="min-h-screen bg-rave-black text-white">
      <Header />
      <AboutHero hero={data.hero} />
      <AboutStory story={data.story} />
      <AboutValues values={data.values} />
      <AboutEcosystem items={data.ecosystem} />
      <AboutConnection items={data.connectionReasons} />
      <AboutPartners partners={data.partners} />
      <AboutCTA cta={data.finalCta} />
      <AboutFooter
        contact={data.footer.contact}
        legalTermsHref={data.footer.legalTermsHref}
        legalPrivacyHref={data.footer.legalPrivacyHref}
      />
    </main>
  );
}
