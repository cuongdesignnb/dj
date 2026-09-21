'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';

export type PublicMenuItem = {
  id: string;
  labelEn: string;
  labelVi?: string | null;
  href: string | null;
  target?: string | null;
  children?: PublicMenuItem[];
};

function isExternal(href: string) {
  return /^(https?:|mailto:|tel:)/i.test(href);
}

function MenuAnchor({ item, className }: { item: PublicMenuItem; className: string }) {
  if (!item.href) return null;
  const label = item.labelEn || item.labelVi || item.href;
  if (isExternal(item.href) || item.target === '_blank') {
    return (
      <a href={item.href} target={item.target ?? undefined} rel={item.target === '_blank' ? 'noopener noreferrer' : undefined} className={className}>
        {label}
      </a>
    );
  }
  return <Link href={item.href} className={className}>{label}</Link>;
}

function renderItems(items: PublicMenuItem[], itemClassName: string, linkClassName: string): ReactNode {
  return items.map((item) => (
    <li key={item.id} className={itemClassName}>
      <MenuAnchor item={item} className={linkClassName} />
      {item.children?.length ? (
        <ul className="mt-2 flex flex-col gap-2 pl-3">
          {renderItems(item.children, '', linkClassName)}
        </ul>
      ) : null}
    </li>
  ));
}

export default function PublicMenuLinks({
  location,
  listClassName = 'flex flex-col gap-2.5',
  itemClassName = '',
  linkClassName = 'text-sm text-rave-muted transition-colors hover:text-white',
}: {
  location: 'HEADER_PRIMARY' | 'HEADER_CTA' | 'MOBILE_PRIMARY' | 'FOOTER_QUICK' | 'FOOTER_LEGAL' | 'FOOTER_SECONDARY';
  listClassName?: string;
  itemClassName?: string;
  linkClassName?: string;
}) {
  const [items, setItems] = useState<PublicMenuItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/v1/navigation/${location}`)
      .then((response) => response.json())
      .then((payload) => {
        if (!cancelled) setItems((payload?.data?.items ?? []) as PublicMenuItem[]);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [location]);

  return <ul className={listClassName}>{renderItems(items, itemClassName, linkClassName)}</ul>;
}
