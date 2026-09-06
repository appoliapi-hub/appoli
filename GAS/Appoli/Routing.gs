/**
 * ROUTING ENGINE UPDATE (PRODUCTION READY)
 * Update: Auto-inject Logo APPOLI Base64 ke seluruh halaman form.
 */
function doGet(e) {
  var halaman = e && e.parameter.page ? e.parameter.page : 'utama';
  var urlAplikasi = ScriptApp.getService().getUrl();

  // Sistem mengambil variabel LOGO_APPOLI_BASE64 secara otomatis dari file logo.gs Anda
  var logo = typeof LOGO_APPOLI_BASE64 !== 'undefined' ? LOGO_APPOLI_BASE64 : '';

  // JALUR DATA MASTER PETANI
  if (halaman === 'petani') {
    var htmlPetani = HTML_HALAMAN_INPUT_PETANI.replace(/{{LOGO_APPOLI}}/g, logo);
    return HtmlService.createHtmlOutput(htmlPetani)
      .setTitle("Kelola Data Petani - APPOLI")
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  // JALUR FORM 1: Analisa Usaha Tani
  if (halaman === 'analisa') {
    var htmlAnalisa = HTML_FORM_ANALISA.replace(/{{LOGO_APPOLI}}/g, logo);
    return HtmlService.createHtmlOutput(htmlAnalisa)
      .setTitle("Formulir Analisa Usaha Tani - APPOLI")
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  // JALUR FORM 2: Inspeksi Internal
  if (halaman === 'inspeksi') { 
    var htmlInspeksi = HTML_FORM_INSPEKSI.replace(/{{LOGO_APPOLI}}/g, logo);
    return HtmlService.createHtmlOutput(htmlInspeksi)
      .setTitle("Formulir Inspeksi Internal - APPOLI")
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); 
  }

  // JALUR FORM 3: Pendataan Petani & Lahan
  if (halaman === 'pendataan_petani') { 
    var htmlPendataan = HTML_FORM_PENDATAAN_LAHAN.replace(/{{LOGO_APPOLI}}/g, logo);
    return HtmlService.createHtmlOutput(htmlPendataan)
      .setTitle("Formulir Pendataan Petani & Lahan - APPOLI")
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); 
  }

  // PORTAL UTAMA
  var tampilanUtama = HTML_PORTAL_UTAMA
                        .replace(/{{URL_APLIKASI}}/g, urlAplikasi)
                        .replace(/{{LOGO_APPOLI}}/g, logo); // Disuntikkan juga ke portal jika dibutuhkan
  return HtmlService.createHtmlOutput(tampilanUtama)
    .setTitle("Portal Utama - APPOLI SYSTEM")
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}