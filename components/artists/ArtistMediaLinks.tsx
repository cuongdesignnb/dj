'use client';

import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import type { Artist, ArtistLinkType } from '@/lib/artists/types';

const LINK_LABELS: Record<ArtistLinkType, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  spotify: 'Spotify',
  soundcloud: 'SoundCloud',
  website: 'Website',
};

/**
 * Socials and media for an artist.
 *
 * Both halves render only when the artist actually has entries. No placeholder
 * handles, no `#` links, no empty media frames — an artist with nothing
 * recorded simply shows nothing here.
 */
export default function ArtistMediaLinks({ artist }: { artist: Artist }) {
  const links = artist.externalLinks;
  const media = artist.media;

  if (links.length === 0 && media.length === 0) return null;

  return (
    <div className="mt-8 flex flex-col gap-8">
      {links.length > 0 && (
        <div>
          <h3 className="font-heading text-sm font-bold uppercase tracking-[0.2em] text-white">
            Find {artist.name}
          </h3>
          <ul className="mt-4 flex flex-wrap gap-3">
            {links.map((link) => (
              <li key={`${link.type}-${link.url}`}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-[12px] border border-white/[0.12] bg-white/[0.02] px-4 font-heading text-xs font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:border-rave-red/60 hover:bg-rave-red/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black"
                >
                  {link.label ?? LINK_LABELS[link.type]}
                  <ExternalLink aria-hidden className="h-3.5 w-3.5" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {media.length > 0 && (
        <div>
          <h3 className="font-heading text-sm font-bold uppercase tracking-[0.2em] text-white">
            Artist Media
          </h3>
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {media.map((item) => {
              const frame = (
                <span className="relative block aspect-video overflow-hidden rounded-[14px] border border-white/[0.08]">
                  {item.thumbnail.src && (
                    <Image
                      src={item.thumbnail.src}
                      alt={item.thumbnail.alt}
                      fill
                      loading="lazy"
                      sizes="(max-width: 640px) 50vw, 240px"
                      className="object-cover"
                    />
                  )}
                </span>
              );

              return (
                <li key={item.id}>
                  {/* No autoplay: a video is a link out, not an embedded player. */}
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-[14px] focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black"
                    >
                      {frame}
                      <span className="mt-2 block text-xs text-rave-muted">
                        {item.title ?? LINK_LABELS.website}
                        <span className="sr-only"> (opens in a new tab)</span>
                      </span>
                    </a>
                  ) : (
                    <>
                      {frame}
                      {item.title && (
                        <span className="mt-2 block text-xs text-rave-muted">{item.title}</span>
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
