// ==========================================
// E. FORM 3: FORMULIR PENDATAAN PETANI DAN LAHAN (VERSI PERBAIKAN BUG)
// ==========================================
var HTML_FORM_PENDATAAN_LAHAN = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Pendataan Petani & Lahan - APPOLI</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
  <style>
    body { background: #f4f6f9; padding: 30px 0; font-family: 'Segoe UI', sans-serif; }
    .paper-form { background: #ffffff; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); padding: 40px; max-width: 900px; margin: 0 auto; }
    .header-title { border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 20px; }
    .table-custom th { background-color: #343a40; color: white; text-align: center; font-size: 0.85rem; }
    .section-title { font-weight: bold; background-color: #e2e8f0; padding: 5px 10px; border-radius: 4px; font-size: 0.9rem; color: #1e293b; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="paper-form">
      
      <div class="row align-items-center header-title">
        <div class="col-2 text-center"><span style="font-size: 3rem;"><img src="{{LOGO_APPOLI}}" class="img-fluid" style="max-height: 85px; object-fit: contain;" alt="Logo APPOLI"></span></div>
        <div class="col-10 text-center">
          <h4 class="fw-bold mb-0">APPOLI</h4>
          <h5 class="mb-1">Aliansi Petani Padi dan Palawija Organik Boyolali</h5>
          <p class="text-muted small mb-0">Dk. Mencil RT.02/01 Desa Glongong, Kec. Nogosari, Kab. Boyolali</p>
        </div>
      </div>

      <h4 class="text-center fw-bold my-4 text-dark">Formulir Pendataan Petani dan Lahan</h4>
      <p class="text-center text-muted small" style="font-style: italic;">"Isi sesuai kondisi aktual pada hari wawancara"</p>

      <div class="mb-4 p-3 bg-light border rounded">
        <label class="form-label small fw-bold text-success">🔍 Pilih Nama Petani untuk Penarikan Data Profil:</label>
        <select id="pilih_petani_f3" class="form-select border-success fw-bold" onchange="eksekusiAutoFillF3()">
          <option value="">Sedang sinkronisasi database...</option>
        </select>
      </div>

      <div class="row g-3 mb-3 small">
        <div class="col-md-6">
          <table class="table table-bordered align-middle mb-0">
            <tr><td class="bg-light fw-bold" style="width:30%;">Nama Petani:</td><td><input type="text" id="f3_nama" class="form-control form-control-sm border-0 bg-transparent fw-bold" readonly></td></tr>
            <tr><td class="bg-light fw-bold">Kode Petani:</td><td><input type="text" id="f3_kode" class="form-control form-control-sm border-0 bg-transparent text-primary fw-bold" readonly></td></tr>
          </table>
        </div>
        <div class="col-md-6">
          <table class="table table-bordered align-middle mb-0">
            <tr><td class="bg-light fw-bold" style="width:30%;">Alamat Petani:</td><td><input type="text" id="f3_alamat" class="form-control form-control-sm border-0 bg-transparent" readonly></td></tr>
            <tr><td class="bg-light fw-bold">Alamat Lahan:</td><td><input type="text" id="f3_alamat_lahan" class="form-control form-control-sm border-0" placeholder="Ketik lokasi spesifik lahan"></td></tr>
          </table>
        </div>
      </div>

      <div class="mb-3">
        <label class="form-label small fw-bold">Status Kepemilikan Lahan:</label>
        <input type="text" id="f3_status_milik" class="form-control form-control-sm" placeholder="Contoh: Milik Sendiri / Sewa / Bagi Hasil">
      </div>

      <div class="section-title">📊 Lahan Pertanian Organik (Semua lahan, termasuk konvensional)</div>
      <div class="table-responsive mt-2">
        <table class="table table-bordered table-sm align-middle text-center small">
          <thead>
            <tr>
              <th style="width:25%;">Nomer Kode Lahan (Sesuai Peta)</th><th style="width:15%;">Ha</th><th style="width:20%;">Tanaman Utama</th><th style="width:20%;">Tanaman Sisipan</th><th style="width:20%;">Pemakaian Terakhir Kimia</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><input type="text" id="lh_k1" class="form-control form-control-sm border-0 text-center" value="Lahan 1"></td><td><input type="text" id="lh_h1" class="form-control form-control-sm border-0 text-center"></td><td><input type="text" id="lh_u1" class="form-control form-control-sm border-0"></td><td><input type="text" id="lh_s1" class="form-control form-control-sm border-0"></td><td><input type="text" id="lh_km1" class="form-control form-control-sm border-0" placeholder="Produk & Bln/Thn"></td></tr>
            <tr><td><input type="text" id="lh_k2" class="form-control form-control-sm border-0 text-center" value="Lahan 2"></td><td><input type="text" id="lh_h2" class="form-control form-control-sm border-0 text-center"></td><td><input type="text" id="lh_u2" class="form-control form-control-sm border-0"></td><td><input type="text" id="lh_s2" class="form-control form-control-sm border-0"></td><td><input type="text" id="lh_km2" class="form-control form-control-sm border-0"></td></tr>
            <tr><td><input type="text" id="lh_k3" class="form-control form-control-sm border-0 text-center" value="Lahan 3"></td><td><input type="text" id="lh_h3" class="form-control form-control-sm border-0 text-center"></td><td><input type="text" id="lh_u3" class="form-control form-control-sm border-0"></td><td><input type="text" id="lh_s3" class="form-control form-control-sm border-0"></td><td><input type="text" id="lh_km3" class="form-control form-control-sm border-0"></td></tr>
          </tbody>
        </table>
      </div>

      <div class="section-title">📅 Kalender Masa Tanam & Estimasi Produksi</div>
      <div class="table-responsive mt-2">
        <table class="table table-bordered table-sm align-middle text-center small">
          <thead>
            <tr>
              <th>Masa Tanam</th><th>Tanggal Tanam</th><th>Tanggal Panen</th><th>Produksi (Kg)</th><th>Tanggal Pendataan</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>MT 1</td><td><input type="text" id="mt_t1" class="form-control form-control-sm border-0 text-center" placeholder="tgl/bln/thn"></td><td><input type="text" id="mt_p1" class="form-control form-control-sm border-0 text-center"></td><td><input type="number" id="mt_k1" class="form-control form-control-sm border-0 text-center"></td><td><input type="text" id="mt_d1" class="form-control form-control-sm border-0 text-center"></td></tr>
            <tr><td>MT 2</td><td><input type="text" id="mt_t2" class="form-control form-control-sm border-0 text-center"></td><td><input type="text" id="mt_p2" class="form-control form-control-sm border-0 text-center"></td><td><input type="number" id="mt_k2" class="form-control form-control-sm border-0 text-center"></td><td><input type="text" id="mt_d2" class="form-control form-control-sm border-0 text-center"></td></tr>
            <tr><td>MT 3</td><td><input type="text" id="mt_t3" class="form-control form-control-sm border-0 text-center"></td><td><input type="text" id="mt_p3" class="form-control form-control-sm border-0 text-center"></td><td><input type="number" id="mt_k3" class="form-control form-control-sm border-0 text-center"></td><td><input type="text" id="mt_d3" class="form-control form-control-sm border-0 text-center"></td></tr>
          </tbody>
        </table>
      </div>

      <div class="section-title">🗺️ Matriks Batas Koordinat Geografis Lahan</div>
      <div class="table-responsive mt-2">
        <table class="table table-bordered table-sm align-middle small">
          <thead>
            <tr>
              <th style="background-color:#4a5568; color:white; width:20%;">Batas Lahan</th><th class="text-center" style="background-color:#4a5568; color:white;">Barat</th><th class="text-center" style="background-color:#4a5568; color:white;">Timur</th><th class="text-center" style="background-color:#4a5568; color:white;">Selatan</th><th class="text-center" style="background-color:#4a5568; color:white;">Utara</th>
            </tr>
          </thead>
          <tbody>
            <tr><td class="fw-bold bg-light">Jenis Batas</td><td><input type="text" id="b_jb_b" class="form-control form-control-sm border-0"></td><td><input type="text" id="b_jb_t" class="form-control form-control-sm border-0"></td><td><input type="text" id="b_jb_s" class="form-control form-control-sm border-0"></td><td><input type="text" id="b_jb_u" class="form-control form-control-sm border-0"></td></tr>
            <tr><td class="fw-bold bg-light">Pemilik</td><td><input type="text" id="b_p_b" class="form-control form-control-sm border-0"></td><td><input type="text" id="b_p_t" class="form-control form-control-sm border-0"></td><td><input type="text" id="b_p_s" class="form-control form-control-sm border-0"></td><td><input type="text" id="b_p_u" class="form-control form-control-sm border-0"></td></tr>
            <tr><td class="fw-bold bg-light">Status Lahan</td><td><input type="text" id="b_s_b" class="form-control form-control-sm border-0" placeholder="Organik/Kimia"></td><td><input type="text" id="b_s_t" class="form-control form-control-sm border-0"></td><td><input type="text" id="b_s_s" class="form-control form-control-sm border-0"></td><td><input type="text" id="b_s_u" class="form-control form-control-sm border-0"></td></tr>
          </tbody>
        </table>
      </div>

      <div class="section-title"> Rooster Produksi Ternak Pendukung Pupuk Alami</div>
      <div class="table-responsive mt-2">
        <table class="table table-bordered table-sm align-middle text-center small">
          <thead>
            <tr>
              <th style="width:25%;">Jenis Ternak</th><th style="width:15%;">Jumlah</th><th style="width:35%;">Pakan dan Pengobatan</th><th style="width:25%;">Kondisi Ternak</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><input type="text" id="tk_j1" class="form-control form-control-sm border-0" placeholder="Misal: Sapi Potong"></td><td><input type="number" id="tk_jm1" class="form-control form-control-sm border-0 text-center"></td><td><input type="text" id="tk_p1" class="form-control form-control-sm border-0"></td><td><input type="text" id="tk_k1" class="form-control form-control-sm border-0" placeholder="Sehat / Sakit"></td></tr>
            <tr><td><input type="text" id="tk_j2" class="form-control form-control-sm border-0" placeholder="Misal: Kambing"></td><td><input type="number" id="tk_jm2" class="form-control form-control-sm border-0 text-center"></td><td><input type="text" id="tk_p2" class="form-control form-control-sm border-0"></td><td><input type="text" id="tk_k2" class="form-control form-control-sm border-0"></td></tr>
          </tbody>
        </table>
      </div>

      <div class="text-center mt-4">
        <button type="button" id="btnSimpanF3" class="btn btn-success fw-bold py-2 px-5 shadow-sm" style="border-radius: 8px;" onclick="simpanDataForm3KeSheets()">
          <i class="bi bi-file-earmark-pdf-fill me-2"></i> Simpan & Cek PDF
        </button>
      </div>

    </div>
  </div>

  <script>
    var dbPetaniF3 = [];
    
    window.onload = function() {
      var hariIni = new Date().toLocaleDateString('id-ID');
      var elemD1 = document.getElementById('mt_d1');
      if(elemD1) elemD1.value = hariIni;

      // 1. TAMPILKAN LOADING AWAL SAAT SINKRONISASI DATABASE (Sama seperti Form 1 & 2)
      aturLoadingOverlay(true, "Sinkronisasi Data...", "Mengambil database petani terbaru dari Google Sheets...");

      google.script.run.withSuccessHandler(function(res) {
        aturLoadingOverlay(false); // Matikan loading jika sukses
        
        var dropdown = document.getElementById('pilih_petani_f3');
        if (res && res.status === "Sukses") {
          dbPetaniF3 = res.data;
          dropdown.innerHTML = '<option value="">-- Cari Nama Petani --</option>';
          dbPetaniF3.forEach(p => {
            var o = document.createElement('option'); o.value = p.id;
            o.textContent = p.nama + " [" + p.id + "]"; dropdown.appendChild(o);
          });
        }
      }).withFailureHandler(function(err) {
        aturLoadingOverlay(false);
        Swal.fire({ icon: 'error', title: 'Koneksi Gagal', text: err.toString() });
      }).ambilDataPetani();
    };

    function eksekusiAutoFillF3() {
      var id = document.getElementById('pilih_petani_f3').value;
      var p = dbPetaniF3.find(x => x.id === id);
      if(p) {
        document.getElementById('f3_nama').value = p.nama;
        document.getElementById('f3_kode').value = "APL / " + p.id;
        document.getElementById('f3_alamat').value = p.alamat;
        
        var meterPersegi = parseFloat(p.luas) || 0;
        var hektar = meterPersegi / 10000;
        
        document.getElementById('lh_h1').value = hektar > 0 ? hektar.toFixed(2) + " Ha" : p.luas;
        document.getElementById('lh_u1').value = p.varietas;
      }
    }

    // 2. LOGIKA KONTROL LOADING OVERLAY DINAMIS
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

    function simpanDataForm3KeSheets() {
      var idPetani = document.getElementById('pilih_petani_f3').value;
      if (!idPetani) {
        Swal.fire({ icon: 'warning', title: 'Perhatian', text: '⚠️ Mohon pilih nama petani terlebih dahulu!' });
        return;
      }

      // 3. AKTIFKAN LOADING UTAMA SAAT PROSES SIMPAN (Sama seperti Form 1 & 2)
      aturLoadingOverlay(true, "Menyimpan Data...", "Sedang menyusun formulir & membuat berkas PDF, harap tunggu...");

      var paketData = {
        idPetani: idPetani,
        nama: document.getElementById('f3_nama').value,
        alamat: document.getElementById('f3_alamat').value,
        alamatLahan: document.getElementById('f3_alamat_lahan').value,
        statusMilik: document.getElementById('f3_status_milik').value,
        
        lh_k1: document.getElementById('lh_k1').value, lh_h1: document.getElementById('lh_h1').value, lh_u1: document.getElementById('lh_u1').value, lh_s1: document.getElementById('lh_s1').value, lh_km1: document.getElementById('lh_km1').value,
        lh_k2: document.getElementById('lh_k2').value, lh_h2: document.getElementById('lh_h2').value, lh_u2: document.getElementById('lh_u2').value, lh_s2: document.getElementById('lh_s2').value, lh_km2: document.getElementById('lh_km2').value,
        lh_k3: document.getElementById('lh_k3').value, lh_h3: document.getElementById('lh_h3').value, lh_u3: document.getElementById('lh_u3').value, lh_s3: document.getElementById('lh_s3').value, lh_km3: document.getElementById('lh_km3').value,
        
        mt_t1: document.getElementById('mt_t1').value, mt_p1: document.getElementById('mt_p1').value, mt_k1: document.getElementById('mt_k1').value, mt_d1: document.getElementById('mt_d1').value,
        mt_t2: document.getElementById('mt_t2').value, mt_p2: document.getElementById('mt_p2').value, mt_k2: document.getElementById('mt_k2').value, mt_d2: document.getElementById('mt_d2').value,
        mt_t3: document.getElementById('mt_t3').value, mt_p3: document.getElementById('mt_p3').value, mt_k3: document.getElementById('mt_k3').value, mt_d3: document.getElementById('mt_d3').value,
        
        b_jb_b: document.getElementById('b_jb_b').value, b_p_b: document.getElementById('b_p_b').value, b_s_b: document.getElementById('b_s_b').value,
        b_jb_t: document.getElementById('b_jb_t').value, b_p_t: document.getElementById('b_p_t').value, b_s_t: document.getElementById('b_s_t').value,
        b_jb_s: document.getElementById('b_jb_s').value, b_p_s: document.getElementById('b_p_s').value, b_s_s: document.getElementById('b_s_s').value,
        b_jb_u: document.getElementById('b_jb_u').value, b_p_u: document.getElementById('b_p_u').value, b_s_u: document.getElementById('b_s_u').value,
        
        tk_j1: document.getElementById('tk_j1').value, tk_jm1: document.getElementById('tk_jm1').value, tk_p1: document.getElementById('tk_p1').value, tk_k1: document.getElementById('tk_k1').value,
        tk_j2: document.getElementById('tk_j2').value, tk_jm2: document.getElementById('tk_jm2').value, tk_p2: document.getElementById('tk_p2').value, tk_k2: document.getElementById('tk_k2').value
      };

      google.script.run.withSuccessHandler(function(respon) {
        aturLoadingOverlay(false); // Matikan loading jika respons data kembali
        
        if(respon.status === "Sukses") {
          Swal.fire({
            icon: 'success',
            title: 'Berhasil Disimpan!',
            text: respon.pesan,
            confirmButtonColor: '#198754'
          }).then(() => {
            if(respon.pdfUrl) window.open(respon.pdfUrl, '_blank');
          });
        } else {
          Swal.fire({ icon: 'error', title: 'Proses Gagal', text: respon.pesan });
        }
      }).withFailureHandler(function(err) {
        aturLoadingOverlay(false);
        Swal.fire({ icon: 'error', title: 'Error Sistem', text: err.toString() });
      }).simpanDanCetakForm3(paketData);
    }
  </script>

  <div id="loadingOverlay" class="d-none animate-fade-in">
    <div class="text-center text-white">
      <div class="spinner-border text-success mb-3" role="status" style="width: 4rem; height: 4rem; border-width: 0.4rem;">
        <span class="visually-hidden">Loading...</span>
      </div>
      <h4 class="fw-bold mb-1" id="loadingTitle" style="letter-spacing: 0.5px;">Memproses Data...</h4>
      <p class="text-light small opacity-75 mb-0" id="loadingSub">Harap tunggu, jangan menutup atau me-refresh halaman.</p>
    </div>
  </div>

  <style>
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
</body>
</html>
`;