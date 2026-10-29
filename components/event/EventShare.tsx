'use client';

import { useState } from 'react';
import { Check, Link2, Mail } from 'lucide-react';

/** Share links built at click time from the page's own origin, so previews and production both share the right URL. */
export default function EventShare({ title, path }: { title: string; path: string }) {
  const [copied, setCopied] = useState(false);
  const url = () => `${window.location.origin}${path}`;
  const open = (href: string) => window.open(href, '_blank', 'noopener,noreferrer');
  const button = 'inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/85 transition-colors hover:border-rave-red/60 hover:text-white';

  return (
    <div data-event-share="" className="flex flex-wrap items-center justify-center gap-2">
      <span className="mr-1 font-heading text-[11px] uppercase tracking-[0.22em] text-rave-muted">Share</span>
      <button type="button" className={button} aria-label="Share on Facebook" onClick={() => open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url())}`)}>Facebook</button>
      <button type="button" className={button} aria-label="Share on X" onClick={() => open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url())}&text=${encodeURIComponent(title)}`)}>X</button>
      <button type="button" className={button} aria-label="Share on WhatsApp" onClick={() => open(`https://wa.me/?text=${encodeURIComponent(`${title} ${url()}`)}`)}>WhatsApp</button>
      <button type="button" className={button} aria-label="Share by email" onClick={() => { window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url())}`; }}><Mail aria-hidden className="h-4 w-4" /></button>
      <button
        type="button"
        className={button}
        onClick={() => {
          void navigator.clipboard?.writeText(url()).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 2000); });
        }}
      >
        {copied ? <Check aria-hidden className="h-4 w-4" /> : <Link2 aria-hidden className="h-4 w-4" />}
        {copied ? 'Copied' : 'Copy link'}
      </button>
    </div>
  );
}
