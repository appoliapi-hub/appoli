'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { LocateFixed, Loader2, MapPin, Plus, Save, Trash2, X } from 'lucide-react';
import { db } from '../../../../lib/firebase';
import { useMenuPermission } from '../../../../lib/use-menu-permission';

type Lahan = { statusLahan: string; alamatLahan: string; luasLahan: string; komoditas: string; latitude: string; longitude: string };
type PetaniForm = { idPetani: string; namaPetani: string; alamatPetani: string; noHp: string; kelompokTani: string; komoditasUtama: string; lahanUtama: Lahan; lahanTambahan: Lahan[] };
type InitialPetani = { idPetani: string; namaPetani?: string; alamatPetani?: string; noHp?: string; kelompokTani?: string; komoditasUtama?: string; lahanUtama?: Partial<Lahan>; lahanTambahan?: Partial<Lahan>[] };

const lahanAwal: Lahan = { statusLahan: 'Milik Sendiri', alamatLahan: '', luasLahan: '', komoditas: '', latitude: '', longitude: '' };
const buatFormAwal = (): PetaniForm => ({
  idPetani: `PTN-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
  namaPetani: '', alamatPetani: '', noHp: '', kelompokTani: '', komoditasUtama: 'Padi Organik',
  lahanUtama: { ...lahanAwal }, lahanTambahan: [],
});
const buatFormEdit = (initialData: InitialPetani): PetaniForm => ({
  ...buatFormAwal(),
  ...initialData,
  lahanUtama: { ...lahanAwal, ...(initialData.lahanUtama || {}) },
  lahanTambahan: (initialData.lahanTambahan || []).map((land) => ({ ...lahanAwal, ...land })),
});
const inputClass = 'w-full mt-1';
const getPetaniDocumentId = (idPetani: string) => encodeURIComponent(idPetani.trim());

function LahanFields({ title, land, required, onChange, onRecordLocation, recording }: { title: string; land: Lahan; required?: boolean; onChange: (field: keyof Lahan, value: string) => void; onRecordLocation: () => void; recording: boolean }) {
  return (
    <fieldset className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <legend className="px-1 text-sm font-bold text-slate-800">{title}</legend>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">Status Lahan<select value={land.statusLahan} onChange={(event) => onChange('statusLahan', event.target.value)} className={`${inputClass} mt-1`}><option>Milik Sendiri</option><option>Sewa</option><option>Bagi Hasil / Sakap</option><option>Menumpang</option></select></label>
        <label className="text-sm font-medium text-slate-700">Luas Lahan<input value={land.luasLahan} onChange={(event) => onChange('luasLahan', event.target.value)} placeholder="Contoh: 0.5 Ha" required={required} className={`${inputClass} mt-1`} /></label>
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">Komoditas<input value={land.komoditas} onChange={(event) => onChange('komoditas', event.target.value)} required={required} className={`${inputClass} mt-1`} /></label>
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">Alamat / keterangan lokasi<input value={land.alamatLahan} onChange={(event) => onChange('alamatLahan', event.target.value)} required={required} className={`${inputClass} mt-1`} /></label>
        <div className="sm:col-span-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3"><div className="flex flex-col gap-3 sm:flex-row sm:items-end"><label className="flex-1 text-sm font-medium text-slate-700">Latitude<input type="number" step="any" value={land.latitude} onChange={(event) => onChange('latitude', event.target.value)} placeholder="Contoh: -7.5234" required={required} className={`${inputClass} mt-1`} /></label><label className="flex-1 text-sm font-medium text-slate-700">Longitude<input type="number" step="any" value={land.longitude} onChange={(event) => onChange('longitude', event.target.value)} placeholder="Contoh: 110.6123" required={required} className={`${inputClass} mt-1`} /></label><button type="button" onClick={onRecordLocation} disabled={recording} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-60"><LocateFixed className="h-4 w-4" />{recording ? 'Merekam...' : 'Rekam lokasi'}</button></div><p className="mt-2 text-xs text-emerald-800">Aktifkan izin lokasi browser saat diminta.</p></div>
      </div>
    </fieldset>
  );
}

export default function PetaniFormModal({ open, onClose, initialData }: { open: boolean; onClose: () => void; initialData?: InitialPetani | null }) {
  const [form, setForm] = useState<PetaniForm>(() => initialData ? buatFormEdit(initialData) : buatFormAwal());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [recordingLocation, setRecordingLocation] = useState<number | null>(null);
  const canWrite = useMenuPermission('profil-petani', 'write');

  if (!open) return null;

  const update = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const updateLahan = (index: number | null, field: keyof Lahan, value: string) => {
    setForm((previous) => index === null
      ? { ...previous, lahanUtama: { ...previous.lahanUtama, [field]: value } }
      : { ...previous, lahanTambahan: previous.lahanTambahan.map((land, position) => position === index ? { ...land, [field]: value } : land) });
  };

  const recordLocation = (index: number | null) => {
    if (!navigator.geolocation) { setError('Browser ini tidak mendukung perekaman lokasi.'); return; }
    setRecordingLocation(index ?? -1);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateLahan(index, 'latitude', position.coords.latitude.toFixed(7));
        updateLahan(index, 'longitude', position.coords.longitude.toFixed(7));
        setRecordingLocation(null);
      },
      (locationError) => { setError(`Lokasi tidak dapat direkam: ${locationError.message}`); setRecordingLocation(null); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canWrite) { setError('Anda tidak memiliki izin tulis untuk profil petani.'); return; }
    setSaving(true);
    setError('');

    try {
      const idPetani = form.idPetani.trim();
      const reference = doc(db, 'petani', getPetaniDocumentId(idPetani));
      const existing = await getDoc(reference);
      await setDoc(reference, {
        ...form,
        lahan2: form.lahanTambahan[0] || null,
        idPetani,
        ...(!existing.exists() ? { createdAt: serverTimestamp() } : {}),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setForm(buatFormAwal());
      onClose();
    } catch (submissionError) {
      console.error('Gagal menyimpan data petani:', submissionError);
      setError('Data gagal disimpan. Periksa koneksi dan hak akses Firestore.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="form-petani-title" onMouseDown={onClose}>
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white p-5">
          <div><h2 id="form-petani-title" className="text-xl font-bold text-slate-900">{initialData ? 'Edit Profil Petani' : 'Input Profil Petani'}</h2><p className="text-sm text-slate-500">{initialData ? 'Perbarui identitas dan informasi lahan petani.' : 'Lengkapi identitas dan informasi lahan petani.'}</p></div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Tutup form"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-5 p-5">
          <fieldset className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4"><legend className="px-1 text-sm font-bold text-slate-800">Identitas Petani</legend><div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">ID Petani<input name="idPetani" value={form.idPetani} onChange={update} required className={`${inputClass} mt-1 font-mono`} /></label>
            <label className="text-sm font-medium text-slate-700">Nama Petani<input name="namaPetani" value={form.namaPetani} onChange={update} required className={`${inputClass} mt-1`} /></label>
            <label className="text-sm font-medium text-slate-700">No. HP / WhatsApp<input name="noHp" value={form.noHp} onChange={update} required className={`${inputClass} mt-1`} /></label>
            <label className="text-sm font-medium text-slate-700">Kelompok Tani<input name="kelompokTani" value={form.kelompokTani} onChange={update} required className={`${inputClass} mt-1`} /></label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">Komoditas Utama<input name="komoditasUtama" value={form.komoditasUtama} onChange={update} required className={`${inputClass} mt-1`} /></label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">Alamat Petani<textarea name="alamatPetani" value={form.alamatPetani} onChange={update} required rows={2} className={`${inputClass} mt-1`} /></label>
          </div></fieldset>
          <LahanFields title="Lahan Utama" land={form.lahanUtama} required onChange={(field, value) => updateLahan(null, field, value)} onRecordLocation={() => recordLocation(null)} recording={recordingLocation === -1} />
          <div className="space-y-4"><div className="flex items-center justify-between gap-3"><h3 className="flex items-center gap-2 text-sm font-bold text-slate-800"><MapPin className="h-4 w-4 text-emerald-600" />Lahan tambahan</h3><button type="button" onClick={() => setForm((previous) => ({ ...previous, lahanTambahan: [...previous.lahanTambahan, { ...lahanAwal }] }))} className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50"><Plus className="h-4 w-4" />Tambah lahan</button></div>{form.lahanTambahan.map((land, index) => <div key={index} className="relative"><LahanFields title={`Lahan Tambahan ${index + 1}`} land={land} onChange={(field, value) => updateLahan(index, field, value)} onRecordLocation={() => recordLocation(index)} recording={recordingLocation === index} /><button type="button" onClick={() => setForm((previous) => ({ ...previous, lahanTambahan: previous.lahanTambahan.filter((_, position) => position !== index) }))} className="absolute right-4 top-2 inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700"><Trash2 className="h-3.5 w-3.5" />Hapus</button></div>)}</div>
          {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          <div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Batal</button><button disabled={saving || !canWrite} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-70">{saving ? <Loader2 className="w-4 animate-spin" /> : <Save className="w-4" />}{saving ? 'Menyimpan...' : initialData ? 'Simpan Perubahan' : 'Simpan Data'}</button></div>
        </form>
      </div>
    </div>
  );
}
