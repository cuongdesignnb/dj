import type { AdminApiError } from '@/lib/admin/common/types';

export default function ApiErrorNotice({ error }: { error?: AdminApiError }) {
  if (!error) return null;
  return <div role="alert" className="mb-4 rounded-lg border border-rose-400/40 bg-rose-400/10 p-4 text-sm text-rose-100">
    <p>{error.message}</p>
    {error.fieldErrors && <ul className="mt-2 list-disc space-y-1 pl-5">{Object.entries(error.fieldErrors).map(([field, message]) => <li key={field}><strong>{field}:</strong> {message}</li>)}</ul>}
    {error.requestId && <p className="mt-2 break-all text-xs">Request ID: {error.requestId}</p>}
    <p className="mt-2 text-xs">Unsaved changes are kept. Correct the fields and try again.</p>
  </div>;
}
