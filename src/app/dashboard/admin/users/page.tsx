'use client';

import { useCallback, useEffect, useState } from 'react';
import { Edit3, Loader2, Plus, ShieldCheck, UserRound, UsersRound } from 'lucide-react';
import { auth } from '../../../../../lib/firebase';
import { APPOLI_MENU_KEYS, type MenuKey } from '../../../../../lib/user-access';

type ManagedUser = {
  uid: string;
  email: string;
  name: string;
  username: string;
  role: 'admin' | 'user';
  accessibleMenus: MenuKey[];
  disabled: boolean;
  emailVerified: boolean;
  lastSignInAt: string | null;
};

const menuLabels: Record<MenuKey, string> = {
  appoli: 'Dashboard Appoli',
  'profil-petani': 'Profil Petani',
  'analisa-usaha': 'Analisa Usaha',
  'inspeksi-ics': 'Inspeksi ICS',
  'data-lahan': 'Data & Lahan',
};

const emptyForm = { email: '', password: '', name: '', username: '', role: 'user' as 'admin' | 'user', accessibleMenus: [...APPOLI_MENU_KEYS] as MenuKey[], disabled: false };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingUid, setEditingUid] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const getToken = async () => {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('Sesi admin tidak ditemukan. Silakan login kembali.');
    return token;
  };

  const loadUsers = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const token = await getToken();
      const response = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
      const result = await response.json() as { users?: ManagedUser[]; error?: string };
      if (!response.ok) throw new Error(result.error || 'Daftar user gagal dimuat.');
      setUsers(result.users || []);
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Daftar user gagal dimuat.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => { void loadUsers(); }, 0);
    return () => window.clearTimeout(loadTimer);
  }, [loadUsers]);

  const resetForm = () => { setForm(emptyForm); setEditingUid(''); };
  const editUser = (user: ManagedUser) => {
    setEditingUid(user.uid);
    setForm({ email: user.email, password: '', name: user.name, username: user.username, role: user.role, accessibleMenus: user.accessibleMenus, disabled: user.disabled });
    setMessage(''); setError('');
  };

  const toggleMenu = (menu: MenuKey) => setForm((current) => ({ ...current, accessibleMenus: current.accessibleMenus.includes(menu) ? current.accessibleMenus.filter((item) => item !== menu) : [...current.accessibleMenus, menu] }));

  const saveUser = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setMessage(''); setError('');
    try {
      const token = await getToken();
      const response = await fetch('/api/admin/users', {
        method: editingUid ? 'PATCH' : 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUid ? { ...form, uid: editingUid } : form),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'User gagal disimpan.');
      setMessage(editingUid ? 'User berhasil diperbarui.' : 'User berhasil dibuat.');
      resetForm();
      await loadUsers();
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'User gagal disimpan.'); }
    finally { setSaving(false); }
  };

  return <div className="mx-auto max-w-7xl space-y-6">
    <header className="flex items-start gap-4 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-600 p-6 text-white shadow-sm">
      <div className="rounded-xl bg-white/15 p-3"><UsersRound className="h-7 w-7" /></div>
      <div><h1 className="text-2xl font-bold">Manajemen User</h1><p className="mt-1 text-sm text-emerald-50">Kelola akun, peran, dan akses menu aplikasi APPOLI.</p></div>
    </header>

    {(error || message) && <p className={`rounded-xl p-4 text-sm font-semibold ${error ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>{error || message}</p>}

    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h2 className="text-lg font-bold text-slate-800">Daftar akun</h2><p className="text-sm text-slate-500">{users.length} akun terdaftar</p></div><button type="button" onClick={resetForm} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700"><Plus className="h-4 w-4" />User baru</button></div>
        {loading ? <div className="flex items-center justify-center p-12 text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Memuat user...</div> : <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">User</th><th className="px-5 py-3">Peran</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Aksi</th></tr></thead><tbody>{users.map((user) => <tr key={user.uid} className="border-t border-slate-100"><td className="px-5 py-4"><p className="font-semibold text-slate-800">{user.name}</p><p className="text-xs text-slate-500">{user.email} · @{user.username}</p></td><td className="px-5 py-4"><span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{user.role === 'admin' ? <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> : <UserRound className="h-3.5 w-3.5" />}{user.role}</span></td><td className="px-5 py-4"><span className={user.disabled ? 'text-rose-600' : 'text-emerald-600'}>{user.disabled ? 'Nonaktif' : 'Aktif'}</span></td><td className="px-5 py-4 text-right"><button type="button" onClick={() => editUser(user)} title="Edit user" className="rounded-lg p-2 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"><Edit3 className="h-4 w-4" /></button></td></tr>)}</tbody></table></div>}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 text-lg font-bold text-slate-800">{editingUid ? 'Edit user' : 'Tambah user'}</h2><form onSubmit={saveUser} className="space-y-4"><label className="block text-sm font-semibold text-slate-700">Nama<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required className="mt-1 w-full" /></label><label className="block text-sm font-semibold text-slate-700">Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required disabled={Boolean(editingUid)} className="mt-1 w-full disabled:cursor-not-allowed disabled:opacity-60" /></label><label className="block text-sm font-semibold text-slate-700">Username<input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required className="mt-1 w-full" /></label>{!editingUid && <label className="block text-sm font-semibold text-slate-700">Password<input type="password" minLength={6} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required className="mt-1 w-full" /></label>}<label className="block text-sm font-semibold text-slate-700">Peran<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as 'admin' | 'user' })} className="mt-1 w-full"><option value="user">User</option><option value="admin">Admin</option></select></label><fieldset><legend className="mb-2 text-sm font-semibold text-slate-700">Akses menu</legend><div className="space-y-2">{APPOLI_MENU_KEYS.map((menu) => <label key={menu} className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={form.role === 'admin' || form.accessibleMenus.includes(menu)} disabled={form.role === 'admin'} onChange={() => toggleMenu(menu)} />{menuLabels[menu]}</label>)}</div></fieldset><label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={form.disabled} onChange={(event) => setForm({ ...form, disabled: event.target.checked })} />Nonaktifkan akun</label><div className="flex gap-2"><button type="submit" disabled={saving} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{editingUid ? 'Simpan perubahan' : 'Buat user'}</button>{editingUid && <button type="button" onClick={resetForm} className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700">Batal</button>}</div></form></section>
    </div>
  </div>;
}