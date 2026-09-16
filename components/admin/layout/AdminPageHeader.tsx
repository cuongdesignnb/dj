import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

export interface AdminCrumb {
  label: string;
  href?: string;
}

export function AdminBreadcrumb({ trail }: { trail: AdminCrumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm">
        {trail.map((crumb, index) => {
          const last = index === trail.length - 1;
          return (
            <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 && <ChevronRight aria-hidden className="h-3.5 w-3.5 text-admin-muted" />}
              {crumb.href && !last ? (
                <Link href={crumb.href} className="text-rave-red hover:text-rave-red2 focus:outline-none focus-visible:underline">
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className={last ? 'text-white/85' : 'text-admin-muted'}>
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Page title block: small eyebrow, big condensed title, breadcrumb and the
 * page's primary actions.
 */
export default function AdminPageHeader({
  eyebrow,
  title,
  description,
  trail,
  actions,
  tagline,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  trail: AdminCrumb[];
  actions?: ReactNode;
  tagline?: string;
}) {
  return (
    <header className="mb-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <p className="font-heading text-[11px] uppercase tracking-[0.4em] text-admin-muted">{eyebrow}</p>}
          <h1 className="mt-1 break-words font-heading text-3xl font-bold uppercase tracking-[0.06em] text-white sm:text-4xl">{title}</h1>
          <div className="mt-2">
            <AdminBreadcrumb trail={trail} />
          </div>
          {description && <p className="mt-2 max-w-2xl text-sm text-admin-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {tagline && (
        <div className="mt-3 flex items-center justify-end gap-3">
          <p className="hidden text-[10px] uppercase tracking-[0.5em] text-admin-muted sm:block">{tagline}</p>
        </div>
      )}
      <div aria-hidden className="mt-3 h-px bg-gradient-to-r from-transparent via-rave-red/60 to-rave-red" />
    </header>
  );
}
