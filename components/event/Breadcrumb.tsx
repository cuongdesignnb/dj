'use client';

import Link from 'next/link';

export default function Breadcrumb({ trail }: { trail: Array<{ label: string; href?: string }> }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-rave-muted">
      <ol className="flex items-center gap-1.5 flex-wrap">
        {trail.map((item, i) => {
          const isLast = i === trail.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-white transition-colors uppercase tracking-[0.18em]"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={isLast ? 'text-white uppercase tracking-[0.18em]' : 'uppercase tracking-[0.18em]'}
                >
                  {item.label}
                </span>
              )}
              {!isLast && <span aria-hidden className="text-rave-muted/50">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
