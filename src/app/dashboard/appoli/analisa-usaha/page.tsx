'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { FileText, Loader2 } from 'lucide-react';
import { addDoc, collection, getDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../../../../lib/firebase';
import { createAppoliPdf, downloadAppoliPdf, openAppoliPdf } from '../../../../../lib/appoli-pdf';
import { useMenuPermission } from '../../../../../lib/use-menu-permission';
import AnalisaUsahaPreview from './analisa-usaha-preview';
import SaveLoadingOverlay from '../save-loading-overlay';

interface RowData {
  waktu: string;
  volume: number | '';
  harga: number | '';
  keterangan: string;
}

type FormState = Record<string, RowData>;

type PetaniOption = {
  idPetani: string;
  namaPetani: string;
  kelompokTani: string;
  komoditasUtama: string;
  lahanUtama?: {
    luasLahan?: string;
    komoditas?: string;
  };
};

const initialRowState: RowData = {
  waktu: '',
  volume: 0,
  harga: 0,
  keterangan: '',
};

export default function AnalisaUsahaPage() {
  const canWrite = useMenuPermission('analisa-usaha', 'write');
  const [petaniOptions, setPetaniOptions] = useState<PetaniOption[]>([]);
  const [selectedPetani, setSelectedPetani] = useState('');
  const [kodePetani, setKodePetani] = useState('');
  const [kelompokTani, setKelompokTani] = useState('');
  const [luasLahan, setLuasLahan] = useState('');
  const [varietas, setVarietas] = useState('');
  const [musimTanam, setMusimTanam] = useState('2026');
  const [namaPetugas, setNamaPetugas] = useState(auth.currentUser?.displayName || auth.currentUser?.email || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [savedRecordId, setSavedRecordId] = useState('');

  const buildPayload = () => {
    const petani = petaniOptions.find((item) => item.idPetani === selectedPetani);

    return {
      petaniId: selectedPetani,
      kodePetani,
      namaPetani: petani?.namaPetani || '',
      kelompokTani,
      luasLahan,
      varietas,
      musimTanam,
      namaPetugas: namaPetugas.trim() || auth.currentUser?.displayName || auth.currentUser?.email || '',
      totalBiaya,
      subTotalA,
      subTotalB,
      totalHasilProduksi,
      labaRugiNetto,
      formData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'petani'),
      (snapshot) => {
        const data = snapshot.docs.map((document) => ({
          idPetani: document.id,
          ...(document.data() as Partial<PetaniOption>),
        })) as PetaniOption[];

        setPetaniOptions(data);
      },
      (error) => {
        console.error('Gagal memuat data petani:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const currentUserName = auth.currentUser?.displayName || auth.currentUser?.email || '';
    setNamaPetugas((prev) => prev || currentUserName);
  }, []);

  useEffect(() => {
    if (!selectedPetani) {
      setKodePetani('');
      setKelompokTani('');
      setLuasLahan('');
      setVarietas('');
      return;
    }

    const petani = petaniOptions.find((item) => item.idPetani === selectedPetani);
    if (!petani) return;

    setKodePetani(petani.idPetani || '');
    setKelompokTani(petani.kelompokTani || '');
    setLuasLahan(petani.lahanUtama?.luasLahan || '');
    setVarietas(petani.lahanUtama?.komoditas || petani.komoditasUtama || '');
  }, [selectedPetani, petaniOptions]);

  const [formData, setFormData] = useState<FormState>({
    benih: { ...initialRowState },
    pupuk_padat: { ...initialRowState },
    pupuk_cair: { ...initialRowState },
    pupuk_urea: { ...initialRowState },
    pupuk_tsp: { ...initialRowState },
    pupuk_phonska: { ...initialRowState },
    pestisida_organik: { ...initialRowState },
    pestisida_kimia: { ...initialRowState },
    lahan_persemaian: { ...initialRowState },
    sebar_benih: { ...initialRowState },
    daut_cabut: { ...initialRowState },
    olah_lahan: { ...initialRowState },
    tanam: { ...initialRowState },
    penyulaman: { ...initialRowState },
    perawatan_tanaman: { ...initialRowState },
    pemupukan: { ...initialRowState },
    penyemprotan: { ...initialRowState },
    pengairan: { ...initialRowState },
    panen_pengangkutan: { ...initialRowState },
    sewa_pajak: { ...initialRowState },
    hasil_panen: { ...initialRowState },
  });

  const handleInputChange = (
    key: string,
    field: keyof RowData,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  const getRowTotal = (key: string) => {
    const vol = Number(formData[key]?.volume) || 0;
    const hrg = Number(formData[key]?.harga) || 0;
    return vol * hrg;
  };

  const subTotalA = useMemo(() => {
    const keysA = [
      'benih',
      'pupuk_padat',
      'pupuk_cair',
      'pupuk_urea',
      'pupuk_tsp',
      'pupuk_phonska',
      'pestisida_organik',
      'pestisida_kimia',
    ];
    return keysA.reduce((sum, key) => sum + getRowTotal(key), 0);
  }, [formData]);

  const subTotalB = useMemo(() => {
    const keysB = [
      'lahan_persemaian',
      'sebar_benih',
      'daut_cabut',
      'olah_lahan',
      'tanam',
      'penyulaman',
      'perawatan_tanaman',
      'pemupukan',
      'penyemprotan',
      'pengairan',
      'panen_pengangkutan',
    ];
    return keysB.reduce((sum, key) => sum + getRowTotal(key), 0);
  }, [formData]);

  const subTotalC = useMemo(() => getRowTotal('sewa_pajak'), [formData]);
  const totalBiaya = useMemo(() => subTotalA + subTotalB + subTotalC, [subTotalA, subTotalB, subTotalC]);
  const totalHasilProduksi = useMemo(() => getRowTotal('hasil_panen'), [formData]);
  const labaRugiNetto = useMemo(() => totalHasilProduksi - totalBiaya, [totalHasilProduksi, totalBiaya]);

  const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID').format(val);

  const selectedPetaniData = useMemo(
    () => petaniOptions.find((item) => item.idPetani === selectedPetani),
    [petaniOptions, selectedPetani]
  );

  const previewRows = useMemo(() => {
    return Object.entries(formData)
      .map(([key, row]) => {
        const total = getRowTotal(key);
        const hasValue = !!(
          total ||
          row.waktu ||
          row.keterangan ||
          row.volume ||
          row.harga
        );

        if (!hasValue) return null;

        return {
          key,
          label: key
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase()),
          volume: Number(row.volume) || 0,
          harga: Number(row.harga) || 0,
          total,
          keterangan: row.keterangan,
        };
      })
      .filter(Boolean) as Array<{
        key: string;
        label: string;
        volume: number;
        harga: number;
        total: number;
        keterangan: string;
      }>;
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canWrite) {
      alert('Anda tidak memiliki izin tulis untuk Analisa Usaha.');
      return;
    }

    if (!selectedPetani) {
      alert('Pilih petani terlebih dahulu sebelum melihat preview PDF.');
      return;
    }

    setIsSaving(true);
    try {
      const reference = await addDoc(collection(db, 'analisaUsaha'), buildPayload());
      const savedSnapshot = await getDoc(reference);
      const saved = savedSnapshot.data();
      if (!saved) throw new Error('Data tidak ditemukan setelah disimpan.');
      await createAppoliPdf('analisaUsaha', reference.id);
      setSelectedPetani('');
      setKodePetani('');
      setKelompokTani('');
      setLuasLahan('');
      setVarietas('');
      setMusimTanam('2026');
      setFormData((current) => Object.fromEntries(Object.keys(current).map((key) => [key, { ...initialRowState }])) as FormState);
      setSavedRecordId('');
      setShowPreviewModal(false);
      alert('Analisa usaha berhasil disimpan.');
    } catch (error) {
      console.error('Gagal menyimpan analisa usaha:', error);
      const message = error instanceof Error ? error.message : '';
      alert(message.includes('DriveApp')
        ? 'Data sudah tersimpan, tetapi PDF belum dibuat. Silakan coba lagi.'
        : 'Data gagal disimpan. Periksa koneksi dan hak akses.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintPdf = async () => {
    if (!savedRecordId) return;
    try { await openAppoliPdf('analisaUsaha', savedRecordId); }
    catch (error) { alert(error instanceof Error ? error.message : 'PDF tidak dapat dibuat.'); }
  };
  const handleDownloadPdf = async () => {
    if (!savedRecordId) return;
    try { await downloadAppoliPdf('analisaUsaha', savedRecordId); }
    catch (error) { alert(error instanceof Error ? error.message : 'PDF tidak dapat diunduh.'); }
  };

  return (
    <>
      <SaveLoadingOverlay open={isSaving} />
      <div className="max-w-5xl mx-auto p-4 sm:p-6 bg-white rounded-xl shadow-lg border border-slate-200 text-slate-800 my-6">
      <div className="text-center border-b border-slate-300 pb-4 mb-6 print:hidden">
        <div className="flex items-center justify-center gap-3 mb-1">
          <Image src="/images/logo-appoli.png" alt="Logo APPOLI" width={56} height={56} className="h-14 w-14 rounded-full object-contain" />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">APPOLI</h1>
            <h2 className="text-sm font-semibold text-slate-700">
              Aliansi Petani Padi dan Palawija Organik Boyolali
            </h2>
            <p className="text-xs text-slate-500">
              Dk. Mencil RT.02/01 Desa Glongong, Kec. Nogosari, Kab. Boyolali
            </p>
          </div>
        </div>
      </div>

      <h2 className="text-center text-lg font-bold uppercase tracking-wide text-slate-900 mb-6 print:hidden">
        ANALISA USAHA TANI
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6 print:hidden">
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-emerald-800 uppercase mb-1">
              🌸 PILIH PETANI TERDAFTAR (Sistem Otomatis):
            </label>
            <select
              value={selectedPetani}
              onChange={(e) => setSelectedPetani(e.target.value)}
              className="w-full"
            >
              <option value="">-- Pilih petani --</option>
              {petaniOptions.map((petani) => (
                <option key={petani.idPetani} value={petani.idPetani}>
                  {petani.namaPetani} - {petani.idPetani}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="w-32 text-xs font-semibold text-slate-700">Kode Petani</span>
                <input
                  type="text"
                  value={kodePetani}
                  onChange={(e) => setKodePetani(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded px-2.5 py-1 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex items-center">
                <span className="w-32 text-xs font-semibold text-slate-700">Kelompok Tani</span>
                <input
                  type="text"
                  value={kelompokTani}
                  onChange={(e) => setKelompokTani(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded px-2.5 py-1 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <span className="w-32 text-xs font-semibold text-slate-700">Luas Lahan</span>
                <input
                  type="text"
                  value={luasLahan}
                  onChange={(e) => setLuasLahan(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded px-2.5 py-1 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex items-center">
                <span className="w-32 text-xs font-semibold text-slate-700">Varietas</span>
                <input
                  type="text"
                  value={varietas}
                  onChange={(e) => setVarietas(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded px-2.5 py-1 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex items-center">
                <span className="w-32 text-xs font-semibold text-slate-700">Musim Tanam</span>
                <input
                  type="text"
                  value={musimTanam}
                  onChange={(e) => setMusimTanam(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded px-2.5 py-1 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex items-center">
                <span className="w-32 text-xs font-semibold text-slate-700">Nama Petugas</span>
                <input
                  type="text"
                  value={namaPetugas}
                  onChange={(e) => setNamaPetugas(e.target.value)}
                  placeholder="Nama petugas pendata"
                  className="flex-1 bg-white border border-slate-300 rounded px-2.5 py-1 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-300 rounded-lg">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold text-center">
                <th className="p-2 border border-slate-700 w-10">No</th>
                <th className="p-2 border border-slate-700">Kegiatan</th>
                <th className="p-2 border border-slate-700 w-28">Waktu</th>
                <th className="p-2 border border-slate-700 w-20">Volume</th>
                <th className="p-2 border border-slate-700 w-28">Harga (Rp)</th>
                <th className="p-2 border border-slate-700 w-32">Total (Rp)</th>
                <th className="p-2 border border-slate-700 w-36">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr className="bg-slate-100 font-bold">
                <td className="p-2 border border-slate-300 text-center">A</td>
                <td colSpan={6} className="p-2 border border-slate-300">Biaya Sarana Produksi</td>
              </tr>

              {renderRow('1', 'benih', 'Benih', formData, handleInputChange, getRowTotal, formatRupiah)}

              <tr>
                <td rowSpan={2} className="p-2 border border-slate-300 text-center align-top">2</td>
                <td className="p-2 border border-slate-300">Pupuk Organik: Padat</td>
                {renderInputs('pupuk_padat', formData, handleInputChange, getRowTotal, formatRupiah)}
              </tr>
              <tr>
                <td className="p-2 border border-slate-300">Pupuk Organik: Cair</td>
                {renderInputs('pupuk_cair', formData, handleInputChange, getRowTotal, formatRupiah)}
              </tr>

              <tr>
                <td rowSpan={3} className="p-2 border border-slate-300 text-center align-top">3</td>
                <td className="p-2 border border-slate-300">Pupuk Kimia: UREA/ZA</td>
                {renderInputs('pupuk_urea', formData, handleInputChange, getRowTotal, formatRupiah)}
              </tr>
              <tr>
                <td className="p-2 border border-slate-300">Pupuk Kimia: TSP 36</td>
                {renderInputs('pupuk_tsp', formData, handleInputChange, getRowTotal, formatRupiah)}
              </tr>
              <tr>
                <td className="p-2 border border-slate-300">Pupuk Kimia: Phonska</td>
                {renderInputs('pupuk_phonska', formData, handleInputChange, getRowTotal, formatRupiah)}
              </tr>

              {renderRow('4', 'pestisida_organik', 'Pestisida Organik', formData, handleInputChange, getRowTotal, formatRupiah)}
              {renderRow('5', 'pestisida_kimia', 'Pestisida Kimia', formData, handleInputChange, getRowTotal, formatRupiah)}

              <tr className="bg-slate-50 font-bold">
                <td colSpan={5} className="p-2 border border-slate-300 text-left">
                  Total Biaya Produksi (Sub-Total A)
                </td>
                <td className="p-2 border border-slate-300 text-right bg-slate-100">
                  {formatRupiah(subTotalA)}
                </td>
                <td className="p-2 border border-slate-300"></td>
              </tr>

              <tr className="bg-slate-100 font-bold">
                <td className="p-2 border border-slate-300 text-center">B</td>
                <td colSpan={6} className="p-2 border border-slate-300">Biaya Tenaga Kerja</td>
              </tr>

              {renderRow('1', 'lahan_persemaian', 'Lahan Persemaian', formData, handleInputChange, getRowTotal, formatRupiah)}
              {renderRow('2', 'sebar_benih', 'Sebar Benih', formData, handleInputChange, getRowTotal, formatRupiah)}
              {renderRow('3', 'daut_cabut', 'Daut atau cabut benih', formData, handleInputChange, getRowTotal, formatRupiah)}
              {renderRow('4', 'olah_lahan', 'Olah lahan', formData, handleInputChange, getRowTotal, formatRupiah)}
              {renderRow('5', 'tanam', 'Tanam', formData, handleInputChange, getRowTotal, formatRupiah)}
              {renderRow('6', 'penyulaman', 'Penyulaman', formData, handleInputChange, getRowTotal, formatRupiah)}
              {renderRow('6', 'perawatan_tanaman', 'Perawatan tanaman', formData, handleInputChange, getRowTotal, formatRupiah)}
              {renderRow('7', 'pemupukan', 'Pemupukan', formData, handleInputChange, getRowTotal, formatRupiah)}
              {renderRow('8', 'penyemprotan', 'Penyemprotan', formData, handleInputChange, getRowTotal, formatRupiah)}
              {renderRow('9', 'pengairan', 'Pengairan', formData, handleInputChange, getRowTotal, formatRupiah)}
              {renderRow('10', 'panen_pengangkutan', 'Panen & pengangkutan', formData, handleInputChange, getRowTotal, formatRupiah)}

              <tr className="bg-slate-50 font-bold">
                <td colSpan={5} className="p-2 border border-slate-300 text-left">
                  Total Biaya Tenaga Kerja (Sub-Total B)
                </td>
                <td className="p-2 border border-slate-300 text-right bg-slate-100">
                  {formatRupiah(subTotalB)}
                </td>
                <td className="p-2 border border-slate-300"></td>
              </tr>

              <tr className="bg-slate-100 font-bold">
                <td className="p-2 border border-slate-300 text-center">C</td>
                <td colSpan={6} className="p-2 border border-slate-300">Lain-lain</td>
              </tr>

              {renderRow('-', 'sewa_pajak', 'Sewa / Pajak Tanah', formData, handleInputChange, getRowTotal, formatRupiah)}

              <tr className="bg-slate-100 font-bold text-rose-700">
                <td colSpan={5} className="p-2 border border-slate-300 text-left">
                  TOTAL BIAYA (A + B + C)
                </td>
                <td className="p-2 border border-slate-300 text-right bg-rose-50 text-rose-700">
                  {formatRupiah(totalBiaya)}
                </td>
                <td className="p-2 border border-slate-300"></td>
              </tr>

              <tr className="bg-slate-100 font-bold">
                <td colSpan={7} className="p-2 border border-slate-300">
                  Kalkulasi Pendapatan & Laba Rugi
                </td>
              </tr>

              {renderRow('-', 'hasil_panen', 'Total Hasil Produksi (Panen)', formData, handleInputChange, getRowTotal, formatRupiah)}

              <tr className="bg-emerald-50 font-bold text-emerald-800">
                <td colSpan={5} className="p-2 border border-slate-300 text-left uppercase">
                  LABA / RUGI NETTO
                </td>
                <td className="p-2 border border-slate-300 text-right bg-emerald-100 text-emerald-900 text-sm">
                  {formatRupiah(labaRugiNetto)}
                </td>
                <td className="p-2 border border-slate-300"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex justify-center pt-2">
          <button
            type="submit"
            disabled={isSaving || !canWrite}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold rounded-lg shadow-md transition disabled:opacity-70"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            <span>{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
          </button>
        </div>
      </form>

      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 overflow-y-auto flex items-start justify-center pt-4 pb-4 print:fixed print:inset-0 print:bg-white print:overflow-visible print:flex print:items-center print:justify-center print:pt-0 print:pb-0">
          {/* Preview PDF Content */}
          <div className="w-auto max-w-fit print:w-full print:max-w-full print:shadow-none">
            <AnalisaUsahaPreview
              namaPetani={selectedPetaniData?.namaPetani || ''}
              kodePetani={kodePetani}
              kelompokTani={kelompokTani}
              luasLahan={luasLahan}
              varietas={varietas}
              musimTanam={musimTanam}
              namaPetugas={namaPetugas}
              totalBiaya={totalBiaya}
              totalHasilProduksi={totalHasilProduksi}
              labaRugiNetto={labaRugiNetto}
              formData={formData}
            />
          </div>

          {/* Floating Action Buttons */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-3 bg-white rounded-lg shadow-2xl p-4 border border-slate-200 print:hidden">
            <button
              type="button"
              onClick={() => setShowPreviewModal(false)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
      </div>
    </>
  );
}

function renderRow(
  no: string,
  key: string,
  label: string,
  formData: Record<string, RowData>,
  handleInputChange: (key: string, field: keyof RowData, value: string | number) => void,
  getRowTotal: (key: string) => number,
  formatRupiah: (value: number) => string
) {
  return (
    <tr>
      <td className="p-2 border border-slate-300 text-center">{no}</td>
      <td className="p-2 border border-slate-300">{label}</td>
      {renderInputs(key, formData, handleInputChange, getRowTotal, formatRupiah)}
    </tr>
  );
}

function renderInputs(
  key: string,
  formData: Record<string, RowData>,
  handleInputChange: (key: string, field: keyof RowData, value: string | number) => void,
  getRowTotal: (key: string) => number,
  formatRupiah: (value: number) => string
) {
  const row = formData[key] || initialRowState;
  const total = getRowTotal(key);

  return (
    <>
      <td className="p-1 border border-slate-300">
        <input
          type="text"
          value={row.waktu}
          onChange={(e) => handleInputChange(key, 'waktu', e.target.value)}
          className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
        />
      </td>
      <td className="p-1 border border-slate-300">
        <input
          type="number"
          value={row.volume}
          onChange={(e) =>
            handleInputChange(
              key,
              'volume',
              e.target.value === '' ? '' : Number(e.target.value)
            )
          }
          className="w-full border border-slate-300 rounded px-2 py-1 text-xs text-right focus:outline-none focus:border-emerald-500"
        />
      </td>
      <td className="p-1 border border-slate-300">
        <input
          type="number"
          value={row.harga}
          onChange={(e) =>
            handleInputChange(
              key,
              'harga',
              e.target.value === '' ? '' : Number(e.target.value)
            )
          }
          className="w-full border border-slate-300 rounded px-2 py-1 text-xs text-right focus:outline-none focus:border-emerald-500"
        />
      </td>
      <td className="p-2 border border-slate-300 text-right font-medium bg-slate-50">
        {formatRupiah(total)}
      </td>
      <td className="p-1 border border-slate-300">
        <input
          type="text"
          value={row.keterangan}
          onChange={(e) => handleInputChange(key, 'keterangan', e.target.value)}
          className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
        />
      </td>
    </>
  );
}
