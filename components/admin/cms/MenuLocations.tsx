'use client';

import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { useToast } from '@/components/admin/ui/Toast';

export default function MenuLocations() {
  const toast = useToast();
  const [locations, setLocations] = useState<any[]>([]);
  const [menus, setMenus] = useState<any[]>([]);
  const [csrf, setCsrf] = useState('');
  useEffect(() => { Promise.all([fetch('/api/v1/admin/navigation/locations').then((response) => response.json()), fetch('/api/v1/admin/navigation/menus').then((response) => response.json()), fetch('/api/v1/auth/session').then((response) => response.json())]).then(([locationPayload, menuPayload, session]) => { setLocations(locationPayload?.data ?? []); setMenus(menuPayload?.data ?? []); setCsrf(session?.data?.csrfToken ?? ''); }).catch(() => toast('error', 'Could not load locations.')); }, [toast]);
  const save = async (locationKey: string, menuId: string) => { const response = await fetch('/api/v1/admin/navigation/locations', { method: 'PATCH', headers: { 'content-type': 'application/json', 'x-csrf-token': csrf }, body: JSON.stringify({ locationKey, menuId: menuId || null }) }); if (!response.ok) toast('error', 'Could not assign location.'); else toast('success', 'Location assigned.'); };
  return <section className="space-y-5"><div><h1 className="font-heading text-2xl font-bold uppercase text-white">Menu Locations</h1><p className="mt-1 text-sm text-admin-muted">Assign published menus to Header, Mobile and Footer slots.</p></div><div className="grid grid-cols-1 gap-3 md:grid-cols-2">{locations.map((location) => <label key={location.locationKey} className="rounded-[12px] border border-admin-border bg-admin-panel/80 p-4"><span className="mb-2 block text-sm font-semibold text-white">{location.locationKey}</span><div className="flex gap-2"><select defaultValue={location.menuId ?? ''} onChange={(event) => void save(location.locationKey, event.target.value)} className="flex-1 rounded border border-admin-border bg-admin-bg px-3 py-2 text-sm text-white"><option value="">Unassigned</option>{menus.map((menu) => <option key={menu.id} value={menu.id}>{menu.name} ({menu.status})</option>)}</select><Save className="mt-2 h-4 w-4 text-admin-muted" /></div></label>)}</div></section>;
}
