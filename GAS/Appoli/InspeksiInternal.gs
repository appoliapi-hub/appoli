
// =========================================================================
// D. FORM 2: FORMULIR INSPEKSI INTERNAL (LENGKAP + SYSTEM LOADING OVERLAY)
// =========================================================================
var HTML_FORM_INSPEKSI = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Formulir Inspeksi Internal - APPOLI</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <style>
    body { background: #f4f6f9; padding: 30px 0; font-family: 'Segoe UI', sans-serif; }
    .paper-form { background: #ffffff; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); padding: 40px; max-width: 900px; margin: 0 auto; }
    .header-title { border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 20px; }
    .table-custom th { background-color: #f8f9fa; font-weight: bold; font-size: 0.9rem; text-align: center; }
    .section-head { background-color: #e9ecef; font-weight: bold; color: #495057; }
    .form-control-sm-custom { height: 32px; padding: 2px 8px; font-size: 0.9rem; }
    .radio-cell { text-align: center; width: 100px; }
  </style>
</head>
<body>

  <!-- SYSTEM LOADING OVERLAY 2 TAHAP -->
  <div id="loadingOverlay" class="d-none position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style="background: rgba(0,0,0,0.75); z-index: 9999;">
    <div class="text-center text-white p-4">
      <div class="spinner-border text-success mb-3" role="status" style="width: 4rem; height: 4rem; border-width: 0.4rem;"></div>
      <h4 class="fw-bold mb-1" id="loadingTitle">Memproses Data...</h4>
      <p class="text-light small opacity-75 mb-0" id="loadingSub">Harap tunggu, jangan menutup atau me-refresh halaman.</p>
    </div>
  </div>

  <div class="container">
    <div class="paper-form">
      
      <!-- KOP HEAD APPOLI -->
      <div class="row align-items-center header-title">
        <div class="col-2 text-center"><span style="font-size: 3rem;"><img src="{{LOGO_APPOLI}}" class="img-fluid" style="max-height: 85px; object-fit: contain;" alt="Logo APPOLI"></span></div>
        <div class="col-10 text-center">
          <h4 class="fw-bold mb-0">APPOLI</h4>
          <h5 class="mb-1">Aliansi Petani Padi dan Palawija Organik Boyolali</h5>
          <p class="text-muted small mb-0">Dk. Mencil RT.02/01 Desa Glongong, Kec. Nogosari, Kab. Boyolali</p>
          <p class="text-muted small mb-0">Tel : 082313395639 Website : www.appoliboyolali.com</p>
        </div>
      </div>

      <h4 class="text-center fw-bold my-4 text-dark">FORMULIR INSPEKSI INTERNAL</h4>

      <!-- DROPDOWN PILIH MASTER DATABASE -->
      <div class="mb-4 p-3 border border-primary" style="background-color: #f0f4f8; border-radius: 8px;">
        <label class="form-label fw-bold text-primary">👥 Pilih Petani Terdaftar (Sistem Database):</label>
        <select id="pilih_petani_inspeksi" class="form-select fw-bold border-primary" onchange="eksekusiAutoFillInspeksi()">
          <option value="">Sedang memuat database petani...</option>
        </select>
      </div>

      <!-- PROFIL METADATA -->
      <div class="row g-3 mb-4">
        <div class="col-md-6">
          <div class="table-responsive">
            <table class="table table-sm table-bordered align-middle mb-0">
              <tr>
                <td style="width: 30%;" class="fw-bold bg-light small">Nama Petani</td>
                <td><input type="text" id="ins_nama" class="form-control form-control-sm border-0 bg-transparent fw-bold" readonly placeholder="- Pilih di atas -"></td>
              </tr>
              <tr>
                <td class="fw-bold bg-light small">Kode Petani</td>
                <td><input type="text" id="ins_kode" class="form-control form-control-sm border-0 bg-transparent text-primary fw-bold" readonly placeholder="- Otomatis -"></td>
              </tr>
              <tr>
                <td class="fw-bold bg-light small">Alamat / Klp</td>
                <td><input type="text" id="ins_alamat" class="form-control form-control-sm border-0 bg-transparent" readonly placeholder="- Otomatis -"></td>
              </tr>
            </table>
          </div>
        </div>
        <div class="col-md-6">
          <div class="table-responsive">
            <table class="table table-sm table-bordered align-middle mb-0">
              <tr>
                <td style="width: 35%;" class="fw-bold bg-light small">Inspektur Internal</td>
                <td><input type="text" id="ins_petugas" class="form-control form-control-sm border-0" placeholder="Ketik nama petugas"></td>
              </tr>
              <tr>
                <td class="fw-bold bg-light small">Tanggal Inspeksi</td>
                <td><input type="date" id="ins_tanggal" class="form-control form-control-sm border-0"></td>
              </tr>
              <tr>
                <td class="fw-bold bg-light small">Jam Inspeksi</td>
                <td><input type="time" id="ins_jam" class="form-control form-control-sm border-0"></td>
              </tr>
            </table>
          </div>
        </div>
      </div>

      <p class="small text-muted mb-2"><em>* Pilihlah keterangan opsi bidang lahan dan checklist kriteria di bawah ini:</em></p>

      <!-- REGISTRASI STATUS BIDANG LAHAN -->
      <div class="card p-3 mb-4 bg-light">
        <label class="fw-bold small mb-2">Bidang lahan, apakah sama dengan tahun lalu dan telah diregistrasi dalam dokumentasi internal?</label>
        <div class="d-flex gap-4">
          <div class="form-check"><input class="form-check-input" type="radio" name="status_bidang" id="sb1" value="Baru"><label class="form-check-label small" for="sb1">Baru</label></div>
          <div class="form-check"><input class="form-check-input" type="radio" name="status_bidang" id="sb2" value="Sama" checked><label class="form-check-label small" for="sb2">Sama</label></div>
          <div class="form-check"><input class="form-check-input" type="radio" name="status_bidang" id="sb3" value="Penambahan"><label class="form-check-label small" for="sb3">Penambahan</label></div>
          <div class="form-check"><input class="form-check-input" type="radio" name="status_bidang" id="sb4" value="Pengurangan"><label class="form-check-label small" for="sb4">Pengurangan</label></div>
        </div>
      </div>

      <!-- MATRIKS DETAIL LAHAN MULTI-BARIS -->
      <div class="table-responsive mb-4">
        <table class="table table-bordered table-sm align-middle mb-0">
          <thead class="table-dark text-center small">
            <tr>
              <th>Bidang Lahan</th><th style="width: 15%;">Luas (m²)</th><th style="width: 25%;">Tanaman Utama</th><th style="width: 25%;">Tanaman Selingan</th><th>Terakhir Kimia Terlarang</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="text-center small fw-bold">Lahan 1</td>
              <td><input type="number" id="luas_l1" class="form-control form-control-sm-custom text-center hitung-luas" value="0"></td>
              <td><input type="text" id="utama_l1" class="form-control form-control-sm-custom"></td>
              <td><input type="text" id="selingan_l1" class="form-control form-control-sm-custom"></td>
              <td><input type="text" id="kimia_l1" class="form-control form-control-sm-custom" placeholder="Bulan/Tahun"></td>
            </tr>
            <tr>
              <td class="text-center small fw-bold">Lahan 2</td>
              <td><input type="number" id="luas_l2" class="form-control form-control-sm-custom text-center hitung-luas" value="0"></td>
              <td><input type="text" id="utama_l2" class="form-control form-control-sm-custom"></td>
              <td><input type="text" id="selingan_l2" class="form-control form-control-sm-custom"></td>
              <td><input type="text" id="kimia_l2" class="form-control form-control-sm-custom"></td>
            </tr>
            <tr>
              <td class="text-center small fw-bold">Lahan 3</td>
              <td><input type="number" id="luas_l3" class="form-control form-control-sm-custom text-center hitung-luas" value="0"></td>
              <td><input type="text" id="utama_l3" class="form-control form-control-sm-custom"></td>
              <td><input type="text" id="selingan_l3" class="form-control form-control-sm-custom"></td>
              <td><input type="text" id="kimia_l3" class="form-control form-control-sm-custom"></td>
            </tr>
            <tr class="table-warning fw-bold">
              <td class="text-end small">Total Lahan m²:</td>
              <td><input type="number" id="total_lahan_m2" class="form-control form-control-sm-custom text-center fw-bold text-danger" readonly value="0"></td>
              <td colspan="3" class="bg-light"></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PERTANYAAN KELOLA ORGANIK -->
      <div class="card p-3 mb-4 border-success" style="background-color: #f4faf6;">
        <div class="d-flex justify-content-between align-items-center">
          <label class="fw-bold small mb-0 text-success">Apakah seluruh usahatani di lahan organik dikelola secara organik (seluruh tanaman)?</label>
          <div class="d-flex gap-3">
            <div class="form-check"><input class="form-check-input border-success" type="radio" name="kelola_organik" id="ko_ya" value="Ya" checked><label class="form-check-label small fw-bold" for="ko_ya">Ya</label></div>
            <div class="form-check"><input class="form-check-input border-success" type="radio" name="kelola_organik" id="ko_tidak" value="Tidak"><label class="form-check-label small fw-bold" for="ko_tidak">Tidak</label></div>
          </div>
        </div>
      </div>

      <!-- ASPEK PEMERIKSAAN KEPATUHAN LAPANGAN -->
      <div class="table-responsive mb-4">
        <table class="table table-bordered table-sm align-middle mb-0">
          <thead class="table-dark text-center small">
            <tr>
              <th>Kriteria / Aspek Pemeriksaan Kepatuhan Lapangan</th>
              <th style="width: 12%;">Kondisi Diterima</th>
              <th style="width: 12%;">Tidak Diterima</th>
              <th style="width: 30%;">Dasar Penerimaan / Kondisi Riil</th>
            </tr>
          </thead>
          <tbody>
            <tr class="section-head"><td colspan="4">1. Kriteria Produksi Ternak</td></tr>
            <tr><td>Kondisi hewan ternak</td><td class="radio-cell"><input type="radio" name="c_ternak_kondisi" value="Diterima" checked></td><td class="radio-cell"><input type="radio" name="c_ternak_kondisi" value="Tidak"></td><td><input type="text" id="d_ternak_kondisi" class="form-control form-control-sm-custom"></td></tr>
            <tr><td>Makanan yang diberikan</td><td class="radio-cell"><input type="radio" name="c_ternak_makan" value="Diterima" checked></td><td class="radio-cell"><input type="radio" name="c_ternak_makan" value="Tidak"></td><td><input type="text" id="d_ternak_makan" class="form-control form-control-sm-custom"></td></tr>

            <tr class="section-head"><td colspan="4">2. Status Lahan</td></tr>
            <tr><td>Apakah lahan sudah melewati masa konversi</td><td class="radio-cell"><input type="radio" name="c_lahan_konversi" value="Diterima" checked></td><td class="radio-cell"><input type="radio" name="c_lahan_konversi" value="Tidak"></td><td><input type="text" id="d_lahan_konversi" class="form-control form-control-sm-custom"></td></tr>
            <tr><td>Apakah lahan pertanian organik terpisah dari lahan konvensional</td><td class="radio-cell"><input type="radio" name="c_lahan_pisah" value="Diterima" checked></td><td class="radio-cell"><input type="radio" name="c_lahan_pisah" value="Tidak"></td><td><input type="text" id="d_lahan_pisah" class="form-control form-control-sm-custom"></td></tr>
            <tr><td>Konservasi (sistem air, tanah, hutan, dsb)</td><td class="radio-cell"><input type="radio" name="c_lahan_konservasi" value="Diterima" checked></td><td class="radio-cell"><input type="radio" name="c_lahan_konservasi" value="Tidak"></td><td><input type="text" id="d_lahan_konservasi" class="form-control form-control-sm-custom"></td></tr>
            <tr><td>Petani terlatih dalam sistem pertanian organik</td><td class="radio-cell"><input type="radio" name="c_lahan_latih" value="Diterima" checked></td><td class="radio-cell"><input type="radio" name="c_lahan_latih" value="Tidak"></td><td><input type="text" id="d_lahan_latih" class="form-control form-control-sm-custom"></td></tr>
            <tr><td>Apakah ada zona pembatas dan filter yang memadai untuk mengatasi kontaminasi</td><td class="radio-cell"><input type="radio" name="c_lahan_filter" value="Diterima" checked></td><td class="radio-cell"><input type="radio" name="c_lahan_filter" value="Tidak"></td><td><input type="text" id="d_lahan_filter" class="form-control form-control-sm-custom"></td></tr>

            <tr class="section-head"><td colspan="4">3. Manajemen Benih</td></tr>
            <tr><td>Dari mana sumber benih</td><td class="radio-cell"><input type="radio" name="c_benih_sumber" value="Diterima" checked></td><td class="radio-cell"><input type="radio" name="c_benih_sumber" value="Tidak"></td><td><input type="text" id="d_benih_sumber" class="form-control form-control-sm-custom" placeholder="Misal: Mandiri/Kelompok"></td></tr>
            <tr><td>Apakah menanam benih rekayasa genetika</td><td class="radio-cell"><input type="radio" name="c_benih_gmo" value="Diterima" checked></td><td class="radio-cell"><input type="radio" name="c_benih_gmo" value="Tidak"></td><td><input type="text" id="d_benih_gmo" class="form-control form-control-sm-custom" placeholder="Wajib Tidak"></td></tr>
            <tr><td>Persiapan dan pengelolaan</td><td class="radio-cell"><input type="radio" name="c_benih_kelola" value="Diterima" checked></td><td class="radio-cell"><input type="radio" name="c_benih_kelola" value="Tidak"></td><td><input type="text" id="d_benih_kelola" class="form-control form-control-sm-custom"></td></tr>

            <tr class="section-head"><td colspan="4">4. Pemupukan Organik</td></tr>
            <tr><td>Bila kondisi tanaman kritis apakah petani masih menggunakan pupuk kimia</td><td class="radio-cell"><input type="radio" name="c_puk_kimia" value="Diterima" checked></td><td class="radio-cell"><input type="radio" name="c_puk_kimia" value="Tidak"></td><td><input type="text" id="d_puk_kimia" class="form-control form-control-sm-custom"></td></tr>
            <tr><td>Pengontrolan rumput liar apakah masih menggunakan herbisida</td><td class="radio-cell"><input type="radio" name="c_puk_herbi" value="Diterima" checked></td><td class="radio-cell"><input type="radio" name="c_puk_herbi" value="Tidak"></td><td><input type="text" id="d_puk_herbi" class="form-control form-control-sm-custom"></td></tr>

            <tr class="section-head"><td colspan="4">5. Manajemen Hama</td></tr>
            <tr><td>Manajemen penyakit</td><td class="radio-cell"><input type="radio" name="c_hama_sakit" value="Diterima" checked></td><td class="radio-cell"><input type="radio" name="c_hama_sakit" value="Tidak"></td><td><input type="text" id="d_hama_sakit" class="form-control form-control-sm-custom"></td></tr>
            <tr><td>Apabila hama dan penyakit sulit dikendalikan apakah petani masih menggunakan pestisida kimia</td><td class="radio-cell"><input type="radio" name="c_hama_pest" value="Diterima" checked></td><td class="radio-cell"><input type="radio" name="c_hama_pest" value="Tidak"></td><td><input type="text" id="d_hama_pest" class="form-control form-control-sm-custom"></td></tr>

            <tr class="section-head"><td colspan="4">6. Manajemen Pola Tanam</td></tr>
            <tr><td>Kesesuaian rotasi & diversifikasi pola tanam di lapangan</td><td class="radio-cell"><input type="radio" name="c_pola_tanam" value="Diterima" checked></td><td class="radio-cell"><input type="radio" name="c_pola_tanam" value="Tidak"></td><td><input type="text" id="d_pola_tanam" class="form-control form-control-sm-custom"></td></tr>
            <tr><td>Apakah setiap rotasi tanaman selalu menerapkan budidaya organic</td><td class="radio-cell"><input type="radio" name="c_pola_organik" value="Diterima" checked></td><td class="radio-cell"><input type="radio" name="c_pola_organik" value="Tidak"></td><td><input type="text" id="d_pola_organik" class="form-control form-control-sm-custom"></td></tr>
          </tbody>
        </table>
      </div>

      <!-- TINDAKAN PASCA PANEN DAN PENGOLAHAN -->
      <h5 class="fw-bold mt-4 mb-2 text-dark">Tindakan pasca panen dan pengolahan</h5>
      <div class="table-responsive mb-4">
        <table class="table table-bordered table-sm align-middle mb-0">
          <thead class="table-light text-center small fw-bold">
            <tr>
              <th>Aktivitas</th>
              <th style="width: 12%;">Kondisi diterima</th>
              <th style="width: 12%;">Tidak diterima</th>
              <th style="width: 30%;">Dasar penerimaan / kondisi</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Pengolahan produk</td><td class="radio-cell"><input type="radio" name="c_pasca_olah" value="Diterima" checked></td><td class="radio-cell"><input type="radio" name="c_pasca_olah" value="Tidak"></td><td><input type="text" id="d_pasca_olah" class="form-control form-control-sm-custom"></td></tr>
            <tr><td>Bagaimana kondisi sak kemasan produk</td><td class="radio-cell"><input type="radio" name="c_pasca_kemasan" value="Diterima" checked></td><td class="radio-cell"><input type="radio" name="c_pasca_kemasan" value="Tidak"></td><td><input type="text" id="d_pasca_kemasan" class="form-control form-control-sm-custom"></td></tr>
            <tr><td>Penyimpanan dan pengiriman</td><td class="radio-cell"><input type="radio" name="c_pasca_simpan" value="Diterima" checked></td><td class="radio-cell"><input type="radio" name="c_pasca_simpan" value="Tidak"></td><td><input type="text" id="d_pasca_simpan" class="form-control form-control-sm-custom"></td></tr>
          </tbody>
        </table>
      </div>

      <!-- MANAJEMEN RISIKO -->
      <h5 class="fw-bold mt-4 mb-2 text-dark">Manajemen resiko</h5>
      <div class="table-responsive mb-3">
        <table class="table table-bordered table-sm align-middle mb-0">
          <thead class="table-light text-center small fw-bold">
            <tr>
              <th>Resiko kontaminasi</th>
              <th style="width: 10%;">Rendah</th>
              <th style="width: 10%;">Menengah</th>
              <th style="width: 10%;">Tinggi</th>
              <th style="width: 30%;">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Lahan pertanian non-organik disekitarnya</td><td class="radio-cell"><input type="radio" name="r_sekitar" value="Rendah" checked></td><td class="radio-cell"><input type="radio" name="r_sekitar" value="Menengah"></td><td class="radio-cell"><input type="radio" name="r_sekitar" value="Tinggi"></td><td><input type="text" id="d_r_sekitar" class="form-control form-control-sm-custom"></td></tr>
            <tr><td>Aktivitas non-organik di lahan sekitar</td><td class="radio-cell"><input type="radio" name="r_aktivitas" value="Rendah" checked></td><td class="radio-cell"><input type="radio" name="r_aktivitas" value="Menengah"></td><td class="radio-cell"><input type="radio" name="r_aktivitas" value="Tinggi"></td><td><input type="text" id="d_r_aktivitas" class="form-control form-control-sm-custom"></td></tr>
            <tr><td>Industri, jalan kendaraan, air limbah, dsb</td><td class="radio-cell"><input type="radio" name="r_industri" value="Rendah" checked></td><td class="radio-cell"><input type="radio" name="r_industri" value="Menengah"></td><td class="radio-cell"><input type="radio" name="r_industri" value="Tinggi"></td><td><input type="text" id="d_r_industri" class="form-control form-control-sm-custom"></td></tr>
          </tbody>
        </table>
      </div>
      <div class="mb-4">
        <label for="r_langkah" class="form-label small fw-bold">Langkah yang diambil untuk mengurangi resiko :</label>
        <textarea id="r_langkah" class="form-control" rows="2" placeholder="Ketik langkah mitigasi penanggulangan resiko lapangan..."></textarea>
      </div>


      <!-- ========================================================================= -->
      <!-- OPSI DIBAWAH INI DISEMBUNYIKAN DARI LAYAR FORM (UNTUK PROSES CETAK PDF ONLY) -->
      <!-- ========================================================================= -->
      <div id="hidden_pdf_components_section" style="display: none;">

        <!-- REKOMENDASI PERSETUJUAN INSPEKTOR -->
        <div class="card p-4 mb-4 border-secondary bg-light">
          <h5 class="fw-bold text-dark mb-3">Rekomendasi persetujuan inspektor</h5>
          <div class="mb-3">
            <label class="fw-bold small mb-2 d-block text-secondary">Pemenuhan kondisi sebelumnya :</label>
            <div class="d-flex flex-wrap gap-3">
              <div class="form-check"><input class="form-check-input" type="radio" name="rekom_kondisi_sebelum" id="rks1" value="Baik" checked><label class="form-check-label small" for="rks1">Baik</label></div>
              <div class="form-check"><input class="form-check-input" type="radio" name="rekom_kondisi_sebelum" id="rks2" value="Sebagian/diterima"><label class="form-check-label small" for="rks2">Sebagian/diterima</label></div>
              <div class="form-check"><input class="form-check-input" type="radio" name="rekom_kondisi_sebelum" id="rks3" value="Hilang/tidak diterima"><label class="form-check-label small" for="rks3">Hilang/tidak diterima</label></div>
              <div class="form-check"><input class="form-check-input" type="radio" name="rekom_kondisi_sebelum" id="rks4" value="Tidak ada kondisi tahun sebelumnya"><label class="form-check-label small" for="rks4">Tidak ada kondisi tahun sebelumnya</label></div>
            </div>
          </div>
          <div class="mb-3">
            <label class="fw-bold small mb-2 d-block text-secondary">Pemenuhan tahun ini :</label>
            <div class="d-flex flex-wrap gap-4">
              <div class="form-check"><input class="form-check-input" type="radio" name="rekom_tahun_ini" id="rti1" value="Menyetujui tanpa syarat" checked><label class="form-check-label small" for="rti1">Menyetujui tanpa syarat</label></div>
              <div class="form-check"><input class="form-check-input" type="radio" name="rekom_tahun_ini" id="rti2" value="Menyetujui dengan syarat"><label class="form-check-label small" for="rti2">Menyetujui dengan syarat</label></div>
              <div class="form-check"><input class="form-check-input" type="radio" name="rekom_tahun_ini" id="rti3" value="Hilang/tidak diterima"><label class="form-check-label small" for="rti3">Hilang/tidak diterima</label></div>
            </div>
          </div>
          <div class="mb-3">
            <label for="rekom_syarat" class="form-label small fw-bold">Persyaratan (tindakan perbaikan) atau penjelasan :</label>
            <textarea id="rekom_syarat" class="form-control" rows="2"></textarea>
          </div>
          <div class="row mt-4 text-center">
            <div class="col-6">
              <p class="fw-bold small mb-5">Petani</p>
              <p class="mb-0 small fw-bold text-dark text-decoration-underline" id="ttd_nama_petani">( .................................... )</p>
            </div>
            <div class="col-6">
              <p class="fw-bold small mb-5">Internal Inspektor</p>
              <p class="mb-0 small text-muted">( .................................... )</p>
            </div>
          </div>
        </div>

        <!-- KESEPAKATAN KEPUTUSAN OLEH OPERATOR ICS -->
        <div class="card p-4 mb-4 border-dark bg-white shadow-sm">
          <h5 class="fw-bold text-dark mb-3">Kesepakatan Keputusan oleh Operator ICS</h5>
          <div class="mb-3">
            <label class="fw-bold small mb-2 d-block text-primary">Pemenuhan tahun ini :</label>
            <div class="d-flex flex-wrap gap-4">
              <div class="form-check"><input class="form-check-input" type="radio" name="ics_keputusan" id="ics1" value="Menyetujui Tanpa Syarat" checked><label class="form-check-label small fw-bold" for="ics1">Menyetujui Tanpa Syarat</label></div>
              <div class="form-check"><input class="form-check-input" type="radio" name="ics_keputusan" id="ics2" value="Menyetujui Dengan Syarat"><label class="form-check-label small fw-bold" for="ics2">Menyetujui Dengan Syarat</label></div>
              <div class="form-check"><input class="form-check-input" type="radio" name="ics_keputusan" id="ics3" value="Tidak Dapat Disetujui"><label class="form-check-label small fw-bold" for="ics3">Tidak Dapat Disetujui</label></div>
            </div>
          </div>
          <div class="mb-3">
            <label for="ics_sanksi" class="form-label small fw-bold">Persyaratan tambahan atau sanksi :</label>
            <textarea id="ics_sanksi" class="form-control" rows="2"></textarea>
          </div>
          <div class="row mt-4 text-center justify-content-end">
            <div class="col-6">
              <p class="fw-bold small mb-5">Tanda tangan Manajer Persetujuan</p>
              <p class="mb-0 small text-muted">( .................................... )</p>
            </div>
          </div>
        </div>

      </div>
      <!-- ========================================================================= -->

      <!-- BUTTON AKSI UTAMA (SINKRON DENGAN ID JAVASCRIPT) -->
      <div class="text-center mt-4">
        <button type="button" id="btnSimpanInspeksi" class="btn btn-success fw-bold py-2 px-5 shadow-sm" style="border-radius: 8px;" onclick="simpanDataForm2KeSheets()">
          <i class="bi bi-file-earmark-pdf-fill me-2"></i> SIMPAN HASIL INSPEKSI
        </button>
      </div>

    </div>
  </div>

  <script>
    // ========================================================
    // 1. FUNGSI SIMPAN DATA INSPEKSI & CETAK PDF (ANTI-CRASH)
    // ========================================================
    function simpanDataForm2KeSheets() {
      try {
        var dropdown = document.getElementById('pilih_petani_inspeksi');
        if (!dropdown || !dropdown.value) { 
          alert("⚠️ Mohon tentukan profil petani terlebih dahulu!"); 
          return; 
        }
        var idPetani = dropdown.value;

        // Ambil elemen tombol simpan
        var tombol = document.getElementById('btnSimpanInspeksi');
        if (tombol) {
          tombol.disabled = true;
          tombol.innerHTML = "⏳ Memproses...";
        }

        // PANGGIL SYSTEM LOADING OVERLAY
        var loading = document.getElementById("loadingOverlay");
        var titleText = document.getElementById("loadingTitle");
        var subText = document.getElementById("loadingSub");

        // Aktifkan Loading Tahap 1
        if (loading) {
          if (titleText) titleText.textContent = "Menyimpan ke Spreadsheet...";
          if (subText) subText.textContent = "Sedang mengamankan data Laporan Inspeksi Internal ke database APPOLI.";
          loading.classList.remove("d-none");
        }

        // Fungsi Helper Pengaman Input (Anti-Null/Anti-Crash)
        var getVal = function(id) { var el = document.getElementById(id); return el ? el.value : ""; };
        var getRadio = function(name, def) { return document.querySelector('input[name="'+name+'"]:checked')?.value || def || ""; };

        // BUNDLING PAKET DATA SECARA AMAN
        var paketData = {
          idPetani: idPetani,
          nama: getVal('ins_nama'),
          inspektur: getVal('ins_petugas') || "Petugas Lapang ICS",
          tglInspeksi: getVal('ins_tanggal'),
          jamInspeksi: getVal('ins_jam'),
          totalLahan: getVal('total_lahan_m2'),
          statusBidang: getRadio('status_bidang', 'Sama'),
          kelolaOrganik: getRadio('kelola_organik', 'Ya'),
          
          lahan: {
            l1_luas: getVal('luas_l1'), l1_utama: getVal('utama_l1'), l1_selingan: getVal('selingan_l1'), l1_kimia: getVal('kimia_l1'),
            l2_luas: getVal('luas_l2'), l2_utama: getVal('utama_l2'), l2_selingan: getVal('selingan_l2'), l2_kimia: getVal('kimia_l2'),
            l3_luas: getVal('luas_l3'), l3_utama: getVal('utama_l3'), l3_selingan: getVal('selingan_l3'), l3_kimia: getVal('kimia_l3')
          },
          
          kriteria: {
            ternak_kondisi_c: getRadio('c_ternak_kondisi'), ternak_kondisi_d: getVal('d_ternak_kondisi'),
            ternak_makan_c: getRadio('c_ternak_makan'), ternak_makan_d: getVal('d_ternak_makan'),
            lahan_konversi_c: getRadio('c_lahan_konversi'), lahan_konversi_d: getVal('d_lahan_konversi'),
            lahan_pisah_c: getRadio('c_lahan_pisah'), lahan_pisah_d: getVal('d_lahan_pisah'),
            lahan_konservasi_c: getRadio('c_lahan_konservasi'), lahan_konservasi_d: getVal('d_lahan_konservasi'),
            lahan_latih_c: getRadio('c_lahan_latih'), lahan_latih_d: getVal('d_lahan_latih'),
            lahan_filter_c: getRadio('c_lahan_filter'), lahan_filter_d: getVal('d_lahan_filter'),
            benih_sumber_c: getRadio('c_benih_sumber'), benih_sumber_d: getVal('d_benih_sumber'),
            benih_gmo_c: getRadio('c_benih_gmo'), benih_gmo_d: getVal('d_benih_gmo'),
            benih_kelola_c: getRadio('c_benih_kelola'), benih_kelola_d: getVal('d_benih_kelola'),
            puk_kimia_c: getRadio('c_puk_kimia'), puk_kimia_d: getVal('d_puk_kimia'),
            puk_herbi_c: getRadio('c_puk_herbi'), puk_herbi_d: getVal('d_puk_herbi'),
            hama_sakit_c: getRadio('c_hama_sakit'), hama_sakit_d: getVal('d_hama_sakit'),
            hama_pest_c: getRadio('c_hama_pest'), hama_pest_d: getVal('d_hama_pest'),
            pola_tanam_c: getRadio('c_pola_tanam'), pola_tanam_d: getVal('d_pola_tanam'),
            pola_organik_c: getRadio('c_pola_organik'), pola_organik_d: getVal('d_pola_organik')
          },
          
          pascaPanen: {
            olah_c: getRadio('c_pasca_olah'), olah_d: getVal('d_pasca_olah'),
            kemasan_c: getRadio('c_pasca_kemasan'), kemasan_d: getVal('d_pasca_kemasan'),
            simpan_c: getRadio('c_pasca_simpan'), simpan_d: getVal('d_pasca_simpan')
          },
          
          manajemenResiko: {
            sekitar_r: getRadio('r_sekitar'), sekitar_d: getVal('d_r_sekitar'),
            aktivitas_r: getRadio('r_aktivitas'), aktivitas_d: getVal('d_r_aktivitas'),
            industri_r: getRadio('r_industri'), industri_d: getVal('d_r_industri'),
            langkahMitigasi: getVal('r_langkah')
          },
          
          rekomendasi: {
            kondisiSebelum: getRadio('rekom_kondisi_sebelum'),
            tahunIni: getRadio('rekom_tahun_ini'),
            syaratPenjelasan: getVal('rekom_syarat')
          },
          ics: {
            keputusan: getRadio('ics_keputusan'),
            sanksiTambahan: getVal('ics_sanksi')
          }
        };

        // KIRIM KE BACKEND APPS SCRIPT
        google.script.run
          .withSuccessHandler(function(respon) {
            if (tombol) {
              tombol.disabled = false;
              tombol.innerHTML = "💾 SIMPAN HASIL INSPEKSI";
            }
            
            if(respon.status === "Sukses") {
              // Aktifkan Loading Tahap 2 (Cetak PDF)
              if (loading && titleText && subText) {
                titleText.textContent = "Menggenerate Dokumen PDF...";
                subText.textContent = "Menyusun format berkas Sertifikasi Internal APPOLI.";
              }

              setTimeout(function() {
                if (loading) loading.classList.add("d-none");
                if (respon.pdfUrl) window.open(respon.pdfUrl, '_blank');
                alert("💾 " + (respon.pesan || "Data inspeksi berhasil disimpan!"));
                location.reload();
              }, 1500);

            } else {
              if (loading) loading.classList.add("d-none");
              alert("❌ Gagal Server: " + respon.pesan);
            }
          })
          .withFailureHandler(function(err) {
            if (tombol) {
              tombol.disabled = false;
              tombol.innerHTML = "💾 SIMPAN HASIL INSPEKSI";
            }
            if (loading) loading.classList.add("d-none");
            alert("❌ Kesalahan Jaringan/Sistem: " + err.toString());
          })
          .simpanDanCetakForm2(paketData);

      } catch (error_sistem) {
        if (tombol) {
          tombol.disabled = false;
          tombol.innerHTML = "💾 SIMPAN HASIL INSPEKSI";
        }
        alert("🔍 Terjadi Error Internal JavaScript: " + error_sistem.message);
      }
    }

    // ========================================================
    // 2. LOAD DATA PETANI KE DROPDOWN AUTOMATIC
    // ========================================================
    var databasePetaniLokal = [];

    window.onload = function() {
      var hariIni = new Date().toISOString().split('T')[0];
      var inputTgl = document.getElementById('ins_tanggal');
      if(inputTgl) inputTgl.value = hariIni;

      google.script.run.withSuccessHandler(function(respon) {
        var dropdown = document.getElementById('pilih_petani_inspeksi');
        if (!dropdown) return;
        
        if (respon.status === "Sukses") {
          databasePetaniLokal = respon.data;
          dropdown.innerHTML = '<option value="">-- Cari & Pilih Nama Petani --</option>';
          
          if(databasePetaniLokal.length === 0) {
            dropdown.innerHTML = '<option value="">(Belum ada database, daftarkan data master dulu di Dashboard)</option>';
            return;
          }
          
          databasePetaniLokal.forEach(function(petani) {
            var opt = document.createElement('option');
            opt.value = petani.id;
            opt.textContent = petani.nama + " [" + petani.id + "] - Kelompok: " + petani.kelompok;
            dropdown.appendChild(opt);
          });
        } else {
          dropdown.innerHTML = '<option value="">Gagal mengambil data petani dari server</option>';
        }
      }).ambilDataPetani();
    };

    // ========================================================
    // 3. FUNGSI AUTOFILL PROFIL PETANI & VALUE DEFAULT (FIXED)
    // ========================================================
    function eksekusiAutoFillInspeksi() {
      var idTerpilih = document.getElementById('pilih_petani_inspeksi').value;
      
      // Mencari data petani secara akurat berdasarkan ID yang dipilih
      var data = databasePetaniLokal.find(p => p.id === idTerpilih);
      
      var setElVal = function(id, value) { var el = document.getElementById(id); if(el) el.value = value; };
      var setElTxt = function(id, text) { var el = document.getElementById(id); if(el) el.textContent = text; };

      if (data) {
        setElVal('ins_nama', data.nama);
        setElVal('ins_kode', "APL / " + data.id);
        setElVal('ins_alamat', data.alamat);
        setElTxt('ttd_nama_petani', "( " + data.nama + " )");
        setElVal('luas_l1', parseFloat(data.luas) || 0);
        setElVal('utama_l1', data.varietas);
        kalkulasiTotalLuasLahan();
      } else {
        setElVal('ins_nama', "");
        setElVal('ins_kode', "");
        setElVal('ins_alamat', "");
        setElTxt('ttd_nama_petani', "( .................................... )");
        setElVal('luas_l1', 0);
        setElVal('utama_l1', "");
        kalkulasiTotalLuasLahan();
      }
    }
    // ========================================================
    // 4. HITUNG OTOMATIS MATRIKS LUAS LAHAN
    // ========================================================
    document.querySelectorAll('.hitung-luas').forEach(input => {
      input.addEventListener('input', kalkulasiTotalLuasLahan);
    });

    function kalkulasiTotalLuasLahan() {
      var getFloat = function(id) { var el = document.getElementById(id); return el ? (parseFloat(el.value) || 0) : 0; };
      var l1 = getFloat('luas_l1');
      var l2 = getFloat('luas_l2');
      var l3 = getFloat('luas_l3');
      
      var totalLahan = document.getElementById('total_lahan_m2');
      if(totalLahan) totalLahan.value = l1 + l2 + l3;
    }
  </script>
  
</body>
</html>
`;