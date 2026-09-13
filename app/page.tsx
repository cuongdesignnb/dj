import type { Metadata } from 'next';
import Header from '@/components/home/Header';
import HeroSection from '@/components/home/HeroSection';
import EventOverview from '@/components/home/EventOverview';
import LineupPreview from '@/components/home/LineupPreview';
import TicketsSection from '@/components/home/TicketsSection';
import VipTableSection from '@/components/home/VipTableSection';
import PartnersFooter from '@/components/home/PartnersFooter';

export const metadata: Metadata = {
  title: "Destiny — Perth’s Next High-Energy Rave Experience",
  description:
    "Join Connection Rave for Destiny at Metro City, Perth on Friday, 30 May 2026. Tickets, lineup, VIP tables and premium nightlife experience.",
  openGraph: {
    title: "Destiny — Connection Rave",
    description:
      "Perth’s next high-energy rave experience. EDM, Hardstyle, Techno, Vinahouse and more.",
    images: ["/assets/event-poster.jpg"],
  },
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-rave-black text-white relative noise-overlay">
      <Header />
      <HeroSection />
      <EventOverview />
      <LineupPreview />
      <TicketsSection />
      <VipTableSection />
      <PartnersFooter />
    </main>
  );
}
