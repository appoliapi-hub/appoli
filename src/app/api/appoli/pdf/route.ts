import { NextRequest, NextResponse } from 'next/server';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { getAdminServices } from '../../../../../lib/firebase-admin';

export const runtime = 'nodejs';
export const maxDuration = 120; // ✅ FIX: Increased from 60 to 120s for complex multi-page PDFs (Inspeksi ICS)

const allowedCollections = new Set(['analisaUsaha', 'inspeksiICS', 'dataLahan']);
const escapeHtml = (value: unknown) => String(value ?? '-').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character] || character));
const money = (value: unknown) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
const cell = (value: unknown) => `<td>${escapeHtml(value || '-')}</td>`;
const logoPath = path.join(process.cwd(), 'public', 'images', 'logo-appoli.png');
const logoData = existsSync(logoPath) ? `data:image/png;base64,${readFileSync(logoPath).toString('base64')}` : '';

// ✅ FIX: Add logo warning if not found
if (!logoData) {
  console.warn('⚠️ WARNING: Logo APPOLI tidak ditemukan di public/images/logo-appoli.png. PDF akan dibuat tanpa logo.');
}

async function getBrowserExecutablePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  if (process.platform === 'win32') {
    // ✅ FIX: Check multiple Chrome/Edge paths
    const candidateBrowsers = [
      // Chrome - Program Files
      `${process.env.ProgramFiles || 'C:\\Program Files'}\\Google\\Chrome\\Application\\chrome.exe`,
      // Chrome - Program Files (x86)
      `${process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)'}\\Google\\Chrome\\Application\\chrome.exe`,
      // Chrome - LocalAppData
      `${process.env.LOCALAPPDATA || process.env.USERPROFILE || 'C:\\Users\\%USERNAME%'}\\Google\\Chrome\\Application\\chrome.exe`,
      // Edge - Program Files
      `${process.env.ProgramFiles || 'C:\\Program Files'}\\Microsoft\\Edge\\Application\\msedge.exe`,
      // Edge - Program Files (x86)
      `${process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)'}\\Microsoft\\Edge\\Application\\msedge.exe`,
      // Edge - LocalAppData
      `${process.env.LOCALAPPDATA || process.env.USERPROFILE || 'C:\\Users\\%USERNAME%'}\\Microsoft\\Edge\\Application\\msedge.exe`,
    ];
    
    const localBrowser = candidateBrowsers.find((browserPath) => {
      try {
        return existsSync(browserPath);
      } catch {
        return false;
      }
    });
    
    if (localBrowser) return localBrowser;
    throw new Error('Browser Chrome atau Edge lokal tidak ditemukan. Atur PUPPETEER_EXECUTABLE_PATH untuk pengembangan lokal.');
  }
  return chromium.executablePath();
}

async function createPdfBrowser() {
  const isLocalBrowser = process.platform === 'win32' || Boolean(process.env.PUPPETEER_EXECUTABLE_PATH);
  // @sparticuz/chromium menyediakan chrome-headless-shell untuk environment
  // serverless Linux. Mode `shell` diperlukan di Vercel; `true` bekerja untuk
  // Chrome/Edge lokal tetapi dapat gagal pada binary shell di Lambda.
  const headless = isLocalBrowser ? true : 'shell' as const;
  if (!isLocalBrowser) chromium.setGraphicsMode = false;

  return puppeteer.launch({
    args: isLocalBrowser
      ? await puppeteer.defaultArgs({ headless })
      : await puppeteer.defaultArgs({ args: chromium.args, headless }),
    executablePath: await getBrowserExecutablePath(),
    headless,
  });
}

function pdfErrorCode(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  if (message.includes('Firebase Admin credentials')) return 'FIREBASE_ADMIN_NOT_CONFIGURED';
  if (/browser|chrome|chromium|executable|spawn|headless/i.test(message)) return 'PDF_BROWSER_UNAVAILABLE';
  return 'PDF_GENERATION_FAILED';
}

// ✅ FIX: Add data validation helper
function validateFormData(collection: string, data: Record<string, unknown>) {
  const requiredFields: Record<string, string[]> = {
    analisaUsaha: ['namaPetani', 'idPetani', 'formData'],
    inspeksiICS: ['namaPetani', 'idPetani', 'kriteria'],
    dataLahan: ['namaPetani', 'idPetani'],
  };
  
  const required = requiredFields[collection] || [];
  const missing = required.filter((key) => !data[key]);
  
  if (missing.length > 0) {
    console.warn(`⚠️ WARNING: Data ${collection} tidak lengkap. Fields yang kosong: ${missing.join(', ')}`);
    // Don't throw - allow partial data to still generate PDF
  }
}

function layout(title: string, content: string, pageSize = 'A4', margin = '10mm', bodyClass = '') {
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><style>
    @page{size:${pageSize};margin:${margin}}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#000;font-size:10px;line-height:1.2;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}.inspection{font-size:9px;line-height:1.1}.inspection table{table-layout:fixed;margin-bottom:4px}.inspection td,.inspection th{overflow-wrap:anywhere;padding:3px}.kop{width:100%;border-collapse:collapse;margin-bottom:10px}.kop td{border:0;padding:0}.kop-logo{width:15%;text-align:center}.kop-logo img{width:70px;height:70px;object-fit:contain}.kop-text{text-align:center}.kop-nama{font-size:16px;font-weight:bold;letter-spacing:1px}.kop-sub{font-size:13px;font-weight:bold;margin:2px 0}.kop-detail{font-size:10px;color:#444}.double-line{border-top:1px solid #000;border-bottom:3px double #000;height:4px;margin:5px 0 12px}.title{text-align:center;font-weight:bold;font-size:13px;text-decoration:underline;margin-bottom:12px}.subtitle{text-align:center;font-style:italic;font-size:10px;margin:-6px 0 10px}table{width:100%;border-collapse:collapse;margin-bottom:8px}th,td{border:1px solid #000;padding:5px;vertical-align:middle}.identity td{border:0;padding:1px 0;vertical-align:top}.identity td:first-child{width:18%}.identity td:nth-child(2){width:2%}th{background:#e6e6e6;color:#000;text-align:center;font-weight:bold}.dark th{background:#34495e;color:#fff}.analisa .dark th{background:#e6e6e6;color:#000}.section{font-weight:bold;background:#e6e6e6;padding:5px;border:1px solid #000;margin-bottom:-1px}.label{background:#e6e6e6;font-weight:bold}.inspection th,.inspection .label,.inspection .section{background:#e7e6e6;color:#000}.inspection .dark th{background:#e7e6e6;color:#000}.inspection .section{padding:3px}.number{text-align:right}.center{text-align:center}.signatures{display:grid;grid-template-columns:1fr 1fr;text-align:center;margin-top:40px;page-break-inside:avoid}.analisa .signatures{margin-top:18px}.analisa table{margin-bottom:4px}.analisa th,.analisa td{padding:3px}.analisa .signature-space{height:48px}.signature-space{height:68px}.signatures p{margin:0}.page-break{page-break-before:always}footer{border-top:1px solid #000;text-align:center;font-size:8px;margin-top:12px;padding-top:4px}
  </style></head><body class="${bodyClass}"><table class="kop"><tr><td class="kop-logo"><img src="${logoData}" alt="Logo APPOLI"><br><b>APPOLI</b></td><td class="kop-text"><div class="kop-nama">APPOLI</div><div class="kop-sub">Aliansi Petani Padi dan Palawija Organik Boyolali</div><div class="kop-detail">Dk. Mencil RT.02/01 Desa Glongong, Kec. Nogosari, Kab. Boyolali</div><div class="kop-detail">Tel : 082313395639 Website : www.appoliboyolali.com</div></td></tr></table><div class="double-line"></div><div class="title">${escapeHtml(title)}</div>${content}</body></html>`;
}

function identity(data: Record<string, unknown>) {
  if ('formData' in data) return analisaIdentity(data);
  if ('kriteria' in data) return inspectionIdentity(data);
  if ('kalenderMasaTanam' in data) return landIdentity(data);
  return `<table><tr><td width="18%" class="label">Nama Petani :</td>${cell(data.namaPetani)}<td width="18%" class="label">${data.inspektur ? 'Inspektur Internal :' : 'Alamat Petani :'}</td>${cell(data.inspektur || data.alamatPetani)}</tr><tr><td class="label">Kode Petani :</td>${cell(`APL / ${data.petaniId || data.idPetani}`)}<td class="label">${data.tanggal ? 'Tanggal Inspeksi :' : 'Alamat Lahan :'}</td>${cell(data.tanggal || data.alamatLahan)}</tr><tr><td class="label">${data.kelompokTani ? 'Kelompok :' : 'Status Kepemilikan :'}</td>${cell(data.kelompokTani || data.statusMilik)}<td class="label">${data.jam ? 'Jam Inspeksi :' : 'Kelompok Tani :'}</td>${cell(data.jam || data.kelompokTani)}</tr></table>`;
}

function analisaIdentity(data: Record<string, unknown>) {
  return `<table class="identity"><tr><td>Nama Petani</td><td>:</td><td>${escapeHtml(data.namaPetani)}</td></tr><tr><td>Kode Petani</td><td>:</td><td>${escapeHtml(`APL / ${data.petaniId || data.idPetani}`)}</td></tr><tr><td>Kelompok tani</td><td>:</td><td>${escapeHtml(data.kelompokTani)}</td></tr><tr><td>Luas lahan</td><td>:</td><td>${escapeHtml(data.luasLahan)} m²</td></tr><tr><td>Varietas</td><td>:</td><td>${escapeHtml(data.varietas)}</td></tr><tr><td>Musim Tanam</td><td>:</td><td>${escapeHtml(data.musimTanam)}</td></tr></table>`;
}

function inspectionIdentity(data: Record<string, unknown>) {
  return `<table><tr><td width="18%" class="label">Nama Petani :</td>${cell(data.namaPetani)}<td width="18%" class="label">Inspektur Internal :</td>${cell(data.inspektur)}</tr><tr><td class="label">Kode :</td>${cell(`APL / ${data.idPetani}`)}<td class="label">Tanggal Inspeksi :</td>${cell(data.tanggal)}</tr><tr><td class="label">Alamat / Klp :</td>${cell([data.alamatPetani, data.kelompokTani].filter(Boolean).join(' / '))}<td class="label">Jam Inspeksi :</td>${cell(data.jam)}</tr></table>`;
}

function landIdentity(data: Record<string, unknown>) {
  return `<table><tr><td width="18%" class="label">Nama Petani:</td>${cell(data.namaPetani)}<td width="18%" class="label">Alamat Petani:</td>${cell(data.alamatPetani)}</tr><tr><td class="label">Kode Petani:</td>${cell(`APL / ${data.idPetani}`)}<td class="label">Alamat Lahan:</td>${cell(data.alamatLahan)}</tr></table><table><tr><td width="22%" class="label">Status Kepemilikan Lahan:</td>${cell(data.statusMilik)}</tr></table>`;
}

function choiceOptions(selected: string, options: string[], symbol = 'O') {
  return options.map((option) => `${symbol} ${selected.toLowerCase() === option.toLowerCase() ? '[✓] ' : ''}${option}`).join(' &nbsp;&nbsp; ');
}

function analisaHtml(data: Record<string, unknown>) {
  const formData = (data.formData || {}) as Record<string, Record<string, unknown>>;
  data.subTotalA = ['benih', 'pupuk_padat', 'pupuk_cair', 'pupuk_urea', 'pupuk_tsp', 'pupuk_phonska', 'pestisida_organik', 'pestisida_kimia'].reduce((sum, key) => sum + Number(formData[key]?.volume || 0) * Number(formData[key]?.harga || 0), 0);
  data.subTotalB = ['lahan_persemaian', 'sebar_benih', 'daut_cabut', 'olah_lahan', 'tanam', 'penyulaman', 'perawatan_tanaman', 'pemupukan', 'penyemprotan', 'pengairan', 'panen_pengangkutan'].reduce((sum, key) => sum + Number(formData[key]?.volume || 0) * Number(formData[key]?.harga || 0), 0);
  const row = (no: string, label: string, key: string) => { const item = formData[key] || {}; return `<tr>${cell(no)}${cell(label)}${cell(item.waktu)}${cell(item.volume)}<td class="number">${money(item.harga).replace('Rp ', '')}</td><td class="number">${money(Number(item.volume || 0) * Number(item.harga || 0)).replace('Rp ', '')}</td>${cell(item.keterangan)}</tr>`; };
  const group = (letter: string, label: string) => `<tr><td class="label center">${letter}</td><td class="label" colspan="6">${label}</td></tr>`;
  const hasilPanen = formData.hasil_panen || {};
  const totalPendapatan = Number(data.totalPendapatan ?? Number(hasilPanen.volume || 0) * Number(hasilPanen.harga || 0));
  const labaRugi = Number(data.labaRugiNetto ?? totalPendapatan - Number(data.totalBiaya || 0));
  const summaryRow = (label: string, value: unknown, className = 'summary') => `<tr class="${className}"><td class="label" colspan="5">${label}</td><td colspan="2" class="number">${escapeHtml(Number(value || 0).toLocaleString('id-ID'))}</td></tr>`;
  const rows = `${group('A', 'Biaya Sarana Produksi')}${row('1', 'Benih', 'benih')}<tr><td class="label center">2</td><td class="label" colspan="6">Pupuk Organik</td></tr>${row('', 'Padat', 'pupuk_padat')}${row('', 'Cair', 'pupuk_cair')}<tr><td class="label center">3</td><td class="label" colspan="6">Pupuk Kimia</td></tr>${row('', 'UREA/ZA', 'pupuk_urea')}${row('', 'TSP 36', 'pupuk_tsp')}${row('', 'Phonska', 'pupuk_phonska')}${row('4', 'Pestisida Organik', 'pestisida_organik')}${row('5', 'Pestisida Kimia', 'pestisida_kimia')}<tr><td class="label" colspan="5">Total Biaya Produksi (Sub-Total A)</td>${cell(Number(data.subTotalA || 0).toLocaleString('id-ID'))}<td></td></tr>${group('B', 'Biaya Tenaga Kerja')}${row('1', 'Lahan Persemaian', 'lahan_persemaian')}${row('2', 'Sebar Benih', 'sebar_benih')}${row('3', 'Daut atau cabut benih', 'daut_cabut')}${row('4', 'Olah lahan', 'olah_lahan')}${row('5', 'Tanam', 'tanam')}${row('6', 'Penyulaman', 'penyulaman')}${row('6', 'Perawatan tanaman', 'perawatan_tanaman')}${row('7', 'Pemupukan', 'pemupukan')}${row('8', 'Penyemprotan', 'penyemprotan')}${row('9', 'Pengairan', 'pengairan')}${row('10', 'Panen & pengangkutan', 'panen_pengangkutan')}<tr><td class="label" colspan="5">Total Biaya Tenaga Kerja (Sub-Total B)</td>${cell(Number(data.subTotalB || 0).toLocaleString('id-ID'))}<td></td></tr>${group('C', 'Lain-lain')}${row('-', 'Sewa / Pajak Tanah', 'sewa_pajak')}<tr><td class="label" colspan="5">TOTAL BIAYA (A + B + C)</td>${cell(Number(data.totalBiaya || 0).toLocaleString('id-ID'))}<td></td></tr>`;
  const summary = `${summaryRow('Total Hasil Produksi (Panen)', hasilPanen.volume)}${summaryRow('Harga Jual', hasilPanen.harga)}${summaryRow('TOTAL PENDAPATAN', totalPendapatan)}${summaryRow('LABA / RUGI NETTO', labaRugi, 'summary profit')}`;
  return `${identity(data)}<table class="dark"><thead><tr><th width="5%">No</th><th width="35%">Kegiatan</th><th width="12%">Waktu</th><th width="10%">Volume</th><th width="12%">Harga</th><th width="12%">Total</th><th width="14%">Keterangan</th></tr></thead><tbody>${rows}</tbody></table><table class="summary-table"><tbody>${summary}</tbody></table><div class="signatures"><div style="grid-column:1 / -1;text-align:left;margin-bottom:8px;font-weight:bold">Boyolali, &nbsp;&nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp;&nbsp; / 2026</div><div>Petani<div class="signature-space"></div><p>( ${escapeHtml(data.namaPetani)} )</p></div><div>Petugas Pendata<div class="signature-space"></div><p>( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; )</p></div></div>`;
}

function inspeksiHtml(data: Record<string, unknown>) {
  const lands = (data.lahan || []) as Record<string, unknown>[];
  const checks = (data.kriteria || {}) as Record<string, Record<string, unknown>>;
  const risks = (data.manajemenRisiko || {}) as Record<string, Record<string, unknown>>;
  const landRows = lands.map((land, index) => `<tr>${cell(`Lahan ${index + 1}`)}${cell(land.luas)}${cell(land.utama)}${cell(land.selingan)}${cell(land.kimia)}</tr>`).join('');
  const labels: Record<string, string> = { ternak_kondisi: 'Kondisi hewan ternak', ternak_makan: 'Makanan yang diberikan', lahan_konversi: 'Apakah lahan sudah melewati masa konversi', lahan_pisah: 'Apakah lahan pertanian organik terpisah dari lahan konvensional', lahan_konservasi: 'Konservasi (sistem air, tanah,hutan, dsb)', lahan_latih: 'Petani terlatih dalam sistem pertanian organik', lahan_filter: 'Apakah ada zona pembatas dan filter yang memadai untuk mengatasi kontaminasi', benih_sumber: 'Dari mana sumber benih', benih_gmo: 'Apakah menanam benih rekayasa genetika', benih_kelola: 'Persiapan dan pengelolaan', puk_kimia: 'Bila kondisi tanaman kritis apakah petani masih menggunakan pupuk kimia', puk_herbi: 'Pengontrolan rumput liar apakah masih menggunakan herbisida', hama_sakit: 'Manajemen penyakit', hama_pest: 'Apabila hama dan penyakit sulit dikendalikan apakah petani masih menggunakan pestisida kimia', pola_tanam: 'Kesesuaian rotasi & diversifikasi pola tanam di lapangan', pola_organik: 'Apakah setiap rotasi tanaman selalu menerapkan budidaya organic', pasca_olah: 'Pengolahan produk', pasca_kemasan: 'Bagaimana kondisi sak kemasan produk', pasca_simpan: 'Penyimpanan dan pengiriman' };
  const checkRows = Object.entries(checks).map(([key, value]) => `<tr>${cell(labels[key] || key.replace(/_/g, ' '))}<td class="center">${value.kondisi === 'Diterima' ? '[✓]' : '[ ]'}</td><td class="center">${value.kondisi === 'Tidak' ? '[✓]' : '[ ]'}</td>${cell(value.dasar)}</tr>`).join('');
  const riskLabels: Record<string, string> = { sekitar: 'Lahan pertanian non-organik disekitarnya', aktivitas: 'Aktivitas non-organik di lahan sekitar', industri: 'Industri, jalan kendaraan, air limbah, dsb' };
  const riskRows = Object.entries(risks).map(([key, value]) => `<tr>${cell(riskLabels[key] || key)}<td class="center">${['Rendah', 'Menengah', 'Tinggi'].map((level) => value.level === level ? '[✓]' : '[ ]').join(' ')}</td>${cell(value.dasar)}</tr>`).join('');
  const inspectPage = `${identity(data)}<p class="muted"><i>Lingkari atau contreng keterangan yang dipilih</i></p><table><tr><td width="55%">Bidang lahan, apakah sama dengan tahun lalu dan telah diregistrasi dalam dokumentasi internal?</td><td class="center"><b>${['Baru', 'Sama', 'Penambahan', 'Pengurangan'].map((value) => `[${data.statusBidang === value ? '✓' : ' '}] ${value}`).join(' &nbsp; ')}</b></td></tr></table><table><tr class="label"><td>Bidang lahan</td><td>m²</td><td>Tanaman utama</td><td>Tanaman selingan</td><td>Terakhir pemakaian kimia terlarang</td></tr>${landRows}<tr class="label"><td class="number">Total Lahan m²:</td>${cell(data.totalLahanM2)}</tr></table><table><tr><td>Seluruh usahatani dilahan organic dikelola secara organik (seluruh tanaman)</td><td class="center"><b>${data.kelolaOrganik === 'Ya' ? '[✓]' : '[ ]'} Ya &nbsp; ${data.kelolaOrganik === 'Tidak' ? '[✓]' : '[ ]'} Tidak</b></td></tr></table><table class="dark"><tr><th>Kriteria / Aspek Pemeriksaan Kepatuhan Lapangan</th><th>Diterima</th><th>Tidak</th><th>Dasar Penerimaan / Kondisi Riil</th></tr><tr><td class="label" colspan="4">1. Kriteria Production Ternak</td></tr>${checkRows}</table>`;
  const continuation = `<div class="page-break"></div><table class="dark"><tr><th>Kriteria / Aspek Pemeriksaan Kepatuhan Lapangan (Lanjutan)</th><th>Diterima</th><th>Tidak</th><th>Dasar penerimaan / kondisi</th></tr>${['pola_organik', 'pasca_olah', 'pasca_kemasan', 'pasca_simpan'].map((key) => { const value = checks[key] || { kondisi: '', dasar: '' }; return `<tr>${cell(labels[key])}<td class="center">${value.kondisi === 'Diterima' ? '[✓]' : '[ ]'}</td><td class="center">${value.kondisi === 'Tidak' ? '[✓]' : '[ ]'}</td>${cell(value.dasar)}</tr>`; }).join('')}</table><div class="section">Manajemen resiko</div><table><tr class="label"><td>Resiko kontaminasi</td><td>Rendah / Menengah / Tinggi</td><td>Keterangan</td></tr>${riskRows}<tr><td colspan="3"><b>Langkah yang diambil untuk mengurangi resiko :</b><br>${cell((data.manajemenRisiko as Record<string, unknown>)?.langkahMitigasi)}</td></tr></table><table><tr><td class="label" colspan="2">Rekomendasi persetujuan inspektor</td></tr><tr><td>Rekomendasi tahun ini</td>${cell((data.rekomendasi as Record<string, unknown>)?.tahunIni)}</tr><tr><td>Persyaratan atau penjelasan</td>${cell((data.rekomendasi as Record<string, unknown>)?.syaratPenjelasan)}</tr><tr><td class="label" colspan="2">Kesepakatan Keputusan oleh Operator ICS</td></tr><tr><td>Keputusan</td>${cell(data.keputusan)}</tr><tr><td>Persyaratan tambahan atau sanksi</td>${cell(data.sanksiTambahan)}</tr></table><div class="signatures"><div>Petani<div class="signature-space"></div><p>(................................)</p>${escapeHtml(data.namaPetani)}</div><div>Internal Inspektor<div class="signature-space"></div><p>(................................)</p>${escapeHtml(data.inspektur)}</div><div style="grid-column:2;text-align:center;margin-top:25px">Tanda tangan Manajer Persetujuan<div class="signature-space"></div><p>(................................)</p></div></div>`;
  return inspectPage + continuation;
}

function inspeksiHtmlAppsScript(data: Record<string, unknown>) {
  const checks = (data.kriteria || {}) as Record<string, Record<string, unknown>>;
  const risks = (data.manajemenRisiko || {}) as Record<string, Record<string, unknown>>;
  const lands = (data.lahan || []) as Record<string, unknown>[];
  const recommendation = (data.rekomendasi || {}) as Record<string, unknown>;
  const labels: Record<string, string> = { ternak_kondisi: 'Kondisi hewan ternak', ternak_makan: 'Makanan yang diberikan', lahan_konversi: 'Apakah lahan sudah melewati masa konversi', lahan_pisah: 'Apakah lahan pertanian organik terpisah dari lahan konvensional', lahan_konservasi: 'Konservasi (sistem air, tanah,hutan, dsb)', lahan_latih: 'Petani terlatih dalam sistem pertanian organik', lahan_filter: 'Apakah ada zona pembatas dan filter yang memadai untuk mengatasi kontaminasi', benih_sumber: 'Dari mana sumber benih', benih_gmo: 'Apakah menanam benih rekayasa genetika', benih_kelola: 'Persiapan dan pengelolaan', puk_kimia: 'Bila kondisi tanaman kritis apakah petani masih menggunakan pupuk kimia', puk_herbi: 'Pengontrolan rumput liar apakah masih menggunakan herbisida', hama_sakit: 'Manajemen penyakit', hama_pest: 'Apabila hama dan penyakit sulit dikendalikan apakah petani masih menggunakan pestisida kimia', pola_tanam: 'Kesesuaian rotasi & diversifikasi pola tanam di lapangan', pola_organik: 'Apakah setiap rotasi tanaman selalu menerapkan budidaya organic', pasca_olah: 'Pengolahan produk', pasca_kemasan: 'Bagaimana kondisi sak kemasan produk', pasca_simpan: 'Penyimpanan dan pengiriman' };
  const checkRow = (key: string) => { const value = checks[key] || {}; return `<tr>${cell(labels[key] || key)}<td class="center">${value.kondisi === 'Diterima' ? '✓' : ''}</td><td class="center">${value.kondisi === 'Tidak' ? '✓' : ''}</td>${cell(value.dasar)}</tr>`; };
  const checkHeader = (label: string) => `<tr class="label"><td width="50%">${label}</td><td width="10%">Kondisi diterima</td><td width="10%">Tidak diterima</td><td width="30%">Dasar penerimaan / kondisi</td></tr>`;
  const sectionRow = (label: string) => `<tr><td class="label" colspan="4">${label}</td></tr>`;
  const landRows = lands.map((land, index) => `<tr>${cell(`Lahan ${index + 1}`)}${cell(land.luas)}${cell(land.utama)}${cell(land.selingan)}${cell(land.kimia)}</tr>`).join('');
  const riskLabels: Record<string, string> = { sekitar: 'Lahan pertanian non-organik disekitarnya', aktivitas: 'Aktivitas non-organik di lahan sekitar', industri: 'Industri, jalan kendaraan, air limbah, dsb' };
  const riskRow = (key: string) => { const value = risks[key] || {}; const levelValue = value.level === 'Sedang' ? 'Menengah' : value.level; return `<tr>${cell(riskLabels[key] || key)}${['Rendah', 'Menengah', 'Tinggi'].map((level) => `<td class="center">${levelValue === level ? '✓' : ''}</td>`).join('')}${cell(value.dasar)}</tr>`; };
  const status = (value: string) => `[${data.statusBidang === value ? '✓' : ' '}] ${value}`;
  const organik = `${data.kelolaOrganik === 'Ya' ? '[✓]' : '[ ]'} Ya &nbsp;&nbsp;&nbsp; ${data.kelolaOrganik === 'Tidak' ? '[✓]' : '[ ]'} Tidak`;
  const firstPage = `${identity(data)}<p class="muted"><i>Lingkari atau contreng keterangan yang dipilih</i></p><table><tr><td width="55%">Bidang lahan, apakah sama dengan tahun lalu dan telah diregistrasi dalam dokumentasi internal?</td><td class="center"><b>${status('Baru')} &nbsp;&nbsp; ${status('Sama')} &nbsp;&nbsp; ${status('Penambahan')} &nbsp;&nbsp; ${status('Pengurangan')}</b></td></tr></table><table><tr class="label"><td width="20%">Bidang lahan</td><td width="15%">m²</td><td width="25%">Tanaman utama</td><td width="25%">Tanaman selingan</td><td width="15%">Terakhir pemakaian kimia terlarang</td></tr>${landRows}<tr class="label"><td class="number">Total Lahan m²:</td>${cell(data.totalLahanM2)}<td colspan="3"></td></tr></table><table><tr><td width="75%">Seluruh usahatani dilahan organic dikelola secara organik (seluruh tanaman)</td><td class="center"><b>${organik}</b></td></tr></table><table>${checkHeader('Kriteria / Aspek Pemeriksaan Kepatuhan Lapangan')}${sectionRow('1. Kriteria Production Ternak')}${checkRow('ternak_kondisi')}${checkRow('ternak_makan')}${sectionRow('2. Status lahan')}${checkRow('lahan_konversi')}${checkRow('lahan_pisah')}${sectionRow('Konservasi (sistem air, tanah,hutan, dsb)')}${checkRow('lahan_latih')}${checkRow('lahan_filter')}</table><div class="page-break"></div><table>${checkHeader('Kriteria')}${sectionRow('3. Manajemen Benih')}${checkRow('benih_sumber')}${checkRow('benih_gmo')}${checkRow('benih_kelola')}${sectionRow('4. Pemupukan organik')}${checkRow('puk_kimia')}${checkRow('puk_herbi')}${sectionRow('5. Manajemen hama')}${checkRow('hama_sakit')}${checkRow('hama_pest')}${sectionRow('6. Manajemen pola tanam')}${checkRow('pola_tanam')}</table>`;
  const secondPage = `<table>${checkHeader('Kriteria / Aspek Pemeriksaan Kepatuhan Lapangan (Lanjutan)')}${checkRow('pola_organik')}</table><div class="section">Tindakan pasca panen dan pengolahan</div><table>${checkHeader('Aktivitas')}${checkRow('pasca_olah')}${checkRow('pasca_kemasan')}${checkRow('pasca_simpan')}</table><div class="section">Manajemen resiko</div><table><tr class="label"><td width="40%">Resiko kontaminasi</td><td width="10%">Rendah</td><td width="10%">Menengah</td><td width="10%">Tinggi</td><td width="30%">Keterangan</td></tr>${riskRow('sekitar')}${riskRow('aktivitas')}${riskRow('industri')}<tr><td colspan="5"><b>Langkah yang diambil untuk mengurangi resiko :</b><br>${escapeHtml((risks as Record<string, unknown>).langkahMitigasi)}</td></tr></table><table><tr><td class="label" colspan="2">Rekomendasi persetujuan inspektor</td></tr><tr><td colspan="2"><b>Pemenuhan kondisi sebelumnya :</b><br>O baik &nbsp;&nbsp; O sebagian/diterima &nbsp;&nbsp; O hilang/tidak diterima &nbsp;&nbsp; O tidak ada kondisi tahun sebelumnya</td></tr><tr><td colspan="2"><b>Pemenuhan tahun ini :</b><br>O menyetujui tanpa syarat &nbsp;&nbsp; O menyetujui dengan syarat &nbsp;&nbsp; O hilang /tidak diterima</td></tr><tr><td colspan="2" style="height:45px"><b>Persyaratan (tindakan perbaikan) atau penjelasan :</b><br>${escapeHtml(recommendation.syaratPenjelasan)}</td></tr><tr><td width="50%" class="center" style="height:75px"><b>Petani</b><div class="signature-space"></div><u>( ${escapeHtml(data.namaPetani)} )</u></td><td width="50%" class="center"><b>Internal Inspektor</b><div class="signature-space"></div><u>( .................................... )</u></td></tr></table><table><tr style="background:#333;color:#fff"><td colspan="2"><b>Kesepakatan Keputusan oleh Operator ICS</b></td></tr><tr><td colspan="2"><b>Pemenuhan tahun ini :</b><br>□ Menyetujui Tanpa Syarat &nbsp;&nbsp; □ Menyetujui Dengan Syarat &nbsp;&nbsp; □ Tidak Dapat Disetujui</td></tr><tr><td colspan="2" style="height:40px"><b>Persyaratan tambahan atau sanksi :</b><br>${escapeHtml(data.sanksiTambahan)}</td></tr><tr><td colspan="2" class="center" style="height:75px"><b>Tanda tangan Manajer Persetujuan</b><div class="signature-space"></div><u>( .................................... )</u></td></tr></table>`;
  const firstPageOutput = firstPage.replace('<tr><td class="label" colspan="4">Konservasi (sistem air, tanah,hutan, dsb)</td></tr>', '<tr><td class="label" colspan="4">Konservasi (sistem air, tanah,hutan, dsb)</td></tr>' + checkRow('lahan_konservasi'));
  const secondPageOutput = secondPage
    .replace(/O baik[\s\S]*?O tidak ada kondisi tahun sebelumnya/, choiceOptions(String(recommendation.kondisiSebelum || ''), ['Baik', 'Sebagian/diterima', 'Hilang/tidak diterima', 'Tidak ada kondisi tahun sebelumnya']))
    .replace(/O menyetujui tanpa syarat[\s\S]*?O hilang \/tidak diterima/, choiceOptions(String(recommendation.tahunIni || ''), ['Menyetujui tanpa syarat', 'Menyetujui dengan syarat', 'Hilang /tidak diterima']))
    .replace(/□ Menyetujui Tanpa Syarat[\s\S]*?□ Tidak Dapat Disetujui/, choiceOptions(String(data.keputusan || ''), ['Menyetujui Tanpa Syarat', 'Menyetujui Dengan Syarat', 'Tidak Dapat Disetujui'], '□'))
    .replace(/^<table class="kop">[\s\S]*?<\/table>/, '');
  return firstPageOutput + secondPageOutput;
}

function lahanHtml(data: Record<string, unknown>) {
  const lands = (data.lahan || []) as Record<string, unknown>[];
  const seasons = (data.kalenderMasaTanam || []) as Record<string, unknown>[];
  const livestock = (data.ternak || []) as Record<string, unknown>[];
  const boundaries = (data.batasLahan || {}) as Record<string, Record<string, unknown>>;
  return `${identity(data)}<div class="section">Lahan Pertanian Organik (Semua lahan, termasuk konvensional)</div><table><tr class="label"><td width="25%">Nomer kode lahan (sama dengan peta)</td><td width="12%">Ha</td><td width="23%">Tanaman utama</td><td width="20%">Tanaman sisipan</td><td width="20%">Pemakaian terakhir bahan kimia (Produk &amp; Bln/Thn)</td></tr>${lands.map((land) => `<tr>${cell(land.kode)}${cell(land.luas)}${cell(land.utama)}${cell(land.sisipan)}${cell(land.kimia)}</tr>`).join('')}</table><div class="section">Kalender Masa Tanam &amp; Estimasi Produksi</div><table><tr class="label"><td>Masa Tanam</td><td>Tanggal tanam</td><td>Tanggal Panen</td><td>Produksi kg</td><td>Tanggal Pendataan</td></tr>${seasons.map((season, index) => `<tr>${cell(`MT ${index + 1}`)}${cell(season.tanam)}${cell(season.panen)}${cell(season.produksi)}${cell(season.pendataan)}</tr>`).join('')}</table><div class="section">Matriks Batas Koordinat Geografis Lahan</div><table><tr class="label"><td>Batas Lahan</td>${['Barat', 'Timur', 'Selatan', 'Utara'].map((direction) => `<td>${direction}</td>`).join('')}</tr>${(['jenis', 'pemilik', 'status'] as const).map((field) => `<tr>${cell(field === 'jenis' ? 'Jenis batas' : field === 'pemilik' ? 'Pemilik' : 'Status lahan')}${['Barat', 'Timur', 'Selatan', 'Utara'].map((direction) => cell(boundaries[direction]?.[field])).join('')}</tr>`).join('')}</table><div class="section">Produksi Ternak Pendukung Pupuk Alami</div><table><tr class="label"><td>Jenis Ternak</td><td>Jumlah</td><td>Pakan dan Pengobatan</td><td>Kondisi Ternak</td></tr>${livestock.map((animal) => `<tr>${cell(animal.jenis)}${cell(animal.jumlah)}${cell(animal.pakan)}${cell(animal.kondisi)}</tr>`).join('')}</table><table><tr><td width="50%">Saya, selaku petani, menyatakan bahwa informasi ini adalah benar dan saya telah memahami persyaratan Produksi Padi dan palawija Organik.<br><br>Tanggal : ${escapeHtml(data.tanggal || '')}<br>Tempat : Boyolali<div class="center"><br><br><b>Tanda Tangan Petani:</b><div class="signature-space"></div>( ${escapeHtml(data.namaPetani || '....................................')} )</div></td><td width="50%">Saya, sebagai petugas lapangan menegaskan bahwa informasi yang disebutkan diatas adalah benar.<div class="center"><br><br><b>Tanda Tangan Petugas Lapang ICS:</b><div class="signature-space"></div>( .................................... )</div></td></tr></table>`;
}

export async function GET(request: NextRequest) {
  const collectionName = request.nextUrl.searchParams.get('collection') || '';
  const id = request.nextUrl.searchParams.get('id') || '';
  if (!allowedCollections.has(collectionName) || !id) return NextResponse.json({ error: 'Koleksi atau ID tidak valid.' }, { status: 400 });
  try {
    const { adminAuth, adminDb } = getAdminServices();
    const authorization = request.headers.get('authorization');
    const idToken = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : '';
    if (!idToken) return NextResponse.json({ error: 'Token autentikasi tidak ditemukan.' }, { status: 401 });
    await adminAuth.verifyIdToken(idToken);
    const snapshot = await adminDb.collection(collectionName).doc(id).get();
    if (!snapshot.exists) return NextResponse.json({ error: 'Data tidak ditemukan.' }, { status: 404 });
    const data = snapshot.data() as Record<string, unknown>;
    
    // ✅ FIX: Validate form data before PDF generation
    validateFormData(collectionName, data);
    
    const content = collectionName === 'analisaUsaha' ? analisaHtml(data) : collectionName === 'inspeksiICS' ? inspeksiHtmlAppsScript(data) : lahanHtml(data);
    
    // ✅ FIX: Better browser creation error handling
    let browser;
    try {
      browser = await createPdfBrowser();
    } catch (browserError) {
      console.error('Browser initialization failed:', browserError);
      throw new Error(`Browser tidak dapat diinisialisasi: ${browserError instanceof Error ? browserError.message : 'Unknown error'}`);
    }
    
    try {
      const page = await browser.newPage();
      const isInspection = collectionName === 'inspeksiICS';
      await page.setContent(layout(collectionName === 'analisaUsaha' ? 'ANALISA USAHA TANI' : isInspection ? 'FORMULIR INSPEKSI INTERNAL' : 'FORMULIR PENDATAAN PETANI DAN LAHAN', content, isInspection ? '8.5in 14in' : 'A4', isInspection ? '0.5in' : '10mm', isInspection ? 'inspection' : collectionName === 'analisaUsaha' ? 'analisa' : ''), { waitUntil: 'load' });
      const pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
      return new NextResponse(Buffer.from(pdf), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${collectionName}-${id}.pdf"`, 'Cache-Control': 'no-store' } });
    } finally { 
      await browser.close(); 
    }
  } catch (error) {
    console.error('Gagal membuat PDF Appoli:', error);
    return NextResponse.json({ error: 'PDF gagal dibuat.', code: pdfErrorCode(error) }, { status: 500 });
  }
}
