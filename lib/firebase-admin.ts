import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let cachedAdminApp: ReturnType<typeof initializeApp> | null = null;

export function getAdminServices() {
  const projectId = process.env.APPOLI_FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_APPOLI_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.APPOLI_FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.APPOLI_FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const databaseURL = process.env.APPOLI_FIREBASE_ADMIN_DATABASE_URL || `https://${projectId}-default-rtdb.asia-southeast1.firebasedatabase.app`;
  
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin credentials belum dikonfigurasi di environment server.');
  }

  // Menggunakan cache variable untuk mencegah multiple initialization pada hot reload
  if (cachedAdminApp) {
    return { adminAuth: getAuth(cachedAdminApp), adminDb: getFirestore(cachedAdminApp) };
  }

  const adminApp = getApps().length
    ? getApps()[0]
    : initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), databaseURL });
  
  cachedAdminApp = adminApp;
  return { adminAuth: getAuth(adminApp), adminDb: getFirestore(adminApp) };
}
