import React, { useCallback, useEffect, useRef, useState } from 'react';

const BACKEND =
  (typeof import.meta !== 'undefined' &&
    (import.meta as ImportMeta & { env?: { VITE_BACKEND_URL?: string } }).env?.VITE_BACKEND_URL) ||
  'https://aatmabodha1-backend.onrender.com';

const DEFAULT_CHIPS = [
  'Change language',
  'Update birth time',
  'How many questions left?',
  'Add profile',
  'What is Yogini dasha?',
  'Reset chart',
];

type Msg = { role: 'user' | 'assistant'; text: string };

export default function FloatingHelpBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: 'assistant',
      text: 'Hi! I can help with the app only — settings, language, profiles, quotas, and account. Ask anything about using Aatmabodha (not chart predictions).',
    },
  ]);
  const [chips, setChips] = useState<string[]>(DEFAULT_CHIPS);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, open]);

  const send = useCallback(
    async (text: string) => {
      const t = text.trim();
      if (!t) return;
      const token = localStorage.getItem('auth_token');
      let userId = '';
      try {
        userId = JSON.parse(localStorage.getItem('auth_user') || '{}').id || '';
      } catch {
        userId = '';
      }
      if (!token || !userId) {
        setMsgs((m) => [...m, { role: 'user', text: t }, { role: 'assistant', text: 'Please sign in to use Help.' }]);
        return;
      }
      const lang = localStorage.getItem('vedicLanguage') || 'English';
      setMsgs((m) => [...m, { role: 'user', text: t }]);
      setInput('');
      setLoading(true);
      try {
        const r = await fetch(`${BACKEND}/api/faq-bot/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ message: t, userId, language: lang }),
        });
        const data = await r.json().catch(() => ({}));
        const reply = typeof data.reply === 'string' ? data.reply : 'Something went wrong.';
        const nextChips = Array.isArray(data.suggestedChips) ? data.suggestedChips.filter(Boolean) : [];
        setMsgs((m) => [...m, { role: 'assistant', text: reply }]);
        if (nextChips.length) setChips(nextChips.slice(0, 8));
      } catch {
        setMsgs((m) => [...m, { role: 'assistant', text: 'Network error — try again.' }]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-full border border-amber-600/50 bg-[#1a1638] px-4 py-3 text-sm font-semibold text-amber-100 shadow-lg shadow-amber-900/30 hover:bg-indigo-950/90"
        aria-label="Open help chat"
      >
        <span aria-hidden>💬</span> Help
      </button>

      {open && (
        <div
          className="fixed bottom-20 right-5 z-[60] flex w-[300px] flex-col overflow-hidden rounded-xl border border-indigo-600/40 bg-[#0f0d1c] shadow-2xl"
          style={{ height: 400, maxHeight: '70vh' }}
        >
          <div className="flex items-center justify-between border-b border-indigo-800/50 bg-[#16122a] px-3 py-2">
            <span className="text-sm font-semibold text-amber-100">💬 Aatmabodha Help</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded px-2 py-1 text-xs text-indigo-300 hover:bg-indigo-900/50"
            >
              ×
            </button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto px-3 py-2 text-xs leading-relaxed">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`rounded-lg px-2 py-1.5 ${m.role === 'user' ? 'ml-6 bg-indigo-900/40 text-indigo-100' : 'mr-4 bg-amber-950/25 text-amber-50'}`}
              >
                {m.text}
              </div>
            ))}
            {loading && <div className="text-indigo-300/80">…</div>}
            <div ref={endRef} />
          </div>
          <div className="flex flex-wrap gap-1 border-t border-indigo-900/40 px-2 py-1.5">
            {chips.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => void send(c)}
                className="rounded-full border border-indigo-700/50 bg-indigo-950/60 px-2 py-0.5 text-[10px] text-indigo-100 hover:border-amber-600/50"
              >
                {c}
              </button>
            ))}
          </div>
          <form
            className="flex gap-1 border-t border-indigo-900/50 p-2"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type here…"
              className="min-w-0 flex-1 rounded-lg border border-indigo-700/50 bg-black/30 px-2 py-1.5 text-xs text-amber-50 outline-none focus:border-amber-600/60"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-amber-700/80 px-2 py-1 text-xs font-bold text-white hover:bg-amber-600 disabled:opacity-40"
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}
