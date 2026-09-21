'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Plus, Menu as MenuIcon } from 'lucide-react';
import { useToast } from '@/components/admin/ui/Toast';

export default function NavigationHub() {
  const toast = useToast();
  const [menus, setMenus] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { fetch('/api/v1/admin/navigation/menus').then((response) => response.json()).then((payload) => setMenus(payload?.data ?? [])).catch(() => toast('error', 'Could not load menus.')); }, [toast]);
  const create = async () => { if (!name.trim() || !key.trim()) return; setBusy(true); const session = await fetch('/api/v1/auth/session').then((response) => response.json()); const response = await fetch('/api/v1/admin/navigation/menus', { method: 'POST', headers: { 'content-type': 'application/json', 'x-csrf-token': session?.data?.csrfToken ?? '' }, body: JSON.stringify({ name, key }) }); const payload = await response.json().catch(() => null); setBusy(false); if (!response.ok) toast('error', payload?.message ?? 'Could not create menu.'); else { setMenus((current) => [...current, payload.data]); setName(''); setKey(''); toast('success', 'Menu created.'); } };
  return <section className="space-y-5"><div><h1 className="font-heading text-2xl font-bold uppercase text-white">Menu Builder</h1><p className="mt-1 text-sm text-admin-muted">Menus are versioned database records. Edit, preview, then publish to a location.</p></div><div className="grid grid-cols-1 gap-3 rounded-[12px] border border-admin-border bg-admin-panel/80 p-4 md:grid-cols-[1fr_1fr_auto]"><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Menu name" className="rounded border border-admin-border bg-admin-bg px-3 py-2 text-sm text-white" /><input value={key} onChange={(event) => setKey(event.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-'))} placeholder="stable-key" className="rounded border border-admin-border bg-admin-bg px-3 py-2 text-sm text-white" /><button type="button" disabled={busy} onClick={() => void create()} className="inline-flex items-center justify-center gap-2 rounded bg-rave-red px-4 py-2 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> New menu</button></div><ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">{menus.map((menu) => <li key={menu.id} className="rounded-[12px] border border-admin-border bg-admin-panel/80 p-5"><MenuIcon className="h-5 w-5 text-rave-red" /><h2 className="mt-3 font-heading text-lg uppercase text-white">{menu.name}</h2><p className="mt-1 text-xs text-admin-muted">{menu.key} · {menu.status} · {menu.items?.length ?? 0} items</p><Link href={`/admin/navigation/menus/${menu.id}`} className="mt-4 inline-flex rounded border border-admin-border px-3 py-2 text-sm text-white hover:border-rave-red/60">Open builder</Link></li>)}</ul></section>;
}
