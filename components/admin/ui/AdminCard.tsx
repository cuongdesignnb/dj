import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';

/** Panel with an optional spaced-caps heading and a "View all" link. */
export default function AdminCard({
  title,
  description,
  action,
  children,
  className = '',
  titleId,
  badge,
}: {
  title?: string;
  description?: string;
  action?: { label: string; href: string };
  children: ReactNode;
  className?: string;
  titleId?: string;
  badge?: ReactNode;
}) {
  const Tag = title ? 'section' : 'div';
  return (
    <Tag
      aria-labelledby={title ? titleId : undefined}
      className={`rounded-[12px] border border-admin-border bg-admin-panel/90 p-4 sm:p-5 ${className}`}
    >
      {title && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2
              id={titleId}
              className="flex flex-wrap items-center gap-2 font-heading text-sm font-semibold uppercase tracking-[0.25em] text-white"
            >
              {title}
              {badge}
            </h2>
            {description && <p className="mt-1 text-xs text-admin-muted">{description}</p>}
          </div>
          {action && (
            <Link
              href={action.href}
              className="inline-flex items-center gap-1 text-xs font-medium text-rave-red hover:text-rave-red2 focus:outline-none focus-visible:underline"
            >
              {action.label}
              <ArrowRight aria-hidden className="h-3 w-3" />
            </Link>
          )}
        </div>
      )}
      {children}
    </Tag>
  );
}

export function DemoTag({ label = 'Demo data' }: { label?: string }) {
  return (
    <span className="rounded-full border border-admin-warning/40 bg-admin-warning/10 px-2 py-0.5 font-body text-[10px] font-medium normal-case tracking-normal text-admin-warning">
      {label}
    </span>
  );
}
