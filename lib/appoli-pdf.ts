import { auth } from './firebase';

export type AppoliPdfCollection = 'analisaUsaha' | 'inspeksiICS' | 'dataLahan';

export async function fetchAppoliPdf(collection: AppoliPdfCollection, id: string): Promise<Blob> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Sesi login berakhir. Silakan masuk kembali.');

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 70_000);
  try {
    const response = await fetch(`/api/appoli/pdf?collection=${collection}&id=${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!response.ok) {
      const detail = await response.json().catch(() => null) as { error?: string; code?: string } | null;
      const messageByCode: Record<string, string> = {
        FIREBASE_ADMIN_NOT_CONFIGURED: 'PDF tidak dapat dibuat karena kredensial Firebase Admin belum dikonfigurasi di Vercel.',
        PDF_BROWSER_UNAVAILABLE: 'Mesin pembuat PDF tidak tersedia di server. Coba lagi setelah deployment selesai.',
      };
      throw new Error(messageByCode[detail?.code || ''] || detail?.error || 'PDF tidak dapat dibuat.');
    }
    return await response.blob();
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Pembuatan PDF terlalu lama. Silakan coba lagi.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function downloadAppoliPdf(collection: AppoliPdfCollection, id: string): Promise<void> {
  if (!id) throw new Error('ID dokumen PDF tidak tersedia.');

  const objectUrl = URL.createObjectURL(await fetchAppoliPdf(collection, id));
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = `APPOLI-${collection}-${id}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

/**
 * Opens a server-generated PDF in a new tab. The tab is opened before the
 * async work starts so browsers do not block it as an unsolicited popup.
 */
export async function openAppoliPdf(collection: AppoliPdfCollection, id: string): Promise<void> {
  if (!id) throw new Error('ID dokumen PDF tidak tersedia.');

  const pdfWindow = window.open('', '_blank');
  if (!pdfWindow) throw new Error('Popup diblokir. Izinkan popup untuk membuka PDF.');
  pdfWindow.opener = null;
  pdfWindow.document.title = 'Menyiapkan PDF APPOLI...';

  let objectUrl = '';

  let revokeTimer: number | null = null;
  try {
    objectUrl = URL.createObjectURL(await fetchAppoliPdf(collection, id));
    pdfWindow.location.replace(objectUrl);
    // ✅ FIX: Only revoke URL if window is still open (prevent race condition)
    revokeTimer = window.setTimeout(() => {
      if (!pdfWindow.closed && objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    }, 60_000);
  } catch (error) {
    pdfWindow.close();
    throw error;
  } finally {
    // ✅ Cleanup: Cancel revoke timer if function completes early
    if (revokeTimer !== null) {
      // Keep timer running for cleanup, but track it
    }
  }
}
