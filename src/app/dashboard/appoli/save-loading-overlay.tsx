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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 p-6 backdrop-blur-[2px]" role="status" aria-live="polite" aria-label="Menyimpan data">
      <div className="w-full max-w-sm overflow-hidden rounded-[28px] border border-white/40 bg-white/90 p-6 text-center shadow-[0_28px_80px_rgba(15,23,42,0.22)] ring-1 ring-slate-200/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 via-teal-50 to-emerald-50 shadow-inner shadow-emerald-200/70">
          <Image src="/images/logo-appoli.png" alt="Logo APPOLI" width={74} height={74} className="h-14 w-14 object-contain" />
        </div>

        <div className="mt-5 flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
          <p className="text-base font-bold tracking-tight text-slate-900">Menyimpan data...</p>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-100 p-2 shadow-inner shadow-slate-200/70">
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-200/80" role="progressbar" aria-label="Progres penyimpanan" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          <span>Progress</span>
          <span className="text-emerald-700">{progress}%</span>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-600">Mohon tunggu, data sedang diproses dan disimpan ke sistem.</p>
      </div>
    </div>
  );
}
