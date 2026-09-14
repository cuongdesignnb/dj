import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";
import MouseGlow from "@/components/ui/MouseGlow";

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
  title: "Destiny — Connection Rave",
  description: "Perth's next high-energy rave experience.",
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
        {children}
      </body>
    </html>
  );
}
