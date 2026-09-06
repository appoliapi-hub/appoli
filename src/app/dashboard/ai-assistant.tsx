'use client';

import { FormEvent, useState } from 'react';
import { Bot, ChevronDown, Loader2, Send, Sparkles, X } from 'lucide-react';
import { auth } from '../../../lib/firebase';

type Message = { role: 'user' | 'assistant'; text: string };

const suggestions = [
  'Apa yang perlu diperiksa sebelum menyimpan data petani?',
  'Jelaskan cara membaca hasil analisa usaha tani.',
  'Apa tujuan inspeksi ICS?',
];

export default function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'Halo, saya Asisten AI APPOLI. Saya dapat membantu menjelaskan alur aplikasi dan formulir APPOLI.' },
  ]);
  const [loading, setLoading] = useState(false);

  const ask = async (event?: FormEvent) => {
    event?.preventDefault();
    const question = prompt.trim();
    if (!question || loading) return;
    setPrompt('');
    setMessages((current) => [...current, { role: 'user', text: question }]);
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Sesi login berakhir. Silakan login kembali.');
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: question, context: `Path dashboard aktif: ${window.location.pathname}` }),
      });
      const result = await response.json() as { answer?: string; error?: string };
      if (!response.ok) throw new Error(result.error || 'Asisten AI tidak dapat menjawab.');
      setMessages((current) => [...current, { role: 'assistant', text: result.answer || 'Tidak ada jawaban.' }]);
    } catch (error) {
      setMessages((current) => [...current, { role: 'assistant', text: error instanceof Error ? error.message : 'Asisten AI tidak dapat digunakan.' }]);
    } finally {
      setLoading(false);
    }
  };

  return <>
    <button type="button" onClick={() => setOpen((value) => !value)} aria-label="Buka Asisten AI" title="Asisten AI" className="fixed bottom-6 right-6 z-[80] inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xl shadow-emerald-900/20 transition hover:scale-105 hover:bg-emerald-700 print:hidden">
      {open ? <X className="h-5 w-5" /> : <Sparkles className="h-6 w-6" />}
    </button>
    {open && <section className="fixed bottom-24 right-6 z-[80] flex h-[min(620px,calc(100vh-8rem))] w-[min(390px,calc(100vw-3rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl print:hidden" aria-label="Asisten AI APPOLI">
      <header className="flex items-center justify-between bg-emerald-700 px-4 py-4 text-white"><div className="flex items-center gap-3"><div className="rounded-xl bg-white/15 p-2"><Bot className="h-5 w-5" /></div><div><h2 className="text-sm font-bold">Asisten AI APPOLI</h2><p className="text-xs text-emerald-100">Panduan kerja dan formulir</p></div></div><button type="button" onClick={() => setOpen(false)} aria-label="Tutup Asisten AI" className="rounded-lg p-1.5 hover:bg-white/10"><ChevronDown className="h-5 w-5" /></button></header>
      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">{messages.map((message, index) => <div key={`${message.role}-${index}`} className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-3 py-2.5 text-sm leading-relaxed ${message.role === 'user' ? 'ml-auto bg-emerald-600 text-white' : 'bg-white text-slate-700 shadow-sm'}`}>{message.text}</div>)}{loading && <div className="flex items-center gap-2 text-xs text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Asisten sedang berpikir...</div>}</div>
      <div className="border-t border-slate-200 bg-white p-3"><div className="mb-2 flex gap-2 overflow-x-auto pb-1">{suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => setPrompt(suggestion)} className="shrink-0 rounded-full border border-emerald-200 px-3 py-1.5 text-left text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50">{suggestion}</button>)}</div><form onSubmit={ask} className="flex items-end gap-2"><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void ask(); } }} rows={2} maxLength={4000} placeholder="Tulis pertanyaan..." className="min-h-11 flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10" /><button type="submit" disabled={!prompt.trim() || loading} aria-label="Kirim pertanyaan" title="Kirim pertanyaan" className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-4 w-4" /></button></form></div>
    </section>}
  </>;
}
