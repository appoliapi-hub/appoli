// ====================================================================
// A. PORTAL UTAMA (LOGIN ASLI & DASHBOARD PREMIUM MERGE)
// ====================================================================
var HTML_PORTAL_UTAMA = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Portal Terpadu - APPOLI</title>
  
  <!-- BOOTSTRAP & ICONS -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  
  <!-- FONT POPPINS & CHART.JS -->
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  
  <style>
    /* ========================================== */
    /* 1. STYLING GLOBAL & WRAPPER LOGIN ASLI     */
    /* ========================================== */
    body { 
      background: #f8fafc; /* Warna dasar premium */
      font-family: 'Poppins', sans-serif; 
      color: #1e293b;
      margin: 0;
      padding: 0;
      min-height: 100vh;
    }
    
    /* Wrapper khusus agar halaman login berada di tengah */
    #loginWrapper {
      background: linear-gradient(135deg, #f4f6f9 0%, #e8f5e9 100%);
      min-height: 100vh; 
      display: flex; 
      align-items: center; 
      justify-content: center;
      padding: 20px;
    }

    .portal-card { 
      border: none; 
      border-radius: 20px; 
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.06); 
      background-color: #ffffff; 
      padding: 40px; 
      width: 100%; 
      max-width: 440px; 
    }
    .logo-img-login { max-height: 80px; object-fit: contain; margin-bottom: 15px; }

    /* ========================================== */
    /* 2. STYLING KHUSUS DASHBOARD PREMIUM        */
    /* ========================================== */
    .navbar-custom {
      background-color: #0f172a; /* Warna dark premium */
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    }
    
    .card-kpi { 
      border: none; 
      border-radius: 16px; 
      box-shadow: 0 4px 15px rgba(15,23,42,0.03); 
      transition: all 0.3s ease; 
      background: #ffffff;
    }
    .card-kpi:hover { 
      transform: translateY(-4px); 
      box-shadow: 0 12px 25px rgba(15,23,42,0.06); 
    }

    /* Efek Kartu Menu Form */
    .menu-card { 
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
      border: 1px solid #f1f5f9; 
      border-radius: 16px; 
      background: #ffffff;
      overflow: hidden;
      position: relative;
      cursor: pointer;
    }
    .menu-card::before {
      content: ''; position: absolute; top: 0; left: 0; width: 6px; height: 100%;
    }
    .card-analisa::before { background-color: #10b981; }
    .card-inspeksi::before { background-color: #f59e0b; }
    .card-pendataan::before { background-color: #0ea5e9; }
    .menu-card:hover { 
      transform: translateY(-5px); 
      box-shadow: 0 15px 30px rgba(0,0,0,0.06); 
    }

    .activity-feed { max-height: 380px; overflow-y: auto; padding-right: 10px; }
    .activity-item { border-left: 3px solid #10b981; padding-left: 15px; margin-bottom: 20px; position: relative; }
    .activity-item::before { 
      content: ''; position: absolute; left: -7px; top: 5px; width: 11px; height: 11px; 
      background: #10b981; border-radius: 50%; box-shadow: 0 0 0 3px #ecfdf5;
    }
    .search-bar-nav { max-width: 320px; }
    .search-bar-nav input { border-radius: 20px 0 0 20px !important; padding-left: 15px; }
    .search-bar-nav button { border-radius: 0 20px 20px 0 !important; padding-right: 15px; }
  </style>
</head>
<body>

  <!-- ========================================== -->
  <!-- SEKSI LOGIN (BUNGKUS ASLI)                 -->
  <!-- ========================================== -->
  <div id="loginWrapper">
    <div id="seksiLogin" class="portal-card">
      <div class="text-center mb-4">
        <img src="{{LOGO_APPOLI}}" class="logo-img-login" alt="Logo APPOLI">
        <h3 class="fw-bold text-success mb-1" style="letter-spacing: 0.5px;">APPOLI SYSTEM</h3>
        <p class="text-muted small">Sistem Informasi Operasional Terpadu 2026</p>
      </div>
      <div id="alertBox" class="alert d-none small fw-bold" role="alert"></div>
      <div class="mb-3">
        <label class="form-label text-secondary small fw-bold">Username</label>
        <input type="text" id="username" class="form-control" style="border-radius: 8px;">
      </div>
      <div class="mb-4">
        <label class="form-label text-secondary small fw-bold">Password</label>
        <input type="password" id="password" class="form-control" style="border-radius: 8px;">
      </div>
      <button id="btnMasuk" class="btn btn-success w-100 fw-bold py-2" style="border-radius: 8px;" onclick="eksekusiLogin()">MASUK APLIKASI</button>
    </div>
  </div>

  <!-- ========================================== -->
  <!-- SEKSI DASHBOARD (FULL WIDTH, PREMIUM)      -->
  <!-- ========================================== -->
  <div id="seksiDashboard" class="d-none">
    
    <!-- NAVBAR PREMIUM -->
    <nav class="navbar navbar-expand-lg navbar-dark navbar-custom sticky-top py-2.5">
      <div class="container-fluid px-4">
        <a class="navbar-brand fw-bold text-white d-flex align-items-center" href="#" onclick="return false;">
          <i class="bi bi-hexagon-fill text-success me-2"></i> APPOLI SYSTEM
        </a>
        <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <form class="d-flex ms-lg-4 my-2 my-lg-0 search-bar-nav" onsubmit="event.preventDefault(); jalankanPencarianCepat();">
            <div class="input-group input-group-sm">
              <input type="text" id="inputPencarianCepat" class="form-control bg-secondary text-white border-0" placeholder="Cari ID, Nama, Kelompok..." style="background-color: rgba(255,255,255,0.1) !important;">
              <button class="btn btn-success" type="button" onclick="jalankanPencarianCepat()"><i class="bi bi-search"></i></button>
            </div>
          </form>
          <ul class="navbar-nav ms-auto align-items-lg-center">
            <li class="nav-item"><a class="nav-link active fw-medium me-2" href="#" onclick="return false;"><i class="bi bi-house-door me-1"></i> Beranda</a></li>
            <li class="nav-item"><a class="nav-link text-light me-2" href="{{URL_APLIKASI}}?page=registrasi" target="_blank"><i class="bi bi-people me-1"></i> Register</a></li>
            <li class="nav-item dropdown me-3 my-2 my-lg-0">
              <a class="nav-link text-light position-relative" href="#" id="notifDropdown" role="button" data-bs-toggle="dropdown">
                <i class="bi bi-bell fs-5"></i>
                <span class="position-absolute top-1 start-75 translate-middle badge rounded-pill bg-danger" style="font-size: 0.6rem;">3</span>
              </a>
              <ul class="dropdown-menu dropdown-menu-end shadow border-0 mt-2 rounded-3" style="width: 280px;">
                <li><h6 class="dropdown-header fw-bold text-dark">Pemberitahuan Sistem</h6></li>
                <li><a class="dropdown-item small text-wrap py-2" href="#"><i class="bi bi-exclamation-circle text-warning me-2"></i> Jadwal Inspeksi Kelompok Tani Nogosari besok pagi!</a></li>
                <li><a class="dropdown-item small text-wrap py-2" href="#"><i class="bi bi-check-circle text-success me-2"></i> Form 1 Bpk. Budi sukses diverifikasi.</a></li>
              </ul>
            </li>
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle text-white d-flex align-items-center fw-semibold" href="#" id="profilDropdown" role="button" data-bs-toggle="dropdown">
                <div class="bg-success rounded-circle d-flex align-items-center justify-content-center text-white fw-bold me-2" style="width: 32px; height: 32px; font-size: 0.85rem;">US</div>
                <span id="namaUserNav">User Aktif</span>
              </a>
              <ul class="dropdown-menu dropdown-menu-end shadow border-0 mt-2 rounded-3">
                <li><span class="dropdown-item-text text-muted small mb-1">Role: Petugas Lapang</span></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item small text-danger fw-bold" href="#" onclick="eksekusiLogout()"><i class="bi bi-box-arrow-right me-2"></i> Keluar Sistem</a></li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- KONTEN DASHBOARD -->
    <div class="container-fluid px-4 my-4">
      
      <!-- HEADER BANNER -->
      <div class="d-flex align-items-center mb-4 p-4 bg-white rounded-4 shadow-sm">
        <img src="{{LOGO_APPOLI}}" style="max-height: 60px; object-fit: contain;" alt="Logo APPOLI" class="me-4">
        <div>
          <h4 class="fw-bold text-dark mb-1" style="letter-spacing: -0.5px;">Sistem Sertifikasi Internal Organik</h4>
          <p class="text-muted small mb-0">Aliansi Petani Padi dan Palawija Organik Boyolali (APPOLI)</p>
        </div>
      </div>

      <!-- KPI CARDS -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-lg-3">
          <div class="card card-kpi p-3 border-start border-primary border-4">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <p class="text-muted small fw-bold mb-1">TOTAL PETANI</p>
                <h3 class="fw-bold mb-0 text-dark"id="kpiTotalPetani">...</h3>
              </div>
              <div class="fs-1 text-primary opacity-25"><i class="bi bi-people-fill"></i></div>
            </div>
            <span class="text-success small fw-semibold mt-2 d-block"><i class="bi bi-arrow-up-short"></i> +12 Petani bulan ini</span>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="card card-kpi p-3 border-start border-success border-4">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <p class="text-muted small fw-bold mb-1">LUAS LAHAN</p>
                <h3 class="fw-bold mb-0 text-dark"><span id="kpiLuasLahan">...<span class="fs-6 fw-normal text-muted">Ha</span></h3>
              </div>
              <div class="fs-1 text-success opacity-25"><i class="bi bi-geo-alt-fill"></i></div>
            </div>
            <span class="text-muted small mt-2 d-block">Sertifikasi Organik Penuh</span>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="card card-kpi p-3 border-start border-warning border-4">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <p class="text-muted small fw-bold mb-1">INSPEKSI SELESAI</p>
                <h3 class="fw-bold mb-0 text-dark"id="kpiInspeksiSelesai">...</h3>
              </div>
              <div class="fs-1 text-warning opacity-25"><i class="bi bi-file-earmark-check-fill"></i></div>
            </div>
            <span class="text-muted small mt-2 d-block">Target Bulan Ini</span>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="card card-kpi p-3 border-start border-danger border-4">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <p class="text-muted small fw-bold mb-1">ANTREAN INSPEKSI</p>
                <h3 class="fw-bold mb-0 text-dark"id="kpiAntreanInspeksi">...</h3>
              </div>
              <div class="fs-1 text-danger opacity-25"><i class="bi bi-hourglass-split"></i></div>
            </div>
            <span class="text-danger small fw-semibold mt-2 d-block"><i class="bi bi-clock-history"></i> Perlu verifikasi lapang</span>
          </div>
        </div>
      </div>

      <div class="row g-4">
        <!-- KOLOM KIRI (MENU & GRAFIK) -->
        <div class="col-xl-8">
          <h5 class="fw-bold text-dark mb-3"><i class="bi bi-grid-fill me-2 text-success"></i> Instrumen Input Lapangan</h5>
          
          <div class="row g-3 mb-4">
            <div class="col-md-4">
              <div class="card menu-card card-analisa h-100 p-4" onclick="window.open('{{URL_APLIKASI}}?page=analisa', '_blank')">
                <div class="text-center">
                  <div class="fs-1 mb-2" style="color: #10b981;"><i class="bi bi-cash-coin"></i></div>
                  <h6 class="fw-bold mb-2 text-dark">Form 1: Analisa Usaha</h6>
                  <p class="text-muted small mb-0">Kalkulasi biaya produksi, pendapatan, & laba rugi tani.</p>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="card menu-card card-inspeksi h-100 p-4" onclick="window.open('{{URL_APLIKASI}}?page=inspeksi', '_blank')">
                <div class="text-center">
                  <div class="fs-1 mb-2" style="color: #f59e0b;"><i class="bi bi-clipboard-check"></i></div>
                  <h6 class="fw-bold mb-2 text-dark">Form 2: Inspeksi ICS</h6>
                  <p class="text-muted small mb-0">Checklist kepatuhan standar regulasi pangan organik.</p>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="card menu-card card-pendataan h-100 p-4" onclick="window.open('{{URL_APLIKASI}}?page=pendataan_petani', '_blank')">
                <div class="text-center">
                  <div class="fs-1 mb-2" style="color: #0ea5e9;"><i class="bi bi-geo-alt-fill"></i></div>
                  <h6 class="fw-bold mb-2 text-dark">Form 3: Data & Lahan</h6>
                  <p class="text-muted small mb-0">Kalender masa tanam, batas wilayah, & entri ternak alami.</p>
                </div>
              </div>
            </div>
          </div>

          <div class="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
            <h5 class="fw-bold text-dark mb-4"><i class="bi bi-graph-up-arrow me-2 text-primary"></i> Panel Analitik Pantauan</h5>
            <div class="row g-4">
              <div class="col-md-7">
                <p class="text-center small fw-bold text-muted mb-3">Tren Registrasi Petani Baru</p>
                <div style="position: relative; height: 220px; width: 100%;"><canvas id="grafikTrenPetani"></canvas></div>
              </div>
              <div class="col-md-5">
                <p class="text-center small fw-bold text-muted mb-3">Status Sertifikasi Internal</p>
                <div style="position: relative; height: 220px; width: 100%;"><canvas id="grafikPieSertifikasi"></canvas></div>
              </div>
            </div>
          </div>
        </div>

        <!-- KOLOM KANAN (LOG AKTIVITAS) -->
        <div class="col-xl-4">
          <div class="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
            <h5 class="fw-bold text-dark mb-4"><i class="bi bi-clock-history me-2 text-danger"></i> Aktivitas Terbaru</h5>
            <div class="activity-feed">
              <div class="activity-item">
                <span class="text-muted d-block" style="font-size: 0.75rem;"><i class="bi bi-clock me-1"></i> 10 Menit Lalu</span>
                <span class="small fw-bold text-dark d-block mt-1">Pembaruan Profil Lahan Bpk. Budi</span>
                <p class="text-muted mb-0" style="font-size: 0.8rem; line-height: 1.4;">Selesai diinput oleh petugas via Form 3</p>
              </div>
              <div class="activity-item" style="border-left-color: #3b82f6;">
                <style>.activity-item:nth-child(2)::before { background: #3b82f6; box-shadow: 0 0 0 3px #eff6ff; }</style>
                <span class="text-muted d-block" style="font-size: 0.75rem;"><i class="bi bi-clock me-1"></i> 1 Jam Lalu</span>
                <span class="small fw-bold text-dark d-block mt-1">PDF Analisa Usaha Dibuat</span>
                <p class="text-muted mb-0" style="font-size: 0.8rem; line-height: 1.4;">Form 1 Petani Ibu Siti sukses diexport ke Drive.</p>
              </div>
              <div class="activity-item" style="border-left-color: #f59e0b;">
                <style>.activity-item:nth-child(3)::before { background: #f59e0b; box-shadow: 0 0 0 3px #fffbeb; }</style>
                <span class="text-muted d-block" style="font-size: 0.75rem;"><i class="bi bi-clock me-1"></i> 3 Jam Lalu</span>
                <span class="small fw-bold text-dark d-block mt-1">Inspeksi Berstatus "Sanksi Syarat"</span>
                <p class="text-muted mb-0" style="font-size: 0.8rem; line-height: 1.4;">Bpk. Joko mendapat catatan tambahan dari manajer.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
  <script>
    // FUNGSI LOGIN
    function eksekusiLogin() {
      var u = document.getElementById("username").value;
      var p = document.getElementById("password").value;
      var btn = document.getElementById("btnMasuk");
      var alertBox = document.getElementById("alertBox");
      if(!u || !p) return;

      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Memproses...';
      
      google.script.run.withSuccessHandler(function(respon) {
        btn.disabled = false;
        btn.innerHTML = 'MASUK APLIKASI';
        
        if(respon.status === "Sukses") {
          document.getElementById("loginWrapper").classList.add("d-none");
          document.getElementById("seksiDashboard").classList.remove("d-none");
          document.getElementById("namaUserNav").textContent = respon.namaPetugas;
          
          // AMBIL DATA DASHBOARD SECARA DINAMIS SETELAH LOGIN SUKSES
          muatDataDashboardDinamis();
          
        } else {
          alertBox.textContent = respon.pesan; 
          alertBox.className = "alert alert-danger small fw-bold"; 
          alertBox.classList.remove("d-none");
        }
      }).cekLogin(u, p);
    }
    
    // FUNGSI LOGOUT
    function eksekusiLogout() {
      document.getElementById("seksiDashboard").classList.add("d-none");
      document.getElementById("loginWrapper").classList.remove("d-none");
      document.getElementById("username").value = "";
      document.getElementById("password").value = "";
      document.getElementById("alertBox").classList.add("d-none");
    }

    // FUNGSI PENCARIAN
    function jalankanPencarianCepat() {
      var q = document.getElementById('inputPencarianCepat').value;
      if(!q) return;
      alert("🔍 Mencari '" + q + "' pada database sistem...");
    }

// FUNGSI BARU: MENEMBAK BACKEND UNTUK AMBIL DATA REAL
    function muatDataDashboardDinamis() {
      google.script.run.withSuccessHandler(function(dataDash) {
        if(dataDash.status === "Sukses") {
          // Injection data ke komponen KPI
          document.getElementById("kpiTotalPetani").textContent = dataDash.totalPetani;
          document.getElementById("kpiLuasLahan").textContent = dataDash.luasLahan;
          document.getElementById("kpiInspeksiSelesai").textContent = dataDash.inspeksiSelesai;
          document.getElementById("kpiAntreanInspeksi").textContent = dataDash.antreanInspeksi;
          
          // Render Grafik menggunakan data Real dari database
          renderGrafikBatang(dataDash.grafikBatang); 
          renderGrafikPie(dataDash.grafikPie);
        }
      }).ambilStatistikDashboard();
    }
    
    
    // VARIABEL GLOBAL UNTUK MENCEGAH GRAFIK DOUBLE RENDER
    var chartBar = null;
    var chartPie = null;

// FUNGSI RENDER GRAFIK BAR (MENERIMA PARAMETER DATA REAL)
    function renderGrafikBatang(dataReal) {
      var ctx = document.getElementById('grafikTrenPetani').getContext('2d');
      if (chartBar) chartBar.destroy();
      
      chartBar = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul'],
          datasets: [{ 
            label: 'Petani Baru', 
            data: dataReal, // Menggunakan array data dari Google Sheet
            backgroundColor: '#10b981', 
            borderRadius: 6 
          }]
        },
        options: { 
          responsive: true, 
          maintainAspectRatio: false, 
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { borderDash: [2, 4], color: '#f1f5f9' } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    // FUNGSI RENDER GRAFIK BAR
    function renderGrafikBatang() {
      var ctx = document.getElementById('grafikTrenPetani').getContext('2d');
      if (chartBar) chartBar.destroy(); // Hapus grafik lama jika ada
      
      chartBar = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul'],
          datasets: [{ 
            label: 'Petani Baru', 
            data: [12, 19, 15, 22, 28, 14], 
            backgroundColor: '#10b981', 
            borderRadius: 6 
          }]
        },
        options: { 
          responsive: true, 
          maintainAspectRatio: false, 
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { borderDash: [2, 4], color: '#f1f5f9' } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    // FUNGSI RENDER GRAFIK PIE (MENERIMA PARAMETER DATA REAL)
    function renderGrafikPie(dataReal) {
      var ctx = document.getElementById('grafikPieSertifikasi').getContext('2d');
      if (chartPie) chartPie.destroy();
      
      chartPie = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Lolos', 'Syarat', 'Ditolak'],
          datasets: [{ 
            data: dataReal, // Menggunakan array data dari Google Sheet
            backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
            borderWidth: 0
          }]
        },
        options: { 
          responsive: true, 
          maintainAspectRatio: false, 
          cutout: '65%',
          plugins: { 
            legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, font: { family: 'Poppins', size: 11 } } } 
          } 
        }
      });
    }
  </script>
</body>
</html>
`;