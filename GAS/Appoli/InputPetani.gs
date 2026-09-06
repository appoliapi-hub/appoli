// ==========================================
// B. HALAMAN INPUT MASTER DATA PETANI (VERSI ID OTOMATIS)
// ==========================================
var HTML_HALAMAN_INPUT_PETANI = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
  
  <style>
    body { 
      background: linear-gradient(135deg, #f4f6f9 0%, #e8f5e9 100%); 
      padding: 40px 15px; 
      font-family: 'Poppins', sans-serif; 
      color: #333333;
    }
    .form-control { border-radius: 8px; }
    .form-control:focus {
      border-color: #2e7d32;
      box-shadow: 0 0 0 0.25rem rgba(46, 125, 50, 0.25);
    }
  </style>
</head>
<body>
  <div class="container" style="max-width: 600px;">
    <div class="card p-4 p-md-5 shadow-lg border-0" style="border-radius: 20px;">
      
      <h4 class="fw-bold text-success mb-1 d-flex align-items-center">
        <i class="bi bi-person-lines-fill me-2 fs-3"></i> Registrasi Data Petani
      </h4>
      <p class="text-muted small mb-4">Mendaftarkan data induk petani dengan ID yang diatur oleh sistem otomatis.</p>
      
      <div id="statusAlert" class="alert d-none small fw-bold mb-4" role="alert"></div>
      
      <div class="mb-3">
        <label class="form-label small fw-bold text-secondary">ID / Kode Petani (Otomatis Sistem)</label>
        <input type="text" id="reg_id" class="form-control fw-bold text-success" readonly style="background-color: #f8f9fa;" placeholder="Memuat ID Baru...">
      </div>
      <div class="mb-3">
        <label class="form-label small fw-bold text-secondary">Nama Lengkap Petani <span class="text-danger">*</span></label>
        <input type="text" id="reg_nama" class="form-control" placeholder="Masukkan nama petani">
      </div>
      
      <div class="mb-3">
        <label class="form-label small fw-bold text-secondary">Nomor HP</label>
        <input type="text" id="reg_hp" class="form-control" placeholder="Contoh: 081234567890">
      </div>
      
      <div class="mb-3">
        <label class="form-label small fw-bold text-secondary">Alamat Lengkap</label>
        <textarea id="reg_alamat" class="form-control" rows="2" placeholder="Masukkan alamat lengkap petani"></textarea>
      </div>

      <div class="mb-3">
        <label class="form-label small fw-bold text-secondary">Kelompok Tani</label>
        <input type="text" id="reg_kelompok" class="form-control" placeholder="Contoh: Ngudi Makmur">
      </div>
      <div class="mb-3">
        <label class="form-label small fw-bold text-secondary">Luas Lahan</label>
        <input type="text" id="reg_luas" class="form-control" placeholder="Contoh: 2500 m2">
      </div>
      <div class="mb-4">
        <label class="form-label small fw-bold text-secondary">Varietas Komoditas</label>
        <input type="text" id="reg_varietas" class="form-control" placeholder="Contoh: Padi IR64 / Mentik Wangi">
      </div>
      
      <button type="button" id="btnSimpanMaster" class="btn btn-success w-100 fw-bold py-2 shadow-sm" style="border-radius: 8px;" onclick="prosesSimpanMaster()">
        <i class="bi bi-floppy-fill me-2"></i> Simpan Data Petani
      </button>
      
    </div>
  </div>

  <script>
    // OTOMATIS AMBIL ID BARU SAAT HALAMAN DIBUKA
    window.onload = function() {
      muatIdOtomatisBerikutnya();
    };

    function muatIdOtomatisBerikutnya() {
      document.getElementById('reg_id').value = "Memuat ID Baru...";
      google.script.run.withSuccessHandler(function(idBaru) {
        document.getElementById('reg_id').value = idBaru;
      }).ambilNextId();
    }

    function prosesSimpanMaster() {
      var obj = {
        nama: document.getElementById('reg_nama').value.trim(),
        hp: document.getElementById('reg_hp').value.trim(),           // DATA BARU
        alamat: document.getElementById('reg_alamat').value.trim(),   // DATA BARU
        kelompok: document.getElementById('reg_kelompok').value.trim(),
        luas: document.getElementById('reg_luas').value.trim(),
        varietas: document.getElementById('reg_varietas').value.trim()
      };
      
      if(!obj.nama) { 
        alert("Nama Petani wajib diisi!"); 
        document.getElementById('reg_nama').focus();
        return; 
      }
      
      var btn = document.getElementById('btnSimpanMaster');
      var alertBox = document.getElementById('statusAlert');
      
      // Mengubah state tombol menjadi loading
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Menyimpan...';
      
      google.script.run.withSuccessHandler(function(respon) {
        // Mengembalikan state tombol
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-floppy-fill me-2"></i> Simpan Data Petani';
        alertBox.classList.remove('d-none', 'alert-danger', 'alert-success');
        
        if(respon.status === "Sukses") {
          alertBox.textContent = respon.pesan; 
          alertBox.className = "alert alert-success small fw-bold mb-4";
          
          // Kosongkan seluruh form input
          document.getElementById('reg_nama').value = "";
          document.getElementById('reg_hp').value = "";         // KOSONGKAN DATA BARU
          document.getElementById('reg_alamat').value = "";     // KOSONGKAN DATA BARU
          document.getElementById('reg_kelompok').value = ""; 
          document.getElementById('reg_luas').value = ""; 
          document.getElementById('reg_varietas').value = "";
          
          // GENERIKAN ID BARU BERIKUTNYA UNTUK ANTRIAN KEDUA
          muatIdOtomatisBerikutnya();
        } else {
          alertBox.textContent = respon.pesan; 
          alertBox.className = "alert alert-danger small fw-bold mb-4";
        }
      }).simpanPetaniBaru(obj);
    }
  </script>
</body>
</html>
`;
