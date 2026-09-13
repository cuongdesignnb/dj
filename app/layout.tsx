import type { Metadata } from "next";
import "./globals.css";
import MouseGlow from "@/components/ui/MouseGlow";

export const metadata: Metadata = {
  title: "Destiny — Connection Rave",
  description: "Perth’s next high-energy rave experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-rave-black font-body text-white antialiased" suppressHydrationWarning>
        <MouseGlow />
        {children}
      </body>
    </html>
  );
}
