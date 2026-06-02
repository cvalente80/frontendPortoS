import React, { useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { ensureChatForUser, addUserMessage, subscribeMessages, markUserOpened, updateChatIdentity, getChat, subscribeChatDoc, setUserTyping } from '../lib/chat';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuthUX } from '../context/AuthUXContext';
import { trackWhatsAppClick } from '../lib/tracking';

type ChatMessage = { id: string; who: 'user' | 'agent'; text: string; at: number };

export type ChatWidgetProps = {
  phoneNumber: string; // e.g., '+351 912 345 678'
  whatsappNumber?: string; // e.g., '+351912345678' or '351912345678'
  defaultOpen?: boolean;
};

export default function ChatWidget({ phoneNumber, whatsappNumber, defaultOpen = false }: ChatWidgetProps) {
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const { openAuth } = useAuthUX();
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useParams();
  const base = lang === 'en' ? 'en' : 'pt';

  // Derivar marca pelo domínio
  const brandName = useMemo(() => {
    const h = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
    if (h.includes('aurelio')) return 'Aurélio Seguros';
    if (h.includes('sintraseg') || h.includes('sintra')) return 'Sintra Seguros';
    if (h.includes('pombalseg') || h.includes('pombal')) return 'Pombal Seguros';
    if (h.includes('povoaseg') || h.includes('povoa')) return 'Póvoa Seguros';
    if (h.includes('lisboaseg') || h.includes('lisboa')) return 'Lisboa Seguros';
    if (h.includes('portoseg') || h.includes('porto')) return 'Porto Seguros';
    if (h.includes('vlxinsurance') || h.includes('vlx') || h.includes('vfx')) return 'VFX Seguros';
    return 'Ansião Seguros';
  }, []);
  const [open, setOpen] = useState(defaultOpen);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<null | { type: 'ok' | 'err'; text: string }>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const unsubRef = useRef<null | (() => void)>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const persistTimer = useRef<any>(null);
  const isDev = typeof import.meta !== 'undefined' && !!(import.meta as any).env?.DEV;
  const DEBUG = typeof import.meta !== 'undefined' && ((import.meta as any).env?.DEV || (import.meta as any).env?.VITE_CHAT_DEBUG === '1');
  const [online, setOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [typingAdmin, setTypingAdmin] = useState(false);
  const prevCountRef = useRef(0);
  const metaUnsubRef = useRef<null | (() => void)>(null);
  const stopTypingTimerRef = useRef<any>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hideWhatsApp, setHideWhatsApp] = useState<boolean>(() => {
    try { return localStorage.getItem('chat:hideWhatsApp') === '1'; } catch { return false; }
  });
  const [hideChatButton, setHideChatButton] = useState<boolean>(() => {
    try { return localStorage.getItem('chat:hideChatButton') === '1'; } catch { return false; }
  });
  const [pos, setPos] = useState<{ left: number; top: number }>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('chat:pos');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (typeof parsed?.left === 'number' && typeof parsed?.top === 'number') {
            return parsed;
          }
        }
      } catch {}
      return { left: 24, top: window.innerHeight - 520 };
    }
    return { left: 24, top: 200 };
  });
  const dragRef = useRef<{ dragging: boolean; offsetX: number; offsetY: number }>({ dragging: false, offsetX: 0, offsetY: 0 });

  // Track browser online/offline state
  React.useEffect(() => {
    function onUp() { setOnline(true); }
    function onDown() { setOnline(false); }
    window.addEventListener('online', onUp);
    window.addEventListener('offline', onDown);
    function onResetFloating() {
      setHideWhatsApp(false);
      setHideChatButton(false);
      try {
        localStorage.removeItem('chat:hideWhatsApp');
        localStorage.removeItem('chat:hideChatButton');
      } catch {}
    }
    window.addEventListener('chat:resetFloating', onResetFloating as any);
    return () => {
      window.removeEventListener('online', onUp);
      window.removeEventListener('offline', onDown);
      window.removeEventListener('chat:resetFloating', onResetFloating as any);
    };
  }, []);

  // Persist position to localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('chat:pos', JSON.stringify(pos)); } catch {}
    }
  }, [pos]);

  // Drag handlers to move the chat panel
  React.useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragRef.current.dragging) return;
      setPos((p) => {
        const left = e.clientX - dragRef.current.offsetX;
        const top = e.clientY - dragRef.current.offsetY;
        const maxLeft = (typeof window !== 'undefined' ? window.innerWidth : 800) - 320; // approximate width
        const maxTop = (typeof window !== 'undefined' ? window.innerHeight : 600) - 480; // approximate height
        return {
          left: Math.max(8, Math.min(left, maxLeft)),
          top: Math.max(8, Math.min(top, maxTop)),
        };
      });
    }
    function onUp() {
      dragRef.current.dragging = false;
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, []);

  // Ouvir pedido global para abrir o chat (após login)
  React.useEffect(() => {
    function onChatOpen() {
      setOpen(true);
    }
    window.addEventListener('chat:open', onChatOpen);
    return () => window.removeEventListener('chat:open', onChatOpen);
  }, []);

  const telHref = useMemo(() => `tel:${phoneNumber.replace(/[^+\d]/g, '')}`, [phoneNumber]);
  const whatsHref = useMemo(() => {
    if (!whatsappNumber) return '';
    const onlyDigits = whatsappNumber.replace(/\D/g, '');
    const prefill = base === 'en'
      ? `Hello! I would like to chat with ${brandName}.`
      : `Olá! Gostaria de falar com a ${brandName}.`;
    const text = encodeURIComponent(prefill);
    return `https://wa.me/${onlyDigits}?text=${text}`;
  }, [whatsappNumber, t, brandName, base]);

  function scrollToBottomSoon() {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    });
  }

  // Subscribe mensagens + presença typing
  React.useEffect(() => {
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    if (metaUnsubRef.current) { metaUnsubRef.current(); metaUnsubRef.current = null; }
    setMessages([]);
    setChatId(null);
    prevCountRef.current = 0;
    if (!open || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const id = await ensureChatForUser(user.uid);
        if (cancelled) return;
        setChatId(id);
        // Write-back identity from authenticated user profile if fields are empty
        try {
          const display = user.displayName || user.email?.split('@')[0] || '';
          const patch: { name?: string | null; email?: string | null; phone?: string | null } = {};
          if (display && !name) patch.name = display;
          if (user.email && !email) patch.email = user.email;
          if (Object.keys(patch).length) {
            await updateChatIdentity(id, patch);
            if (patch.name && !name) setName(patch.name || '');
            if (patch.email && !email) setEmail(patch.email || '');
          }
        } catch {}
        try { await markUserOpened(id); } catch {}
        unsubRef.current = subscribeMessages(id, (list) => {
          const mapped = list.map((m) => ({
            id: m.id,
            who: m.authorRole === 'user' ? 'user' : 'agent',
            text: m.text,
            at: m.createdAt ? m.createdAt.getTime() : Date.now(),
          }));
          const isNewAdminMsg = list.length > prevCountRef.current && list[list.length - 1].authorRole === 'admin';
          prevCountRef.current = list.length;
          setMessages(mapped);
          scrollToBottomSoon();
          if (soundEnabled && isNewAdminMsg) {
            try {
              const Ctx: any = (window as any).AudioContext || (window as any).webkitAudioContext;
              const ctx = new Ctx();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'sine';
              osc.frequency.value = 880;
              osc.connect(gain); gain.connect(ctx.destination);
              gain.gain.setValueAtTime(0.0001, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
              gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
              osc.start(); osc.stop(ctx.currentTime + 0.31);
            } catch {}
          }
        });
        metaUnsubRef.current = subscribeChatDoc(id, (doc) => {
          if (!doc) { setTypingAdmin(false); return; }
          const ts: any = doc.typingAdminAt;
          let recent = false;
          if (ts && ts.toDate) {
            recent = Date.now() - ts.toDate().getTime() < 5000;
          }
          setTypingAdmin(Boolean(doc.typingAdmin) && recent);
        });
      } catch (e) {
        console.error('[ChatWidget] subscribe error', e);
      }
    })();
    return () => {
      cancelled = true;
      if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
      if (metaUnsubRef.current) { metaUnsubRef.current(); metaUnsubRef.current = null; }
    };
  }, [open, user, soundEnabled]);

  // Persist identity fields (name/email/phone) to chat doc with debounce
  React.useEffect(() => {
    if (!user || !chatId) return;
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      const payload: { name?: string | null; email?: string | null; phone?: string | null } = {};
      if (name) payload.name = name;
      if (email) payload.email = email;
      if (phone) payload.phone = phone;
      if (Object.keys(payload).length > 0) {
        updateChatIdentity(chatId, payload).catch(() => {});
      }
    }, 600);
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
    };
  }, [name, email, phone, chatId, user]);

  async function handleSend() {
    if (!input.trim()) return;
    if (!user) {
      try { localStorage.setItem('chat:intentOpen', '1'); } catch {}
      openAuth();
      return;
    }
    // Optimistic send: avoid awaiting network when SDK flags offline
    setSending(true);
    const id = chatId ?? user.uid;
    if (!chatId) setChatId(id);
    // Ensure chat exists (best-effort, non-blocking)
    ensureChatForUser(user.uid).catch(() => {});
    const text = input.trim();
    setInput('');
    setFeedback({ type: 'ok', text: t('chat.sent') });
    setTimeout(() => setFeedback(null), 3000);
    // Optimistic echo in UI
    const optimisticId = `optimistic-${Date.now()}`;
    setMessages((prev) => [...prev, { id: optimisticId, who: 'user', text, at: Date.now() }]);
    scrollToBottomSoon();
    if (DEBUG) console.log('[ChatWidget] debug ids', { authUid: user.uid, chatId: id });
    addUserMessage(id, user.uid, text).catch((e) => {
      console.error('[ChatWidget] send error', e);
      setFeedback({ type: 'err', text: t('chat.error') });
      setTimeout(() => setFeedback(null), 6000);
      // Optionally mark optimistic message as failed
      setMessages((prev) => prev.map((m) => (m.id === optimisticId ? { ...m, text: `${m.text}\n(erro ao enviar)` } : m)));
    });
    setSending(false);
    if (chatId) setUserTyping(chatId, false).catch(() => {});
  }

  function signalTyping() {
    if (!chatId || !user) return;
    if (stopTypingTimerRef.current) clearTimeout(stopTypingTimerRef.current);
    setUserTyping(chatId, true).catch(() => {});
    stopTypingTimerRef.current = setTimeout(() => {
      setUserTyping(chatId, false).catch(() => {});
    }, 3500);
  }

  // Dev-only diagnostic: force create/merge chat doc and report result
  async function debugEnsureChat() {
    if (!user) return;
    try {
      setFeedback({ type: 'ok', text: 'A criar chat…' });
      const id = user.uid;
      const ref = doc(db, 'chats', id);
      await setDoc(ref, {
        userId: user.uid,
        status: 'open',
        firstNotified: false,
        createdAt: serverTimestamp(),
      }, { merge: true });
      setChatId(id);
      setFeedback({ type: 'ok', text: `Chat garantido: ${id}` });
      setTimeout(() => setFeedback(null), 3000);
    } catch (e: any) {
      console.error('[ChatWidget] debugEnsureChat error', e);
      const code = String(e?.code || 'unknown');
      setFeedback({ type: 'err', text: `Falha ao criar chat (${code})` });
      setTimeout(() => setFeedback(null), 5000);
    }
  }

  // Dev-only diagnostic: create a test message directly and report result
  async function debugSendTestMessage() {
    if (!user) return;
    const id = chatId ?? user.uid;
    try {
      setFeedback({ type: 'ok', text: 'A enviar mensagem de teste…' });
      await addUserMessage(id, user.uid, '[diagnóstico] mensagem de teste');
      setFeedback({ type: 'ok', text: 'Mensagem de teste enviada' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (e: any) {
      console.error('[ChatWidget] debugSendTestMessage error', e);
      const code = String(e?.code || 'unknown');
      setFeedback({ type: 'err', text: `Falha ao enviar mensagem (${code})` });
      setTimeout(() => setFeedback(null), 5000);
    }
  }

  // Dev-only diagnostic: fetch chat doc and show counters
  async function debugFetchChat() {
    if (!user) return;
    const id = chatId ?? user.uid;
    try {
      const data = await getChat(id);
      if (data) {
        const ua = Number(data.unreadForAdmin || 0);
        const uu = Number(data.unreadForUser || 0);
        setFeedback({ type: 'ok', text: `Chat ${id}: UA=${ua} UU=${uu}` });
      } else {
        setFeedback({ type: 'err', text: `Chat ${id} não existe` });
      }
      setTimeout(() => setFeedback(null), 4000);
    } catch (e: any) {
      const code = String(e?.code || 'unknown');
      setFeedback({ type: 'err', text: `Falha ao obter chat (${code})` });
      setTimeout(() => setFeedback(null), 5000);
    }
  }

  return (
    <div className="fixed right-4 bottom-4 z-40">
      {/* Floating Button */}
      {!open && (
        <div className="flex flex-col items-end gap-2">
          {whatsappNumber && !hideWhatsApp && (
            <div className="relative">
              <a
                href={whatsHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackWhatsAppClick({ page: location.pathname, placement: 'chat-widget', language: base, destination: 'wa.me' })}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#1fb256] transition"
                aria-label={t('chat.whatsappNow')}
              >
                <WhatsAppIcon className="w-5 h-5 text-white" />
                <span className="font-semibold text-sm">{t('chat.whatsappNow')}</span>
              </a>
              <button
                type="button"
                aria-label={t('chat.close')}
                title={t('chat.close') as string}
                onClick={() => {
                  setHideWhatsApp(true);
                  try { localStorage.setItem('chat:hideWhatsApp', '1'); } catch {}
                }}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black/40 text-white text-xs leading-none flex items-center justify-center hover:bg-black/55"
              >
                ✕
              </button>
            </div>
          )}
          {/* Mobile "Ligar agora" removed as requested */}
          {!hideChatButton && (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    try {
                      // Guarda intenção de abrir chat após login
                      localStorage.setItem('chat:intentOpen', '1');
                    } catch {}
                    // Abre o modal de autenticação centralizado
                    openAuth();
                    return;
                  }
                  setOpen(true);
                }}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-500 transition"
                aria-expanded={open}
                aria-controls="chat-panel"
              >
                <ChatIcon className="w-5 h-5 text-white" />
                <span className="font-semibold text-sm">{t('chat.talkNow')}</span>
              </button>
              <button
                type="button"
                aria-label={t('chat.close')}
                title={t('chat.close') as string}
                onClick={() => {
                  setHideChatButton(true);
                  try { localStorage.setItem('chat:hideChatButton', '1'); } catch {}
                }}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black/40 text-white text-xs leading-none flex items-center justify-center hover:bg-black/55"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}

      {/* Panel */}
      {open && (
        <div
          id="chat-panel"
          className="w-80 sm:w-96 h-[28rem] bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col fixed"
          style={{ left: pos.left, top: pos.top }}
          role="dialog"
          aria-label={t('chat.title')}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-3 py-2 bg-blue-600 text-white cursor-move"
            onMouseDown={(e) => {
              const rect = (e.currentTarget.parentElement as HTMLElement)?.getBoundingClientRect();
              dragRef.current.dragging = true;
              dragRef.current.offsetX = e.clientX - rect.left;
              dragRef.current.offsetY = e.clientY - rect.top;
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xl leading-none">🤖</span>
              <span className="text-sm font-bold truncate">{t('chat.title')}</span>
              <span className={`ml-1 inline-flex items-center gap-1 px-2 py-[2px] rounded ${online ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`} title={online ? 'Online' : 'Offline'}>
                <span className={`w-2 h-2 rounded-full ${online ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                <span className="text-[10px] font-semibold">{online ? 'Online' : 'Offline'}</span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t('chat.close')}
              className="w-6 h-6 p-0 rounded text-white/90 hover:bg-white/15 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/70"
              title={t('chat.close')}
            >
              ✕
            </button>
          </div>

          {/* Identity inputs removed; identity managed automatically from user profile */}

          {/* Messages */}
          <div ref={listRef} className="flex-1 overflow-auto p-3 bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-sm text-gray-500 text-center mt-8">
                {t('chat.empty')}
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map((m) => (
                  <div key={m.id} className={`max-w-[85%] p-2 rounded-xl text-sm shadow ${m.who === 'user' ? 'ml-auto bg-cyan-50 border border-cyan-100' : 'bg-white border border-gray-200'}`}>
                    <div className="text-[10px] text-gray-500 mb-0.5">{m.who === 'user' ? t('chat.you') : t('chat.agent')}</div>
                    <div className="whitespace-pre-wrap text-gray-800">{m.text}</div>
                  </div>
                ))}
                {typingAdmin && (
                  <div className="max-w-[60%] p-2 rounded-xl text-xs bg-white border border-gray-200 italic text-gray-500">
                    {t('chat.agent')} está a escrever...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="p-3 border-t border-gray-200 bg-white">
            {feedback && (
              <div className={`mb-2 text-xs ${feedback.type === 'ok' ? 'text-green-600' : 'text-red-600'}`}>{feedback.text}</div>
            )}
            <div className="flex items-end gap-2">
              <textarea
                rows={2}
                className="flex-1 resize-none px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder={t('chat.messagePlaceholder')}
                value={input}
                onChange={(e) => { setInput(e.target.value); signalTyping(); }}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault();
                    if (!sending) handleSend();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || sending || !user}
                className={`px-4 py-2 rounded-lg text-white font-semibold shadow ${
                  !input.trim() || sending || !user ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'
                }`}
              >
                {sending ? t('chat.sending') : t('chat.send')}
              </button>
              <button
                type="button"
                onClick={() => setSoundEnabled((v) => !v)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border ${soundEnabled ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 text-gray-600 border-gray-300'}`}
              >{soundEnabled ? '🔔 Som' : '🔕 Mudo'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WhatsAppIcon({ className = '' }: { className?: string }) {
  // WhatsApp logo (simplified) using currentColor for fill
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      className={className}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M19.11 17.23c-.27-.14-1.6-.79-1.84-.88-.25-.09-.43-.14-.61.14-.18.27-.7.87-.86 1.05-.16.18-.32.2-.59.07-.27-.14-1.13-.42-2.16-1.34-.8-.71-1.34-1.6-1.5-1.87-.16-.27-.02-.41.12-.55.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.46-.84-2-.22-.53-.44-.46-.61-.46-.16 0-.34-.02-.52-.02-.18 0-.48.07-.73.34-.25.27-.96.93-.96 2.26 0 1.33.98 2.62 1.12 2.8.14.18 1.93 2.95 4.68 4.13.65.28 1.16.45 1.56.57.65.21 1.25.18 1.72.11.53-.08 1.6-.65 1.83-1.27.23-.62.23-1.14.16-1.25-.07-.11-.25-.18-.52-.32z"/>
      <path d="M26.75 5.25A13.93 13.93 0 0 0 16 1a14 14 0 0 0-12.2 20.9L1 31l9.3-2.76A14 14 0 1 0 26.75 5.25zM16 27a11 11 0 0 1-5.6-1.5l-.4-.23-5.4 1.6 1.6-5.3-.26-.43A11 11 0 1 1 27 16 11 11 0 0 1 16 27z"/>
    </svg>
  );
}

function PhoneIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.08 4.2 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.89.32 1.76.59 2.6a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.48-1.11a2 2 0 0 1 2.11-.45c.84.27 1.71.47 2.6.59A2 2 0 0 1 22 16.92z"/>
    </svg>
  );
}

function ChatIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM6 9h8v2H6V9zm0-3h12v2H6V6z"/>
    </svg>
  );
}
