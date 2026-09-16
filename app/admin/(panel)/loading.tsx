import { LoadingSkeleton } from '@/components/admin/ui/States';

export default function AdminLoading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <LoadingSkeleton />
    </div>
  );
}
