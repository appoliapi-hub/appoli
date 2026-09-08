'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    if (standalone) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIos(ios);
    const dismissed = window.localStorage.getItem('appoli-install-dismissed');
    if (dismissed) return;

    const handleInstallAvailable = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleInstallAvailable);
    if (ios) setVisible(true);
    return () => window.removeEventListener('beforeinstallprompt', handleInstallAvailable);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    window.localStorage.setItem('appoli-install-dismissed', 'true');
    setVisible(false);
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === 'accepted') setVisible(false);
    setInstallEvent(null);
  };

  return (
    <aside className="fixed inset-x-3 bottom-4 z-[120] mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-emerald-200 bg-white p-4 shadow-2xl" role="dialog" aria-label="Instal aplikasi APPOLI">
      <Image src="/images/logo-appoli.png" alt="Logo APPOLI" width={48} height={48} className="h-12 w-12 shrink-0 object-contain" />
      <div className="min-w-0 flex-1">
        <p className="font-bold text-slate-900">Pasang APPOLI di perangkat</p>
        {isIos && !installEvent ? <p className="mt-1 text-xs text-slate-600">Pilih Bagikan lalu Tambahkan ke Layar Utama.</p> : <p className="mt-1 text-xs text-slate-600">Akses APPOLI lebih cepat dari laptop atau mobile.</p>}
      </div>
      <div className="flex shrink-0 gap-2">
        {installEvent && <button type="button" onClick={() => void install()} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700">Instal</button>}
        <button type="button" onClick={dismiss} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Nanti</button>
      </div>
    </aside>
  );
}
