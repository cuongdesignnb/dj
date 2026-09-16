// Shared button styles. Plain module (not 'use client') so Server Components
// receive the class strings, not client references.

export const buttonClass = {
  primary:
    'inline-flex min-h-[40px] items-center justify-center gap-2 rounded-[8px] bg-rave-red px-4 text-sm font-semibold text-white transition-colors hover:bg-rave-red2 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-admin-panel',
  secondary:
    'inline-flex min-h-[40px] items-center justify-center gap-2 rounded-[8px] border border-white/15 bg-white/[0.03] px-4 text-sm font-medium text-white transition-colors hover:border-white/35 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red',
  danger:
    'inline-flex min-h-[40px] items-center justify-center gap-2 rounded-[8px] border border-rave-red/60 bg-rave-red/15 px-4 text-sm font-semibold text-white transition-colors hover:bg-rave-red/30 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red',
  ghost:
    'inline-flex min-h-[40px] items-center justify-center gap-2 rounded-[8px] px-3 text-sm font-medium text-admin-muted transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red',
};
