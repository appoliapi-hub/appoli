'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { Activity, ArrowRight, CheckCircle2, Eye, EyeOff, Lock, Mail, ShieldCheck, Sprout } from 'lucide-react';
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
    <main className="relative flex min-h-screen items-center overflow-hidden bg-[#f4f8f5] px-4 py-6 font-sans text-slate-900 sm:px-8 lg:px-12">
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-emerald-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-0 h-[32rem] w-[32rem] rounded-full bg-amber-100/40 blur-3xl" />
      <section className="relative mx-auto grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 shadow-[0_28px_90px_rgba(24,62,44,0.14)] backdrop-blur-xl lg:min-h-[660px] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative hidden overflow-hidden bg-[#123f35] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border-[28px] border-emerald-300/10" />
          <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full border-[35px] border-amber-200/10" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/95 shadow-lg"><Image src={logoAppoli} alt="Logo APPOLI" width={42} height={42} className="h-10 w-10 object-contain" /></div>
              <div><p className="text-lg font-black tracking-[0.16em]">ICS APPOLI</p><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">Internal Control System</p></div>
            </div>
            <div className="mt-20 max-w-md">
              <p className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-amber-300"><Sprout className="h-4 w-4" /> Organik. Terukur. Terjaga.</p>
              <h1 className="text-4xl font-black leading-[1.08] tracking-tight xl:text-5xl">Kontrol yang kuat untuk pertanian yang berkelanjutan.</h1>
              <p className="mt-6 max-w-sm text-sm leading-7 text-emerald-50/75">Kelola pendataan petani, verifikasi ICS, dan dokumen lahan dalam satu ruang kerja yang aman.</p>
            </div>
          </div>
          <div className="relative grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm"><ShieldCheck className="h-5 w-5 text-amber-300" /><p className="mt-4 text-sm font-bold">Data terkontrol</p><p className="mt-1 text-xs text-emerald-100/60">Akses sesuai peran</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm"><Activity className="h-5 w-5 text-emerald-200" /><p className="mt-4 text-sm font-bold">Alur terpantau</p><p className="mt-1 text-xs text-emerald-100/60">Siap untuk operasional</p></div>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-10 lg:p-14">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden"><Image src={logoAppoli} alt="Logo APPOLI - Aliansi Petani Padi Organik Boyolali" preload className="h-24 w-auto object-contain" /><p className="mt-3 text-sm font-bold tracking-wide text-emerald-800">Internal Control System APPOLI</p></div>
            <div className="mb-8"><p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Selamat datang kembali</p><h2 className="text-3xl font-black tracking-tight text-slate-900">Masuk ke ruang kerja Anda.</h2><p className="mt-3 text-sm leading-6 text-slate-500">Gunakan akun terdaftar untuk melanjutkan ke dashboard ICS APPOLI.</p></div>

            {error && <div className="mb-5 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium leading-6 text-rose-700" role="alert"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}

            <form onSubmit={handleLogin} className="space-y-5">
              <div><label htmlFor="credential" className="mb-2 block text-sm font-semibold text-slate-700">Email atau Username</label><div className="relative"><Mail className="pointer-events-none absolute inset-y-0 left-0 my-auto ml-3.5 h-5 w-5 text-slate-400" /><input id="credential" type="text" value={credential} onChange={(event) => setCredential(event.target.value)} placeholder="email_anda atau username_anda" autoComplete="username" className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-3.5 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10" /></div></div>
              <div><label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">Kata Sandi</label><div className="relative"><Lock className="pointer-events-none absolute inset-y-0 left-0 my-auto ml-3.5 h-5 w-5 text-slate-400" /><input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Masukkan kata sandi" autoComplete="current-password" className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-3.5 pl-11 pr-11 text-sm text-slate-800 placeholder-slate-400 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 transition hover:text-slate-600">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div></div>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-slate-600"><input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />Ingat saya di perangkat ini</label>
              <button type="submit" disabled={isLoading} className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#087f5b] px-4 py-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(8,127,91,0.2)] transition hover:-translate-y-0.5 hover:bg-[#066b4d] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70">{isLoading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <><span>Masuk</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>}</button>
            </form>

            <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5 text-[11px] font-semibold text-slate-400"><span>&copy; {new Date().getFullYear()} ICS APPOLI</span><span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Sistem aman</span></div>
          </div>
        </div>
      </section>
    </main>
  );
}
