'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { Check, Link2 } from 'lucide-react';

// lucide-react v1 no longer ships brand marks, so these are inline — the same
// approach the site footer already uses for its social icons.
function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.65l-5.22-6.82-5.97 6.82H1.67l7.73-8.83L1.25 2.25h6.82l4.71 6.23zm-1.16 17.52h1.83L7.01 4.13H5.04z" />
    </svg>
  );
}
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}
function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

/** The address bar only moves under us on history navigation. */
function subscribeToLocation(onChange: () => void) {
  window.addEventListener('popstate', onChange);
  window.addEventListener('hashchange', onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener('hashchange', onChange);
  };
}

/**
 * Share controls for an article.
 *
 * Only networks with a real web share endpoint are offered. Instagram and
 * TikTok have none, so they are not shown — a button that silently does nothing
 * is worse than its absence.
 *
 * The URL is read from the browser rather than composed from a guessed origin,
 * so it is always the address the reader is actually on.
 */
export default function ArticleShare({ title }: { title: string }) {
  // The address bar is external state, so it is read through
  // useSyncExternalStore rather than copied into state from an effect. The
  // server snapshot is empty, which is what the initial HTML contains, so
  // hydration matches and the real URL arrives on the first client render.
  const url = useSyncExternalStore(
    subscribeToLocation,
    () => window.location.href,
    () => '',
  );
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const copied = status === 'copied';

  useEffect(() => {
    if (status === 'idle') return;
    const timer = window.setTimeout(() => setStatus('idle'), 4000);
    return () => window.clearTimeout(timer);
  }, [status]);

  const copyLink = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setStatus('copied');
    } catch {
      // Some browsers refuse clipboard access outright. Say so rather than
      // leaving the reader to wonder whether the click registered.
      setStatus('failed');
    }
  };

  const statusMessage =
    status === 'copied'
      ? 'Link copied to clipboard.'
      : status === 'failed'
        ? 'Copying is blocked in this browser — copy the address from the address bar.'
        : '';

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const targets = [
    {
      key: 'twitter',
      label: 'Share on X',
      Icon: XIcon,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      key: 'facebook',
      label: 'Share on Facebook',
      Icon: FacebookIcon,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      key: 'linkedin',
      label: 'Share on LinkedIn',
      Icon: LinkedinIcon,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
  ];

  const buttonClass =
    'grid h-11 w-11 place-items-center rounded-[12px] border border-white/[0.12] bg-white/[0.02] text-white transition-all duration-300 hover:border-rave-red/60 hover:bg-rave-red/10 hover:text-rave-red focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black';

  return (
    <div>
      <h3 className="font-heading text-sm font-bold uppercase tracking-[0.2em] text-white">
        Share This Article
      </h3>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={copyLink}
          disabled={!url}
          aria-label={copied ? 'Link copied' : 'Copy link to this article'}
          className={`${buttonClass} disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {copied ? (
            <Check aria-hidden className="h-4 w-4 text-rave-red" />
          ) : (
            <Link2 aria-hidden className="h-4 w-4" />
          )}
        </button>

        {targets.map(({ key, label, Icon, href }) =>
          url ? (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className={buttonClass}
            >
              <Icon className="h-4 w-4" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          ) : null,
        )}
      </div>

      {/* Announced, not just shown as a colour change on the icon. */}
      <p
        aria-live="polite"
        className={`mt-2 text-xs ${status === 'failed' ? 'text-rave-red' : 'text-rave-muted'}`}
      >
        {statusMessage}
      </p>
    </div>
  );
}
