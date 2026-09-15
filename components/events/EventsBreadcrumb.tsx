'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import Container from '@/components/ui/Container';

export interface Crumb {
  label: string;
  /** Omitted on the final crumb, which is the current page. */
  href?: string;
}

/**
 * Breadcrumb for the /events tree. Sits below the fixed 84px header, so it
 * carries its own top padding rather than relying on the section after it.
 */
export default function EventsBreadcrumb({ trail }: { trail: Crumb[] }) {
  return (
    <motion.nav
      aria-label="Breadcrumb"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-rave-black pt-[100px] sm:pt-[108px]"
    >
      <Container>
        <ol className="flex flex-wrap items-center gap-2 font-heading text-xs uppercase tracking-[0.18em] text-rave-muted sm:text-sm">
          {trail.map((crumb, index) => {
            const last = index === trail.length - 1;
            return (
              <li key={crumb.label} className="flex items-center gap-2">
                {index > 0 && (
                  <span aria-hidden className="text-rave-muted/60">
                    /
                  </span>
                )}
                {last || !crumb.href ? (
                  <span aria-current={last ? 'page' : undefined} className="text-rave-red">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="rounded-sm transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black"
                  >
                    {crumb.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </Container>
    </motion.nav>
  );
}
