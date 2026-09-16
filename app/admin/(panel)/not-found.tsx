import Link from 'next/link';
import { SearchX } from 'lucide-react';
import { buttonClass } from '@/components/admin/ui/buttonClass';

export default function AdminNotFound() {
  return (
    <div className="flex flex-col items-center justify-center rounded-[12px] border border-admin-border px-6 py-16 text-center">
      <SearchX aria-hidden className="h-10 w-10 text-admin-muted" strokeWidth={1.5} />
      <h1 className="mt-3 font-heading text-2xl font-bold uppercase tracking-wide text-white">Not found</h1>
      <p className="mt-2 max-w-md text-sm text-admin-muted">This item does not exist or has been deleted.</p>
      <Link href="/admin" className={`${buttonClass.secondary} mt-6`}>
        Back to dashboard
      </Link>
    </div>
  );
}
