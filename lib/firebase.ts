import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { browserSessionPersistence, getAuth, initializeAuth } from "firebase/auth";

// Isi nilai ini dari Firebase Console project Appoli di file .env.local.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_APPOLI_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_APPOLI_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_APPOLI_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_APPOLI_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_APPOLI_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_APPOLI_FIREBASE_APP_ID
};

// Pola ini mencegah inisialisasi ganda saat Next.js melakukan hot-reloading
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
// Firebase Auth local persistence menggunakan IndexedDB. Pada dev mode
// Turbopack, ketika tab sedang hidden/di-refresh, SDK dapat mencoba membuka
// database yang sedang ditutup dan memunculkan "Database is closing/hidden".
// Session persistence memakai sessionStorage sehingga listener auth tetap stabil
// selama tab browser aktif tanpa bergantung pada IndexedDB.
const auth = typeof window === "undefined"
  ? getAuth(app)
  : (() => {
      try {
        return initializeAuth(app, { persistence: browserSessionPersistence });
      } catch {
        // Auth mungkin telah diinisialisasi oleh modul lama saat Fast Refresh.
        return getAuth(app);
      }
    })();

export { app, db, auth };
