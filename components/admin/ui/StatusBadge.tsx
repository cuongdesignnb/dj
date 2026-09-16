// Status pill. The label is always written out, so status never depends on
// colour alone.

type Tone = 'green' | 'amber' | 'blue' | 'purple' | 'red' | 'gray';

const TONE_BY_VALUE: Record<string, Tone> = {
  published: 'green',
  active: 'green',
  paid: 'green',
  connected: 'green',
  complete: 'green',
  completed: 'green',
  available: 'green',
  true: 'green',
  draft: 'amber',
  pending: 'amber',
  invited: 'amber',
  review: 'amber',
  partial: 'amber',
  configured: 'amber',
  unfulfilled: 'amber',
  preview: 'blue',
  processing: 'blue',
  image: 'blue',
  logo: 'purple',
  shipped: 'purple',
  'video-thumbnail': 'purple',
  document: 'gray',
  unknown: 'gray',
  'not-connected': 'gray',
  'not-configured': 'gray',
  archived: 'gray',
  false: 'gray',
  disabled: 'red',
  cancelled: 'red',
  failed: 'red',
  error: 'red',
  missing: 'red',
  'sold-out': 'red',
};

const LABEL_OVERRIDES: Record<string, string> = {
  'not-connected': 'Not Connected',
  'not-configured': 'Not configured',
  'sold-out': 'Sold out',
  'video-thumbnail': 'Video thumbnail',
  unknown: 'Unknown',
};

const TONE_CLASS: Record<Tone, string> = {
  green: 'border-admin-success/35 bg-admin-success/10 text-admin-success',
  amber: 'border-admin-warning/35 bg-admin-warning/10 text-admin-warning',
  blue: 'border-rave-blue/40 bg-rave-blue/10 text-[#7FA6FF]',
  purple: 'border-rave-purple/40 bg-rave-purple/10 text-[#B98BFF]',
  red: 'border-rave-red/40 bg-rave-red/10 text-[#FF6B82]',
  gray: 'border-white/15 bg-white/[0.04] text-admin-muted',
};

export function statusLabel(value: string): string {
  if (LABEL_OVERRIDES[value]) return LABEL_OVERRIDES[value];
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ');
}

export default function StatusBadge({ value, label }: { value: string; label?: string }) {
  const tone = TONE_BY_VALUE[value] ?? 'gray';
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONE_CLASS[tone]}`}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
      {label ?? statusLabel(value)}
    </span>
  );
}
