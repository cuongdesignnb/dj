'use client';

import { useEffect } from 'react';

/**
 * Phones often capitalise the first letter typed after the domain
 * ("/Tickets"). Every public route is lowercase, so a 404 on a path with
 * capitals retries once in lowercase; a lowercase path is left alone.
 */
export default function LowercasePathRedirect() {
  useEffect(() => {
    const { pathname, search, hash } = window.location;
    const lower = pathname.toLowerCase();
    if (lower !== pathname && !pathname.startsWith('/api/')) window.location.replace(lower + search + hash);
  }, []);
  return null;
}
