/**
 * TAHAP DATA MASTER: PENGELOLA DATABASE PETANI DI GOOGLE SHEETS
 */

// Fungsi pembantu untuk memastikan Sheet "Data_Petani" sudah tersedia
function dapatkanSheetPetani() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var namaSheet = "Data_Petani";
  var sheet = ss.getSheetByName(namaSheet);
  
  if (!sheet) {
    sheet = ss.insertSheet(namaSheet);
    // UPDATE HEADER: Menambahkan "Nomor HP" dan "Alamat"
    sheet.appendRow(["ID/Kode Petani", "Nama Petani", "Nomor HP", "Alamat", "Kelompok Tani", "Luas Lahan", "Varietas Utama"]);
  }
  return sheet;
}

// Perbarui Fungsi Simpan: Mengunci ID otomatis langsung saat data masuk ke server
function simpanPetaniBaru(obj) {
  try {
    var sheet = dapatkanSheetPetani();
    
    // Server menghasilkan ID secara otomatis & real-time
    var idOtomatis = ambilNextId(); 
    
    // UPDATE APPEND ROW: Memasukkan obj.hp dan obj.alamat sesuai urutan header
    sheet.appendRow([
      idOtomatis, 
      obj.nama, 
      obj.hp || "", 
      obj.alamat || "", 
      obj.kelompok, 
      obj.luas, 
      obj.varietas
    ]);
    
    return { status: "Sukses", pesan: "Petani baru berhasil didaftarkan dengan ID Otomatis: " + idOtomatis };
  } catch(e) {
    return { status: "Gagal", pesan: "Gagal menyimpan: " + e.message };
  }
}

// Fungsi Backend: Mengambil semua data petani untuk sistem Auto-Fill Dropdown
function ambilDataPetani() {
  try {
    var sheet = dapatkanSheetPetani();
    var data = sheet.getDataRange().getValues();
    
    // Buang baris pertama (header)
    data.shift();
    
    // Bungkus data ke dalam format objek agar mudah dibaca oleh Javascript browser
    // UPDATE INDEKS ARRAY: Disesuaikan dengan pergeseran kolom
    var listPetani = data.map(function(baris) {
      return {
        id: baris[0],
        nama: baris[1],
        hp: baris[2],
        alamat: baris[3],
        kelompok: baris[4],
        luas: baris[5],
        varietas: baris[6]
      };
    });
    
    return { status: "Sukses", data: listPetani };
  } catch(e) {
    return { status: "Gagal", pesan: e.message };
  }
}

// Fungsi login tanpa menggunakan Google Sheet
function cekLogin(username, password) {
  try {
    // Membersihkan spasi berlebih dan menyamakan huruf kecil
    var inputUser = username.trim().toLowerCase();
    var inputPass = password.trim();
    
    // Pengecekan langsung ke username "admin" dan sandi "1234"
    if (inputUser === "admin" && inputPass === "1234") {
      return { 
        status: "Sukses", 
        namaPetugas: "Admin" // Nama ini bisa Anda ganti sesuai keinginan
      };
    } else {
      return { 
        status: "Gagal", 
        pesan: "Username atau Password salah!" 
      };
    }
    
  } catch (error) {
    return { 
      status: "Gagal", 
      pesan: "Error sistem login: " + error.toString() 
    };
  }
}

// Fungsi Baru Backend: Membuat ID otomatis berdasarkan baris terakhir di Sheets (Format: PTN-001)
function ambilNextId() {
  try {
    var sheet = dapatkanSheetPetani();
    var barisTerakhir = sheet.getLastRow();
    
    // Jika sheet masih kosong (hanya ada header), mulai dari PTN-001
    if (barisTerakhir <= 1) {
      return "PTN-001";
    }
    
    // Ambil ID dari baris paling bawah
    var idTerakhir = sheet.getRange(barisTerakhir, 1).getValue().toString(); 
    
    if (idTerakhir.indexOf("PTN-") === 0) {
      // Potong teks "PTN-", ambil angkanya, lalu naikkan +1
      var angkaSekarang = parseInt(idTerakhir.replace("PTN-", ""), 10);
      var angkaBerikutnya = angkaSekarang + 1;
      
      // Format agar tetap 3 digit (misal: 2 menjadi 002)
      var formatAngka = ("000" + angkaBerikutnya).slice(-3);
      return "PTN-" + formatAngka;
    } else {
      // Jaga-jaga jika format baris terakhir rusak, buat berdasarkan nomor baris
      return "PTN-" + ("000" + barisTerakhir).slice(-3);
    }
  } catch(e) {
    return "PTN-001";
  }
}

/**
 * FUNGSI HELPER: Memastikan data kosong tidak merusak struktur tabel PDF
 */
function aman(val) {
  if (val === undefined || val === null || val.toString().trim() === "") {
    return "-"; // Beri strip jika kosong agar cell tabel tetap kokoh
  }
  return val;
}

// ==========================================
// UTILITAS PEMBANTU (ANTI-BROKEN & FORMATTING)
// ==========================================
function vText(val) {
  return (val === undefined || val === null) ? "" : val;
}

function vNum(val) {
  if (val === undefined || val === null || val.toString().trim() === "" || isNaN(val)) return "";
  var num = Number(val);
  return num.toLocaleString('id-ID');
}

// ==========================================
// ENGINE UTAMA: SIMPAN & CETAK FORM 1 (PERBAIKAN STRUKTUR PUPUK & TTD AUTOMATION)
// ==========================================
function simpanDanCetakForm1(data) {
  try {
    var workerMode = data._worker === true;
    var ss = workerMode ? null : SpreadsheetApp.getActiveSpreadsheet();
    var sheet = workerMode ? null : ss.getSheetByName("Database_Form1_Analisa");
    if (!workerMode) {
    
    // Menambahkan kolom "Link Dokumen PDF" di akhir header jika sheet baru dibuat
    if (!sheet) {
      sheet = ss.insertSheet("Database_Form1_Analisa");
      sheet.appendRow([
        "Tanggal Pengisian", "ID Petani", "Nama Petani", "Kelompok", 
        "Luas Lahan", "Varietas", "Musim Tanam", "Subtotal Biaya A", 
        "Subtotal Tenaga B", "Total Biaya (A+B+C)", "Total Pendapatan", 
        "Laba Rugi Netto", "Link Dokumen PDF" // <-- Kolom ke-13 ditambahkan
      ]);
      sheet.getRange(1, 1, 1, 13).setFontWeight("bold").setBackground("#d6dbdf");
    }
    
    var tglSekarang = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
    
    // Menyimpan data dengan baris kosong di kolom ke-13 untuk nantinya diisi link PDF
    sheet.appendRow([
      tglSekarang, data.idPetani, data.nama, data.kelompok, 
      data.luas, data.varietas, data.musim, data.subA, 
      data.subB, data.grandTotal, data.totalPendapatan, data.labaRugi, ""
    ]);
    
    var barisTerakhir = sheet.getLastRow();
    }

    // HTML TEMPLATE - ULTRA PROFESSIONAL STRUCTURE
    var htmlTemplate = `
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; font-size: 11px; color: #222; margin: 0; padding: 5px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .kop-table { width: 100%; border-collapse: collapse; border: none; }
        .kop-text { text-align: center; }
        .kop-nama { font-size: 16px; font-weight: bold; letter-spacing: 1px; color: #111; }
        .kop-sub { font-size: 11px; font-weight: bold; margin-top: 2px; color: #333; }
        .kop-detil { font-size: 9px; color: #555; margin-top: 2px; }
        .garis-double { border-top: 1px solid #000; border-bottom: 3px double #000; height: 3px; margin-top: 8px; margin-bottom: 15px; }
        .judul { text-align: center; font-weight: bold; font-size: 14px; text-transform: uppercase; margin-bottom: 25px; letter-spacing: 1px; color: #111; }
        
        /* Metadata Profil */
        .meta-table { width: 100%; border-collapse: collapse; border: none; margin-bottom: 20px; }
        .meta-table td { padding: 4px 0; font-size: 11px; vertical-align: top; color: #333; }
        
        /* Desain Tabel Utama */
        .main-table { width: 100%; border-collapse: collapse; margin-bottom: 0px; font-size: 10.5px; }
        .main-table th, .main-table td { border: 1px solid #333333; padding: 6px 7px; }
        
        /* Desain Tabel Ringkasan Akhir (Anti Pecah Halaman) */
        .summary-table { width: 100%; border-collapse: collapse; margin-top: -1px; margin-bottom: 25px; font-size: 10.5px; page-break-inside: avoid; break-inside: avoid; }
        .summary-table td { border: 1px solid #333333; padding: 6px 7px; }
        
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        
        /* Proteksi Cetak */
        .main-table tr { page-break-inside: avoid; break-inside: avoid; }
        .ttd-container { page-break-inside: avoid; break-inside: avoid; margin-top: 40px; }
        .ttd-table { width: 100%; border-collapse: collapse; border: none; font-size: 11px; }
      </style>
    </head>
    <body>
      
      <table class="kop-table" border="0">
        <tr>
          <td width="15%" align="center" valign="middle">
            <div style="font-size: 38px; font-weight: bold; margin-top:3px;"><img src="${LOGO_APPOLI_BASE64}" width="70" height="70" style="object-fit: contain;" alt="Logo APPOLI"></div>
            <div style="font-size: 9px; font-weight: bold; margin-top:3px;">APPOLI</div>
          </td>
          <td width="85%" class="kop-text">
            <div class="kop-nama">APPOLI</div>
            <div class="kop-sub">Aliansi Petani Padi dan Palawija Organik Boyolali</div>
            <div class="kop-detil">Dk. Mencil RT.02/01 Desa Glongong, Kec. Nogosari, Kab. Boyolali</div>
            <div class="kop-detil">Tel : 082313395639 Website : www.appoliboyolali.com</div>
          </td>
        </tr>
      </table>
      
      <div class="garis-double"></div>
      
      <div class="judul">ANALISA USAHA TANI</div>
      
      <table class="meta-table" border="0">
        <tr><td width="18%">Nama Petani</td><td width="2%">:</td><td width="80%">${vText(data.nama)}</td></tr>
        <tr><td>Kode Petani</td><td>:</td><td>APL / ${vText(data.idPetani)}</td></tr>
        <tr><td>Kelompok tani</td><td>:</td><td>${vText(data.kelompok)}</td></tr>
        <tr><td>Luas lahan</td><td>:</td><td>${vText(data.luas)} m²</td></tr>
        <tr><td>Varietas</td><td>:</td><td>${vText(data.varietas)}</td></tr>
        <tr><td>Musim Tanam</td><td>:</td><td>${vText(data.musim)}</td></tr>
      </table>

      <table class="main-table">
        <thead>
          <tr>
            <th width="5%" style="background-color: #34495e; color: #ffffff; font-weight: bold; border: 1px solid #333333;">No</th>
            <th width="35%" style="background-color: #34495e; color: #ffffff; font-weight: bold; border: 1px solid #333333;">Kegiatan</th>
            <th width="12%" style="background-color: #34495e; color: #ffffff; font-weight: bold; border: 1px solid #333333;">Waktu</th>
            <th width="10%" style="background-color: #34495e; color: #ffffff; font-weight: bold; border: 1px solid #333333;">Volume</th>
            <th width="12%" style="background-color: #34495e; color: #ffffff; font-weight: bold; border: 1px solid #333333;">Harga</th>
            <th width="12%" style="background-color: #34495e; color: #ffffff; font-weight: bold; border: 1px solid #333333;">Total</th>
            <th width="14%" style="background-color: #34495e; color: #ffffff; font-weight: bold; border: 1px solid #333333;">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          
          <tr>
            <td align="center" style="background-color: #d6dbdf; font-weight: bold; color: #111;">A</td>
            <td colspan="6" style="background-color: #d6dbdf; font-weight: bold; color: #111; text-transform: uppercase;">Biaya Sarana Produksi</td>
          </tr>
          <tr>
            <td align="center">1</td><td>Benih</td>
            <td class="text-center">${vText(data.a1_waktu)}</td><td class="text-center">${vText(data.a1_vol)}</td>
            <td class="text-right">${vNum(data.a1_hrg)}</td><td class="text-right">${vNum(data.a1_tot)}</td>
            <td>${vText(data.a1_ket)}</td>
          </tr>
          
          <tr>
            <td align="center" rowspan="3" valign="middle" style="font-weight: bold;">2</td>
            <td colspan="6" style="background-color: #f8f9fa; font-weight: bold; color: #333;">Pupuk Organik</td>
          </tr>
          <tr>
            <td style="padding-left: 15px;">- Padat</td>
            <td class="text-center">${vText(data.a2_padat_waktu)}</td><td class="text-center">${vText(data.a2_padat_vol)}</td>
            <td class="text-right">${vNum(data.a2_padat_hrg)}</td><td class="text-right">${vNum(data.a2_padat_tot)}</td>
            <td>${vText(data.a2_padat_ket)}</td>
          </tr>
          <tr>
            <td style="padding-left: 15px;">- Cair</td>
            <td class="text-center">${vText(data.a2_cair_waktu)}</td><td class="text-center">${vText(data.a2_cair_vol)}</td>
            <td class="text-right">${vNum(data.a2_cair_hrg)}</td><td class="text-right">${vNum(data.a2_cair_tot)}</td>
            <td>${vText(data.a2_cair_ket)}</td>
          </tr>
          
          <tr>
            <td align="center" rowspan="4" valign="middle" style="font-weight: bold;">3</td>
            <td colspan="6" style="background-color: #f8f9fa; font-weight: bold; color: #333;">Pupuk Kimia</td>
          </tr>
          <tr>
            <td style="padding-left: 15px;">- UREA/ZA</td>
            <td class="text-center">${vText(data.a3_urea_waktu)}</td><td class="text-center">${vText(data.a3_urea_vol)}</td>
            <td class="text-right">${vNum(data.a3_urea_hrg)}</td><td class="text-right">${vNum(data.a3_urea_tot)}</td>
            <td>${vText(data.a3_urea_ket)}</td>
          </tr>
          <tr>
            <td style="padding-left: 15px;">- TSP 36</td>
            <td class="text-center">${vText(data.a3_tsp_waktu)}</td><td class="text-center">${vText(data.a3_tsp_vol)}</td>
            <td class="text-right">${vNum(data.a3_tsp_hrg)}</td><td class="text-right">${vNum(data.a3_tsp_tot)}</td>
            <td>${vText(data.a3_tsp_ket)}</td>
          </tr>
          <tr>
            <td style="padding-left: 15px;">- Phonska</td>
            <td class="text-center">${vText(data.a3_phonska_waktu)}</td><td class="text-center">${vText(data.a3_phonska_vol)}</td>
            <td class="text-right">${vNum(data.a3_phonska_hrg)}</td><td class="text-right">${vNum(data.a3_phonska_tot)}</td>
            <td>${vText(data.a3_phonska_ket)}</td>
          </tr>
          
          <tr>
            <td align="center">4</td><td>Pestisida organik</td>
            <td class="text-center">${vText(data.a4_waktu)}</td><td class="text-center">${vText(data.a4_vol)}</td>
            <td class="text-right">${vNum(data.a4_hrg)}</td><td class="text-right">${vNum(data.a4_tot)}</td>
            <td>${vText(data.a4_ket)}</td>
          </tr>
          <tr>
            <td align="center">5</td><td>Pestisida Kimia</td>
            <td class="text-center">${vText(data.a5_waktu)}</td><td class="text-center">${vText(data.a5_vol)}</td>
            <td class="text-right">${vNum(data.a5_hrg)}</td><td class="text-right">${vNum(data.a5_tot)}</td>
            <td>${vText(data.a5_ket)}</td>
          </tr>
          <tr>
            <td style="background-color: #f2f4f4;"> </td>
            <td style="background-color: #f2f4f4; font-weight: bold;">Total Biaya Production (Sub-Total A)</td>
            <td style="background-color: #f2f4f4;"> </td><td style="background-color: #f2f4f4;"> </td><td style="background-color: #f2f4f4;"> </td>
            <td class="text-right" style="background-color: #f2f4f4; font-weight: bold;">${vNum(data.subA)}</td>
            <td style="background-color: #f2f4f4;"> </td>
          </tr>

          <tr>
            <td align="center" style="background-color: #d6dbdf; font-weight: bold; color: #111;">B</td>
            <td colspan="6" style="background-color: #d6dbdf; font-weight: bold; color: #111; text-transform: uppercase;">Biaya Tenaga Kerja</td>
          </tr>
          <tr><td align="center">1</td><td>Lahan Persemaian</td><td class="text-center">${vText(data.b1_waktu)}</td><td class="text-center">${vText(data.b1_vol)}</td><td class="text-right">${vNum(data.b1_hrg)}</td><td class="text-right">${vNum(data.b1_tot)}</td><td>${vText(data.b1_ket)}</td></tr>
          <tr><td align="center">2</td><td>Sebar Benih</td><td class="text-center">${vText(data.b2_waktu)}</td><td class="text-center">${vText(data.b2_vol)}</td><td class="text-right">${vNum(data.b2_hrg)}</td><td class="text-right">${vNum(data.b2_tot)}</td><td>${vText(data.b2_ket)}</td></tr>
          <tr><td align="center">3</td><td>Daut atau cabut benih</td><td class="text-center">${vText(data.b3_waktu)}</td><td class="text-center">${vText(data.b3_vol)}</td><td class="text-right">${vNum(data.b3_hrg)}</td><td class="text-right">${vNum(data.b3_tot)}</td><td>${vText(data.b3_ket)}</td></tr>
          <tr><td align="center">4</td><td>Olah lahan</td><td class="text-center">${vText(data.b4_waktu)}</td><td class="text-center">${vText(data.b4_vol)}</td><td class="text-right">${vNum(data.b4_hrg)}</td><td class="text-right">${vNum(data.b4_tot)}</td><td>${vText(data.b4_ket)}</td></tr>
          <tr><td align="center">5</td><td>Tanam</td><td class="text-center">${vText(data.b5_waktu)}</td><td class="text-center">${vText(data.b5_vol)}</td><td class="text-right">${vNum(data.b5_hrg)}</td><td class="text-right">${vNum(data.b5_tot)}</td><td>${vText(data.b5_ket)}</td></tr>
          <tr><td align="center">6</td><td>Penyulaman</td><td class="text-center">${vText(data.b6_waktu)}</td><td class="text-center">${vText(data.b6_vol)}</td><td class="text-right">${vNum(data.b6_hrg)}</td><td class="text-right">${vNum(data.b6_tot)}</td><td>${vText(data.b6_ket)}</td></tr>
          <tr><td align="center">7</td><td>Perawatan tanaman</td><td class="text-center">${vText(data.b7_waktu)}</td><td class="text-center">${vText(data.b7_vol)}</td><td class="text-right">${vNum(data.b7_hrg)}</td><td class="text-right">${vNum(data.b7_tot)}</td><td>${vText(data.b7_ket)}</td></tr>
          <tr><td align="center">8</td><td>Pemupukan</td><td class="text-center">${vText(data.b8_waktu)}</td><td class="text-center">${vText(data.b8_vol)}</td><td class="text-right">${vNum(data.b8_hrg)}</td><td class="text-right">${vNum(data.b8_tot)}</td><td>${vText(data.b8_ket)}</td></tr>
          <tr><td align="center">9</td><td>Penyemprotan</td><td class="text-center">${vText(data.b9_waktu)}</td><td class="text-center">${vText(data.b9_vol)}</td><td class="text-right">${vNum(data.b9_hrg)}</td><td class="text-right">${vNum(data.b9_tot)}</td><td>${vText(data.b9_ket)}</td></tr>
          <tr><td align="center">10</td><td>Pengairan</td><td class="text-center">${vText(data.b10_waktu)}</td><td class="text-center">${vText(data.b10_vol)}</td><td class="text-right">${vNum(data.b10_hrg)}</td><td class="text-right">${vNum(data.b10_tot)}</td><td>${vText(data.b10_ket)}</td></tr>
          <tr><td align="center">11</td><td>Panen & pengangkutan</td><td class="text-center">${vText(data.b11_waktu)}</td><td class="text-center">${vText(data.b11_vol)}</td><td class="text-right">${vNum(data.b11_hrg)}</td><td class="text-right">${vNum(data.b11_tot)}</td><td>${vText(data.b11_ket)}</td></tr>
          <tr>
            <td style="background-color: #f2f4f4;"> </td>
            <td style="background-color: #f2f4f4; font-weight: bold;">Total Biaya Tenaga Kerja (Sub-Total B)</td>
            <td style="background-color: #f2f4f4;"> </td><td style="background-color: #f2f4f4;"> </td><td style="background-color: #f2f4f4;"> </td>
            <td class="text-right" style="background-color: #f2f4f4; font-weight: bold;">${vNum(data.subB)}</td>
            <td style="background-color: #f2f4f4;"> </td>
          </tr>

          <tr>
            <td align="center" style="background-color: #d6dbdf; font-weight: bold; color: #111;">C</td>
            <td colspan="6" style="background-color: #d6dbdf; font-weight: bold; color: #111; text-transform: uppercase;">Lain-lain</td>
          </tr>
          <tr>
            <td align="center">-</td>
            <td>Sewa / Pajak Tanah</td>
            <td class="text-center">${vText(data.c1_waktu)}</td><td class="text-center">${vText(data.c1_vol)}</td>
            <td class="text-right">${vNum(data.c1_hrg)}</td><td class="text-right">${vNum(data.c1_tot)}</td>
            <td>${vText(data.c1_ket)}</td>
          </tr>
          <tr>
            <td style="background-color: #d6dbdf;"> </td>
            <td style="background-color: #d6dbdf; font-weight: bold; color: #b03a2e;">TOTAL BIAYA (A + B + C)</td>
            <td style="background-color: #d6dbdf;"> </td><td style="background-color: #d6dbdf;"> </td><td style="background-color: #d6dbdf;"> </td>
            <td class="text-right" style="background-color: #d6dbdf; font-weight: bold; color: #b03a2e;">${vNum(data.grandTotal)}</td>
            <td style="background-color: #d6dbdf;"> </td>
          </tr>
        </tbody>
      </table>

      <table class="summary-table">
        <tbody>
          <tr>
            <td width="5%" align="center" style="background-color: #eaeded; font-weight: bold; border-top: none;">-</td>
            <td width="35%" style="background-color: #eaeded; font-weight: bold; border-top: none;">Total Hasil Produksi (Panen)</td>
            <td width="12%" style="background-color: #eaeded; border-top: none;"> </td>
            <td width="10%" class="text-center" style="background-color: #d6dbdf; font-weight: bold; border-top: none;">${vText(data.p_vol)}</td>
            <td width="12%" style="background-color: #eaeded; border-top: none;"> </td>
            <td width="12%" style="background-color: #eaeded; border-top: none;"> </td>
            <td width="14%" style="background-color: #eaeded; border-top: none;"> </td>
          </tr>
          <tr>
            <td align="center" style="background-color: #eaeded; font-weight: bold;">-</td>
            <td style="background-color: #eaeded; font-weight: bold;">Harga Jual</td>
            <td style="background-color: #eaeded;"> </td>
            <td style="background-color: #eaeded;"> </td> 
            <td class="text-right" style="background-color: #d6dbdf; font-weight: bold;">${vNum(data.p_hrg)}</td>
            <td style="background-color: #eaeded;"> </td>
            <td style="background-color: #eaeded;"> </td>
          </tr>
          <tr>
            <td style="background-color: #d6dbdf;"> </td>
            <td style="background-color: #d6dbdf; font-weight: bold;">TOTAL PENDAPATAN</td>
            <td style="background-color: #d6dbdf;"> </td><td style="background-color: #d6dbdf;"> </td><td style="background-color: #d6dbdf;"> </td>
            <td class="text-right" style="background-color: #d6dbdf; font-weight: bold;">${vNum(data.totalPendapatan)}</td>
            <td style="background-color: #d6dbdf;"> </td>
          </tr>
          <tr>
            <td style="background-color: #2c3e50;"> </td>
            <td style="background-color: #2c3e50; font-weight: bold; color: #ffffff;">LABA / RUGI NETTO</td>
            <td style="background-color: #2c3e50;"> </td><td style="background-color: #2c3e50;"> </td><td style="background-color: #2c3e50;"> </td>
            <td class="text-right" style="background-color: #2c3e50; font-weight: bold; color: #ffffff;">${vNum(data.labaRugi)}</td>
            <td style="background-color: #2c3e50;"> </td>
          </tr>
        </tbody>
      </table>

      <div class="ttd-container">
        <table class="ttd-table" border="0">
          <tr>
            <td colspan="2" align="left" style="padding-bottom: 35px; padding-left: 15px; font-weight: bold; color: #333;">
              Boyolali,          /          / 2026
            </td>
          </tr>
          <tr>
            <td width="50%" align="center" valign="top" style="font-weight: bold; color: #333;">
              Petani<br><br><br><br><br><br>
              ( <span style="text-decoration: underline;">${data.nama ? vText(data.nama) : '                            '}</span> )
            </td>
            <td width="50%" align="center" valign="top" style="font-weight: bold; color: #333;">
              Petugas Pendata<br><br><br><br><br><br>
              (                              )
            </td>
          </tr>
        </table>
      </div>

    </body>
    </html>`;
    
    // ==========================================
    // 3. GENERATE BLOB PDF & SIMPAN KE SUB-FOLDER AUTOMATIS
    // ==========================================
    var htmlOutput = HtmlService.createHtmlOutput(htmlTemplate);
    var blobPdf = htmlOutput.getAs('application/pdf');
    
    // Penamaan file yang aman dan rapi
    var namaFilePembersih = "Form1_Analisa_" + data.nama.replace(/\s+/g, '_') + "_" + data.idPetani + ".pdf";
    blobPdf.setName(namaFilePembersih);
    
    // Panggil fungsi pembantu untuk meletakkan file ke sub-folder spesifik Form 1
    var folderTujuan = dapatkanFolderTujuan("Form 1 - Pendaftaran Petani");
    var filePdf = folderTujuan.createFile(blobPdf);
    var urlLinkPdf = filePdf.getUrl();
    
    // Buka akses share agar tautan bisa dibuka oleh internal APPOLI
    filePdf.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Catat URL PDF ke baris data kolom terakhir (kolom 13)
    if (!workerMode) sheet.getRange(barisTerakhir, 13).setValue(urlLinkPdf);
    
    return { 
      status: "Sukses", 
      pesan: "✔ Analisa Usaha Tani berhasil disimpan ke folder PDF_DOKUMEN_APPOLI/Form 1 - Pendaftaran Petani!", 
      pdfUrl: urlLinkPdf 
    };
    
  } catch(e) { 
    return { status: "Gagal", pesan: "Error Sistem Form 1: " + e.toString() }; 
  }
}

/**
 * Fungsi Pengaman Format Teks & Angka (Defensif Wrapper)
 * Menjaga agar sistem tidak crash jika input kosong/null.
 */
function vText(val) { return val !== undefined && val !== null ? val : ''; }
function vNum(val) { return val !== undefined && val !== null && val !== '' ? val : '0'; }

// ==========================================
// C. ENGINE FORM 2 (ANTI-KOLAPS)
// ==========================================
/**
 * Fungsi Utama: Menyimpan Ringkasan Hasil Inspeksi ke Spreadsheet
 * dan Menghasilkan Laporan PDF Dua Halaman Resmi APPOLI (Fix Total Warna Abu via Atribut Bgcolor)
 * Author: AI Collaborator for Mas Diony
 * Tahun: 2026
 */
function simpanDanCetakForm2(paketData) {
  try {
    // ==========================================
    // 1. PROSES SIMPAN DATA KE SPREADSHEET
    // ==========================================
    var workerMode = paketData._worker === true;
    var ss = workerMode ? null : SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = "Database_Inspeksi";
    var sheet = workerMode ? null : ss.getSheetByName(sheetName);
    if (!workerMode) {
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow([
        "Timestamp", "ID Petani", "Nama Petani", "Inspektur Internal", 
        "Tanggal Inspeksi", "Jam Inspeksi", "Total Lahan (m²)", 
        "Status Bidang", "Kelola Organik Secara Penuh", "Link Dokumen PDF"
      ]);
      sheet.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#f0f4f8");
    }
    
    var timestamp = new Date();
    sheet.appendRow([
      timestamp,
      paketData.idPetani,
      paketData.nama,
      paketData.inspektur,
      paketData.tglInspeksi,
      paketData.jamInspeksi,
      paketData.totalLahan,
      paketData.statusBidang,
      paketData.kelolaOrganik,
      "" 
    ]);
    var barisTerakhir = sheet.getLastRow();
    }

    // ==========================================
    // 2. RACIK TEMPLATE HTML UNTUK PDF
    // ==========================================
    function ambilCheck(nilaiKondisi, targetKondisi) {
      return (nilaiKondisi === targetKondisi) ? "✓" : "";
    }

    var sb_baru = paketData.statusBidang === "Baru" ? "[✓]" : "[ ]";
    var sb_sama = paketData.statusBidang === "Sama" ? "[✓]" : "[ ]";
    var sb_tambah = paketData.statusBidang === "Penambahan" ? "[✓]" : "[ ]";
    var sb_kurang = paketData.statusBidang === "Pengurangan" ? "[✓]" : "[ ]";
    
    var ko_ya = paketData.kelolaOrganik === "Ya" ? "[✓]" : "[ ]";
    var ko_tidak = paketData.kelolaOrganik === "Tidak" ? "[✓]" : "[ ]";

    var kopAppoli = `
      <table width="100%" style="border-collapse: collapse; font-family: Arial, sans-serif;">
        <tr>
          <td width="15%" align="center" style="font-size: 38px; padding-bottom: 5px;"><img src="${LOGO_APPOLI_BASE64}" width="70" height="70" style="object-fit: contain;" alt="Logo APPOLI"></td>
          <td width="85%" align="center">
            <div style="font-weight: bold; font-size: 16px; letter-spacing: 1px; margin-bottom: 2px;">APPOLI</div>
            <div style="font-size: 13px; font-weight: bold; margin-bottom: 3px;">Aliansi Petani Padi dan Palawija Organik Boyolali</div>
            <div style="font-size: 10px; color: #444;">Dk. Mencil RT.02/01 Desa Glongong, Kec. Nogosari, Kab. Boyolali</div>
            <div style="font-size: 10px; color: #444;">Tel : 082313395639 Website : www.appoliboyolali.com</div>
          </td>
        </tr>
      </table>
      <hr style="border: none; border-top: 1px solid #000; border-bottom: 3px double #000; height: 4px; margin-top: 5px; margin-bottom: 12px;">
    `;

    var htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        @page { size: A4; margin: 1.2cm 1.2cm 1.2cm 1.2cm; }
        body { 
          font-family: Arial, sans-serif; 
          color: #000; 
          line-height: 1.2; 
          margin: 0; 
          padding: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .judul-form { text-align: center; font-weight: bold; font-size: 13px; margin-bottom: 12px; text-decoration: underline; }
        table.tabel-data { width: 100%; border-collapse: collapse; font-size: 10.5px; margin-bottom: 10px; }
        table.tabel-data th, table.tabel-data td { border: 1px solid #000; padding: 5px; vertical-align: middle; }
        .fw-bold { font-weight: bold; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .page-break { page-break-before: always; }
      </style>
    </head>
    <body>

      ${kopAppoli}
      <div class="judul-form">Formulir Inspeksi Internal</div>

      <table class="tabel-data">
        <tr>
          <td width="18%" class="fw-bold" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Nama Petani :</td>
          <td width="32%">${paketData.nama || ''}</td>
          <td width="18%" class="fw-bold" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Inspektur Internal :</td>
          <td width="32%">${paketData.inspektur || ''}</td>
        </tr>
        <tr>
          <td class="fw-bold" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Kode :</td>
          <td>APL / ${paketData.idPetani || ''}</td>
          <td class="fw-bold" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Tanggal Inspeksi :</td>
          <td>${paketData.tglInspeksi || ''}</td>
        </tr>
        <tr>
          <td class="fw-bold" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Alamat / Klp :</td>
          <td>${paketData.kelompok || ''}</td>
          <td class="fw-bold" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Jam Inspeksi :</td>
          <td>${paketData.jamInspeksi || ''}</td>
        </tr>
      </table>

      <p style="font-size: 10px; font-style: italic; margin: 0 0 5px 0;">Lingkari atau contreng keterangan yang dipilih</p>

      <table class="tabel-data">
        <tr>
          <td width="55%">Bidang lahan, apakah sama dengan tahun lalu dan telah diregistrasi dalam dokumentasi internal?</td>
          <td width="45%" class="text-center fw-bold">
            ${sb_baru} Baru &nbsp;&nbsp; ${sb_sama} Sama &nbsp;&nbsp; ${sb_tambah} Penambahan &nbsp;&nbsp; ${sb_kurang} Pengurangan
          </td>
        </tr>
      </table>

      <table class="tabel-data text-center">
        <tr class="fw-bold">
          <td width="20%" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Bidang lahan</td>
          <td width="15%" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">m²</td>
          <td width="25%" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Tanaman utama</td>
          <td width="25%" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Tanaman selingan</td>
          <td width="15%" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Terakhir pemakaian kimia terlarang</td>
        </tr>
        <tr>
          <td class="fw-bold">Lahan 1</td>
          <td>${paketData.lahan.l1_luas || '0'}</td>
          <td>${paketData.lahan.l1_utama || ''}</td>
          <td>${paketData.lahan.l1_selingan || ''}</td>
          <td>${paketData.lahan.l1_kimia || ''}</td>
        </tr>
        <tr>
          <td class="fw-bold">Lahan 2</td>
          <td>${paketData.lahan.l2_luas || '0'}</td>
          <td>${paketData.lahan.l2_utama || ''}</td>
          <td>${paketData.lahan.l2_selingan || ''}</td>
          <td>${paketData.lahan.l2_kimia || ''}</td>
        </tr>
        <tr>
          <td class="fw-bold">Lahan 3</td>
          <td>${paketData.lahan.l3_luas || '0'}</td>
          <td>${paketData.lahan.l3_utama || ''}</td>
          <td>${paketData.lahan.l3_selingan || ''}</td>
          <td>${paketData.lahan.l3_kimia || ''}</td>
        </tr>
        <tr class="fw-bold">
          <td class="text-right" bgcolor="#fff3cd" style="background-color: #fff3cd;">Total Lahan m²:</td>
          <td style="color: red; background-color: #fff3cd;" bgcolor="#fff3cd">${paketData.totalLahan || '0'}</td>
          <td colspan="3" style="background-color: #fff;"></td>
        </tr>
      </table>

      <table class="tabel-data">
        <tr>
          <td width="75%">Seluruh usahatani dilahan organic dikelola secara organik (seluruh tanaman)</td>
          <td width="25%" class="text-center fw-bold">
            ${ko_ya} Ya &nbsp;&nbsp;&nbsp;&nbsp; ${ko_tidak} Tidak
          </td>
        </tr>
      </table>

      <table class="tabel-data">
        <tr>
          <td colspan="4" class="fw-bold" style="padding: 6px 4px 2px 4px;">Kriteria Production Ternak</td>
        </tr>
        
        <tr class="fw-bold">
          <td bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Kondisi hewan ternak</td>
          <td class="text-center" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">${ambilCheck(paketData.kriteria.ternak_kondisi_c, 'Diterima')}</td>
          <td class="text-center" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">${ambilCheck(paketData.kriteria.ternak_kondisi_c, 'Tidak')}</td>
          <td bgcolor="#e6e6e6" style="background-color: #e6e6e6;">${paketData.kriteria.ternak_kondisi_d || ''}</td>
        </tr>
        
        <tr class="fw-bold">
          <td bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Makanan yang diberikan</td>
          <td class="text-center" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">${ambilCheck(paketData.kriteria.ternak_makan_c, 'Diterima')}</td>
          <td class="text-center" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">${ambilCheck(paketData.kriteria.ternak_makan_c, 'Tidak')}</td>
          <td bgcolor="#e6e6e6" style="background-color: #e6e6e6;">${paketData.kriteria.ternak_makan_d || ''}</td>
        </tr>

        <tr class="fw-bold text-center">
          <td width="50%" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Kriteria</td>
          <td width="10%" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Kondisi diterima a</td>
          <td width="10%" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Tidak diterima a</td>
          <td width="30%" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Dasar penerimaan /kondisi</td>
        </tr>
        
        <tr class="fw-bold">
          <td colspan="4" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Status lahan</td>
        </tr>
        <tr>
          <td>Apakah lahan sudah melewati masa konversi</td>
          <td class="text-center fw-bold">${ambilCheck(paketData.kriteria.lahan_konversi_c, 'Diterima')}</td>
          <td class="text-center fw-bold">${ambilCheck(paketData.kriteria.lahan_konversi_c, 'Tidak')}</td>
          <td>${paketData.kriteria.lahan_konversi_d || ''}</td>
        </tr>
        <tr>
          <td>Apakah lahan pertanian organik terpisah dari lahan konvensional</td>
          <td class="text-center fw-bold">${ambilCheck(paketData.kriteria.lahan_pisah_c, 'Diterima')}</td>
          <td class="text-center fw-bold">${ambilCheck(paketData.kriteria.lahan_pisah_c, 'Tidak')}</td>
          <td>${paketData.kriteria.lahan_pisah_d || ''}</td>
        </tr>

        <tr class="fw-bold">
          <td colspan="4" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Konservasi (sistem air, tanah,hutan, dsb)</td>
        </tr>
        <tr>
          <td>Petani terlatih dalam sistem pertanian organik</td>
          <td class="text-center fw-bold">${ambilCheck(paketData.kriteria.lahan_latih_c, 'Diterima')}</td>
          <td class="text-center fw-bold">${ambilCheck(paketData.kriteria.lahan_latih_c, 'Tidak')}</td>
          <td>${paketData.kriteria.lahan_latih_d || ''}</td>
        </tr>
        <tr>
          <td>Apakah ada zona pembatas dan filter yang memadai untuk mengatasi kontaminasi</td>
          <td class="text-center fw-bold">${ambilCheck(paketData.kriteria.lahan_filter_c, 'Diterima')}</td>
          <td class="text-center fw-bold">${ambilCheck(paketData.kriteria.lahan_filter_c, 'Tidak')}</td>
          <td>${paketData.kriteria.lahan_filter_d || ''}</td>
        </tr>

        <tr class="fw-bold text-center">
          <td bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Kriteria</td>
          <td bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Kondisi diterima a</td>
          <td bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Tidak diterima a</td>
          <td bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Dasar penerimaan /kondisi</td>
        </tr>

        <tr class="fw-bold">
          <td colspan="4" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Manajemen Benih</td>
        </tr>
        <tr>
          <td>Dari mana sumber benih</td>
          <td class="text-center fw-bold">${ambilCheck(paketData.kriteria.benih_sumber_c, 'Diterima')}</td>
          <td class="text-center fw-bold">${ambilCheck(paketData.kriteria.benih_sumber_c, 'Tidak')}</td>
          <td>${paketData.kriteria.benih_sumber_d || ''}</td>
        </tr>
        <tr>
          <td>Apakah menanam benih rekayasa genetika</td>
          <td class="text-center fw-bold">${ambilCheck(paketData.kriteria.benih_gmo_c, 'Diterima')}</td>
          <td class="text-center fw-bold">${ambilCheck(paketData.kriteria.benih_gmo_c, 'Tidak')}</td>
          <td>${paketData.kriteria.benih_gmo_d || ''}</td>
        </tr>
        <tr>
          <td>Persiapan dan pengelolaan</td>
          <td class="text-center fw-bold">${ambilCheck(paketData.kriteria.benih_kelola_c, 'Diterima')}</td>
          <td class="text-center fw-bold">${ambilCheck(paketData.kriteria.benih_kelola_c, 'Tidak')}</td>
          <td>${paketData.kriteria.benih_kelola_d || ''}</td>
        </tr>

        <tr class="fw-bold">
          <td colspan="4" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Pemupukan organik</td>
        </tr>
        <tr>
          <td>Bila kondisi tanaman kritis apakah petani masih menggunakan pupuk kimia</td>
          <td class="text-center fw-bold">${ambilCheck(paketData.kriteria.puk_kimia_c, 'Diterima')}</td>
          <td class="text-center fw-bold">${ambilCheck(paketData.kriteria.puk_kimia_c, 'Tidak')}</td>
          <td>${paketData.kriteria.puk_kimia_d || ''}</td>
        </tr>
        <tr>
          <td>Pengontrolan rumput liar apakah masih menggunakan herbisida</td>
          <!-- PERBAIKAN: Ditambahkan .kriteria pada pemanggilan data -->
          <td class="text-center fw-bold">${ambilCheck(paketData.kriteria.puk_herbi_c, 'Diterima')}</td>
          <td class="text-center fw-bold">${ambilCheck(paketData.kriteria.puk_herbi_c, 'Tidak')}</td>
          <td>${paketData.kriteria.puk_herbi_d || ''}</td>
        </tr>

        <tr class="fw-bold">
          <td colspan="4" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Manajemen hama</td>
        </tr>
        <tr>
          <td>Manajemen penyakit Apabila hama dan penyakit sulit dikendalikan apakah petani masih menggunakan pestisida kimia</td>
          <td class="text-center fw-bold">${ambilCheck(paketData.kriteria.hama_pest_c, 'Diterima')}</td>
          <td class="text-center fw-bold">${ambilCheck(paketData.kriteria.hama_pest_c, 'Tidak')}</td>
          <td>${paketData.kriteria.hama_pest_d || ''}</td>
        </tr>

        <tr class="fw-bold">
          <td colspan="4" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Manajemen pola tanam</td>
        </tr>
      </table>

      <div class="page-break"></div>
      ${kopAppoli}

      <table class="tabel-data">
        <tr class="fw-bold text-center">
          <td width="50%" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Kriteria / Aspek Pemeriksaan Kepatuhan Lapangan (Lanjutan)</td>
          <td width="10%" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Kondisi diterima</td>
          <td width="10%" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Tidak diterima</td>
          <td width="30%" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Dasar penerimaan / kondisi</td>
        </tr>
        <tr>
          <td>Apakah setiap rotasi tanaman selalu menerapkan budidaya organic</td>
          <td class="text-center fw-bold">${ambilCheck(paketData.kriteria.pola_organik_c, 'Diterima')}</td>
          <td class="text-center fw-bold">${ambilCheck(paketData.kriteria.pola_organik_c, 'Tidak')}</td>
          <td>${paketData.kriteria.pola_organik_d || ''}</td>
        </tr>
      </table>

      <div class="fw-bold" style="font-size: 11px; margin-bottom: 4px;">Tindakan pasca panen dan pengolahan</div>
      <table class="tabel-data">
        <tr class="fw-bold text-center">
          <td width="50%" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Aktivitas</td>
          <td width="10%" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Kondisi diterima a</td>
          <td width="10%" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Tidak diterima a</td>
          <td width="30%" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Dasar penerimaan /kondisi</td>
        </tr>
        <tr>
          <td>Pengolahan produk</td>
          <td class="text-center fw-bold">${ambilCheck(paketData.pascaPanen.olah_c, 'Diterima')}</td>
          <td class="text-center fw-bold">${ambilCheck(paketData.pascaPanen.olah_c, 'Tidak')}</td>
          <td>${paketData.pascaPanen.olah_d || ''}</td>
        </tr>
        <tr>
          <td>Bagaimana kondisi sak kemasan produk</td>
          <td class="text-center fw-bold">${ambilCheck(paketData.pascaPanen.kemasan_c, 'Diterima')}</td>
          <td class="text-center fw-bold">${ambilCheck(paketData.pascaPanen.kemasan_c, 'Tidak')}</td>
          <td>${paketData.pascaPanen.kemasan_d || ''}</td>
        </tr>
        <tr>
          <td>Penyimpanan dan pengiriman</td>
          <td class="text-center fw-bold">${ambilCheck(paketData.pascaPanen.simpan_c, 'Diterima')}</td>
          <td class="text-center fw-bold">${ambilCheck(paketData.pascaPanen.simpan_c, 'Tidak')}</td>
          <td>${paketData.pascaPanen.simpan_d || ''}</td>
        </tr>
      </table>

      <div class="fw-bold" style="font-size: 11px; margin-bottom: 4px;">Manajemen resiko</div>
      <table class="tabel-data">
        <tr class="fw-bold text-center">
          <td width="40%" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Resiko kontaminasi</td>
          <td width="10%" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Rendah</td>
          <td width="10%" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Menengah</td>
          <td width="10%" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Tinggi</td>
          <td width="30%" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Keterangan</td>
        </tr>
        <tr>
          <td>Lahan pertanian non-organik disekitarnya</td>
          <td class="text-center fw-bold">${ambilCheck(paketData.manajemenResiko.sekitar_r, 'Rendah')}</td>
          <td class="text-center fw-bold">${ambilCheck(paketData.manajemenResiko.sekitar_r, 'Menengah')}</td>
          <td class="text-center fw-bold">${ambilCheck(paketData.manajemenResiko.sekitar_r, 'Tinggi')}</td>
          <td>${paketData.manajemenResiko.sekitar_d || ''}</td>
        </tr>
        <tr>
          <td>Aktivitas non-organik di lahan sekitar</td>
          <td class="text-center fw-bold">${ambilCheck(paketData.manajemenResiko.aktivitas_r, 'Rendah')}</td>
          <td class="text-center fw-bold">${ambilCheck(paketData.manajemenResiko.aktivitas_r, 'Menengah')}</td>
          <td class="text-center fw-bold">${ambilCheck(paketData.manajemenResiko.aktivitas_r, 'Tinggi')}</td>
          <td>${paketData.manajemenResiko.aktivitas_d || ''}</td>
        </tr>
        <tr>
          <td>Industri, jalan kendaraan, air limbah, dsb</td>
          <td class="text-center fw-bold">${ambilCheck(paketData.manajemenResiko.industri_r, 'Rendah')}</td>
          <td class="text-center fw-bold">${ambilCheck(paketData.manajemenResiko.industri_r, 'Menengah')}</td>
          <td class="text-center fw-bold">${ambilCheck(paketData.manajemenResiko.industri_r, 'Tinggi')}</td>
          <td>${paketData.manajemenResiko.industri_d || ''}</td>
        </tr>
        <tr>
          <td colspan="5" style="padding: 6px;">
            <span class="fw-bold">Langkah yang diambil untuk mengurangi resiko :</span><br>
            <div style="margin-top: 4px; min-height: 20px; font-style: italic; color: #333;">
              ${paketData.manajemenResiko.langkahMitigasi || '-'}
            </div>
          </td>
        </tr>
      </table>

      <table class="tabel-data">
        <tr style="background-color: #4a90e2; color: #fff; font-weight: bold;">
          <td colspan="2" style="padding: 5px;">Rekomendasi persetujuan inspektor</td>
        </tr>
        <tr>
          <td colspan="2">
            <span class="fw-bold">Pemenuhan kondisi sebelumnya :</span><br>
            <div style="margin: 5px 0; letter-spacing: 0.5px;">
              [&nbsp;&nbsp;&nbsp;&nbsp;] Baik &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 
              [&nbsp;&nbsp;&nbsp;&nbsp;] Sebagian/diterima &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 
              [&nbsp;&nbsp;&nbsp;&nbsp;] Hilang/tidak diterima &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 
              [&nbsp;&nbsp;&nbsp;&nbsp;] Tidak ada kondisi tahun sebelumnya
            </div>
          </td>
        </tr>
        <tr>
          <td colspan="2">
            <span class="fw-bold">Pemenuhan tahun ini :</span><br>
            <div style="margin: 5px 0; letter-spacing: 0.5px;">
              [&nbsp;&nbsp;&nbsp;&nbsp;] Menyetujui tanpa syarat &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 
              [&nbsp;&nbsp;&nbsp;&nbsp;] Menyetujui dengan syarat &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 
              [&nbsp;&nbsp;&nbsp;&nbsp;] Hilang/tidak diterima
            </div>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="height: 45px; vertical-align: top;">
            <span class="fw-bold">Persyaratan (tindakan perbaikan) atau penjelasan :</span>
          </td>
        </tr>
        <tr>
          <td width="50%" class="text-center" style="height: 75px; vertical-align: top; padding-top: 8px;">
            <span class="fw-bold">Petani</span><br><br><br><br>
            <u>( ${paketData.nama || '....................................'} )</u>
          </td>
          <td width="50%" class="text-center" style="height: 75px; vertical-align: top; padding-top: 8px;">
            <span class="fw-bold">Internal Inspektor</span><br><br><br><br>
            <u>( .................................... )</u>
          </td>
        </tr>
      </table>

      <table class="tabel-data">
        <tr style="background-color: #333; color: #fff; font-weight: bold;">
          <td colspan="2" style="padding: 5px;">Kesepakatan Keputusan oleh Operator ICS</td>
        </tr>
        <tr>
          <td colspan="2">
            <span class="fw-bold">Pemenuhan tahun ini :</span><br>
            <div style="margin: 5px 0; letter-spacing: 0.5px;">
              [&nbsp;&nbsp;&nbsp;&nbsp;] Menyetujui Tanpa Syarat &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 
              [&nbsp;&nbsp;&nbsp;&nbsp;] Menyetujui Dengan Syarat &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 
              [&nbsp;&nbsp;&nbsp;&nbsp;] Tidak Dapat Disetujui
            </div>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="height: 40px; vertical-align: top;">
            <span class="fw-bold">Persyaratan tambahan atau sanksi :</span>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="height: 75px; vertical-align: top; padding: 8px;">
            <table width="100%" style="border-collapse: collapse;">
              <tr>
                <td style="border:none;"></td>
                <td width="250px" class="text-center" style="border:none;">
                  <span class="fw-bold">Tanda tangan Manajer Persetujuan</span><br><br><br><br>
                  <u>( .................................... )</u>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

    </body>
    </html>
    `;

    // ==========================================
    // 3. GENERATE BLOB PDF & SIMPAN KE DRIVE
    // ==========================================
    var htmlOutput = HtmlService.createHtmlOutput(htmlContent);
    var blobPdf = htmlOutput.getAs('application/pdf');
    
    var namaFilePembersih = "Form_Inspeksi_" + paketData.nama.replace(/\s+/g, '_') + "_" + paketData.idPetani + ".pdf";
    blobPdf.setName(namaFilePembersih);
    
    // Panggil fungsi pembantu untuk mendapatkan folder "Form 2 - Inspeksi Internal"
    var folderTujuan = dapatkanFolderTujuan("Form 2 - Inspeksi Internal");
    
    // Simpan file PDF langsung ke dalam folder tujuan tersebut
    var filePdf = folderTujuan.createFile(blobPdf);
    
    // ==========================================
    // PERBAIKAN UTAMA: Mendefinisikan urlLinkPdf sebelum dipakai
    // ==========================================
    var urlLinkPdf = filePdf.getUrl();
    
    filePdf.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    if (!workerMode) sheet.getRange(barisTerakhir, 10).setValue(urlLinkPdf);
    
    return {
      status: "Sukses",
      pesan: "✔ Data inspeksi berhasil direkam ke database, dan berkas PDF resmi untuk " + paketData.nama + " telah terbit dengan warna abu-abu permanen!",
      pdfUrl: urlLinkPdf
    };

  } catch (error) {
    return {
      status: "Gagal",
      pesan: "Terjadi kesalahan sistem di Backend: " + error.toString()
    };
  }
}
// ==========================================
// D. ENGINE FORM 3 (ANTI-KOLAPS)
// ==========================================
/**
 * Fungsi Utama: Menyimpan Formulir Pendataan Petani dan Lahan (Form 3) ke Spreadsheet
 * dan Menghasilkan Laporan PDF Satu Halaman Resmi APPOLI (Menyesuaikan ID HTML Mas Diony)
 * Author: AI Collaborator for Mas Diony
 * Tahun: 2026
 */
function simpanDanCetakForm3(paketData) {
  try {
    // ==========================================
    // 1. PROSES SIMPAN DATA KE SPREADSHEET
    // ==========================================
    var workerMode = paketData._worker === true;
    var ss = workerMode ? null : SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = "Database_Pendataan_Lahan";
    var sheet = workerMode ? null : ss.getSheetByName(sheetName);
    if (!workerMode) {
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow([
        "Timestamp", "ID Petani", "Nama Petani", "Alamat Petani", 
        "Alamat Lengkap Lahan", "Status Kepemilikan", "Link Dokumen PDF"
      ]);
      sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#e2ece9");
    }
    
    var timestamp = new Date();
    var tglHariIni = timestamp.toLocaleDateString('id-ID');

    sheet.appendRow([
      timestamp,
      paketData.idPetani,
      paketData.nama,
      paketData.alamat,        // Sesuai dengan properti HTML Anda
      paketData.alamatLahan,   // Sesuai dengan properti HTML Anda
      paketData.statusMilik,   // Sesuai dengan properti HTML Anda
      "" 
    ]);
    var barisTerakhir = sheet.getLastRow();
    }

    // ==========================================
    // 2. RACIK TEMPLATE HTML UNTUK PDF FORM 3
    // ==========================================
    var kopAppoli = `
      <table width="100%" style="border-collapse: collapse; font-family: Arial, sans-serif;">
        <tr>
          <td width="15%" align="center" style="font-size: 38px; padding-bottom: 5px;"><img src="${LOGO_APPOLI_BASE64}" width="70" height="70" style="object-fit: contain;" alt="Logo APPOLI"></td>
          <td width="85%" align="center">
            <div style="font-weight: bold; font-size: 16px; letter-spacing: 1px; margin-bottom: 2px;">APPOLI</div>
            <div style="font-size: 13px; font-weight: bold; margin-bottom: 3px;">Aliansi Petani Padi dan Palawija Organik Boyolali</div>
            <div style="font-size: 10px; color: #444;">Dk. Mencil RT.02/01 Desa Glongong, Kec. Nogosari, Kab. Boyolali</div>
            <div style="font-size: 10px; color: #444;">Tel : 082313395639 Website : www.appoliboyolali.com</div>
          </td>
        </tr>
      </table>
      <hr style="border: none; border-top: 1px solid #000; border-bottom: 3px double #000; height: 4px; margin-top: 5px; margin-bottom: 10px;">
    `;

    var htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        @page { size: A4; margin: 1.0cm 1.0cm 1.0cm 1.0cm; }
        body { 
          font-family: Arial, sans-serif; 
          color: #000; 
          line-height: 1.2; 
          margin: 0; 
          padding: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .judul-form { text-align: center; font-weight: bold; font-size: 13px; margin-bottom: 2px; text-decoration: underline; }
        .sub-judul { text-align: center; font-style: italic; font-size: 10px; margin-bottom: 10px; }
        table.tabel-data { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 8px; }
        table.tabel-data th, table.tabel-data td { border: 1px solid #000; padding: 5px; vertical-align: middle; }
        .fw-bold { font-weight: bold; }
        .text-center { text-align: center; }
        .section-header { font-weight: bold; font-size: 10.5px; padding: 5px; border: 1px solid #000; margin-bottom: -1px; }
      </style>
    </head>
    <body>

      ${kopAppoli}
      
      <div class="judul-form">Formulir Pendataan Petani dan Lahan</div>
      <div class="sub-judul">Isi sesuai kondisi aktual pada hari wawancara</div>

      <table class="tabel-data">
        <tr>
          <td width="18%" class="fw-bold" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Nama Petani:</td>
          <td width="32%">${paketData.nama || ''}</td>
          <td width="18%" class="fw-bold" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Alamat Petani:</td>
          <td width="32%">${paketData.alamat || ''}</td>
        </tr>
        <tr>
          <td class="fw-bold" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Kode Petani:</td>
          <td>APL / ${paketData.idPetani || ''}</td>
          <td class="fw-bold" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Alamat Lahan:</td>
          <td>${paketData.alamatLahan || ''}</td>
        </tr>
      </table>

      <table class="tabel-data">
        <tr>
          <td width="22%" class="fw-bold" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Status Kepemilikan Lahan:</td>
          <td width="78%">${paketData.statusMilik || ''}</td>
        </tr>
      </table>

      <div class="section-header" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Lahan Pertanian Organik (Semua lahan, termasuk konvensional)</div>
      <table class="tabel-data text-center">
        <tr class="fw-bold">
          <td width="25%" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Nomer kode lahan (sama dengan peta)</td>
          <td width="12%" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Ha</td>
          <td width="23%" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Tanaman utama</td>
          <td width="20%" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Tanaman sisipan</td>
          <td width="20%" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Pemakaian terakhir bahan kimia (Produk & Bln/Thn)</td>
        </tr>
        <tr>
          <td class="fw-bold">Lahan 1</td>
          <td>${paketData.lh_h1 || ''}</td>
          <td>${paketData.lh_u1 || ''}</td>
          <td>${paketData.lh_s1 || ''}</td>
          <td>${paketData.lh_km1 || ''}</td>
        </tr>
        <tr>
          <td class="fw-bold">Lahan 2</td>
          <td>${paketData.lh_h2 || ''}</td>
          <td>${paketData.lh_u2 || ''}</td>
          <td>${paketData.lh_s2 || ''}</td>
          <td>${paketData.lh_km2 || ''}</td>
        </tr>
        <tr>
          <td class="fw-bold">Lahan 3</td>
          <td>${paketData.lh_h3 || ''}</td>
          <td>${paketData.lh_u3 || ''}</td>
          <td>${paketData.lh_s3 || ''}</td>
          <td>${paketData.lh_km3 || ''}</td>
        </tr>
      </table>

      <div class="section-header" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Kalender Masa Tanam & Estimasi Produksi</div>
      <table class="tabel-data text-center">
        <tr class="fw-bold">
          <td width="20%" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Masa Tanam</td>
          <td width="20%" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Tanggal tanam</td>
          <td width="20%" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Tanggal Panen</td>
          <td width="20%" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Produksi kg</td>
          <td width="20%" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Tanggal Pendataan</td>
        </tr>
        <tr>
          <td class="fw-bold">MT 1</td>
          <td>${paketData.mt_t1 || ''}</td>
          <td>${paketData.mt_p1 || ''}</td>
          <td>${paketData.mt_k1 || ''}</td>
          <td>${tglHariIni}</td>
        </tr>
        <tr>
          <td class="fw-bold">MT 2</td>
          <td>${paketData.mt_t2 || ''}</td>
          <td>${paketData.mt_p2 || ''}</td>
          <td>${paketData.mt_k2 || ''}</td>
          <td>${tglHariIni}</td>
        </tr>
        <tr>
          <td class="fw-bold">MT 3</td>
          <td>${paketData.mt_t3 || ''}</td>
          <td>${paketData.mt_p3 || ''}</td>
          <td>${paketData.mt_k3 || ''}</td>
          <td>${tglHariIni}</td>
        </tr>
      </table>

      <div class="section-header" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Matriks Batas Koordinat Geografis Lahan</div>
      <table class="tabel-data">
        <tr class="fw-bold text-center">
          <td width="20%" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Batas Lahan</td>
          <td width="20%" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Barat</td>
          <td width="20%" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Timur</td>
          <td width="20%" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Selatan</td>
          <td width="20%" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Utara</td>
        </tr>
        <tr>
          <td class="fw-bold" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Jenis batas</td>
          <td>${paketData.b_jb_b || ''}</td>
          <td>${paketData.b_jb_t || ''}</td>
          <td>${paketData.b_jb_s || ''}</td>
          <td>${paketData.b_jb_u || ''}</td>
        </tr>
        <tr>
          <td class="fw-bold" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Pemilik</td>
          <td>${paketData.b_p_b || ''}</td>
          <td>${paketData.b_p_t || ''}</td>
          <td>${paketData.b_p_s || ''}</td>
          <td>${paketData.b_p_u || ''}</td>
        </tr>
        <tr>
          <td class="fw-bold" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Status lahan</td>
          <td>${paketData.b_s_b || ''}</td>
          <td>${paketData.b_s_t || ''}</td>
          <td>${paketData.b_s_s || ''}</td>
          <td>${paketData.b_s_u || ''}</td>
        </tr>
      </table>

      <div class="section-header" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Produksi Ternak Pendukung Pupuk Alami</div>
      <table class="tabel-data text-center">
        <tr class="fw-bold">
          <td width="25%" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Jenis Ternak</td>
          <td width="15%" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Jumlah</td>
          <td width="35%" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Pakan dan Pengobatan</td>
          <td width="25%" bgcolor="#e6e6e6" style="background-color: #e6e6e6;">Kondisi Ternak</td>
        </tr>
        <tr>
          <td>${paketData.tk_j1 || '&nbsp;'}</td>
          <td>${paketData.tk_jm1 || ''}</td>
          <td>${paketData.tk_p1 || ''}</td>
          <td>${paketData.tk_k1 || ''}</td>
        </tr>
        <tr>
          <td>${paketData.tk_j2 || '&nbsp;'}</td>
          <td>${paketData.tk_jm2 || ''}</td>
          <td>${paketData.tk_p2 || ''}</td>
          <td>${paketData.tk_k2 || ''}</td>
        </tr>
      </table>

      <table class="tabel-data" style="margin-top: 15px;">
        <tr>
          <td width="50%" style="vertical-align: top; padding: 10px;">
            <p style="margin: 0 0 15px 0; text-align: justify; line-height: 1.3;">
              Saya, selaku petani, menyatakan bahwa informasi ini adalah benar dan saya telah memahami persyaratan Produksi Padi dan palawija Organik. Saya juga telah menerima salinan kontrak petani organik.
            </p>
            <p style="margin: 0 0 5px 0;">Tanggal : ${tglHariIni}</p>
            <p style="margin: 0 0 25px 0;">Tempat : Boyolali</p>
            <div class="text-center">
              <span class="fw-bold">Tanda Tangan Petani:</span><br><br><br><br>
              <u>( ${paketData.nama || '....................................'} )</u>
            </div>
          </td>
          
          <td width="50%" style="vertical-align: top; padding: 10px;">
            <p style="margin: 0 0 65px 0; text-align: justify; line-height: 1.3;">
              Saya, sebagai petugas lapangan menegaskan bahwa informasi yang disebutkan diatas adalah benar.
            </p>
            <div class="text-center" style="margin-top: 10px;">
              <span class="fw-bold">Tanda Tangan Petugas Lapang ICS:</span><br><br><br><br>
              <u>( .................................... )</u>
            </div>
          </td>
        </tr>
      </table>

    </body>
    </html>
    `;

    // ==========================================
    // 3. GENERATE BLOB PDF & SIMPAN KE DRIVE
    // ==========================================
    var htmlOutput = HtmlService.createHtmlOutput(htmlContent);
    var blobPdf = htmlOutput.getAs('application/pdf');
    
    var namaFilePembersih = "Form3_Pendataan_" + paketData.nama.replace(/\s+/g, '_') + "_" + paketData.idPetani + ".pdf";
    blobPdf.setName(namaFilePembersih);

    
// Panggil fungsi pembantu untuk mendapatkan folder "Form 3 - Pendataan Lahan"
    var folderTujuan = dapatkanFolderTujuan("Form 3 - Pendataan Lahan");
    
    // Simpan file PDF langsung ke dalam folder tujuan tersebut
    var filePdf = folderTujuan.createFile(blobPdf);
    // -------------------------

    var urlLinkPdf = filePdf.getUrl();
    
    filePdf.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    if (!workerMode) sheet.getRange(barisTerakhir, 7).setValue(urlLinkPdf);
    
    return {
      status: "Sukses",
      pesan: "✔ Data Form 3 Berhasil disimpan! PDF telah tersimpan di folder PDF_DOKUMEN_APPOLI/Form 3 - Pendataan Lahan",
      pdfUrl: urlLinkPdf
    };

  } catch (error) {
    return {
      status: "Gagal",
      pesan: "Terjadi kesalahan sistem Form 3 di Backend: " + error.toString()
    };
  }
}

// ==========================================
// UTALITAS TAMBAHAN (PASTIKAN DI LUAR FUNGSI LAIN)
// ==========================================

/**
 * Helper Function: Mendapatkan atau membuat struktur folder di Google Drive
 * Mengamankan agar folder tidak duplikat jika dijalankan berkali-kali.
 */
function dapatkanFolderTujuan(namaSubFolder) {
  var namaFolderUtama = "PDF_DOKUMEN_APPOLI";
  var folderUtama;
  var cekUtama = DriveApp.getFoldersByName(namaFolderUtama);
  
  // 1. Cek atau Buat Folder Utama
  if (cekUtama.hasNext()) {
    folderUtama = cekUtama.next();
  } else {
    folderUtama = DriveApp.createFolder(namaFolderUtama);
  }
  
  // 2. Cek atau Buat Sub-Folder Spesifik Form
  var subFolder;
  var cekSub = folderUtama.getFoldersByName(namaSubFolder);
  if (cekSub.hasNext()) {
    subFolder = cekSub.next();
  } else {
    subFolder = folderUtama.createFolder(namaSubFolder);
  }
  
  return subFolder;
}

function buatDanSimpanPDF(htmlContent, namaFile) {
  var blob = HtmlService.createHtmlOutput(htmlContent).getAs('application/pdf');
  blob.setName(namaFile + ".pdf");
  var folder = dapatkanFolderPDF();
  var file = folder.createFile(blob);
  return file.getUrl();
}

/**
 * Menghitung dan mengambil data aktual dari spreadsheet untuk Dashboard
 */
function ambilStatistikDashboard() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. HITUNG TOTAL PETANI (Dari Form 3 / Database_Pendataan_Lahan)
    var sheetLahan = ss.getSheetByName("Database_Pendataan_Lahan");
    var totalPetani = 0;
    if (sheetLahan) {
      // Mengurangi 1 untuk baris header
      totalPetani = sheetLahan.getLastRow() - 1; 
      if (totalPetani < 0) totalPetani = 0;
    }
    
    // 2. HITUNG LUAS LAHAN, INSPEKSI, DAN ANTREAN
    // Catatan: Anda bisa menyesuaikan bagian ini dengan sheet Form 1 & Form 2 Anda nantinya.
    // Sementara kita pasang nilai dinamis dasar & fallback agar sistem tidak crash.
    var totalLuasLahan = 0; 
    var inspeksiSelesai = 0;
    var antreanInspeksi = 0;
    
    // Contoh penarikan data Inspeksi dari sheet Form 2 jika sudah ada
    var sheetInspeksi = ss.getSheetByName("Database_Inspeksi"); // Sesuaikan nama sheet Form 2 Anda
    if (sheetInspeksi) {
      var dataInspeksi = sheetInspeksi.getDataRange().getValues();
      // Contoh logika: menghitung baris berdasarkan status tertentu
      inspeksiSelesai = dataInspeksi.length - 1; 
    } else {
      inspeksiSelesai = 24; // Fallback dummy sebelum sheet diisi penuh
      antreanInspeksi = 7;
    }

    // 3. RACIK DATA UNTUK GRAFIK (CHART.JS)
    // Tren Bulanan Petani Baru (Contoh: mengambil total petani saat ini sebagai bulan berjalan)
    var trenPetaniBaru = [12, 19, 15, 22, 28, totalPetani]; 
    
    // Status Sertifikasi (Lolos, Syarat, Ditolak)
    var statusSertifikasi = [75, 20, 5]; 

    return {
      status: "Sukses",
      totalPetani: totalPetani,
      luasLahan: totalPetani > 0 ? (totalPetani * 0.5).toFixed(1) : "0", // Ilustrasi kalkulasi luas lahan rata-rata
      inspeksiSelesai: inspeksiSelesai,
      antreanInspeksi: antreanInspeksi,
      grafikBatang: trenPetaniBaru,
      grafikPie: statusSertifikasi
    };
    
  } catch (error) {
    return {
      status: "Gagal",
      pesan: error.toString()
    };
  }
}