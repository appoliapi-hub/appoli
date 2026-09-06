/** GAS APPOLI hanya digunakan sebagai worker PDF. */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok', service: 'appoli-pdf-worker' }))
    .setMimeType(ContentService.MimeType.JSON);
}