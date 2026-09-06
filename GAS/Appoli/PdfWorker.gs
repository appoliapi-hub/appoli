/*
 * APPOLI PDF WORKER
 * Salin file ini ke Apps Script bersama Backend.gs dan LOGO.GS.
 *
 * Script Properties yang diperlukan:
 * APPOLI_CALLBACK_URL    = https://domain-appoli/api/appoli/pdf/callback
 * APPOLI_CALLBACK_SECRET = secret-yang-sama-dengan-server
 *
 * POST body:
 * {
 *   "collection": "analisaUsaha|inspeksiICS|dataLahan",
 *   "documentId": "id-firestore",
 *   "data": { ...data-firestore }
 * }
 */

function doPost(event) {
  var payload;
  try {
    payload = JSON.parse(event && event.postData && event.postData.contents || '{}');
    var properties = PropertiesService.getScriptProperties();
    var configuredSecret = properties.getProperty('APPOLI_CALLBACK_SECRET') || '';
    var requestSecret = event && event.parameter && event.parameter.secret || payload.secret || '';
    if (!configuredSecret || requestSecret !== configuredSecret) {
      return pdfWorkerJson({ status: 'Gagal', pesan: 'Unauthorized.' });
    }

    var collection = String(payload.collection || '');
    var documentId = String(payload.documentId || '');
    var data = payload.data || {};
    if (!documentId || ['analisaUsaha', 'inspeksiICS', 'dataLahan'].indexOf(collection) < 0) {
      throw new Error('collection atau documentId tidak valid.');
    }

    var result = pdfWorkerGenerate(collection, documentId, data);
    pdfWorkerCallback({
      status: 'ready',
      collection: collection,
      documentId: documentId,
      pdfUrl: result.pdfUrl,
      fileId: result.fileId,
      fileName: result.fileName
    });
    return pdfWorkerJson({ status: 'Sukses', pdfUrl: result.pdfUrl, fileId: result.fileId });
  } catch (error) {
    try {
      pdfWorkerCallback({
        status: 'failed',
        collection: payload && payload.collection || '',
        documentId: payload && payload.documentId || '',
        error: String(error && error.message || error)
      });
    } catch (callbackError) {
      console.error(callbackError);
    }
    return pdfWorkerJson({ status: 'Gagal', pesan: String(error && error.message || error) });
  }
}

function pdfWorkerGenerate(collection, documentId, source) {
  var data;
  var result;
  if (collection === 'analisaUsaha') {
    data = pdfWorkerAnalisa(source);
    result = simpanDanCetakForm1(data);
  } else if (collection === 'inspeksiICS') {
    data = pdfWorkerInspeksi(source);
    result = simpanDanCetakForm2(data);
  } else {
    data = pdfWorkerLahan(source);
    result = simpanDanCetakForm3(data);
  }
  if (!result || result.status !== 'Sukses' || !result.pdfUrl) {
    throw new Error(result && result.pesan || 'PDF gagal dibuat.');
  }
  return {
    pdfUrl: result.pdfUrl,
    fileId: pdfWorkerFileId(result.pdfUrl),
    fileName: collection + '-' + documentId + '.pdf'
  };
}

function pdfWorkerAnalisa(source) {
  var output = pdfWorkerCopy(source);
  var rows = source.formData || {};
  var groups = {
    benih: 'a1', pupuk_padat: 'a2_padat', pupuk_cair: 'a2_cair',
    pupuk_urea: 'a3_urea', pupuk_tsp: 'a3_tsp', pupuk_phonska: 'a3_phonska',
    pestisida_organik: 'a4', pestisida_kimia: 'a5', lahan_persemaian: 'b1',
    sebar_benih: 'b2', daut_cabut: 'b3', olah_lahan: 'b4', tanam: 'b5',
    penyulaman: 'b6', perawatan_tanaman: 'b7', pemupukan: 'b8',
    penyemprotan: 'b9', pengairan: 'b10', panen_pengangkutan: 'b11',
    sewa_pajak: 'c1', hasil_panen: 'p'
  };
  Object.keys(groups).forEach(function(key) {
    var row = rows[key] || {};
    var prefix = groups[key];
    output[prefix + '_waktu'] = row.waktu || '';
    output[prefix + '_vol'] = row.volume || 0;
    output[prefix + '_hrg'] = row.harga || 0;
    output[prefix + '_tot'] = Number(row.volume || 0) * Number(row.harga || 0);
    output[prefix + '_ket'] = row.keterangan || '';
  });
  output.subA = source.subTotalA || 0;
  output.subB = source.subTotalB || 0;
  output.grandTotal = source.totalBiaya || 0;
  output.totalPendapatan = source.totalPendapatan || source.totalHasilProduksi || 0;
  output.labaRugi = source.labaRugiNetto || 0;
  output.p_vol = (rows.hasil_panen || {}).volume || 0;
  output.p_hrg = (rows.hasil_panen || {}).harga || 0;
  return output;
}

function pdfWorkerInspeksi(source) {
  var output = pdfWorkerCopy(source);
  output.nama = source.namaPetani || '';
  output.kelompok = [source.alamatPetani, source.kelompokTani].filter(String).join(' / ');
  output.tglInspeksi = source.tanggal || '';
  output.jamInspeksi = source.jam || '';
  output.totalLahan = source.totalLahanM2 || 0;
  output.lahan = {};
  (source.lahan || []).slice(0, 3).forEach(function(land, index) {
    var number = index + 1;
    output.lahan['l' + number + '_luas'] = land.luas || '';
    output.lahan['l' + number + '_utama'] = land.utama || '';
    output.lahan['l' + number + '_selingan'] = land.selingan || '';
    output.lahan['l' + number + '_kimia'] = land.kimia || '';
  });
  output.kriteria = {};
  Object.keys(source.kriteria || {}).forEach(function(key) {
    var check = source.kriteria[key] || {};
    output.kriteria[key + '_c'] = check.kondisi || '';
    output.kriteria[key + '_d'] = check.dasar || '';
  });
  output.pascaPanen = {};
  ['pasca_olah', 'pasca_kemasan', 'pasca_simpan'].forEach(function(key) {
    var check = (source.kriteria || {})[key] || {};
    var shortKey = key.replace('pasca_', '');
    output.pascaPanen[shortKey + '_c'] = check.kondisi || '';
    output.pascaPanen[shortKey + '_d'] = check.dasar || '';
  });
  output.manajemenResiko = {};
  Object.keys(source.manajemenRisiko || {}).forEach(function(key) {
    var risk = source.manajemenRisiko[key] || {};
    output.manajemenResiko[key + '_r'] = risk.level || '';
    output.manajemenResiko[key + '_d'] = risk.dasar || '';
  });
  output.manajemenResiko.langkahMitigasi = source.manajemenRisiko && source.manajemenRisiko.langkahMitigasi || '';
  return output;
}

function pdfWorkerLahan(source) {
  var output = pdfWorkerCopy(source);
  output.nama = source.namaPetani || '';
  output.alamat = source.alamatPetani || '';
  output.lahan = source.lahan || [];
  (output.lahan || []).slice(0, 3).forEach(function(land, index) {
    var number = index + 1;
    output['lh_h' + number] = land.luas || '';
    output['lh_u' + number] = land.utama || '';
    output['lh_s' + number] = land.sisipan || '';
    output['lh_km' + number] = land.kimia || '';
  });
  (source.kalenderMasaTanam || []).slice(0, 3).forEach(function(season, index) {
    var number = index + 1;
    output['mt_t' + number] = season.tanam || '';
    output['mt_p' + number] = season.panen || '';
    output['mt_k' + number] = season.produksi || '';
  });
  var directions = { Barat: 'b', Timur: 't', Selatan: 's', Utara: 'u' };
  Object.keys(directions).forEach(function(direction) {
    var boundary = (source.batasLahan || {})[direction] || {};
    var code = directions[direction];
    output['b_jb_' + code] = boundary.jenis || '';
    output['b_p_' + code] = boundary.pemilik || '';
    output['b_s_' + code] = boundary.status || '';
  });
  (source.ternak || []).slice(0, 2).forEach(function(animal, index) {
    var number = index + 1;
    output['tk_j' + number] = animal.jenis || '';
    output['tk_jm' + number] = animal.jumlah || '';
    output['tk_p' + number] = animal.pakan || '';
    output['tk_k' + number] = animal.kondisi || '';
  });
  return output;
}

function pdfWorkerCopy(source) {
  var output = {};
  Object.keys(source || {}).forEach(function(key) { output[key] = source[key]; });
  output._worker = true;
  output.idPetani = source.idPetani || source.petaniId || '';
  output.nama = source.nama || source.namaPetani || '';
  return output;
}

function pdfWorkerFileId(url) {
  var match = String(url || '').match(/[-\\w]{25,}/);
  return match ? match[0] : '';
}

function pdfWorkerCallback(result) {
  var properties = PropertiesService.getScriptProperties();
  var callbackUrl = properties.getProperty('APPOLI_CALLBACK_URL');
  var secret = properties.getProperty('APPOLI_CALLBACK_SECRET');
  if (!callbackUrl || !secret) throw new Error('APPOLI_CALLBACK_URL atau APPOLI_CALLBACK_SECRET belum diatur.');
  var response = UrlFetchApp.fetch(callbackUrl, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-appoli-pdf-secret': secret },
    payload: JSON.stringify(result),
    muteHttpExceptions: true
  });
  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
    throw new Error('Callback PDF gagal: HTTP ' + response.getResponseCode());
  }
}

function pdfWorkerJson(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
