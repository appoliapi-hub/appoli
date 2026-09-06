import { NextResponse } from 'next/server';
import { getAdminServices } from '../../../../../lib/firebase-admin';

export const runtime = 'nodejs';

const maxPromptLength = 4000;
const maxContextLength = 6000;

function getBearerToken(request: Request): string {
  const authorization = request.headers.get('authorization') || '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
}

export async function POST(request: Request) {
  try {
    const { adminAuth, adminDb } = getAdminServices();
    const token = getBearerToken(request);
    if (!token) return NextResponse.json({ error: 'Sesi login diperlukan.' }, { status: 401 });
    await adminAuth.verifyIdToken(token);

    const body = await request.json() as { prompt?: string; context?: string };
    const prompt = body.prompt?.trim() || '';
    const context = body.context?.trim() || '';
    if (!prompt) return NextResponse.json({ error: 'Pertanyaan belum diisi.' }, { status: 400 });
    if (prompt.length > maxPromptLength) return NextResponse.json({ error: 'Pertanyaan terlalu panjang.' }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Asisten AI belum dikonfigurasi.' }, { status: 503 });

    const [farmersSnapshot, businessSnapshot, inspectionSnapshot, landSnapshot] = await Promise.all([
      adminDb.collection('petani').get(),
      adminDb.collection('analisaUsaha').get(),
      adminDb.collection('inspeksiICS').get(),
      adminDb.collection('dataLahan').get(),
    ]);

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const systemInstruction = [
      'Anda adalah Asisten AI APPOLI.',
      'Jawab dalam bahasa Indonesia yang ringkas, jelas, dan praktis.',
      'Bantu pengguna memahami pendataan petani, lahan, analisa usaha, inspeksi ICS, dan penggunaan aplikasi.',
      'Jangan mengarang data petani atau status sertifikasi. Jika data tidak tersedia, katakan bahwa data belum tersedia.',
      'Jangan meminta atau menampilkan password, API key, private key, atau data rahasia.',
    ].join(' ');
    const operationalContext = [
      `Jumlah petani terdaftar: ${farmersSnapshot.size}`,
      `Jumlah analisa usaha: ${businessSnapshot.size}`,
      `Jumlah inspeksi ICS: ${inspectionSnapshot.size}`,
      `Jumlah pendataan lahan: ${landSnapshot.size}`,
      'Data petani terdaftar:',
      ...farmersSnapshot.docs.slice(0, 100).map((document) => {
        const data = document.data();
        return `- nama: ${String(data.namaPetani || '-')} | alamat: ${String(data.alamatPetani || '-')} | kelompok: ${String(data.kelompokTani || '-')} | id: ${String(data.idPetani || document.id)}`;
      }),
    ].join('\n');
    const contextBlock = `${operationalContext}\n${context}`.slice(0, maxContextLength);
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: contextBlock ? `Konteks halaman:\n${contextBlock}\n\nPertanyaan pengguna:\n${prompt}` : prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 700 },
      }),
      cache: 'no-store',
    });

    const result = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>; error?: { message?: string } };
    if (!response.ok) {
      console.error('Gemini request failed:', result.error?.message || response.statusText);
      return NextResponse.json({ error: 'Asisten AI sedang tidak dapat digunakan.' }, { status: 502 });
    }

    const answer = result.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
    if (!answer) return NextResponse.json({ error: 'Asisten AI tidak menghasilkan jawaban.' }, { status: 502 });
    return NextResponse.json({ answer });
  } catch (error) {
    console.error('AI assistant request failed:', error);
    return NextResponse.json({ error: 'Gagal menghubungi Asisten AI.' }, { status: 500 });
  }
}
