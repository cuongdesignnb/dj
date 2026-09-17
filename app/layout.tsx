import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";
import MouseGlow from "@/components/ui/MouseGlow";
import { canonicalUrl } from '@/lib/seo/canonical';
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, robotsFor, siteUrl } from '@/lib/seo/config';
import { jsonLd, organizationSchema, websiteSchema } from '@/lib/seo/structured-data';

// Fonts loaded via next/font so they're self-hosted, never blocked by
// network and never cause a flash of unstyled text.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-oswald",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: DEFAULT_TITLE, template: '%s | Connection Rave' },
  description: DEFAULT_DESCRIPTION,
  applicationName: 'Connection Rave',
  alternates: { canonical: canonicalUrl('/') },
  icons: { icon: '/favicon.ico' },
  openGraph: {
    type: 'website',
    siteName: 'Connection Rave',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: canonicalUrl('/'),
    images: [{ url: canonicalUrl('/assets/event-poster.jpg'), width: 1200, height: 800, alt: 'DESTINY event poster' }],
  },
  twitter: { card: 'summary_large_image', title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, images: [canonicalUrl('/assets/event-poster.jpg')] },
  robots: robotsFor(),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${oswald.variable} h-full scroll-smooth`}
    >
      <body className="min-h-full flex flex-col bg-rave-black text-white antialiased font-body">
        <MouseGlow />
        {[organizationSchema(), websiteSchema()].map((schema, index) => (
          <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) ?? '' }} />
        ))}
        {children}
      </body>
    </html>
  );
}
