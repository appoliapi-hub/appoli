'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { addDoc, collection, getDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { CalendarDays, Database, Loader2, MapPinned, Save, Sprout, Tractor } from 'lucide-react';
import { auth, db } from '../../../../../lib/firebase';
import { createAppoliPdf, downloadAppoliPdf, openAppoliPdf } from '../../../../../lib/appoli-pdf';
import { useMenuPermission } from '../../../../../lib/use-menu-permission';
import DataLahanPreview from './data-lahan-preview';
import SaveLoadingOverlay from '../save-loading-overlay';

type LandProfile = { statusLahan?: string; alamatLahan?: string; luasLahan?: string; komoditas?: string };
type Farmer = { idPetani: string; namaPetani?: string; alamatPetani?: string; kelompokTani?: string; lahanUtama?: LandProfile; lahan2?: LandProfile };
type LandRow = { kode: string; luas: string; utama: string; sisipan: string; kimia: string };
type Season = { tanam: string; panen: string; produksi: string; pendataan: string };
type Boundary = { jenis: string; pemilik: string; status: string };
type Livestock = { jenis: string; jumlah: string; pakan: string; kondisi: string };

const inputClass = 'w-full';
const blankLand = (index: number): LandRow => ({ kode: `Lahan ${index + 1}`, luas: '', utama: '', sisipan: '', kimia: '' });
const blankSeason = (): Season => ({ tanam: '', panen: '', produksi: '', pendataan: '' });
const blankBoundary = (): Boundary => ({ jenis: '', pemilik: '', status: '' });
const blankLivestock = (): Livestock => ({ jenis: '', jumlah: '', pakan: '', kondisi: '' });
const directions = ['Barat', 'Timur', 'Selatan', 'Utara'];
const parseArea = (value = '') => { const amount = Number(value.replace(',', '.').match(/[\d.]+/)?.[0] || 0); return /ha/i.test(value) ? amount : amount / 10000; };

export default function DataLahanPage() {
    const canWrite = useMenuPermission('data-lahan', 'write');
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [address, setAddress] = useState('');
  const [ownership, setOwnership] = useState('');
  const [lands, setLands] = useState<LandRow[]>([blankLand(0), blankLand(1), blankLand(2)]);
  const [seasons, setSeasons] = useState<Season[]>([blankSeason(), blankSeason(), blankSeason()]);
  const [boundaries, setBoundaries] = useState<Record<string, Boundary>>(() => Object.fromEntries(directions.map((direction) => [direction, blankBoundary()])));
  const [livestock, setLivestock] = useState<Livestock[]>([blankLivestock(), blankLivestock()]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [savedRecordId, setSavedRecordId] = useState('');
  const selected = farmers.find((farmer) => farmer.idPetani === selectedId);
  const totalArea = lands.reduce((sum, land) => sum + parseArea(land.luas), 0);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'petani'), (snapshot) => setFarmers(snapshot.docs.map((document) => ({ idPetani: document.id, ...(document.data() as Omit<Farmer, 'idPetani'>) }))), (error) => console.error('Gagal memuat data petani:', error));
    return unsubscribe;
  }, []);

  const selectFarmer = (id: string) => {
    setSelectedId(id);
    const farmer = farmers.find((item) => item.idPetani === id);
    setAddress(farmer?.lahanUtama?.alamatLahan || '');
    setOwnership(farmer?.lahanUtama?.statusLahan || '');
    setLands([
      { ...blankLand(0), luas: farmer?.lahanUtama?.luasLahan || '', utama: farmer?.lahanUtama?.komoditas || '' },
      { ...blankLand(1), luas: farmer?.lahan2?.luasLahan || '', utama: farmer?.lahan2?.komoditas || '' },
      blankLand(2),
    ]);
  };
  const updateList = <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>, index: number, field: keyof T, value: string) => setter((current) => current.map((item, position) => position === index ? { ...item, [field]: value } : item));
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canWrite) { setMessage('Anda tidak memiliki izin tulis untuk Data & Lahan.'); return; }
    if (!selected) { setMessage('Pilih petani terlebih dahulu.'); return; }
    void saveData();
  };
  const saveData = async () => {
    if (!selected) return;
    setSaving(true); setMessage('');
    try {
      const reference = await addDoc(collection(db, 'dataLahan'), { idPetani: selected.idPetani, namaPetani: selected.namaPetani || '', namaPetugas: auth.currentUser?.displayName || auth.currentUser?.email || '', alamatPetani: selected.alamatPetani || '', kelompokTani: selected.kelompokTani || '', alamatLahan: address, statusMilik: ownership, lahan: lands, totalLuasHa: totalArea, kalenderMasaTanam: seasons, batasLahan: boundaries, ternak: livestock, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      const savedSnapshot = await getDoc(reference);
      const saved = savedSnapshot.data();
      if (!saved) throw new Error('Data tidak ditemukan setelah disimpan.');
      await createAppoliPdf('dataLahan', reference.id);
      setSelectedId(''); setAddress(''); setOwnership(''); setLands([blankLand(0), blankLand(1), blankLand(2)]); setSeasons([blankSeason(), blankSeason(), blankSeason()]); setBoundaries(Object.fromEntries(directions.map((direction) => [direction, blankBoundary()]))); setLivestock([blankLivestock(), blankLivestock()]);
      setSavedRecordId(''); setShowPreview(false);
      setMessage('Data berhasil disimpan.');
    } catch (error) { console.error('Gagal menyimpan data lahan:', error); setMessage(error instanceof Error && error.message.includes('DriveApp') ? 'Data sudah tersimpan, tetapi PDF belum dibuat. Silakan coba lagi.' : 'Data gagal disimpan. Periksa koneksi dan hak akses.'); } finally { setSaving(false); }
  };
  const printPdf = async () => { if (!savedRecordId) return; try { await openAppoliPdf('dataLahan', savedRecordId); } catch (error) { setMessage(error instanceof Error ? error.message : 'PDF tidak dapat dibuat.'); } };
  const downloadPdf = async () => { if (!savedRecordId) return; try { await downloadAppoliPdf('dataLahan', savedRecordId); } catch (error) { setMessage(error instanceof Error ? error.message : 'PDF tidak dapat diunduh.'); } };
  return <><SaveLoadingOverlay open={saving} /><div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
    <header className="flex items-start gap-4 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-500 p-6 text-white shadow-sm print:hidden"><div className="rounded-xl bg-white p-2"><Image src="/images/logo-appoli.png" alt="Logo APPOLI" width={56} height={56} className="h-14 w-14 object-contain" /></div><div><h1 className="text-2xl font-bold">Form Data & Lahan</h1><p className="mt-1 text-sm text-sky-50">Pendataan kondisi aktual petani, lahan, masa tanam, batas wilayah, dan ternak.</p></div></header>
    <form onSubmit={submit} className="space-y-6 print:hidden">
      <Section title="Profil petani dan lahan" icon={<Database className="h-5 w-5 text-sky-600" />}><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700 sm:col-span-2">Pilih petani<select value={selectedId} onChange={(event) => selectFarmer(event.target.value)} required className={inputClass}><option value="">Pilih petani terdaftar</option>{farmers.map((farmer) => <option key={farmer.idPetani} value={farmer.idPetani}>{farmer.namaPetani || farmer.idPetani} ({farmer.idPetani})</option>)}</select></label><Info label="Nama petani" value={selected?.namaPetani || '-'} /><Info label="Kode petani" value={selected?.idPetani || '-'} /><Info label="Alamat petani" value={selected?.alamatPetani || '-'} /><Info label="Kelompok tani" value={selected?.kelompokTani || '-'} /><label className="text-sm font-semibold text-slate-700">Alamat lahan<input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Lokasi spesifik lahan" className={inputClass} /></label><label className="text-sm font-semibold text-slate-700">Status kepemilikan lahan<input value={ownership} onChange={(event) => setOwnership(event.target.value)} placeholder="Milik sendiri / sewa / bagi hasil" className={inputClass} /></label></div></Section>
      <Section title="Lahan pertanian organik" icon={<Sprout className="h-5 w-5 text-emerald-600" />}><div className="overflow-x-auto"><table className="w-full min-w-[800px] border-collapse text-sm"><thead><tr className="bg-slate-800 text-white"><th className="p-3 text-left">Kode lahan</th><th className="p-3">Luas (Ha)</th><th className="p-3 text-left">Tanaman utama</th><th className="p-3 text-left">Tanaman sisipan</th><th className="p-3 text-left">Pemakaian terakhir kimia</th></tr></thead><tbody>{lands.map((land, index) => <tr key={index} className="border-b border-slate-200">{(['kode', 'luas', 'utama', 'sisipan', 'kimia'] as const).map((field) => <td key={field} className="p-2"><input type={field === 'luas' ? 'text' : 'text'} value={land[field]} onChange={(event) => updateList(setLands, index, field, event.target.value)} className="w-full rounded border border-slate-300 px-2 py-1.5" /></td>)}</tr>)}<tr className="bg-sky-50 font-bold"><td className="p-3 text-right">Total luas</td><td className="p-3 text-sky-700">{totalArea.toLocaleString('id-ID', { maximumFractionDigits: 4 })} Ha</td><td colSpan={3} /></tr></tbody></table></div></Section>
      <Section title="Kalender masa tanam dan estimasi produksi" icon={<CalendarDays className="h-5 w-5 text-amber-600" />}><div className="overflow-x-auto"><table className="w-full min-w-[760px] border-collapse text-sm"><thead><tr className="bg-slate-800 text-white"><th className="p-3">Masa tanam</th><th className="p-3 text-left">Tanggal tanam</th><th className="p-3 text-left">Tanggal panen</th><th className="p-3 text-left">Produksi (Kg)</th><th className="p-3 text-left">Tanggal pendataan</th></tr></thead><tbody>{seasons.map((season, index) => <tr key={index} className="border-b border-slate-200"><td className="p-3 text-center font-bold">MT {index + 1}</td>{(['tanam', 'panen', 'produksi', 'pendataan'] as const).map((field) => <td key={field} className="p-2"><input type={field === 'produksi' ? 'number' : 'text'} value={season[field]} onChange={(event) => updateList(setSeasons, index, field, event.target.value)} placeholder={field === 'pendataan' ? 'tgl/bln/thn' : ''} className="w-full rounded border border-slate-300 px-2 py-1.5" /></td>)}</tr>)}</tbody></table></div></Section>
      <Section title="Batas koordinat geografis lahan" icon={<MapPinned className="h-5 w-5 text-blue-600" />}><div className="overflow-x-auto"><table className="w-full min-w-[760px] border-collapse text-sm"><thead><tr className="bg-slate-800 text-white"><th className="p-3 text-left">Informasi batas</th>{directions.map((direction) => <th key={direction} className="p-3">{direction}</th>)}</tr></thead><tbody>{(['jenis', 'pemilik', 'status'] as const).map((field) => <tr key={field} className="border-b border-slate-200"><td className="bg-slate-50 p-3 font-bold">{field === 'jenis' ? 'Jenis batas' : field === 'pemilik' ? 'Pemilik' : 'Status lahan'}</td>{directions.map((direction) => <td key={direction} className="p-2"><input value={boundaries[direction][field]} onChange={(event) => setBoundaries((current) => ({ ...current, [direction]: { ...current[direction], [field]: event.target.value } }))} className="w-full rounded border border-slate-300 px-2 py-1.5" /></td>)}</tr>)}</tbody></table></div></Section>
      <Section title="Ternak pendukung pupuk alami" icon={<Tractor className="h-5 w-5 text-orange-600" />}><div className="overflow-x-auto"><table className="w-full min-w-[720px] border-collapse text-sm"><thead><tr className="bg-slate-800 text-white"><th className="p-3 text-left">Jenis ternak</th><th className="p-3">Jumlah</th><th className="p-3 text-left">Pakan dan pengobatan</th><th className="p-3 text-left">Kondisi ternak</th></tr></thead><tbody>{livestock.map((animal, index) => <tr key={index} className="border-b border-slate-200">{(['jenis', 'jumlah', 'pakan', 'kondisi'] as const).map((field) => <td key={field} className="p-2"><input type={field === 'jumlah' ? 'number' : 'text'} value={animal[field]} onChange={(event) => updateList(setLivestock, index, field, event.target.value)} className="w-full rounded border border-slate-300 px-2 py-1.5" /></td>)}</tr>)}</tbody></table></div></Section>
      {message && <p className={`rounded-lg p-4 text-sm font-semibold ${message.includes('berhasil') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{message}</p>}<div className="flex justify-end"><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? 'Menyimpan...' : 'Simpan'}</button></div>
    </form>
    {showPreview && selected && <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 p-4 print:static print:overflow-visible print:bg-white print:p-0"><div className="mx-auto w-fit max-w-full"><DataLahanPreview nama={selected.namaPetani || ''} kode={selected.idPetani} alamat={selected.alamatPetani || ''} kelompok={selected.kelompokTani || ''} alamatLahan={address} statusMilik={ownership} lands={lands} totalArea={totalArea} seasons={seasons} boundaries={boundaries} livestock={livestock} /><div className="fixed bottom-5 left-1/2 flex -translate-x-1/2 gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-xl print:hidden"><button type="button" onClick={() => setShowPreview(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Tutup</button></div></div></div>}
  </div></>;
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) { return <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">{icon}{title}</h2>{children}</section>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-sm font-bold text-slate-800">{value}</p></div>; }
