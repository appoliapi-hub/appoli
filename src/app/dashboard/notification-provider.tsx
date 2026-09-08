'use client';

import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

type NoticeKind = 'success' | 'error' | 'info';
type Notice = { kind: NoticeKind; message: string };
type ConfirmRequest = { message: string; resolve: (confirmed: boolean) => void };
type NotificationContextValue = {
  notify: (message: string, kind?: NoticeKind) => void;
  confirm: (message: string) => Promise<boolean>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications harus digunakan di dalam NotificationProvider.');
  return context;
}

export default function NotificationProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null);

  const notify = useCallback((message: string, kind: NoticeKind = 'info') => {
    setNotice({ message, kind });
  }, []);

  const confirm = useCallback((message: string) => new Promise<boolean>((resolve) => {
    setConfirmRequest({ message, resolve });
  }), []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const resolveConfirm = (confirmed: boolean) => {
    confirmRequest?.resolve(confirmed);
    setConfirmRequest(null);
  };

  const icon = notice?.kind === 'success'
    ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
    : notice?.kind === 'error'
      ? <AlertTriangle className="h-5 w-5 text-rose-600" />
      : <Info className="h-5 w-5 text-sky-600" />;

  return (
    <NotificationContext.Provider value={{ notify, confirm }}>
      {children}
      {notice && (
        <div className="fixed inset-x-4 top-5 z-[200] mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-white/70 bg-white/95 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.18)] ring-1 ring-slate-200/80 backdrop-blur-xl" role="status" aria-live="polite">
          <div className="mt-0.5 shrink-0">{icon}</div>
          <p className="min-w-0 flex-1 text-sm font-semibold leading-relaxed text-slate-700">{notice.message}</p>
          <button type="button" onClick={() => setNotice(null)} className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Tutup notifikasi">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {confirmRequest && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[3px]" role="presentation">
          <div className="w-full max-w-md rounded-[26px] border border-white/60 bg-white p-6 shadow-[0_28px_80px_rgba(15,23,42,0.24)]" role="dialog" aria-modal="true" aria-labelledby="appoli-confirm-title">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="appoli-confirm-title" className="text-base font-bold text-slate-900">Konfirmasi tindakan</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{confirmRequest.message}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => resolveConfirm(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50">Batal</button>
              <button type="button" onClick={() => resolveConfirm(true)} className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-rose-700">Hapus data</button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}
