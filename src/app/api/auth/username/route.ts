import { NextResponse } from 'next/server';
import { getAdminServices } from '../../../../../lib/firebase-admin';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json() as { username?: string };
    const username = body.username?.trim().toLowerCase() || '';
    if (!username || username.includes('@')) {
      return NextResponse.json({ error: 'Username tidak valid.' }, { status: 400 });
    }

    const { adminDb } = getAdminServices();
    const snapshot = await adminDb.collection('users').where('username', '==', username).limit(1).get();
    const email = snapshot.empty ? '' : String(snapshot.docs[0].data().email || '').trim().toLowerCase();
    return NextResponse.json({ email: email || null });
  } catch (error) {
    console.error('Username lookup failed:', error);
    return NextResponse.json({ error: 'Username tidak dapat diperiksa.' }, { status: 500 });
  }
}
