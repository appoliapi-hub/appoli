'use client';

import type { ReactNode } from 'react';

type LandRow = { luas: string; utama: string; selingan: string; kimia: string };
type CheckValue = { kondisi: string; dasar: string };
type RiskValue = { level: string; dasar: string };

type Props = {
  nama: string;
  kode: string;
  alamat: string;
  inspektur: string;
  tanggal: string;
  jam: string;
  statusBidang: string;
  kelolaOrganik: string;
  lands: LandRow[];
  checks: Record<string, CheckValue>;
  sections: Array<{ title: string; items: [string, string][] }>;
  postHarvest: [string, string][];
  risks: Record<string, RiskValue>;
  riskItems: [string, string][];
  recommendation: { kondisiSebelum: string; tahunIni: string; syaratPenjelasan: string };
  decision: string;
  sanksi: string;
};

const cell = 'border border-black px-2 py-1 text-[10px]';
const check = (value: string, expected: string) => value === expected ? '[x]' : '[ ]';

export default function InspeksiIcsPreview(props: Props) {
  return <div className="pdf-preview flex justify-center bg-slate-100 py-6 print:bg-white print:py-0">
    <style>{'@media print { @page { size: A4; margin: 0; } .pdf-preview, .pdf-preview * { box-shadow: none !important; } .pdf-preview .pdf-paper, .pdf-preview .pdf-paper * { border-color: #000 !important; } }'}</style>
    <article className="pdf-paper w-[210mm] min-h-[297mm] border-0 bg-white p-7 text-black shadow-2xl print:border-0 print:shadow-none" style={{ fontFamily: 'Arial, sans-serif' }}>
      <header className="border-b-[3px] border-double border-black pb-3 text-center"><p className="mb-1 text-lg font-black tracking-widest">APPOLI</p><p className="text-sm font-bold">Aliansi Petani Padi dan Palawija Organik Boyolali</p><p className="text-[10px]">Dk. Mencil RT.02/01 Desa Glongong, Kec. Nogosari, Kab. Boyolali</p><p className="text-[10px]">Tel: 082313395639 | Website: www.appoliboyolali.com</p></header>
      <h1 className="my-4 text-center text-sm font-bold underline">FORMULIR INSPEKSI INTERNAL</h1>
      <table className="mb-3 w-full border-collapse"><tbody><tr><Label text="Nama Petani" /><td className={cell}>{props.nama || '-'}</td><Label text="Inspektur Internal" /><td className={cell}>{props.inspektur || '-'}</td></tr><tr><Label text="Kode" /><td className={cell}>APL / {props.kode || '-'}</td><Label text="Tanggal / Jam" /><td className={cell}>{props.tanggal || '-'} {props.jam || ''}</td></tr><tr><Label text="Alamat / Kelompok" /><td colSpan={3} className={cell}>{props.alamat || '-'}</td></tr></tbody></table>
      <SectionTitle>Status bidang dan lahan</SectionTitle><p className="mb-2 text-[10px]">Bidang lahan dibanding tahun lalu: <b>{props.statusBidang}</b> | Seluruh usahatani dikelola organik: <b>{props.kelolaOrganik}</b></p>
      <table className="mb-4 w-full border-collapse"><thead><tr className="bg-slate-800 text-white"><th className={cell}>Bidang</th><th className={cell}>Luas (m2)</th><th className={cell}>Tanaman utama</th><th className={cell}>Tanaman selingan</th><th className={cell}>Terakhir kimia</th></tr></thead><tbody>{props.lands.map((land, index) => <tr key={index}><td className={`${cell} font-bold`}>Lahan {index + 1}</td><td className={cell}>{land.luas || '-'}</td><td className={cell}>{land.utama || '-'}</td><td className={cell}>{land.selingan || '-'}</td><td className={cell}>{land.kimia || '-'}</td></tr>)}</tbody></table>
      <SectionTitle>Aspek pemeriksaan kepatuhan lapangan</SectionTitle><CheckTable groups={props.sections} checks={props.checks} />
      <div className="page-break-before mt-5"><SectionTitle>Tindakan pasca panen dan pengolahan</SectionTitle><CheckTable groups={[{ title: '', items: props.postHarvest }]} checks={props.checks} /></div>
      <SectionTitle>Manajemen risiko kontaminasi</SectionTitle><table className="mb-4 w-full border-collapse"><thead><tr className="bg-slate-800 text-white"><th className={cell}>Risiko</th><th className={cell}>Tingkat</th><th className={cell}>Dasar penilaian / kondisi</th></tr></thead><tbody>{props.riskItems.map(([key, label]) => <tr key={key}><td className={cell}>{label}</td><td className={`${cell} text-center`}>{props.risks[key].level}</td><td className={cell}>{props.risks[key].dasar || '-'}</td></tr>)}</tbody></table>
      <SectionTitle>Rekomendasi dan keputusan ICS</SectionTitle><table className="mb-3 w-full border-collapse"><tbody><tr><Label text="Kondisi sebelum inspeksi" /><td className={cell}>{props.recommendation.kondisiSebelum}</td></tr><tr><Label text="Rekomendasi tahun ini" /><td className={cell}>{props.recommendation.tahunIni}</td></tr><tr><Label text="Catatan" /><td className={cell}>{props.recommendation.syaratPenjelasan || '-'}</td></tr><tr><Label text="Keputusan ICS" /><td className={`${cell} font-bold`}>{props.decision}</td></tr><tr><Label text="Sanksi / persyaratan" /><td className={cell}>{props.sanksi || '-'}</td></tr></tbody></table>
      <div className="mt-8 grid grid-cols-2 text-center text-[10px]"><div><p>Petani</p><p className="mb-10 mt-12">(................................)</p><b>{props.nama || '-'}</b></div><div><p>Petugas ICS</p><p className="mb-10 mt-12">(................................)</p><b>{props.inspektur || '-'}</b></div></div><footer className="mt-6 border-t border-black pt-2 text-center text-[8px]">Dokumen hasil wawancara dan verifikasi langsung di lapangan.</footer>
    </article>
  </div>;
}

function Label({ text }: { text: string }) { return <td className={`${cell} bg-slate-200 font-bold`}>{text}</td>; }
function SectionTitle({ children }: { children: ReactNode }) { return <h2 className="mb-2 mt-3 border-l-4 border-amber-600 bg-slate-100 px-2 py-1 text-[11px] font-bold uppercase">{children}</h2>; }
function CheckTable({ groups, checks }: { groups: Array<{ title: string; items: [string, string][] }>; checks: Record<string, CheckValue> }) { return <table className="mb-3 w-full border-collapse"><thead><tr className="bg-slate-800 text-white"><th className={cell}>Kriteria / aktivitas</th><th className={cell}>Diterima</th><th className={cell}>Tidak</th><th className={cell}>Dasar penerimaan / kondisi</th></tr></thead><tbody>{groups.flatMap((group) => [group.title && <tr key={`${group.title}-title`}><td colSpan={4} className={`${cell} bg-slate-200 font-bold`}>{group.title}</td></tr>, ...group.items.map(([key, label]) => <tr key={key}><td className={cell}>{label}</td><td className={`${cell} text-center`}>{check(checks[key].kondisi, 'Diterima')}</td><td className={`${cell} text-center`}>{check(checks[key].kondisi, 'Tidak')}</td><td className={cell}>{checks[key].dasar || '-'}</td></tr>)])}</tbody></table>; }
