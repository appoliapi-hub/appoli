'use client';

import React from 'react';

interface RowData {
  waktu: string;
  volume: number | '';
  harga: number | '';
  keterangan: string;
}

interface AnalisaUsahaPreviewProps {
  namaPetani: string;
  kodePetani: string;
  kelompokTani: string;
  luasLahan: string;
  varietas: string;
  musimTanam: string;
  totalBiaya: number;
  totalHasilProduksi: number;
  labaRugiNetto: number;
  formData: Record<string, RowData>;
}

export default function AnalisaUsahaPreview({
  namaPetani,
  kodePetani,
  kelompokTani,
  luasLahan,
  varietas,
  musimTanam,
  totalBiaya,
  totalHasilProduksi,
  labaRugiNetto,
  formData,
}: AnalisaUsahaPreviewProps) {
  const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID').format(val);

  const getRowTotal = (key: string) => {
    const vol = Number(formData[key]?.volume) || 0;
    const hrg = Number(formData[key]?.harga) || 0;
    return vol * hrg;
  };

  const renderTableRow = (
    no: string,
    label: string,
    keyId: string,
    bgColor = 'bg-white'
  ) => {
    const row = formData[keyId] || { waktu: '', volume: 0, harga: 0, keterangan: '' };
    const total = getRowTotal(keyId);

    return (
      <tr key={keyId} className={bgColor}>
        <td className="border border-black px-1 py-0.5 text-center text-[10px] align-middle">{no}</td>
        <td className="border border-black px-1 py-0.5 text-[10px]">{label}</td>
        <td className="border border-black px-1 py-0.5 text-[10px]">{row.waktu || '—'}</td>
        <td className="border border-black px-1 py-0.5 text-right text-[10px]">{Number(row.volume) || '—'}</td>
        <td className="border border-black px-1 py-0.5 text-right text-[10px]">{formatRupiah(Number(row.harga) || 0)}</td>
        <td className="border border-black px-1 py-0.5 text-right text-[10px] font-semibold">{formatRupiah(total)}</td>
        <td className="border border-black px-1 py-0.5 text-[10px]">{row.keterangan || '—'}</td>
      </tr>
    );
  };

  const subTotalA = ['benih', 'pupuk_padat', 'pupuk_cair', 'pupuk_urea', 'pupuk_tsp', 'pupuk_phonska', 'pestisida_organik', 'pestisida_kimia']
    .reduce((sum, key) => sum + getRowTotal(key), 0);

  const subTotalB = ['lahan_persemaian', 'sebar_benih', 'daut_cabut', 'olah_lahan', 'tanam', 'penyulaman', 'perawatan_tanaman', 'pemupukan', 'penyemprotan', 'pengairan', 'panen_pengangkutan']
    .reduce((sum, key) => sum + getRowTotal(key), 0);

  const subTotalC = getRowTotal('sewa_pajak');

  return (
    <div className="pdf-preview flex min-h-screen justify-center bg-slate-100 py-6 print:bg-white print:py-0">
      <style>{'@media print { @page { size: A4; margin: 0; } .pdf-preview, .pdf-preview * { box-shadow: none !important; } .pdf-preview .pdf-paper, .pdf-preview .pdf-paper * { border-color: #000 !important; } }'}</style>
      {/* Kertas A4 */}
      <div className="pdf-paper w-[210mm] min-h-[297mm] border-0 bg-white px-6 py-4 text-black shadow-2xl overflow-hidden print:border-0 print:shadow-none" style={{ fontFamily: 'Arial, sans-serif' }}>
        
        {/* HEADER */}
        <div className="flex items-start justify-between mb-2">
          <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="data:image/png;base64,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" alt="Logo Appoli" className="max-w-full max-h-full object-contain" />
          </div>
          <div className="flex-1 text-center pr-16">
            <h1 className="text-xl font-bold mb-0">APPOLI</h1>
            <h2 className="text-[11px] font-bold mb-0.5">Aliansi Petani Padi dan Palawija Organik Boyolali</h2>
            <p className="text-[9px] leading-tight mb-0">
              Dk. Mencil RT.02/01 Desa Glongong, Kec. Nogosari, Kab. Boyolali<br />
              Tel : 082313395639 Website : www.appoliboyolali.com
            </p>
          </div>
        </div>

        {/* DOUBLE BORDER */}
        <div className="w-full border-t-[3px] border-black mb-[1px]"></div>
        <div className="w-full border-t border-black mb-2"></div>

        {/* TITLE */}
        <div className="text-center mb-2">
          <h3 className="font-bold underline text-[11px]">ANALISA USAHA TANI</h3>
        </div>

        {/* IDENTITAS TABLE */}
        <table className="w-full text-[10px] border-collapse mb-2" style={{ borderSpacing: 0 }}>
          <tbody>
            <tr>
              <td className="w-[18%]">Nama Petani</td><td className="w-[2%]">:</td><td>{namaPetani || '—'}</td>
            </tr>
            <tr>
              <td>Kode Petani</td><td>:</td><td>APL / {kodePetani || '—'}</td>
            </tr>
            <tr>
              <td>Kelompok tani</td><td>:</td><td>{kelompokTani || '—'}</td>
            </tr>
            <tr><td>Luas lahan</td><td>:</td><td>{luasLahan || '—'} m²</td></tr>
            <tr><td>Varietas</td><td>:</td><td>{varietas || '—'}</td></tr>
            <tr><td>Musim Tanam</td><td>:</td><td>{musimTanam || '—'}</td></tr>
          </tbody>
        </table>

        {/* DETAIL TABLE */}
        <div className="overflow-hidden mb-1">
          <table className="w-full text-[10px] border-collapse border border-black" style={{ borderSpacing: 0 }}>
            <thead>
              <tr className="bg-slate-200 text-black text-center">
                <th className="border border-black px-1 py-0.5" style={{ width: '5%' }}>No</th>
                <th className="border border-black px-1 py-0.5 text-left" style={{ width: '35%' }}>Kegiatan</th>
                <th className="border border-black px-1 py-0.5" style={{ width: '12%' }}>Waktu</th>
                <th className="border border-black px-1 py-0.5" style={{ width: '10%' }}>Volume</th>
                <th className="border border-black px-1 py-0.5" style={{ width: '12%' }}>Harga</th>
                <th className="border border-black px-1 py-0.5" style={{ width: '12%' }}>Total</th>
                <th className="border border-black px-1 py-0.5 text-left" style={{ width: '14%' }}>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {/* A. BIAYA SARANA PRODUKSI */}
              <tr className="bg-slate-300 font-bold">
                <td className="border border-black px-2 py-1 text-center">A</td>
                <td colSpan={6} className="border border-black px-2 py-1">Biaya Sarana Produksi</td>
              </tr>
              {renderTableRow('1', 'Benih', 'benih')}
              <tr className="bg-slate-100">
                <td className="border border-black px-1 py-0.5 text-center font-bold">2</td>
                <td colSpan={6} className="border border-black px-1 py-0.5 font-bold">Pupuk Organik</td>
              </tr>
              {renderTableRow('', 'Padat', 'pupuk_padat', 'bg-white')}
              {renderTableRow('', 'Cair', 'pupuk_cair', 'bg-white')}
              <tr className="bg-slate-100">
                <td className="border border-black px-1 py-0.5 text-center font-bold">3</td>
                <td colSpan={6} className="border border-black px-1 py-0.5 font-bold">Pupuk Kimia</td>
              </tr>
              {renderTableRow('', 'UREA/ZA', 'pupuk_urea', 'bg-white')}
              {renderTableRow('', 'TSP 36', 'pupuk_tsp', 'bg-white')}
              {renderTableRow('', 'Phonska', 'pupuk_phonska', 'bg-white')}
              {renderTableRow('4', 'Pestisida Organik', 'pestisida_organik')}
              {renderTableRow('5', 'Pestisida Kimia', 'pestisida_kimia')}
              <tr className="bg-slate-200 font-bold">
                <td colSpan={5} className="border border-black px-2 py-1 text-right">Sub-Total A:</td>
                <td className="border border-black px-2 py-1 text-right">{formatRupiah(subTotalA)}</td>
                <td className="border border-black px-2 py-1"></td>
              </tr>

              {/* B. BIAYA TENAGA KERJA */}
              <tr className="bg-slate-300 font-bold">
                <td className="border border-black px-2 py-1 text-center">B</td>
                <td colSpan={6} className="border border-black px-2 py-1">Biaya Tenaga Kerja</td>
              </tr>
              {renderTableRow('1', 'Lahan Persemaian', 'lahan_persemaian')}
              {renderTableRow('2', 'Sebar Benih', 'sebar_benih')}
              {renderTableRow('3', 'Daut atau cabut benih', 'daut_cabut')}
              {renderTableRow('4', 'Olah lahan', 'olah_lahan')}
              {renderTableRow('5', 'Tanam', 'tanam')}
              {renderTableRow('6', 'Penyulaman', 'penyulaman')}
              {renderTableRow('6', 'Perawatan tanaman', 'perawatan_tanaman')}
              {renderTableRow('7', 'Pemupukan', 'pemupukan')}
              {renderTableRow('8', 'Penyemprotan', 'penyemprotan')}
              {renderTableRow('9', 'Pengairan', 'pengairan')}
              {renderTableRow('10', 'Panen & pengangkutan', 'panen_pengangkutan')}
              <tr className="bg-slate-200 font-bold">
                <td colSpan={5} className="border border-black px-2 py-1 text-right">Sub-Total B:</td>
                <td className="border border-black px-2 py-1 text-right">{formatRupiah(subTotalB)}</td>
                <td className="border border-black px-2 py-1"></td>
              </tr>

              {/* C. LAIN-LAIN */}
              <tr className="bg-slate-300 font-bold">
                <td className="border border-black px-2 py-1 text-center">C</td>
                <td colSpan={6} className="border border-black px-2 py-1">Lain-lain</td>
              </tr>
              {renderTableRow('-', 'Sewa / Pajak Tanah', 'sewa_pajak')}
              <tr className="bg-red-200 font-bold">
                <td colSpan={5} className="border border-black px-2 py-1 text-right text-red-700">TOTAL BIAYA (A + B + C):</td>
                <td className="border border-black px-2 py-1 text-right text-red-700">{formatRupiah(totalBiaya)}</td>
                <td className="border border-black px-2 py-1"></td>
              </tr>

            </tbody>
          </table>
        </div>

        <table className="w-full text-[10px] border-collapse border border-black mb-1" style={{ borderSpacing: 0 }}>
          <tbody>
            <tr className="bg-slate-200 font-bold"><td className="border border-black px-1 py-0.5 text-center" style={{ width: '5%' }}>-</td><td className="border border-black px-1 py-0.5" style={{ width: '35%' }}>Total Hasil Produksi (Panen)</td><td className="border border-black px-1 py-0.5" style={{ width: '12%' }}></td><td className="border border-black px-1 py-0.5 text-right" style={{ width: '10%' }}>{Number(formData.hasil_panen?.volume) || '—'}</td><td className="border border-black px-1 py-0.5" style={{ width: '12%' }}></td><td className="border border-black px-1 py-0.5" style={{ width: '12%' }}></td><td className="border border-black px-1 py-0.5" style={{ width: '14%' }}></td></tr>
            <tr className="bg-slate-200 font-bold"><td className="border border-black px-1 py-0.5 text-center">-</td><td className="border border-black px-1 py-0.5">Harga Jual</td><td colSpan={2} className="border border-black px-1 py-0.5"></td><td className="border border-black px-1 py-0.5 text-right">{formatRupiah(Number(formData.hasil_panen?.harga) || 0)}</td><td colSpan={2} className="border border-black px-1 py-0.5"></td></tr>
            <tr className="bg-slate-300 font-bold"><td className="border border-black px-1 py-0.5"></td><td className="border border-black px-1 py-0.5">TOTAL PENDAPATAN</td><td colSpan={3} className="border border-black px-1 py-0.5"></td><td className="border border-black px-1 py-0.5 text-right">{formatRupiah(totalHasilProduksi)}</td><td className="border border-black px-1 py-0.5"></td></tr>
            <tr className="bg-slate-700 font-bold text-white"><td className="border border-black px-1 py-0.5"></td><td className="border border-black px-1 py-0.5">LABA / RUGI NETTO</td><td colSpan={3} className="border border-black px-1 py-0.5"></td><td className="border border-black px-1 py-0.5 text-right">{formatRupiah(labaRugiNetto)}</td><td className="border border-black px-1 py-0.5"></td></tr>
          </tbody>
        </table>

        {/* TANDA TANGAN */}
        <div className="text-[10px]" style={{ pageBreakInside: 'avoid' }}>
          <p className="mb-1 font-bold">Boyolali, &nbsp;&nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp;&nbsp; / 2026</p>
          <div className="grid grid-cols-2 text-center">
            <div>Petani<div className="h-16"></div><p>( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; )</p></div>
            <div>Petugas Pendata<div className="h-16"></div><p>( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; )</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
