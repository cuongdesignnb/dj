'use client';

import { useEffect } from 'react';

/**
 * Admin keeps the original palette whatever the public site theme is. The admin
 * wrapper pins it for server-rendered markup; this also pins <html> so toasts,
 * dialogs and tours portalled to <body> match, and restores it on the way out.
 */
export default function AdminThemePin() {
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.dataset.theme;
    root.dataset.theme = 'connection';
    return () => { if (previous) root.dataset.theme = previous; };
  }, []);
  return null;
}
