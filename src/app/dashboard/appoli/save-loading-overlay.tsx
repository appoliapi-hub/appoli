'use client';

import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function SaveLoadingOverlay({ open }: { open: boolean }) {
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    if (!open) return;
    const timers = [
      window.setTimeout(() => setProgress(8), 0),
      window.setTimeout(() => setProgress(30), 700),
      window.setTimeout(() => setProgress(60), 1800),
      window.setTimeout(() => setProgress(85), 4000),
    ];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-6" role="status" aria-live="polite" aria-label="Menyimpan data">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl">
        <Image src="/images/logo-appoli.png" alt="Logo APPOLI" width={80} height={80} className="mx-auto h-20 w-20 object-contain" />
        <Loader2 className="mx-auto mt-5 h-7 w-7 animate-spin text-emerald-600" />
        <p className="mt-3 text-base font-bold text-slate-900">Menyimpan data...</p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-label="Progres penyimpanan" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <div className="h-full rounded-full bg-emerald-600 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-sm font-bold text-emerald-700">{progress}%</p>
        <p className="mt-1 text-sm text-slate-500">Mohon tunggu, data sedang diproses.</p>
      </div>
    </div>
  );
}
