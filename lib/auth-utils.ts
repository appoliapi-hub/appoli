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

  // Username dicari di server agar login anonim tidak perlu membaca koleksi users.
  try {
    const response = await fetch('/api/auth/username', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: trimmedInput }),
    });
    if (!response.ok) throw new Error('Username lookup failed.');
    const result = await response.json() as { email?: string | null };
    return result.email || undefined;
  } catch (error) {
    console.error('Error looking up username:', error);
    throw new Error('Gagal memeriksa username. Silakan coba lagi.');
  }
}
