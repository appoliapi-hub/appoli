'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { Activity, BarChart3, CheckCircle2, ClipboardCheck, Download, Edit3, Eye, Leaf, Loader2, Map as MapIcon, MapPinned, Plus, Search, Sprout, Tractor, Trash2, Users, XCircle } from 'lucide-react';
import { auth, db } from '../../../../lib/firebase';
import { downloadAppoliPdf, fetchAppoliPdf, openAppoliPdf, type AppoliPdfCollection } from '../../../../lib/appoli-pdf';
import { useMenuPermission } from '../../../../lib/use-menu-permission';
import PetaniFormModal from './petani-form-modal';
import InspeksiIcsPreview from './inspeksi-ics/inspeksi-ics-preview';
import DataLahanPreview from './data-lahan/data-lahan-preview';
import AnalisaUsahaPreview from './analisa-usaha/analisa-usaha-preview';
import { useNotifications } from '../notification-provider';

type Lahan = {
  luasLahan?: string;
  komoditas?: string;
  alamatLahan?: string;
  latitude?: string;
  longitude?: string;
};

type Petani = {
  idPetani: string;
  documentId?: string;
  namaPetani: string;
  kelompokTani: string;
  komoditasUtama: string;
  lahanUtama?: Lahan;
  lahan2?: Lahan | null;
  lahanTambahan?: Lahan[];
};

type AnalisaUsahaRow = {
  waktu?: string;
  volume?: number | string;
  harga?: number | string;
  keterangan?: string;
};

type AnalisaUsaha = {
  id: string;
  petaniId: string;
  namaPetani: string;
  namaPetugas?: string;
  kelompokTani: string;
  luasLahan?: string;
  varietas?: string;
  musimTanam?: string;
  totalBiaya?: number;
  totalHasilProduksi?: number;
  labaRugiNetto?: number;
  formData?: Record<string, AnalisaUsahaRow>;
  pdf?: { status?: string; url?: string; fileId?: string; fileName?: string };
  createdAt?: unknown;
};
type Inspection = { id: string; idPetani?: string; namaPetani?: string; inspektur?: string; tanggal?: string; jam?: string; statusBidang?: string; kelolaOrganik?: string; keputusan?: string; totalLahanM2?: number; lahan?: { luas: string; utama: string; selingan: string; kimia: string }[]; kriteria?: Record<string, { kondisi: string; dasar: string }>; manajemenRisiko?: Record<string, { level: string; dasar: string }>; rekomendasi?: { kondisiSebelum: string; tahunIni: string; syaratPenjelasan: string }; sanksiTambahan?: string; createdAt?: unknown };
type LandSurvey = { id: string; idPetani?: string; namaPetani?: string; alamatPetani?: string; kelompokTani?: string; alamatLahan?: string; statusMilik?: string; totalLuasHa?: number; lahan?: { kode: string; luas: string; utama: string; sisipan: string; kimia: string }[]; kalenderMasaTanam?: { tanam: string; panen: string; produksi: string; pendataan: string }[]; batasLahan?: Record<string, { jenis: string; pemilik: string; status: string }>; ternak?: { jenis: string; jumlah: string; pakan: string; kondisi: string }[]; createdAt?: unknown };
type MapPoint = { latitude: number; longitude: number; nama: string; komoditas: string; lahan: string; alamat: string };

function getRecordTime(value: unknown): number {
  if (value && typeof value === 'object' && 'toMillis' in value && typeof value.toMillis === 'function') return value.toMillis();
  if (value && typeof value === 'object' && 'seconds' in value) return Number(value.seconds) * 1000;
  const parsed = new Date(String(value || '')).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatRecordDate(value: unknown): string {
  const time = getRecordTime(value);
  return time ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'short', timeStyle: 'short' }).format(time) : '-';
}

const inspectionSections = [
  { title: '1. Kriteria Produksi Ternak', items: [['ternak_kondisi', 'Kondisi hewan ternak'], ['ternak_makan', 'Makanan yang diberikan']] },
  { title: '2. Status Lahan', items: [['lahan_konversi', 'Apakah lahan sudah melewati masa konversi'], ['lahan_pisah', 'Lahan organik terpisah dari lahan konvensional'], ['lahan_konservasi', 'Konservasi sistem air, tanah, hutan, dan lainnya'], ['lahan_latih', 'Petani terlatih dalam sistem pertanian organik'], ['lahan_filter', 'Zona pembatas dan filter untuk mencegah kontaminasi']] },
  { title: '3. Manajemen Benih', items: [['benih_sumber', 'Dari mana sumber benih'], ['benih_gmo', 'Apakah menanam benih rekayasa genetika'], ['benih_kelola', 'Persiapan dan pengelolaan benih']] },
  { title: '4. Pemupukan Organik', items: [['puk_kimia', 'Penggunaan pupuk kimia saat tanaman kritis'], ['puk_herbi', 'Penggunaan herbisida untuk mengontrol rumput liar']] },
  { title: '5. Manajemen Hama', items: [['hama_sakit', 'Manajemen penyakit'], ['hama_pest', 'Penggunaan pestisida kimia saat hama sulit dikendalikan']] },
  { title: '6. Manajemen Pola Tanam', items: [['pola_tanam', 'Kesesuaian rotasi dan diversifikasi pola tanam'], ['pola_organik', 'Setiap rotasi menerapkan budidaya organik']] },
] as Array<{ title: string; items: [string, string][] }>;
const inspectionPostHarvest: [string, string][] = [['pasca_olah', 'Pengolahan produk'], ['pasca_kemasan', 'Kondisi sak kemasan produk'], ['pasca_simpan', 'Penyimpanan dan pengiriman']];
const inspectionRiskItems: [string, string][] = [['sekitar', 'Risiko kontaminasi dari lingkungan sekitar'], ['aktivitas', 'Risiko dari aktivitas pertanian sekitar'], ['industri', 'Risiko dari industri atau sumber pencemar']];
const emptyInspectionChecks = Object.fromEntries([...inspectionSections.flatMap((group) => group.items), ...inspectionPostHarvest].map(([key]) => [key, { kondisi: 'Diterima', dasar: '' }])) as Record<string, { kondisi: string; dasar: string }>;
const emptyRisks = { sekitar: { level: 'Rendah', dasar: '' }, aktivitas: { level: 'Rendah', dasar: '' }, industri: { level: 'Rendah', dasar: '' } };
const directions = ['Barat', 'Timur', 'Selatan', 'Utara'];

function getLuasHektare(value?: string): number {
  if (!value) return 0;
  const text = value.trim().toLowerCase();
  const numberText = text.match(/[\d.,]+/)?.[0];
  if (!numberText) return 0;
  const isHectare = /ha\b/.test(text);
  const normalized = isHectare
    ? numberText.includes(',') && numberText.includes('.')
      ? numberText.replace(/\./g, '').replace(',', '.')
      : numberText.replace(',', '.')
    : numberText.replace(/[.,]/g, '');
  const numberValue = Number(normalized);
  if (!Number.isFinite(numberValue)) return 0;
  return isHectare ? numberValue : /m[²2]/.test(text) ? numberValue / 10000 : 0;
}

function getAllFarmerLands(farmer: Petani): Lahan[] {
  return [
    farmer.lahanUtama,
    ...(farmer.lahanTambahan || []),
    ...(!farmer.lahanTambahan?.length && farmer.lahan2 ? [farmer.lahan2] : []),
  ].filter((land): land is Lahan => Boolean(land));
}

function normalizeLabel(value?: string): string {
  return value?.trim().replace(/\s+/g, ' ').toLocaleLowerCase('id-ID') || '';
}

export default function DashboardAppoli() {
  const { notify, confirm } = useNotifications();
  const [petani, setPetani] = useState<Petani[]>([]);
  const [analisaUsaha, setAnalisaUsaha] = useState<AnalisaUsaha[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [landSurveys, setLandSurveys] = useState<LandSurvey[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPetani, setSelectedPetani] = useState<Petani | null>(null);
  const [selectedAnalisa, setSelectedAnalisa] = useState<AnalisaUsaha | null>(null);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [selectedLandSurvey, setSelectedLandSurvey] = useState<LandSurvey | null>(null);
  const [analisaPage, setAnalisaPage] = useState(1);
  const [downloadingAnalisaId, setDownloadingAnalisaId] = useState('');
  const [deletingRecordKey, setDeletingRecordKey] = useState('');
  const canWritePetani = useMenuPermission('profil-petani', 'write');
  const canWriteAnalisa = useMenuPermission('analisa-usaha', 'write');
  const canWriteInspection = useMenuPermission('inspeksi-ics', 'write');
  const canWriteLand = useMenuPermission('data-lahan', 'write');

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'petani'),
      (snapshot) => {
        setPetani(snapshot.docs.map((document) => ({
          ...(document.data() as Omit<Petani, 'documentId'>),
          idPetani: String(document.data().idPetani || document.id),
          documentId: document.id,
        })) as Petani[]);
        setLoading(false);
      },
      (snapshotError) => {
        console.error('Gagal memuat data petani:', snapshotError);
        setError('Data petani belum dapat dimuat. Periksa koneksi atau hak akses data.');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'inspeksiICS'), (snapshot) => {
      setInspections(snapshot.docs.map((document) => ({ id: document.id, ...(document.data() as Omit<Inspection, 'id'>) })).sort((a, b) => getRecordTime(b.createdAt) - getRecordTime(a.createdAt)));
    }, (snapshotError) => console.error('Gagal memuat inspeksi ICS:', snapshotError));
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'dataLahan'), (snapshot) => {
      setLandSurveys(snapshot.docs.map((document) => ({ id: document.id, ...(document.data() as Omit<LandSurvey, 'id'>) })).sort((a, b) => getRecordTime(b.createdAt) - getRecordTime(a.createdAt)));
    }, (snapshotError) => console.error('Gagal memuat data lahan:', snapshotError));
    return unsubscribe;
  }, []);

  const removeRecord = async (collectionName: string, id: string, label: string, fileId = '') => {
    if (!(await confirm(`Hapus ${label} ini? Data yang dihapus tidak dapat dikembalikan.`))) return;
    const deleteKey = `${collectionName}:${id}`;
    if (deletingRecordKey) return;
    setDeletingRecordKey(deleteKey);
    try {
      const canWrite = collectionName === 'petani' ? canWritePetani : collectionName === 'analisaUsaha' ? canWriteAnalisa : collectionName === 'inspeksiICS' ? canWriteInspection : canWriteLand;
      if (!canWrite) throw new Error('User tidak memiliki izin tulis untuk menu ini.');
      if (collectionName === 'petani') {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) throw new Error('Sesi admin tidak ditemukan. Silakan login kembali.');
        const response = await fetch('/api/appoli/petani/delete', {
          method: 'POST',
          headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId: id }),
        });
        const result = await response.json() as { error?: string };
        if (!response.ok) throw new Error(result.error || 'Gagal menghapus profil petani.');
      } else {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) throw new Error('Sesi admin tidak ditemukan. Silakan login kembali.');
        const response = await fetch('/api/appoli/delete', {
          method: 'POST',
          headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ collection: collectionName, documentId: id, fileId }),
        });
        const result = await response.json() as { error?: string };
        if (!response.ok) throw new Error(result.error || `Gagal menghapus ${label}.`);
      }
    } catch (deleteError) {
      console.error(`Gagal menghapus ${label}:`, deleteError);
      setError(`Data ${label} gagal dihapus. Periksa hak akses data.`);
    } finally {
      setDeletingRecordKey('');
    }
  };

  const downloadAnalisaPdf = async (id: string) => {
    if (downloadingAnalisaId) return;
    setDownloadingAnalisaId(id);
    try {
      await downloadAppoliPdf('analisaUsaha', id);
    } catch (downloadError) {
      notify(downloadError instanceof Error ? downloadError.message : 'PDF tidak dapat diunduh.', 'error');
    } finally {
      setDownloadingAnalisaId('');
    }
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'analisaUsaha'),
      (snapshot) => {
        const data = snapshot.docs.map((document) => ({
          id: document.id,
          ...(document.data() as Omit<AnalisaUsaha, 'id'>),
        })) as AnalisaUsaha[];

        setAnalisaUsaha(data.sort((a, b) => {
          const aTime = getRecordTime(a.createdAt);
          const bTime = getRecordTime(b.createdAt);
          return bTime - aTime;
        }));
      },
      (snapshotError) => {
        console.error('Gagal memuat data analisa usaha:', snapshotError);
      }
    );

    return unsubscribe;
  }, []);

  const stats = useMemo(() => {
    const totalLuas = petani.reduce((total, item) => total + getAllFarmerLands(item).reduce((landTotal, land) => landTotal + getLuasHektare(land.luasLahan), 0), 0);
    const komoditas = new Set(petani.flatMap((item) => [item.komoditasUtama, ...getAllFarmerLands(item).map((land) => land.komoditas)]).map(normalizeLabel).filter(Boolean));
    const kelompok = new Set(petani.map((item) => normalizeLabel(item.kelompokTani)).filter(Boolean));

    return [
      { label: 'Total Petani', value: petani.length.toLocaleString('id-ID'), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Total Luas Lahan', value: `${totalLuas.toLocaleString('id-ID', { maximumFractionDigits: 2 })} Ha`, icon: MapIcon, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { label: 'Komoditas Aktif', value: komoditas.size.toLocaleString('id-ID'), icon: Sprout, color: 'text-amber-600', bg: 'bg-amber-50' },
      { label: 'Kelompok Tani', value: kelompok.size.toLocaleString('id-ID'), icon: Tractor, color: 'text-violet-600', bg: 'bg-violet-50' },
    ];
  }, [petani]);

  const analytics = useMemo(() => {
    const now = new Date();
    const monthKeys = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(date),
        count: 0,
      };
    });
    const monthLookup = new Map(monthKeys.map((month) => [month.key, month]));
    petani.forEach((farmer) => {
      const time = getRecordTime((farmer as Petani & { createdAt?: unknown }).createdAt);
      if (!time) return;
      const date = new Date(time);
      const month = monthLookup.get(`${date.getFullYear()}-${date.getMonth()}`);
      if (month) month.count += 1;
    });

    const inspectionStatus = { approved: 0, review: 0, rejected: 0 };
    inspections.forEach((inspection) => {
      const decision = normalizeLabel(inspection.keputusan);
      if (decision.includes('tolak')) inspectionStatus.rejected += 1;
      else if (decision.includes('syarat') || decision.includes('perbaikan')) inspectionStatus.review += 1;
      else if (decision) inspectionStatus.approved += 1;
    });

    return {
      months: monthKeys,
      inspectionStatus,
      totalForms: analisaUsaha.length + inspections.length + landSurveys.length,
    };
  }, [analisaUsaha.length, inspections, landSurveys.length, petani]);

  const mapPoints = useMemo(() => petani.flatMap((farmer) => {
    const lands = getAllFarmerLands(farmer).map((land, index) => ({ title: index === 0 ? 'Lahan Utama' : `Lahan Tambahan ${index}`, land }));
    return lands.flatMap(({ title, land }) => {
      const latitude = Number(land?.latitude);
      const longitude = Number(land?.longitude);
      return Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180
        ? [{ latitude, longitude, nama: farmer.namaPetani || farmer.idPetani, komoditas: land?.komoditas || farmer.komoditasUtama || '-', lahan: title, alamat: land?.alamatLahan || '-' }]
        : [];
    });
  }), [petani]);

  const filteredPetani = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return petani;

    return petani.filter((item) =>
      [item.idPetani, item.namaPetani, item.kelompokTani, item.komoditasUtama]
        .some((value) => value?.toLowerCase().includes(keyword))
    );
  }, [petani, searchTerm]);

  const getPreviewRowTotal = (row?: AnalisaUsahaRow) => {
    const volume = Number(row?.volume ?? 0) || 0;
    const harga = Number(row?.harga ?? 0) || 0;
    return volume * harga;
  };

  const previewRows = useMemo(() => {
    if (!selectedAnalisa?.formData) return [];

    return Object.entries(selectedAnalisa.formData)
      .map(([key, row]) => {
        const total = getPreviewRowTotal(row);
        const hasValue = !!(
          total ||
          row?.waktu ||
          row?.keterangan ||
          row?.volume ||
          row?.harga
        );

        if (!hasValue) return null;

        return {
          key,
          label: key
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase()),
          volume: Number(row?.volume ?? 0) || 0,
          harga: Number(row?.harga ?? 0) || 0,
          total,
          keterangan: row?.keterangan || '-',
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
  }, [selectedAnalisa]);

  const analisaPageCount = Math.max(1, Math.ceil(analisaUsaha.length / 5));
  const currentAnalisaPage = Math.min(analisaPage, analisaPageCount);
  const visibleAnalisa = analisaUsaha.slice((currentAnalisaPage - 1) * 5, currentAnalisaPage * 5);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="print:hidden">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Appoli</h1>
          <p className="text-sm text-slate-500">Ringkasan data petani yang tersinkron secara real-time.</p>
        </div>
        <button type="button" onClick={() => setIsFormOpen(true)} disabled={!canWritePetani} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
          <Plus className="w-4 h-4" /> Tambah Petani
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className={`rounded-lg p-3 ${stat.bg} ${stat.color}`}><Icon className="w-6 h-6" /></div>
              <div><p className="text-sm font-medium text-slate-500">{stat.label}</p><p className="text-2xl font-bold text-slate-900">{stat.value}</p></div>
            </div>
          );
        })}
      </div>

      <AppoliMap points={mapPoints} />

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 text-lg font-bold text-slate-800"><BarChart3 className="h-5 w-5 text-blue-600" />Pertumbuhan Petani</h2><p className="text-xs text-slate-500">Data baru dalam enam bulan terakhir</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{petani.length} total</span></div>
          <div className="flex h-44 items-end gap-3 border-b border-slate-200 px-2 pb-2">
            {analytics.months.map((month) => { const maximum = Math.max(1, ...analytics.months.map((item) => item.count)); const height = month.count ? Math.max(10, (month.count / maximum) * 100) : 4; return <div key={month.key} className="flex min-w-0 flex-1 flex-col items-center gap-2"><span className="text-xs font-bold text-slate-600">{month.count}</span><div className="flex h-28 w-full max-w-10 items-end rounded-t-md bg-slate-100"><div className="w-full rounded-t-md bg-blue-500 transition-all" style={{ height: `${height}%` }} /></div><span className="text-[11px] font-semibold capitalize text-slate-500">{month.label}</span></div>; })}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5"><h2 className="flex items-center gap-2 text-lg font-bold text-slate-800"><ClipboardCheck className="h-5 w-5 text-amber-600" />Status Inspeksi ICS</h2><p className="text-xs text-slate-500">Distribusi keputusan terakhir</p></div>
          <div className="space-y-4 text-sm"><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-slate-600"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Disetujui</span><strong className="text-slate-900">{analytics.inspectionStatus.approved}</strong></div><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-slate-600"><Activity className="h-4 w-4 text-amber-600" />Perlu perbaikan</span><strong className="text-slate-900">{analytics.inspectionStatus.review}</strong></div><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-slate-600"><XCircle className="h-4 w-4 text-rose-600" />Ditolak</span><strong className="text-slate-900">{analytics.inspectionStatus.rejected}</strong></div><div className="border-t border-slate-200 pt-4"><span className="text-xs text-slate-500">Total formulir operasional</span><p className="mt-1 text-2xl font-bold text-slate-900">{analytics.totalForms}</p></div></div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2"><Users className="w-5 h-5 text-emerald-600" /><h2 className="text-lg font-bold text-slate-800">Data Petani</h2></div>
            <div className="relative w-full sm:w-64"><Search className="absolute left-3 top-1/2 w-4 -translate-y-1/2 text-slate-400" /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Cari ID, nama, kelompok..." className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500" /></div>
          </div>
          {error ? <p className="p-6 text-sm text-rose-600">{error}</p> : loading ? <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500"><Loader2 className="w-5 animate-spin text-emerald-600" />Memuat data petani...</div> : (
            <div className="overflow-x-auto"><table className="w-full text-left text-sm text-slate-600"><thead className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">ID & Nama</th><th className="px-5 py-3">Kelompok / Komoditas</th><th className="px-5 py-3">Luas Lahan</th><th className="px-5 py-3 text-center">Aksi</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredPetani.length === 0 ? <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-500">Belum ada data petani yang sesuai.</td></tr> : filteredPetani.map((item) => { const documentId = item.documentId || encodeURIComponent(item.idPetani); return <tr key={item.documentId || item.idPetani} className="hover:bg-slate-50"><td className="px-5 py-3"><p className="font-semibold text-slate-900">{item.namaPetani}</p><p className="font-mono text-xs text-slate-500">{item.idPetani}</p></td><td className="px-5 py-3"><p className="font-medium text-slate-800">{item.kelompokTani}</p><p className="mt-0.5 flex items-center gap-1 text-xs text-emerald-600"><Sprout className="w-3 h-3" />{item.komoditasUtama}</p></td><td className="px-5 py-3 font-medium">{item.lahanUtama?.luasLahan || '—'}</td><td className="px-5 py-3"><div className="flex justify-center gap-2"><button type="button" onClick={() => setSelectedPetani(item)} title="Lihat profil petani" className="rounded-md p-1.5 text-blue-600 transition hover:bg-blue-50"><Eye className="w-4 h-4" /></button><button type="button" disabled={Boolean(deletingRecordKey)} onClick={() => void removeRecord('petani', documentId, 'profil petani')} title="Hapus profil petani" className="rounded-md p-1.5 text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"><Trash2 className="w-4 h-4" /></button></div></td></tr>; })}</tbody></table></div>
          )}
        </section>

        <aside className="h-fit rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 p-5"><h2 className="flex items-center gap-2 text-lg font-bold text-slate-800"><Activity className="w-5 h-5 text-blue-600" />Status Data</h2></div>
          <div className="space-y-4 p-5 text-sm"><div className="flex gap-3"><span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" /><div><p className="font-semibold text-slate-800">Data tersambung</p><p className="text-slate-500">Daftar dan ringkasan diperbarui otomatis saat data berubah.</p></div></div><div className="flex gap-3"><span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" /><div><p className="font-semibold text-slate-800">Data siap dikelola</p><p className="text-slate-500">Tambahkan profil petani melalui tombol di atas.</p></div></div><div className="rounded-lg bg-emerald-50 p-4 text-emerald-800"><Leaf className="mb-2 w-5" /><p className="font-semibold">{petani.length} profil petani tercatat</p></div></div>
        </aside>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 p-5">
          <Leaf className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-bold text-slate-800">Daftar Analisa Usaha</h2>
        </div>

        {analisaUsaha.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">Belum ada data analisa usaha yang tersimpan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Petani</th>
                  <th className="px-5 py-3">Tanggal</th>
                  <th className="px-5 py-3">Nama Petugas</th>
                  <th className="px-5 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleAnalisa.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-slate-900">{item.namaPetani}</p>
                      <p className="font-mono text-[11px] text-slate-500">{item.petaniId}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-700">{formatRecordDate(item.createdAt)}</td>
                    <td className="px-5 py-3 text-slate-700">{(item as AnalisaUsaha & { namaPetugas?: string }).namaPetugas || '-'}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-center gap-2">
                        <button type="button" onClick={() => setSelectedAnalisa(item)} title="Lihat PDF dalam modal" aria-label="Lihat PDF dalam modal" className="rounded-md p-1.5 text-blue-600 transition hover:bg-blue-50"><Eye className="h-4 w-4" /></button>
                        <button type="button" onClick={() => void downloadAnalisaPdf(item.id)} disabled={Boolean(downloadingAnalisaId)} title="Download PDF" aria-label="Download PDF" className="rounded-md p-1.5 text-emerald-600 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"><Download className="h-4 w-4" /></button>
                        <button type="button" onClick={() => removeRecord('analisaUsaha', item.id, 'analisa usaha', item.pdf?.fileId)} title="Hapus analisa usaha dan PDF Drive" aria-label="Hapus analisa usaha dan PDF Drive" className="rounded-md p-1.5 text-rose-600 transition hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={currentAnalisaPage} pageCount={analisaPageCount} total={analisaUsaha.length} onPageChange={setAnalisaPage} />
          </div>
        )}
      </section>

      <RecordSection
        title="Daftar Inspeksi ICS"
        icon={<ClipboardCheck className="h-5 w-5 text-amber-600" />}
        empty="Belum ada hasil inspeksi ICS yang tersimpan."
        records={inspections}
        columns={[
          ['Nama Petani', (record) => String(record.namaPetani || '-')],
          ['Tanggal', (record) => String(record.tanggal || '-')],
          ['Nama Petugas', (record) => String(record.inspektur || '-')],
        ]}
        onPreview={setSelectedInspection}
        onDelete={(id, record) => removeRecord('inspeksiICS', id, 'inspeksi ICS', String(record.pdf?.fileId || ''))}
      />

      <RecordSection
        title="Daftar Data & Lahan"
        icon={<MapPinned className="h-5 w-5 text-sky-600" />}
        empty="Belum ada data lahan yang tersimpan."
        records={landSurveys}
        columns={[
          ['Nama Petani', (record) => String(record.namaPetani || '-')],
          ['Tanggal', (record) => formatRecordDate(record.createdAt)],
          ['Nama Petugas', (record) => String(record.namaPetugas || '-')],
        ]}
        onPreview={setSelectedLandSurvey}
        onDelete={(id, record) => removeRecord('dataLahan', id, 'data lahan', String(record.pdf?.fileId || ''))}
      />
      </div>

      {selectedPetani && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" role="dialog" aria-modal="true" aria-labelledby="profil-petani-title"><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-200 p-5"><div><p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Profil petani</p><h2 id="profil-petani-title" className="mt-1 text-xl font-bold text-slate-900">{selectedPetani.namaPetani || '-'}</h2></div><button type="button" onClick={() => setSelectedPetani(null)} title="Tutup profil" className="rounded-md p-2 text-slate-500 hover:bg-slate-100">×</button></div><div className="grid gap-4 p-5 sm:grid-cols-2"><ProfileValue label="ID Petani" value={selectedPetani.idPetani} /><ProfileValue label="No. HP" value={(selectedPetani as Petani & { noHp?: string }).noHp || '-'} /><ProfileValue label="Kelompok Tani" value={selectedPetani.kelompokTani || '-'} /><ProfileValue label="Komoditas Utama" value={selectedPetani.komoditasUtama || '-'} /><ProfileValue label="Alamat Petani" value={(selectedPetani as Petani & { alamatPetani?: string }).alamatPetani || '-'} /><ProfileValue label="Lahan Utama" value={selectedPetani.lahanUtama?.luasLahan || '-'} /><ProfileValue label="Lokasi Lahan" value={selectedPetani.lahanUtama?.alamatLahan || '-'} /><ProfileValue label="Koordinat" value={[selectedPetani.lahanUtama?.latitude, selectedPetani.lahanUtama?.longitude].filter(Boolean).join(', ') || '-'} /><div className="sm:col-span-2"><h3 className="mb-2 text-sm font-bold text-slate-800">Lahan Tambahan</h3>{((selectedPetani as Petani & { lahanTambahan?: Lahan[] }).lahanTambahan || []).length === 0 ? <p className="text-sm text-slate-500">Belum ada lahan tambahan.</p> : <div className="space-y-2">{((selectedPetani as Petani & { lahanTambahan?: Lahan[] }).lahanTambahan || []).map((land, index) => <div key={index} className="rounded-lg border border-slate-200 p-3 text-sm"><p className="font-semibold text-slate-800">Lahan Tambahan {index + 1}: {land.komoditas || '-'}</p><p className="text-slate-600">{land.luasLahan || '-'} | {land.alamatLahan || '-'}</p><p className="text-xs text-slate-500">Koordinat: {[land.latitude, land.longitude].filter(Boolean).join(', ') || '-'}</p></div>)}</div>}</div></div></div></div>}
      {selectedAnalisa && selectedAnalisa.id === '__legacy_disabled__' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-slate-200">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-700">Preview PDF</p>
                  <h3 className="mt-2 text-xl font-black text-slate-900">Analisa Usaha Tani</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAnalisa(null)}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Tutup
                </button>
              </div>
            </div>

            <div className="p-5 text-slate-800 print:p-0">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-5 border-b border-slate-200 pb-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-xs font-black text-emerald-700">
                        APPOLI
                      </div>
                      <div>
                        <div className="text-lg font-black text-slate-900">Aliansi Petani Padi dan Palawija Organik</div>
                        <div className="text-xs text-slate-500">Boyolali</div>
                      </div>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <div className="font-bold text-slate-700">No. Form</div>
                      <div>{selectedAnalisa.petaniId || '—'}</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Nama Petani</div>
                    <div className="mt-1 text-sm font-bold text-slate-900">{selectedAnalisa.namaPetani || '-'}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Kelompok Tani</div>
                    <div className="mt-1 text-sm font-bold text-slate-900">{selectedAnalisa.kelompokTani || '-'}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Kode Petani</div>
                    <div className="mt-1 text-sm font-bold text-slate-900">{selectedAnalisa.petaniId || '-'}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Luas Lahan</div>
                    <div className="mt-1 text-sm font-bold text-slate-900">{selectedAnalisa.luasLahan || '-'}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Varietas</div>
                    <div className="mt-1 text-sm font-bold text-slate-900">{selectedAnalisa.varietas || '-'}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Musim Tanam</div>
                    <div className="mt-1 text-sm font-bold text-slate-900">{selectedAnalisa.musimTanam || '-'}</div>
                  </div>
                </div>

                <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full border-collapse text-xs text-slate-700">
                    <thead>
                      <tr className="bg-slate-900 text-white">
                        <th className="border border-slate-700 px-2 py-2 text-left">Kegiatan</th>
                        <th className="border border-slate-700 px-2 py-2 text-right">Volume</th>
                        <th className="border border-slate-700 px-2 py-2 text-right">Harga</th>
                        <th className="border border-slate-700 px-2 py-2 text-right">Total</th>
                        <th className="border border-slate-700 px-2 py-2 text-left">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row) => (
                        <tr key={row.key} className="bg-white">
                          <td className="border border-slate-200 px-2 py-2 font-semibold text-slate-800">{row.label}</td>
                          <td className="border border-slate-200 px-2 py-2 text-right">{row.volume}</td>
                          <td className="border border-slate-200 px-2 py-2 text-right">{row.harga.toLocaleString('id-ID')}</td>
                          <td className="border border-slate-200 px-2 py-2 text-right font-bold text-slate-900">{row.total.toLocaleString('id-ID')}</td>
                          <td className="border border-slate-200 px-2 py-2 text-left text-slate-600">{row.keterangan}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700">Total Biaya</div>
                    <div className="mt-1 text-lg font-black text-amber-900">Rp {Number(selectedAnalisa.totalBiaya || 0).toLocaleString('id-ID')}</div>
                  </div>
                  <div className="rounded-lg border border-sky-200 bg-sky-50 p-3">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-700">Hasil Produksi</div>
                    <div className="mt-1 text-lg font-black text-sky-900">Rp {Number(selectedAnalisa.totalHasilProduksi || 0).toLocaleString('id-ID')}</div>
                  </div>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">Laba / Rugi Netto</div>
                    <div className="mt-1 text-lg font-black text-emerald-900">Rp {Number(selectedAnalisa.labaRugiNetto || 0).toLocaleString('id-ID')}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setSelectedAnalisa(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => void openAppoliPdf('analisaUsaha', selectedAnalisa.id).catch((error: unknown) => notify(error instanceof Error ? error.message : 'PDF tidak dapat dibuat.', 'error'))}
                className="rounded-lg border border-sky-200 bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
              >
                Cetak PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedPetani && !isFormOpen && <button type="button" onClick={() => setIsFormOpen(true)} title="Edit profil petani" className="fixed bottom-6 right-6 z-[60] inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-xl hover:bg-emerald-700"><Edit3 className="h-4 w-4" />Edit profil</button>}
      {selectedAnalisa && <PdfPreviewModal key={`analisa-${selectedAnalisa.id}`} title="Preview Analisa Usaha" recordId={selectedAnalisa.id} onClose={() => setSelectedAnalisa(null)}><AnalisaUsahaPreview namaPetani={selectedAnalisa.namaPetani || ''} kodePetani={selectedAnalisa.petaniId || ''} kelompokTani={selectedAnalisa.kelompokTani || ''} luasLahan={selectedAnalisa.luasLahan || ''} varietas={selectedAnalisa.varietas || ''} musimTanam={selectedAnalisa.musimTanam || ''} namaPetugas={selectedAnalisa.namaPetugas || ''} totalBiaya={Number(selectedAnalisa.totalBiaya || 0)} totalHasilProduksi={Number(selectedAnalisa.totalHasilProduksi || 0)} labaRugiNetto={Number(selectedAnalisa.labaRugiNetto || 0)} formData={(selectedAnalisa.formData || {}) as unknown as Record<string, { waktu: string; volume: number | ''; harga: number | ''; keterangan: string }>} /></PdfPreviewModal>}
      {selectedInspection && <PdfPreviewModal key={`inspection-${selectedInspection.id}`} title="Preview Inspeksi ICS" recordId={selectedInspection.id} onClose={() => setSelectedInspection(null)}><InspeksiIcsPreview nama={selectedInspection.namaPetani || ''} kode={selectedInspection.idPetani || ''} alamat="" inspektur={selectedInspection.inspektur || ''} tanggal={selectedInspection.tanggal || ''} jam={selectedInspection.jam || ''} statusBidang={selectedInspection.statusBidang || 'Sama'} kelolaOrganik={selectedInspection.kelolaOrganik || 'Ya'} lands={selectedInspection.lahan || []} checks={selectedInspection.kriteria || emptyInspectionChecks} sections={inspectionSections} postHarvest={inspectionPostHarvest} risks={selectedInspection.manajemenRisiko || emptyRisks} riskItems={inspectionRiskItems} recommendation={selectedInspection.rekomendasi || { kondisiSebelum: '-', tahunIni: '-', syaratPenjelasan: '' }} decision={selectedInspection.keputusan || '-'} sanksi={selectedInspection.sanksiTambahan || ''} /></PdfPreviewModal>}
      {selectedLandSurvey && <PdfPreviewModal key={`land-${selectedLandSurvey.id}`} title="Preview Data & Lahan" recordId={selectedLandSurvey.id} onClose={() => setSelectedLandSurvey(null)}><DataLahanPreview nama={selectedLandSurvey.namaPetani || ''} kode={selectedLandSurvey.idPetani || ''} alamat={selectedLandSurvey.alamatPetani || ''} kelompok={selectedLandSurvey.kelompokTani || ''} alamatLahan={selectedLandSurvey.alamatLahan || ''} statusMilik={selectedLandSurvey.statusMilik || ''} lands={selectedLandSurvey.lahan || []} totalArea={selectedLandSurvey.totalLuasHa || 0} seasons={selectedLandSurvey.kalenderMasaTanam || []} boundaries={selectedLandSurvey.batasLahan || Object.fromEntries(directions.map((direction) => [direction, { jenis: '', pemilik: '', status: '' }]))} livestock={selectedLandSurvey.ternak || []} /></PdfPreviewModal>}

      <PetaniFormModal key={selectedPetani?.idPetani || 'new'} open={isFormOpen} initialData={selectedPetani} onClose={() => { setIsFormOpen(false); setSelectedPetani(null); }} />
    </div>
  );
}

type RecordRow = { id: string; pdf?: { fileId?: string } } & Record<string, unknown>;
function RecordSection({ title, icon, empty, records, columns, onPreview, onDelete }: { title: string; icon: React.ReactNode; empty: string; records: RecordRow[]; columns: [string, (record: RecordRow) => string][]; onPreview: (record: RecordRow) => void; onDelete: (id: string, record: RecordRow) => void }) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(records.length / 5));
  const currentPage = Math.min(page, pageCount);
  const visibleRecords = records.slice((currentPage - 1) * 5, currentPage * 5);
  return <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 p-5">{icon}<h2 className="text-lg font-bold text-slate-800">{title}</h2><span className="ml-auto rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-600">{records.length} data</span></div>{records.length === 0 ? <p className="p-6 text-sm text-slate-500">{empty}</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm text-slate-600"><thead className="border-b border-slate-200 bg-white text-[11px] uppercase tracking-wider text-slate-500"><tr>{columns.map(([label]) => <th key={label} className="px-5 py-3">{label}</th>)}<th className="px-5 py-3 text-center">Aksi</th></tr></thead><tbody className="divide-y divide-slate-100">{visibleRecords.map((record) => <tr key={record.id} className="hover:bg-slate-50">{columns.map(([label, value]) => <td key={label} className="px-5 py-3">{value(record)}</td>)}<td className="px-5 py-3"><div className="flex justify-center gap-2"><button type="button" onClick={() => onPreview(record)} title="Lihat preview" className="rounded-md p-1.5 text-blue-600 hover:bg-blue-50"><Eye className="h-4 w-4" /></button><button type="button" onClick={() => onDelete(record.id, record)} title="Hapus data dan PDF Drive" className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button></div></td></tr>)}</tbody></table><Pagination page={currentPage} pageCount={pageCount} total={records.length} onPageChange={setPage} /></div>}</section>;
}

function Pagination({ page, pageCount, total, onPageChange }: { page: number; pageCount: number; total: number; onPageChange: (page: number) => void }) { return <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-xs text-slate-500"><span>Menampilkan maksimal 5 dari {total} data</span><div className="flex items-center gap-2"><button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="rounded-md border border-slate-300 px-3 py-1.5 font-semibold disabled:cursor-not-allowed disabled:opacity-40">Prev</button><span>Halaman {page} / {pageCount}</span><button type="button" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)} className="rounded-md border border-slate-300 px-3 py-1.5 font-semibold disabled:cursor-not-allowed disabled:opacity-40">Next</button></div></div>; }

function ProfileValue({ label, value }: { label: string; value: string }) { return <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-sm font-bold text-slate-800">{value}</p></div>; }

type LeafletLayer = { addTo: (target: unknown) => LeafletLayer; bindPopup: (html: string) => LeafletLayer };
type LeafletMapInstance = { setView: (center: number[], zoom: number) => LeafletMapInstance; fitBounds: (bounds: number[][], options?: object) => LeafletMapInstance; remove: () => void };
type LeafletRuntime = { map: (node: HTMLElement, options?: object) => LeafletMapInstance; tileLayer: (url: string, options: object) => LeafletLayer; circleMarker: (point: number[], options: object) => LeafletLayer };

function loadLeaflet(): Promise<LeafletRuntime> {
  return new Promise((resolve, reject) => {
    const current = (window as unknown as { L?: LeafletRuntime }).L;
    if (current) { resolve(current); return; }
    if (!document.querySelector('[data-appoli-leaflet-css]')) { const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; link.dataset.appoliLeafletCss = 'true'; document.head.appendChild(link); }
    const existing = document.querySelector<HTMLScriptElement>('[data-appoli-leaflet-js]');
    if (existing) { existing.addEventListener('load', () => resolve((window as unknown as { L: LeafletRuntime }).L)); existing.addEventListener('error', reject); return; }
    const script = document.createElement('script'); script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; script.dataset.appoliLeafletJs = 'true'; script.onload = () => resolve((window as unknown as { L: LeafletRuntime }).L); script.onerror = reject; document.body.appendChild(script);
  });
}

function AppoliMap({ points }: { points: MapPoint[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!mapRef.current || points.length === 0) return;
    let map: LeafletMapInstance | undefined;
    void loadLeaflet().then((L) => {
      if (!mapRef.current) return;
      map = L.map(mapRef.current).setView([points[0].latitude, points[0].longitude], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors', maxZoom: 19 }).addTo(map);
      points.forEach((point) => L.circleMarker([point.latitude, point.longitude], { radius: 8, color: '#047857', fillColor: '#10b981', fillOpacity: 0.85, weight: 2 }).bindPopup(`<strong>${escapeMapText(point.nama)}</strong><br/>${escapeMapText(point.lahan)}<br/>${escapeMapText(point.komoditas)}<br/>${escapeMapText(point.alamat)}`).addTo(map as unknown as LeafletMapInstance));
      if (points.length > 1) map.fitBounds(points.map((point) => [point.latitude, point.longitude]), { padding: [24, 24] });
    }).catch((error) => console.error('Gagal memuat peta Appoli:', error));
    return () => map?.remove();
  }, [points]);

  return <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 p-5"><MapPinned className="h-5 w-5 text-emerald-600" /><div><h2 className="text-lg font-bold text-slate-800">Peta Sebaran Lahan Petani</h2><p className="text-xs text-slate-500">{points.length} titik koordinat GPS tersedia</p></div></div>{points.length === 0 ? <div className="flex h-64 items-center justify-center p-6 text-center text-sm text-slate-500">Belum ada koordinat lokasi. Rekam lokasi pada profil petani untuk menampilkan sebaran di peta.</div> : <div ref={mapRef} className="h-[380px] w-full" />}</section>;
}

function escapeMapText(value: string) { return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character] || character)); }

function PdfPreviewModal({ title, recordId, children, onClose }: { title: string; recordId?: string; children: React.ReactNode; onClose: () => void }) {
  const childProps = (children as React.ReactElement<Record<string, unknown>>)?.props || {};
  const resolvedRecordId = recordId || String(childProps.kodePetani || childProps.kode || '');
  const collectionName = title.includes('Analisa') ? 'analisaUsaha' : title.includes('Inspeksi') ? 'inspeksiICS' : 'dataLahan';
  const [previewError, setPreviewError] = useState('');
  const [isGenerating, setIsGenerating] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(8);
  const [loadingMessage, setLoadingMessage] = useState('Menghubungkan ke server PDF...');
  const [isDownloading, setIsDownloading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');

  useEffect(() => {
    if (!resolvedRecordId) return;
    let objectUrl = '';
    let cancelled = false;
    const progressTimers = [
      window.setTimeout(() => { setLoadingProgress(30); setLoadingMessage('Memproses data formulir...'); }, 900),
      window.setTimeout(() => { setLoadingProgress(65); setLoadingMessage('Mengambil berkas PDF...'); }, 3500),
      window.setTimeout(() => { setLoadingProgress(85); setLoadingMessage('Menyiapkan tampilan PDF...'); }, 10000),
    ];
    void fetchAppoliPdf(collectionName as AppoliPdfCollection, resolvedRecordId)
      .then((blob) => {
        if (cancelled) return;
        setLoadingProgress(100);
        setLoadingMessage('PDF siap ditampilkan.');
        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
      })
      .catch((error: unknown) => {
        if (!cancelled) setPreviewError(error instanceof Error ? error.message : 'PDF tidak dapat dibuat.');
      })
      .finally(() => {
        if (!cancelled) setIsGenerating(false);
      });
    return () => {
      cancelled = true;
      progressTimers.forEach((timer) => window.clearTimeout(timer));
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [collectionName, resolvedRecordId]);

  const printPdf = async () => {
    if (!resolvedRecordId || isGenerating) return;
    setIsGenerating(true);
    setPreviewError('');
    try {
      await openAppoliPdf(collectionName as AppoliPdfCollection, resolvedRecordId);
    } catch (error) {
      console.error('Gagal membuat PDF:', error);
      setPreviewError(error instanceof Error ? error.message : 'PDF tidak dapat dibuat.');
    } finally {
      setIsGenerating(false);
    }
  };
  const downloadPdf = async () => {
    if (!resolvedRecordId || isDownloading) return;
    setIsDownloading(true);
    setPreviewError('');
    try {
      await downloadAppoliPdf(collectionName as AppoliPdfCollection, resolvedRecordId);
    } catch (error) {
      console.error('Gagal mengunduh PDF:', error);
      setPreviewError(error instanceof Error ? error.message : 'PDF tidak dapat diunduh.');
    } finally {
      setIsDownloading(false);
    }
  };
  return <div className="fixed inset-0 z-50 bg-slate-900/60 p-4" role="dialog" aria-modal="true" aria-label={title}>
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
      <div className="flex min-h-14 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <h2 className="truncate text-sm font-bold text-slate-800">{title}</h2>
        <div className="flex shrink-0 items-center gap-2">
          {previewError && <span className="hidden max-w-sm truncate text-xs text-rose-600 sm:inline">{previewError}</span>}
          <button type="button" onClick={onClose} aria-label="Tutup viewer PDF" className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">Tutup</button>
        </div>
      </div>
      <div className="relative min-h-0 flex-1 bg-slate-800">
        {isGenerating && <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-800 p-6 text-white">
          <div className="w-full max-w-md text-center">
            <div className="mb-4 flex items-center justify-center gap-2 text-sm font-semibold"><Loader2 className="h-5 w-5 animate-spin text-emerald-400" />{loadingMessage}</div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-600" role="progressbar" aria-label="Progres menyiapkan PDF" aria-valuemin={0} aria-valuemax={100} aria-valuenow={loadingProgress}>
              <div className="h-full rounded-full bg-emerald-400 transition-all duration-500" style={{ width: `${loadingProgress}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-300">{loadingProgress}%</p>
          </div>
        </div>}
        {previewError && !isGenerating && <div className="flex h-full items-center justify-center p-6 text-center text-sm text-rose-200">{previewError}</div>}
        {pdfUrl && <iframe title={title} src={pdfUrl} className="h-full w-full border-0" />}
      </div>
    </div>
  </div>;
}
