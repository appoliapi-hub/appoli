'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { addDoc, collection, getDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Loader2, Save, ShieldCheck } from 'lucide-react';
import { db } from '../../../../../lib/firebase';
import { createAppoliPdf, downloadAppoliPdf, openAppoliPdf } from '../../../../../lib/appoli-pdf';
import { useMenuPermission } from '../../../../../lib/use-menu-permission';
import InspeksiIcsPreview from './inspeksi-ics-preview';
import SaveLoadingOverlay from '../save-loading-overlay';

type PetaniLahan = { statusLahan?: string; alamatLahan?: string; luasLahan?: string; komoditas?: string };
type Petani = { idPetani: string; namaPetani?: string; kelompokTani?: string; alamatPetani?: string; lahanUtama?: PetaniLahan; lahan2?: PetaniLahan };
type LandRow = { luas: string; utama: string; selingan: string; kimia: string };
type CheckValue = { kondisi: 'Diterima' | 'Tidak'; dasar: string };
type CheckGroup = { title: string; items: [string, string][] };

const inputClass = 'w-full';
const sections: CheckGroup[] = [
  { title: '1. Kriteria Produksi Ternak', items: [['ternak_kondisi', 'Kondisi hewan ternak'], ['ternak_makan', 'Makanan yang diberikan']] },
  { title: '2. Status Lahan', items: [['lahan_konversi', 'Apakah lahan sudah melewati masa konversi'], ['lahan_pisah', 'Lahan organik terpisah dari lahan konvensional'], ['lahan_konservasi', 'Konservasi sistem air, tanah, hutan, dan lainnya'], ['lahan_latih', 'Petani terlatih dalam sistem pertanian organik'], ['lahan_filter', 'Zona pembatas dan filter untuk mencegah kontaminasi']] },
  { title: '3. Manajemen Benih', items: [['benih_sumber', 'Dari mana sumber benih'], ['benih_gmo', 'Apakah menanam benih rekayasa genetika'], ['benih_kelola', 'Persiapan dan pengelolaan benih']] },
  { title: '4. Pemupukan Organik', items: [['puk_kimia', 'Penggunaan pupuk kimia saat tanaman kritis'], ['puk_herbi', 'Penggunaan herbisida untuk mengontrol rumput liar']] },
  { title: '5. Manajemen Hama', items: [['hama_sakit', 'Manajemen penyakit'], ['hama_pest', 'Penggunaan pestisida kimia saat hama sulit dikendalikan']] },
  { title: '6. Manajemen Pola Tanam', items: [['pola_tanam', 'Kesesuaian rotasi dan diversifikasi pola tanam'], ['pola_organik', 'Setiap rotasi menerapkan budidaya organik']] },
];
const postHarvest: [string, string][] = [['pasca_olah', 'Pengolahan produk'], ['pasca_kemasan', 'Kondisi sak kemasan produk'], ['pasca_simpan', 'Penyimpanan dan pengiriman']];
const riskItems: [string, string][] = [['sekitar', 'Risiko kontaminasi dari lingkungan sekitar'], ['aktivitas', 'Risiko dari aktivitas pertanian sekitar'], ['industri', 'Risiko dari industri atau sumber pencemar']];
const checkKeys = [...sections.flatMap((group) => group.items.map(([key]) => key)), ...postHarvest.map(([key]) => key)];
const blankLand = (): LandRow => ({ luas: '', utama: '', selingan: '', kimia: '' });
const blankChecks = (): Record<string, CheckValue> => Object.fromEntries(checkKeys.map((key) => [key, { kondisi: 'Diterima', dasar: '' }])) as Record<string, CheckValue>;

export default function InspeksiIcsPage() {
  const canWrite = useMenuPermission('inspeksi-ics', 'write');
  const [petani, setPetani] = useState<Petani[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [inspektur, setInspektur] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [jam, setJam] = useState('');
  const [statusBidang, setStatusBidang] = useState('Sama');
  const [kelolaOrganik, setKelolaOrganik] = useState('Ya');
  const [lands, setLands] = useState<LandRow[]>([blankLand(), blankLand(), blankLand()]);
  const [checks, setChecks] = useState<Record<string, CheckValue>>(blankChecks);
  const [risks, setRisks] = useState<Record<string, { level: string; dasar: string }>>({ sekitar: { level: 'Rendah', dasar: '' }, aktivitas: { level: 'Rendah', dasar: '' }, industri: { level: 'Rendah', dasar: '' } });
  const [recommendation, setRecommendation] = useState({ kondisiSebelum: 'Sesuai', tahunIni: 'Sesuai', syaratPenjelasan: '' });
  const [decision, setDecision] = useState('Disetujui');
  const [sanksi, setSanksi] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [savedRecordId, setSavedRecordId] = useState('');
  const selected = petani.find((item) => item.idPetani === selectedId);
  const totalLand = lands.reduce((sum, land) => sum + (Number(land.luas) || 0), 0);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'petani'),
      (snapshot) => setPetani(snapshot.docs.map((document) => ({
        idPetani: document.id,
        ...(document.data() as Omit<Petani, 'idPetani'>),
      }))),
      (error) => console.error('Gagal memuat data petani:', error),
    );
    return unsubscribe;
  }, []);

  const updateLand = (index: number, field: keyof LandRow, value: string) => setLands((current) => current.map((land, position) => position === index ? { ...land, [field]: value } : land));
  const selectPetani = (id: string) => {
    setSelectedId(id);
    const farmer = petani.find((item) => item.idPetani === id);
    if (!farmer) {
      setLands([blankLand(), blankLand(), blankLand()]);
      return;
    }
    setLands([
      {
        luas: farmer.lahanUtama?.luasLahan || '',
        utama: farmer.lahanUtama?.komoditas || '',
        selingan: '',
        kimia: '',
      },
      {
        luas: farmer.lahan2?.luasLahan || '',
        utama: farmer.lahan2?.komoditas || '',
        selingan: '',
        kimia: '',
      },
      blankLand(),
    ]);
  };
  const updateCheck = (key: string, field: keyof CheckValue, value: string) => setChecks((current) => ({ ...current, [key]: { ...current[key], [field]: value } as CheckValue }));
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canWrite) { setMessage('Anda tidak memiliki izin tulis untuk Form Inspeksi ICS.'); return; }
    if (!selected) { setMessage('Pilih petani terlebih dahulu.'); return; }
    void saveData();
  };
  const saveData = async () => {
    if (!selected) return;
    setSaving(true); setMessage('');
    try {
      const reference = await addDoc(collection(db, 'inspeksiICS'), { idPetani: selected.idPetani, namaPetani: selected.namaPetani || '', alamatPetani: selected.alamatPetani || '', kelompokTani: selected.kelompokTani || '', inspektur: inspektur.trim() || 'Petugas Lapang ICS', tanggal, jam, statusBidang, kelolaOrganik, totalLahanM2: totalLand, lahan: lands, kriteria: checks, manajemenRisiko: risks, rekomendasi: recommendation, keputusan: decision, sanksiTambahan: sanksi, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      const savedSnapshot = await getDoc(reference);
      const saved = savedSnapshot.data();
      if (!saved) throw new Error('Data tidak ditemukan setelah disimpan.');
      await createAppoliPdf('inspeksiICS', reference.id);
      setSelectedId(''); setInspektur(''); setTanggal(new Date().toISOString().slice(0, 10)); setJam(''); setStatusBidang('Sama'); setKelolaOrganik('Ya'); setLands([blankLand(), blankLand(), blankLand()]); setChecks(blankChecks()); setRisks({ sekitar: { level: 'Rendah', dasar: '' }, aktivitas: { level: 'Rendah', dasar: '' }, industri: { level: 'Rendah', dasar: '' } }); setRecommendation({ kondisiSebelum: 'Sesuai', tahunIni: 'Sesuai', syaratPenjelasan: '' }); setDecision('Disetujui'); setSanksi('');
      setSavedRecordId(''); setShowPreview(false);
      setMessage('Hasil inspeksi berhasil disimpan.');
    } catch (error) { console.error('Gagal menyimpan inspeksi ICS:', error); setMessage(error instanceof Error && error.message.includes('DriveApp') ? 'Data sudah tersimpan, tetapi PDF belum dibuat. Silakan coba lagi.' : 'Data gagal disimpan. Periksa koneksi dan hak akses.'); } finally { setSaving(false); }
  };
  const printPdf = async () => { if (!savedRecordId) return; try { await openAppoliPdf('inspeksiICS', savedRecordId); } catch (error) { setMessage(error instanceof Error ? error.message : 'PDF tidak dapat dibuat.'); } };
  const downloadPdf = async () => { if (!savedRecordId) return; try { await downloadAppoliPdf('inspeksiICS', savedRecordId); } catch (error) { setMessage(error instanceof Error ? error.message : 'PDF tidak dapat diunduh.'); } };
  return <><SaveLoadingOverlay open={saving} /><div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
    <header className="flex items-start gap-4 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-500 p-6 text-white shadow-sm print:hidden"><div className="rounded-xl bg-white p-2"><Image src="/images/logo-appoli.png" alt="Logo APPOLI" width={56} height={56} className="h-14 w-14 object-contain" /></div><div><h1 className="text-2xl font-bold">Form Inspeksi ICS</h1><p className="mt-1 text-sm text-orange-50">Formulir inspeksi internal kepatuhan pertanian organik APPOLI.</p></div></header>
    <form onSubmit={submit} className="space-y-6 print:hidden">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800"><ShieldCheck className="h-5 w-5 text-amber-600" />Identitas inspeksi</h2><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700 sm:col-span-2">Pilih petani<select value={selectedId} onChange={(event) => selectPetani(event.target.value)} required className={inputClass}><option value="">Pilih petani terdaftar</option>{petani.map((item) => <option key={item.idPetani} value={item.idPetani}>{item.namaPetani || item.idPetani} ({item.idPetani})</option>)}</select></label><Info label="Nama petani" value={selected?.namaPetani || '-'} /><Info label="Kode petani" value={selected?.idPetani || '-'} /><Info label="Alamat / kelompok" value={[selected?.alamatPetani, selected?.kelompokTani].filter(Boolean).join(' / ') || '-'} /><label className="text-sm font-semibold text-slate-700">Inspektur internal<input value={inspektur} onChange={(event) => setInspektur(event.target.value)} placeholder="Nama petugas" className={inputClass} /></label><label className="text-sm font-semibold text-slate-700">Tanggal inspeksi<input type="date" value={tanggal} onChange={(event) => setTanggal(event.target.value)} required className={inputClass} /></label><label className="text-sm font-semibold text-slate-700">Jam inspeksi<input type="time" value={jam} onChange={(event) => setJam(event.target.value)} className={inputClass} /></label></div></section>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 text-lg font-bold text-slate-800">Status bidang dan lahan</h2><RadioGroup label="Status bidang lahan dibanding tahun lalu" value={statusBidang} options={['Baru', 'Sama', 'Penambahan', 'Pengurangan']} onChange={setStatusBidang} /><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[700px] border-collapse text-sm"><thead><tr className="bg-slate-800 text-left text-white"><th className="p-3">Bidang</th><th className="p-3">Luas (m²)</th><th className="p-3">Tanaman utama</th><th className="p-3">Tanaman selingan</th><th className="p-3">Terakhir kimia terlarang</th></tr></thead><tbody>{lands.map((land, index) => <tr key={index} className="border-b border-slate-200"><td className="p-3 font-bold">Lahan {index + 1}</td>{(['luas', 'utama', 'selingan', 'kimia'] as const).map((field) => <td key={field} className="p-2"><input type={field === 'luas' ? 'number' : 'text'} value={land[field]} onChange={(event) => updateLand(index, field, event.target.value)} className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" /></td>)}</tr>)}<tr className="bg-amber-50 font-bold"><td className="p-3 text-right">Total lahan</td><td className="p-3 text-amber-700">{totalLand.toLocaleString('id-ID')} m²</td><td colSpan={3} /></tr></tbody></table></div><div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4"><RadioGroup label="Seluruh usahatani di lahan organik dikelola secara organik?" value={kelolaOrganik} options={['Ya', 'Tidak']} onChange={setKelolaOrganik} /></div></section>
      <CheckSection title="Aspek pemeriksaan kepatuhan lapangan" groups={sections} checks={checks} onChange={updateCheck} /><CheckSection title="Tindakan pasca panen dan pengolahan" groups={[{ title: '', items: postHarvest }]} checks={checks} onChange={updateCheck} />
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 text-lg font-bold text-slate-800">Manajemen risiko kontaminasi</h2>{riskItems.map(([key, label]) => <div key={key} className="mb-4 rounded-lg border border-slate-200 p-4 last:mb-0"><RadioGroup label={label} value={risks[key].level} options={['Rendah', 'Sedang', 'Tinggi']} onChange={(value) => setRisks((current) => ({ ...current, [key]: { ...current[key], level: value } }))} /><input value={risks[key].dasar} onChange={(event) => setRisks((current) => ({ ...current, [key]: { ...current[key], dasar: event.target.value } }))} placeholder="Dasar penilaian / kondisi riil" className={inputClass} /></div>)}</section>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 text-lg font-bold text-slate-800">Rekomendasi dan keputusan ICS</h2><div className="grid gap-4 sm:grid-cols-2"><RadioGroup label="Kondisi sebelum inspeksi" value={recommendation.kondisiSebelum} options={['Sesuai', 'Perlu perbaikan']} onChange={(value) => setRecommendation((current) => ({ ...current, kondisiSebelum: value }))} /><RadioGroup label="Rekomendasi tahun ini" value={recommendation.tahunIni} options={['Sesuai', 'Perlu perbaikan']} onChange={(value) => setRecommendation((current) => ({ ...current, tahunIni: value }))} /></div><label className="mt-4 block text-sm font-semibold text-slate-700">Persyaratan tambahan atau catatan<textarea value={recommendation.syaratPenjelasan} onChange={(event) => setRecommendation((current) => ({ ...current, syaratPenjelasan: event.target.value }))} rows={3} className={inputClass} /></label><div className="mt-4 grid gap-4 sm:grid-cols-2"><RadioGroup label="Keputusan ICS" value={decision} options={['Disetujui', 'Sanksi Syarat', 'Ditolak']} onChange={setDecision} /><label className="text-sm font-semibold text-slate-700">Persyaratan tambahan / sanksi<textarea value={sanksi} onChange={(event) => setSanksi(event.target.value)} rows={2} className={inputClass} /></label></div></section>
      {message && <p className={`rounded-lg p-4 text-sm font-semibold ${message.includes('berhasil') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{message}</p>}<div className="flex justify-end"><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-amber-700 disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? 'Menyimpan...' : 'Simpan'}</button></div>
    </form>
    {showPreview && selected && <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 p-4 print:static print:overflow-visible print:bg-white print:p-0"><div className="mx-auto w-fit max-w-full"><InspeksiIcsPreview nama={selected.namaPetani || ''} kode={selected.idPetani} alamat={[selected.alamatPetani, selected.kelompokTani].filter(Boolean).join(' / ')} inspektur={inspektur} tanggal={tanggal} jam={jam} statusBidang={statusBidang} kelolaOrganik={kelolaOrganik} lands={lands} checks={checks} sections={sections} postHarvest={postHarvest} risks={risks} riskItems={riskItems} recommendation={recommendation} decision={decision} sanksi={sanksi} /><div className="fixed bottom-5 left-1/2 flex -translate-x-1/2 gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-xl print:hidden"><button type="button" onClick={() => setShowPreview(false)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Tutup</button></div></div></div>}
  </div></>;
}

function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-sm font-bold text-slate-800">{value}</p></div>; }
function RadioGroup({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) { return <fieldset><legend className="mb-2 text-sm font-semibold text-slate-700">{label}</legend><div className="flex flex-wrap gap-3">{options.map((option) => <label key={option} className="inline-flex items-center gap-2 text-sm text-slate-600"><input type="radio" checked={value === option} onChange={() => onChange(option)} />{option}</label>)}</div></fieldset>; }
function CheckSection({ title, groups, checks, onChange }: { title: string; groups: CheckGroup[]; checks: Record<string, CheckValue>; onChange: (key: string, field: keyof CheckValue, value: string) => void }) { return <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 text-lg font-bold text-slate-800">{title}</h2><div className="overflow-x-auto"><table className="w-full min-w-[760px] border-collapse text-sm"><thead><tr className="bg-slate-800 text-white"><th className="p-3 text-left">Kriteria / aktivitas</th><th className="p-3">Diterima</th><th className="p-3">Tidak</th><th className="p-3 text-left">Dasar penerimaan / kondisi</th></tr></thead><tbody>{groups.flatMap((group) => [group.title && <tr key={`${group.title}-heading`} className="bg-slate-100"><td colSpan={4} className="p-3 font-bold text-slate-700">{group.title}</td></tr>, ...group.items.map(([key, label]) => <tr key={key} className="border-b border-slate-200"><td className="p-3">{label}</td><td className="p-3 text-center"><input type="radio" checked={checks[key].kondisi === 'Diterima'} onChange={() => onChange(key, 'kondisi', 'Diterima')} /></td><td className="p-3 text-center"><input type="radio" checked={checks[key].kondisi === 'Tidak'} onChange={() => onChange(key, 'kondisi', 'Tidak')} /></td><td className="p-2"><input value={checks[key].dasar} onChange={(event) => onChange(key, 'dasar', event.target.value)} className="w-full rounded border border-slate-300 px-2 py-1.5" /></td></tr>)]).filter(Boolean)}</tbody></table></div></section>; }
