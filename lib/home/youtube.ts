/**
 * The 11-character video id from a YouTube link: watch?v=, youtu.be/, /embed/,
 * /shorts/ or /live/. Anything else (playlists, channels, other sites) is null.
 */
export function youtubeId(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, '');
  let id: string | null = null;
  if (host === 'youtu.be') id = url.pathname.split('/')[1] ?? null;
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname === '/watch') id = url.searchParams.get('v');
    else {
      const match = /^\/(?:embed|shorts|live|v)\/([^/?#]+)/.exec(url.pathname);
      id = match?.[1] ?? null;
    }
  }
  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
}
