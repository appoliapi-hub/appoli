import { NextResponse } from 'next/server';
import { getAdminServices } from '../../../../../lib/firebase-admin';

export const runtime = 'nodejs';

const allowedCollections = new Set(['analisaUsaha', 'inspeksiICS', 'dataLahan']);
const adminEmail = 'dionyyr@gmail.com';
const adminUid = 'Zm6IBgsvXkO9pBRmJlKbJ3YicnA3';

export async function POST(request: Request) {
  try {
    const { adminAuth, adminDb } = getAdminServices();
    const authorization = request.headers.get('authorization');
    const idToken = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : '';
    if (!idToken) return NextResponse.json({ error: 'Token admin tidak ditemukan.' }, { status: 401 });

    const requester = await adminAuth.verifyIdToken(idToken);
    const requesterProfile = await adminDb.collection('users').doc(requester.uid).get();
    const isAdmin = requester.email?.toLowerCase() === adminEmail
      || requester.uid === adminUid
      || requesterProfile.data()?.role === 'admin';
    if (!isAdmin) return NextResponse.json({ error: 'Akses hanya untuk admin.' }, { status: 403 });

    const body = await request.json() as { collection?: string; documentId?: string; fileId?: string };
    const collectionName = body.collection?.trim() || '';
    const documentId = body.documentId?.trim() || '';
    if (!allowedCollections.has(collectionName) || !documentId) {
      return NextResponse.json({ error: 'Koleksi atau ID dokumen tidak valid.' }, { status: 400 });
    }

    const documentRef = adminDb.collection(collectionName).doc(documentId);
    const documentSnapshot = await documentRef.get();
    if (!documentSnapshot.exists) return NextResponse.json({ error: 'Data tidak ditemukan.' }, { status: 404 });
    const documentData = documentSnapshot.data() || {};
    const storedPdf = documentData.pdf as { fileId?: string; url?: string } | undefined;
    const fileId = storedPdf?.fileId || storedPdf?.url?.match(/[-\w]{25,}/)?.[0] || '';
    const cleanFilePart = (value: unknown) => String(value || '').replace(/\s+/g, '_');
    const farmerName = documentData.namaPetani || documentData.nama || '';
    const farmerId = documentData.idPetani || documentData.petaniId || '';
    const fileName = collectionName === 'analisaUsaha'
      ? `Form1_Analisa_${cleanFilePart(farmerName)}_${farmerId}.pdf`
      : collectionName === 'inspeksiICS'
        ? `Form_Inspeksi_${cleanFilePart(farmerName)}_${farmerId}.pdf`
        : `Form3_Pendataan_${cleanFilePart(farmerName)}_${farmerId}.pdf`;

    {
      const gasPdfUrl = process.env.APPOLI_GAS_PDF_URL;
      const secret = process.env.APPOLI_CALLBACK_SECRET || '';
      if (!gasPdfUrl || !secret) throw new Error('Konfigurasi penghapusan PDF belum tersedia di server.');
      const response = await fetch(gasPdfUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deletePdf', fileId, fileName, secret }),
        cache: 'no-store',
      });
      const result = await response.json().catch(() => null) as { status?: string; pesan?: string } | null;
      if (!response.ok || result?.status !== 'Sukses') {
        throw new Error(result?.pesan || `PDF Google Drive gagal dihapus (HTTP ${response.status}).`);
      }
    }

    await documentRef.delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Gagal menghapus form Appoli dan PDF Drive:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Gagal menghapus data dan PDF.' }, { status: 500 });
  }
}
