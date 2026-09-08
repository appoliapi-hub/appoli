import { NextRequest, NextResponse } from 'next/server';
import { FieldPath } from 'firebase-admin/firestore';
import { getAdminServices } from '../../../../../lib/firebase-admin';

export const runtime = 'nodejs';

const allowedCollections = new Set(['petani', 'analisaUsaha', 'inspeksiICS', 'dataLahan']);
const maxLimit = 100;

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
}

export async function GET(request: NextRequest) {
  const configuredSecret = process.env.MONITORING_API_SECRET || '';
  const requestSecret = request.headers.get('x-monitoring-secret') || '';

  if (!configuredSecret || requestSecret !== configuredSecret) return unauthorized();

  const collectionName = request.nextUrl.searchParams.get('collection') || 'petani';
  const cursor = request.nextUrl.searchParams.get('cursor') || '';
  const requestedLimit = Number(request.nextUrl.searchParams.get('limit') || 50);
  const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), maxLimit) : 50;

  if (!allowedCollections.has(collectionName)) {
    return NextResponse.json({ error: 'Koleksi tidak diizinkan.' }, { status: 400 });
  }

  try {
    const { adminDb } = getAdminServices();
    let query = adminDb.collection(collectionName).orderBy(FieldPath.documentId()).limit(limit);
    if (cursor) query = query.startAfter(cursor);

    const snapshot = await query.get();
    const data = snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }));
    const nextCursor = snapshot.docs.length === limit ? snapshot.docs[snapshot.docs.length - 1].id : null;

    return NextResponse.json(
      { collection: collectionName, data, nextCursor },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('Gagal mengambil data untuk monitoring-petani:', error);
    return NextResponse.json({ error: 'Data monitoring tidak dapat diambil.' }, { status: 500 });
  }
}
