// ========================================================
// C. FORM 1: ANALISA USAHA TANI (SINKRON LOADING & POP-UP PREMIUM)
// ========================================================
var HTML_FORM_ANALISA = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Analisa Usaha Tani - APPOLI</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
  <style>
    body { background: #f8f9fa; padding: 30px 0; font-family: 'Segoe UI', sans-serif; }
    .paper-form { background: #ffffff; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); padding: 40px; }
    .table-header-sec { background-color: #e2e3e5; font-weight: bold; }
    .table-total-sec { background-color: #eaeaea; font-weight: bold; }
    .table-laba-rugi { background-color: #d1e7dd; font-weight: bold; font-size: 1.1rem; }
    .form-control-sm-custom { height: 30px; padding: 2px 5px; font-size: 0.9rem; }
    
    #loadingOverlay {
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      background-color: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(5px);
      z-index: 9999;
      display: flex; align-items: center; justify-content: center;
    }
    .animate-fade-in { animation: fadeIn 0.3s ease-in-out forwards; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  </style>
</head>
<body>

  <div id="loadingOverlay" class="d-none animate-fade-in">
    <div class="text-center text-white p-4">
      <div class="spinner-border text-success mb-3" role="status" style="width: 4rem; height: 4rem; border-width: 0.4rem;">
        <span class="visually-hidden">Loading...</span>
      </div>
      <h4 class="fw-bold mb-1" id="loadingTitle" style="letter-spacing: 0.5px;">Memproses Data...</h4>
      <p class="text-light small opacity-75 mb-0" id="loadingSub">Harap tunggu, jangan menutup atau me-refresh halaman.</p>
    </div>
  </div>

  <div class="container">
    <div class="paper-form">
      
      <div class="row align-items-center mb-4">
        <div class="col-2 text-center"><span style="font-size: 3rem;"><img src="{{LOGO_APPOLI}}" class="img-fluid" style="max-height: 85px; object-fit: contain;" alt="Logo APPOLI"></span></div>
        <div class="col-10 text-center">
          <h4 class="fw-bold mb-0">APPOLI</h4>
          <h5 class="mb-1">Aliansi Petani Padi dan Palawija Organik Boyolali</h5>
          <p class="text-muted small mb-0">Dk. Mencil RT.02/01 Desa Glongong, Kec. Nogosari, Kab. Boyolali</p>
        </div>
      </div>
      <hr style="border-top: 3px double #000;">
      <h4 class="text-center fw-bold my-4">ANALISA USAHA TANI</h4>

      <div class="row g-3 mb-4 p-3 style" style="background-color: #ebf7ee; border-radius: 8px;">
        <div class="col-md-12">
          <label class="form-label fw-bold text-success">🎯 PILIH PETANI TERDAFTAR (Sistem Otomatis):</label>
          <select id="pilih_petani" class="form-select fw-bold border-success" onchange="eksekusiAutoFill()">
            <option value="">Sedang memuat data petani dari server...</option>
          </select>
        </div>
        
        <div class="col-md-6 mt-3">
          <div class="row mb-2"><label class="col-sm-4 col-form-label-sm fw-bold">Kode Petani</label><div class="col-sm-8"><input type="text" id="kode_petani" class="form-control form-control-sm" readonly></div></div>
          <div class="row mb-2"><label class="col-sm-4 col-form-label-sm fw-bold">Kelompok Tani</label><div class="col-sm-8"><input type="text" id="kelompok_tani" class="form-control form-control-sm" readonly></div></div>
        </div>
        <div class="col-md-6 mt-3">
          <div class="row mb-2"><label class="col-sm-4 col-form-label-sm fw-bold">Luas Lahan</label><div class="col-sm-8"><input type="text" id="luas_lahan" class="form-control form-control-sm" readonly></div></div>
          <div class="row mb-2"><label class="col-sm-4 col-form-label-sm fw-bold">Varietas</label><div class="col-sm-8"><input type="text" id="varietas" class="form-control form-control-sm" readonly></div></div>
          <div class="row mb-2"><label class="col-sm-4 col-form-label-sm fw-bold">Musim Tanam</label><div class="col-sm-8"><input type="text" id="musim_tanam" class="form-control form-control-sm" value="2026"></div></div>
        </div>
      </div>

      <div class="table-responsive">
        <table class="table table-bordered align-middle">
          <thead class="table-dark text-center small">
            <tr>
              <th style="width: 5%;">No</th><th>Kegiatan</th><th style="width: 12%;">Waktu</th><th style="width: 10%;">Volume</th><th style="width: 15%;">Harga (Rp)</th><th style="width: 15%;">Total (Rp)</th><th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            <tr class="table-header-sec"><td>A</td><td colspan="6">Biaya Sarana Produksi</td></tr>
            <tr><td class="text-center">1</td><td>Benih</td><td><input type="text" id="waktu_a1" class="form-control form-control-sm-custom"></td><td><input type="number" id="vol_a1" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="hrg_a1" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="tot_a1" class="form-control form-control-sm-custom" readonly value="0"></td><td><input type="text" id="ket_a1" class="form-control form-control-sm-custom"></td></tr>
            <tr><td class="text-center" rowspan="2">2</td><td>Pupuk Organik: Padat</td><td><input type="text" id="waktu_a2_pdt" class="form-control form-control-sm-custom"></td><td><input type="number" id="vol_a2_pdt" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="hrg_a2_pdt" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="tot_a2_pdt" class="form-control form-control-sm-custom" readonly value="0"></td><td><input type="text" id="ket_a2_pdt" class="form-control form-control-sm-custom"></td></tr>
            <tr><td>Pupuk Organik: Cair</td><td><input type="text" id="waktu_a2_cr" class="form-control form-control-sm-custom"></td><td><input type="number" id="vol_a2_cr" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="hrg_a2_cr" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="tot_a2_cr" class="form-control form-control-sm-custom" readonly value="0"></td><td><input type="text" id="ket_a2_cr" class="form-control form-control-sm-custom"></td></tr>
            <tr><td class="text-center" rowspan="3">3</td><td>Pupuk Kimia: UREA/ZA</td><td><input type="text" id="waktu_a3_urea" class="form-control form-control-sm-custom"></td><td><input type="number" id="vol_a3_urea" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="hrg_a3_urea" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="tot_a3_urea" class="form-control form-control-sm-custom" readonly value="0"></td><td><input type="text" id="ket_a3_urea" class="form-control form-control-sm-custom"></td></tr>
            <tr><td>Pupuk Kimia: TSP 36</td><td><input type="text" id="waktu_a3_tsp" class="form-control form-control-sm-custom"></td><td><input type="number" id="vol_a3_tsp" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="hrg_a3_tsp" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="tot_a3_tsp" class="form-control form-control-sm-custom" readonly value="0"></td><td><input type="text" id="ket_a3_tsp" class="form-control form-control-sm-custom"></td></tr>
            <tr><td>Pupuk Kimia: Phonska</td><td><input type="text" id="waktu_a3_phn" class="form-control form-control-sm-custom"></td><td><input type="number" id="vol_a3_phn" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="hrg_a3_phn" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="tot_a3_phn" class="form-control form-control-sm-custom" readonly value="0"></td><td><input type="text" id="ket_a3_phn" class="form-control form-control-sm-custom"></td></tr>
            <tr><td class="text-center">4</td><td>Pestisida Organik</td><td><input type="text" id="waktu_a4" class="form-control form-control-sm-custom"></td><td><input type="number" id="vol_a4" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="hrg_a4" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="tot_a4" class="form-control form-control-sm-custom" readonly value="0"></td><td><input type="text" id="ket_a4" class="form-control form-control-sm-custom"></td></tr>
            <tr><td class="text-center">5</td><td>Pestisida Kimia</td><td><input type="text" id="waktu_a5" class="form-control form-control-sm-custom"></td><td><input type="number" id="vol_a5" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="hrg_a5" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="tot_a5" class="form-control form-control-sm-custom" readonly value="0"></td><td><input type="text" id="ket_a5" class="form-control form-control-sm-custom"></td></tr>
            <tr class="table-total-sec text-end"><td colspan="5" class="text-start">Total Biaya Produksi (Sub-Total A)</td><td><input type="number" id="sub_total_a" class="form-control form-control-sm-custom text-end fw-bold" readonly value="0"></td><td></td></tr>
            
            <tr class="table-header-sec"><td>B</td><td colspan="6">Biaya Tenaga Kerja</td></tr>
            <tr><td class="text-center">1</td><td>Lahan Persemaian</td><td><input type="text" id="waktu_b1"></td><td><input type="number" id="vol_b1" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="hrg_b1" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="tot_b1" class="form-control form-control-sm-custom" readonly value="0"></td><td><input type="text" id="ket_b1"></td></tr>
            <tr><td class="text-center">2</td><td>Sebar Benih</td><td><input type="text" id="waktu_b2"></td><td><input type="number" id="vol_b2" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="hrg_b2" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="tot_b2" class="form-control form-control-sm-custom" readonly value="0"></td><td><input type="text" id="ket_b2"></td></tr>
            <tr><td class="text-center">3</td><td>Daut atau cabut benih</td><td><input type="text" id="waktu_b3"></td><td><input type="number" id="vol_b3" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="hrg_b3" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="tot_b3" class="form-control form-control-sm-custom" readonly value="0"></td><td><input type="text" id="ket_b3"></td></tr>
            <tr><td class="text-center">4</td><td>Olah lahan</td><td><input type="text" id="waktu_b4"></td><td><input type="number" id="vol_b4" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="hrg_b4" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="tot_b4" class="form-control form-control-sm-custom" readonly value="0"></td><td><input type="text" id="ket_b4"></td></tr>
            <tr><td class="text-center">5</td><td>Tanam</td><td><input type="text" id="waktu_b5"></td><td><input type="number" id="vol_b5" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="hrg_b5" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="tot_b5" class="form-control form-control-sm-custom" readonly value="0"></td><td><input type="text" id="ket_b5"></td></tr>
            <tr><td class="text-center">6</td><td>Penyulaman</td><td><input type="text" id="waktu_b6_syl"></td><td><input type="number" id="vol_b6_syl" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="hrg_b6_syl" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="tot_b6_syl" class="form-control form-control-sm-custom" readonly value="0"></td><td><input type="text" id="ket_b6_syl"></td></tr>
            <tr><td class="text-center">6</td><td>Perawatan tanaman</td><td><input type="text" id="waktu_b6_rwt"></td><td><input type="number" id="vol_b6_rwt" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="hrg_b6_rwt" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="tot_b6_rwt" class="form-control form-control-sm-custom" readonly value="0"></td><td><input type="text" id="ket_b6_rwt"></td></tr>
            <tr><td class="text-center">7</td><td>Pemupukan</td><td><input type="text" id="waktu_b7"></td><td><input type="number" id="vol_b7" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="hrg_b7" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="tot_b7" class="form-control form-control-sm-custom" readonly value="0"></td><td><input type="text" id="ket_b7"></td></tr>
            <tr><td class="text-center">8</td><td>Penyemprotan</td><td><input type="text" id="waktu_b8"></td><td><input type="number" id="vol_b8" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="hrg_b8" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="tot_b8" class="form-control form-control-sm-custom" readonly value="0"></td><td><input type="text" id="ket_b8"></td></tr>
            <tr><td class="text-center">9</td><td>Pengairan</td><td><input type="text" id="waktu_b9"></td><td><input type="number" id="vol_b9" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="hrg_b9" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="tot_b9" class="form-control form-control-sm-custom" readonly value="0"></td><td><input type="text" id="ket_b9"></td></tr>
            <tr><td class="text-center">10</td><td>Panen & pengangkutan</td><td><input type="text" id="waktu_b10"></td><td><input type="number" id="vol_b10" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="hrg_b10" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="tot_b10" class="form-control form-control-sm-custom" readonly value="0"></td><td><input type="text" id="ket_b10"></td></tr>
            <tr class="table-total-sec text-end"><td colspan="5" class="text-start">Total Biaya Tenaga Kerja (Sub-Total B)</td><td><input type="number" id="sub_total_b" class="form-control form-control-sm-custom text-end fw-bold" readonly value="0"></td><td></td></tr>
            
            <tr class="table-header-sec"><td>C</td><td colspan="6">Lain-lain</td></tr>
            <tr><td class="text-center">-</td><td>Sewa / Pajak Tanah</td><td><input type="text" id="waktu_c1"></td><td><input type="number" id="vol_c1" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="hrg_c1" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="tot_c1" class="form-control form-control-sm-custom" readonly value="0"></td><td><input type="text" id="ket_c1"></td></tr>
            <tr class="table-total-sec text-end" style="background-color: #ffd2d2;"><td colspan="5" class="text-start text-danger fw-bold">TOTAL BIAYA (A + B + C)</td><td><input type="number" id="grand_total_biaya" class="form-control form-control-sm-custom text-end fw-bold text-danger" readonly value="0"></td><td></td></tr>
            
            <tr class="table-header-sec"><td colspan="7">Kalkulasi Pendapatan & Laba Rugi</td></tr>
            <tr><td class="text-center">-</td><td>Total Hasil Produksi (Panen)</td><td><input type="text" id="waktu_prod"></td><td><input type="number" id="vol_prod" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="hrg_jual" class="form-control form-control-sm-custom hitung" value="0"></td><td><input type="number" id="tot_pendapatan" class="form-control form-control-sm-custom text-end fw-bold" readonly value="0"></td><td><input type="text" id="ket_prod"></td></tr>
            <tr class="table-laba-rugi text-end"><td colspan="5" class="text-start text-success">LABA / RUGI NETTO</td><td><input type="number" id="laba_rugi" class="form-control form-control-sm-custom text-end fw-bold text-success" readonly value="0"></td><td></td></tr>
          </tbody>
        </table>
      </div>
      
      <div class="text-center mt-4">
        <button type="button" class="btn btn-success fw-bold py-2 px-5 shadow-sm" style="border-radius: 8px;" onclick="simpanDataForm1KeSheets()">
          <i class="bi bi-file-earmark-pdf-fill me-2"></i> Simpan & Cek PDF
        </button>
      </div>
    </div>
  </div>

  <script>
    var memoriPetani = []; // Penampung database lokal di browser

    // 1. LOGIKA KONTROL LOADING OVERLAY DINAMIS (SERASI DENGAN FORM 3)
    function aturLoadingOverlay(tampilkan, judul = "", subTeks = "") {
      var overlay = document.getElementById('loadingOverlay');
      if (overlay) {
        if (tampilkan) {
          document.getElementById('loadingTitle').innerText = judul;
          document.getElementById('loadingSub').innerText = subTeks;
          overlay.classList.remove('d-none');
        } else {
          overlay.classList.add('d-none');
        }
      }
    }

    // 2. LOAD DATA PETANI KE DROPDOWN AUTOMATIC DENGAN LOADING AWAL
    window.onload = function() {
      aturLoadingOverlay(true, "Sinkronisasi Data...", "Mengambil database petani terbaru dari Google Sheets...");

      google.script.run.withSuccessHandler(function(respon) {
        aturLoadingOverlay(false); // Matikan loading awal jika sukses
        
        var dropdown = document.getElementById('pilih_petani');
        if (respon.status === "Sukses") {
          memoriPetani = respon.data;
          dropdown.innerHTML = '<option value="">-- Cari & Pilih Nama Petani --</option>';
          
          if(memoriPetani.length === 0) {
            dropdown.innerHTML = '<option value="">(Belum ada database petani, silakan register dulu di Dashboard)</option>';
            return;
          }
          
          memoriPetani.forEach(function(p) {
            var opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.nama + " [" + p.id + "] - Kelompok: " + p.kelompok;
            dropdown.appendChild(opt);
          });
        } else {
          dropdown.innerHTML = '<option value="">Gagal memuat data dari server</option>';
        }
      }).withFailureHandler(function(err) {
        aturLoadingOverlay(false);
        Swal.fire({ icon: 'error', title: 'Koneksi Gagal', text: err.toString() });
      }).ambilDataPetani();
    };

    // 3. FUNGSI SIMPAN DATA & GENERATE PDF 2 TAHAP (SWEETALERT2 INTEGRATED)
    function simpanDataForm1KeSheets() {
      var idPetani = document.getElementById('pilih_petani').value;
      if (!idPetani) { 
        Swal.fire({ icon: 'warning', title: 'Perhatian', text: '⚠️ Mohon pilih nama petani terlebih dahulu!' });
        return; 
      }

      // Tahap 1 Loading: Simpan Spreadsheet
      aturLoadingOverlay(true, "Menyimpan ke Database...", "Sedang mengamankan baris data Analisa Usaha Tani ke database APPOLI.");

      var paketData = {
        idPetani: idPetani,
        nama: document.getElementById('pilih_petani').options[document.getElementById('pilih_petani').selectedIndex].text.split(' [')[0],
        kelompok: document.getElementById('kelompok_tani').value,
        luas: document.getElementById('luas_lahan').value,
        varietas: document.getElementById('varietas').value,
        musim: document.getElementById('musim_tanam').value,
        subA: parseFloat(document.getElementById('sub_total_a').value) || 0,
        subB: parseFloat(document.getElementById('sub_total_b').value) || 0,
        grandTotal: parseFloat(document.getElementById('grand_total_biaya').value) || 0,
        totalPendapatan: parseFloat(document.getElementById('tot_pendapatan').value) || 0,
        labaRugi: parseFloat(document.getElementById('laba_rugi').value) || 0
      };

      google.script.run
        .withSuccessHandler(function(respon) {
          if(respon.status === "Sukses") {
            
            // Tahap 2 Loading: Menggenerate File PDF
            aturLoadingOverlay(true, "Menggenerate Dokumen PDF...", "Menyusun format laporan.");

            // Jeda transisi visual halus 1.5 detik
            setTimeout(function() {
              aturLoadingOverlay(false); // Sembunyikan loading final
              
              Swal.fire({
                icon: 'success',
                title: 'Berhasil Disimpan!',
                
                confirmButtonColor: '#198754'
              }).then(() => {
                if (respon.pdfUrl) window.open(respon.pdfUrl, '_blank'); // Buka lembar PDF baru
                location.reload(); // Refresh form kembali bersih semula
              });
            }, 1500);

          } else {
            aturLoadingOverlay(false);
            Swal.fire({ icon: 'error', title: 'Proses Gagal', text: respon.pesan });
          }
        })
        .withFailureHandler(function(err) {
          aturLoadingOverlay(false);
          Swal.fire({ icon: 'error', title: 'Error Sistem', text: err.toString() });
        })
        .simpanDanCetakForm1(paketData);
    }

    // 4. RUMUS AUTO-FILL PROFIL JIKA NAMA PETANI DIKLIK
    // 4. RUMUS AUTO-FILL PROFIL JIKA NAMA PETANI DIKLIK
    function eksekusiAutoFill() {
      var idTerpilih = document.getElementById('pilih_petani').value;
      var dataPetani = memoriPetani.find(p => p.id === idTerpilih);
      
      if (dataPetani) {
        document.getElementById('kode_petani').value = dataPetani.id;
        // Sekarang memanggil data yang benar sesuai urutan array backend:
        // id:0, nama:1, hp:2, alamat:3, kelompok:4, luas:5, varietas:6
        document.getElementById('kelompok_tani').value = dataPetani.kelompok; 
        document.getElementById('luas_lahan').value = dataPetani.luas;
        document.getElementById('varietas').value = dataPetani.varietas;
        
        // Jika Anda ingin menampilkan alamat di form ini, tambahkan input ID "alamat_petani" 
        // dan tambahkan baris ini:
        // document.getElementById('alamat_petani').value = dataPetani.alamat;
      } else {
        document.getElementById('kode_petani').value = "";
        document.getElementById('kelompok_tani').value = "";
        document.getElementById('luas_lahan').value = "";
        document.getElementById('varietas').value = "";
      }
    }

    // 5. RUMUS PERHITUNGAN MATRIKS OTOMATIS
    const barisA = ['a1', 'a2_pdt', 'a2_cr', 'a3_urea', 'a3_tsp', 'a3_phn', 'a4', 'a5'];
    const barisB = ['b1', 'b2', 'b3', 'b4', 'b5', 'b6_syl', 'b6_rwt', 'b7', 'b8', 'b9', 'b10'];
    const barisC = ['c1'];
    
    document.querySelectorAll('.hitung').forEach(e => e.addEventListener('input', kalkulasiMatriks));
    
    function kalkulasiMatriks() {
      let subA = 0, subB = 0, subC = 0;
      
      barisA.forEach(id => { 
        let v = parseFloat(document.getElementById('vol_'+id).value)||0, 
            h = parseFloat(document.getElementById('hrg_'+id).value)||0, 
            t = v*h; 
        document.getElementById('tot_'+id).value = t; 
        subA += t; 
      });
      document.getElementById('sub_total_a').value = subA;
      
      barisB.forEach(id => { 
        let v = parseFloat(document.getElementById('vol_'+id).value)||0, 
            h = parseFloat(document.getElementById('hrg_'+id).value)||0, 
            t = v*h; 
        document.getElementById('tot_'+id).value = t; 
        subB += t; 
      });
      document.getElementById('sub_total_b').value = subB;
      
      barisC.forEach(id => { 
        let v = parseFloat(document.getElementById('vol_'+id).value)||0, 
            h = parseFloat(document.getElementById('hrg_'+id).value)||0, 
            t = v*h; 
        document.getElementById('tot_'+id).value = t; 
        subC += t; 
      });
      
      let grandBiaya = subA + subB + subC; 
      document.getElementById('grand_total_biaya').value = grandBiaya;
      
      let totalPendapatan = (parseFloat(document.getElementById('vol_prod').value)||0) * (parseFloat(document.getElementById('hrg_jual').value)||0); 
      document.getElementById('tot_pendapatan').value = totalPendapatan;
      
      let labaRugi = totalPendapatan - grandBiaya; 
      let inputLR = document.getElementById('laba_rugi'); 
      inputLR.value = labaRugi;
      
      inputLR.className = labaRugi < 0 ? "form-control form-control-sm-custom text-end fw-bold text-danger" : "form-control form-control-sm-custom text-end fw-bold text-success";
    }
  </script>
</body>
</html>
`;
