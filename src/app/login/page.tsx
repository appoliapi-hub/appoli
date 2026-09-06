'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { auth } from '../../../lib/firebase';
import { syncUserProfileToFirestore } from '../../../lib/user-access';
import { getUserEmailByUsernameOrEmail } from '../../../lib/auth-utils';
import logoAppoli from '../../../public/images/logo-appoli.png';

export default function LoginPage() {
  const router = useRouter();
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthReady(true);
      if (user) router.replace('/dashboard');
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    if (!credential || !password) {
      setError('Harap isi email/username dan kata sandi Anda.');
      setIsLoading(false);
      return;
    }

    try {
      const emailToUse = await getUserEmailByUsernameOrEmail(credential);
      if (!emailToUse) {
        setError('Username atau email tidak ditemukan dalam sistem.');
        return;
      }

      const result = await signInWithEmailAndPassword(auth, emailToUse, password);
      await syncUserProfileToFirestore({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
      });
      router.push('/dashboard');
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Gagal masuk. Periksa kembali username/email dan kata sandi Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-5 py-10 font-sans text-slate-900 sm:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-emerald-50 to-transparent" />
      <section className="relative w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xl shadow-slate-900/5 sm:p-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image src={logoAppoli} alt="Logo APPOLI - Aliansi Petani Padi Organik Boyolali" preload className="h-36 w-auto object-contain sm:h-40" />
          <p className="mt-3 text-sm font-medium text-slate-500">Sistem Informasi APPOLI</p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="credential" className="mb-2 block text-sm font-semibold text-slate-700">Email atau Username</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute inset-y-0 left-0 my-auto ml-3.5 h-5 w-5 text-slate-400" />
              <input id="credential" type="text" value={credential} onChange={(event) => setCredential(event.target.value)} placeholder="email_anda atau username_anda" autoComplete="username" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10" />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">Kata Sandi</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute inset-y-0 left-0 my-auto ml-3.5 h-5 w-5 text-slate-400" />
              <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Masukkan kata sandi" autoComplete="current-password" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-11 text-sm text-slate-800 placeholder-slate-400 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10" />
              <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 transition hover:text-slate-600">
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-slate-600">
            <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
            Ingat saya di perangkat ini
          </label>

          <button type="submit" disabled={isLoading} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 active:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70">
            {isLoading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <><span>Masuk</span><ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>

        <p className="mt-8 border-t border-slate-100 pt-6 text-center text-xs text-slate-400">© {new Date().getFullYear()} APPOLI</p>
      </section>
    </main>
  );
}
