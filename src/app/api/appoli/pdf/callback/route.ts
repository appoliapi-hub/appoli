import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices } from '../../../../../../lib/firebase-admin';

export const runtime = 'nodejs';

const allowedCollections = new Set(['analisaUsaha', 'inspeksiICS', 'dataLahan']);

export async function POST(request: NextRequest) {
  const secret = process.env.APPOLI_CALLBACK_SECRET || '';
  if (!secret || request.headers.get('x-appoli-pdf-secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const body = await request.json() as {
      status?: 'ready' | 'failed';
      collection?: string;
      documentId?: string;
      pdfUrl?: string;
      fileId?: string;
      fileName?: string;
      error?: string;
    };
    if (!body.collection || !allowedCollections.has(body.collection) || !body.documentId) {
      return NextResponse.json({ error: 'Data callback PDF tidak valid.' }, { status: 400 });
    }

    const { adminDb } = getAdminServices();
    await adminDb.collection(body.collection).doc(body.documentId).set({
      pdf: {
        status: body.status === 'ready' ? 'ready' : 'failed',
        url: body.pdfUrl || '',
        fileId: body.fileId || '',
        fileName: body.fileName || '',
        error: body.error || '',
        updatedAt: new Date(),
      },
    }, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Callback PDF Appoli gagal:', error);
    return NextResponse.json({ error: 'Callback PDF gagal diproses.' }, { status: 500 });
  }
}
