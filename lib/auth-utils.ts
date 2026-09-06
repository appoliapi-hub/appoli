import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

/**
 * Mencari email berdasarkan username atau mengembalikan email jika input sudah email
 * @param usernameOrEmail - Username atau email untuk di-lookup
 * @returns Email yang ditemukan, atau undefined jika tidak ditemukan
 */
export async function getUserEmailByUsernameOrEmail(
  usernameOrEmail: string
): Promise<string | undefined> {
  const trimmedInput = usernameOrEmail.trim().toLowerCase();

  // Jika input sudah berbentuk email (mengandung @), gunakan langsung
  if (trimmedInput.includes('@')) {
    return trimmedInput;
  }

  // Jika input adalah username, cari di Firestore
  try {
    // Cari di collection 'users'
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', trimmedInput));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return userDoc.data().email?.toLowerCase();
    }

    // Appoli memakai collection users dari Firebase project miliknya sendiri.
    return undefined;
  } catch (error) {
    console.error('Error looking up username:', error);
    throw new Error('Gagal memeriksa username. Silakan coba lagi.');
  }
}
