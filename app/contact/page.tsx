import type { Metadata } from 'next';

import Header from '@/components/home/Header';
import ContactForm from '@/components/contact/ContactForm';
import { buildMetadata } from '@/lib/seo/metadata';
import { getContentSeo } from '@/lib/seo/content';

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getContentSeo('contact', { title: 'Contact Connection Rave', description: 'Send a message to the Connection Rave team about events, tickets, partnerships or VIP tables.' });
  return buildMetadata({ ...seo, path: '/contact' });
}

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-rave-black text-white">
      <Header />
      <section className="mx-auto grid w-full max-w-[1180px] gap-12 px-4 pb-20 pt-32 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8 lg:pt-40">
        <div>
          <p className="font-heading text-xs font-bold uppercase tracking-[0.3em] text-rave-red">Connection Rave</p>
          <h1 className="mt-4 font-heading text-5xl font-black uppercase leading-[0.95] sm:text-6xl">Let&apos;s connect.</h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-white/70">Have a question about an event, tickets, partnerships or VIP tables? Send the team a message and we&apos;ll get back to you through the details you provide.</p>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-white/45">Contact details are shown here only when they have been confirmed in the site settings.</p>
        </div>
        <div className="rounded-[16px] border border-white/[0.1] bg-rave-panel/60 p-5 sm:p-8">
          <h2 className="font-heading text-xl font-bold uppercase tracking-[0.1em]">Send an enquiry</h2>
          <p className="mt-2 mb-7 text-sm text-white/55">The form is delivered to the site&apos;s contact inbox when that integration is configured.</p>
          <ContactForm />
        </div>
      </section>
    </main>
  );
}
