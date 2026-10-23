import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/event', destination: '/events/destiny', permanent: true },
      // Common guesses and shortened links. Temporary (307) so a path can later
      // become a real page without browsers remembering the redirect; the query
      // string (e.g. ?event=<slug>) is kept.
      ...([
        ['/home', '/'],
        ['/index.html', '/'],
        ['/ticket', '/tickets'],
        ['/table', '/tables'],
        ['/vip', '/tables'],
        ['/vip-tables', '/tables'],
        ['/booking', '/book-now'],
        ['/book', '/book-now'],
        ['/booknow', '/book-now'],
        ['/artists', '/lineup'],
        ['/merch', '/shop'],
        ['/store', '/shop'],
        ['/sponsors', '/partners'],
        ['/partner', '/partners'],
        ['/photos', '/gallery'],
        ['/about-us', '/about'],
        ['/contact-us', '/contact'],
      ] as const).map(([source, destination]) => ({ source, destination, permanent: false })),
    ];
  },
  async headers() {
    return [
      {
        source: '/checkout/pay/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "object-src 'none'",
              "frame-ancestors 'self'",
              "script-src 'self' https://sandbox.web.squarecdn.com https://web.squarecdn.com",
              "frame-src 'self' https://sandbox.web.squarecdn.com https://web.squarecdn.com https://pci-connect.squareupsandbox.com https://pci-connect.squareup.com",
              "connect-src 'self' https://sandbox.web.squarecdn.com https://web.squarecdn.com https://pci-connect.squareupsandbox.com https://pci-connect.squareup.com",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data: https://square-fonts-production-f.squarecdn.com https://d1g145x70srn7h.cloudfront.net",
              "img-src 'self' data: blob: https:",
            ].join('; '),
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
