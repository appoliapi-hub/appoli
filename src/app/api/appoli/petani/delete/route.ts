import { NextResponse } from 'next/server';
import { getAdminServices } from '../../../../../../lib/firebase-admin';

const ADMIN_EMAIL = 'dionyyr@gmail.com';
const ADMIN_UID = 'Zm6IBgsvXkO9pBRmJlKbJ3YicnA3';

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
    const isAdmin = requester.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
      || requester.uid === ADMIN_UID
      || requesterProfile.data()?.role === 'admin';
    if (!isAdmin) return NextResponse.json({ error: 'Akses hanya untuk admin.' }, { status: 403 });

    const body = await request.json() as { documentId?: string };
    const documentId = body.documentId?.trim();
    if (!documentId) return NextResponse.json({ error: 'ID dokumen petani wajib diisi.' }, { status: 400 });

    await adminDb.collection('petani').doc(documentId).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Farmer profile deletion failed:', error);
    return NextResponse.json({ error: 'Gagal menghapus profil petani.' }, { status: 500 });
  }
}