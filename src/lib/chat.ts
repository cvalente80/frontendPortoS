import { db } from '../firebase';
import { safeEmailSend, EMAILJS_SERVICE_ID_CHAT, EMAILJS_TEMPLATE_ID_CHAT, EMAILJS_USER_ID_CHAT } from '../emailjs.config';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  increment,
  runTransaction,
} from 'firebase/firestore';

export type ChatDoc = {
  userId: string;
  status: 'open' | 'closed' | 'pending';
  firstNotified?: boolean;
  lastMessageAt?: any;
  lastMessagePreview?: string;
  unreadForAdmin?: number;
  unreadForUser?: number;
  createdAt?: any;
  lastReadAtAdmin?: any;
  lastReadAtUser?: any;
  // Identity fields (optional, provided by the user via ChatWidget)
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  // Typing presence fields
  typingUser?: boolean;
  typingUserAt?: any;
  typingAdmin?: boolean;
  typingAdminAt?: any;
};

export type ChatMessageDoc = {
  authorId: string;
  authorRole: 'user' | 'admin' | 'system';
  text: string;
  createdAt: any;
};

// For simplicity, use the user's uid as chatId (one chat por utilizador)
export async function ensureChatForUser(userId: string): Promise<string> {
  const chatId = userId;
  const ref = doc(db, 'chats', chatId);
  // Avoid getDoc first to prevent failures when client is considered offline.
  // Just ensure the document exists via a merge write; if it fails, we still return chatId
  // so that subscriptions can proceed and cache can populate when connectivity resumes.
  try {
    console.log('[chat] ensureChatForUser:setDoc', { chatId });
    const payload: ChatDoc = {
      userId,
      status: 'open',
      firstNotified: false,
      createdAt: serverTimestamp(),
      unreadForAdmin: 0,
      unreadForUser: 0,
    };
    await setDoc(ref, payload, { merge: true });
    console.log('[chat] ensureChatForUser:ok', { chatId });
    // Optional migration: if there exists any chat with same userId but different id,
    // update its status to 'closed' to avoid confusion in admin inbox.
    try {
      // Lightweight server-side cleanup is not performed here; client will deduplicate.
    } catch {}
  } catch (e) {
    // Ignore write failures (e.g., offline). Firestore listeners can still attach,
    // and the write will be retried by the SDK when back online if queued elsewhere.
    // console.warn('[ensureChatForUser] setDoc failed, proceeding', e);
    console.log('[chat] ensureChatForUser:write_failed_offline?', { chatId });
  }
  return chatId;
}

export async function addUserMessage(chatId: string, userId: string, text: string) {
  const col = collection(db, 'chats', chatId, 'messages');
  const msg: ChatMessageDoc = {
    authorId: userId,
    authorRole: 'user',
    text,
    createdAt: serverTimestamp(),
  };
  const DEBUG = typeof import.meta !== 'undefined' && (import.meta.env?.DEV || import.meta.env?.VITE_CHAT_DEBUG === '1');
  if (DEBUG) console.log('[chat] addUserMessage', { chatId, len: text.length });
  // Diagnóstico: ler doc do chat antes de escrever
  try {
    const chatSnap = await getDoc(doc(db, 'chats', chatId));
    if (chatSnap.exists()) {
      const cdata: any = chatSnap.data();
      if (DEBUG) console.log('[chat] addUserMessage:preCheck', { chatId, authUserId: userId, chatUserId: cdata.userId });
    } else {
      if (DEBUG) console.warn('[chat] addUserMessage:preCheck chat inexistente', { chatId, authUserId: userId });
    }
  } catch (e) {
    if (DEBUG) console.warn('[chat] addUserMessage:preCheck erro getDoc', e);
  }
  try {
    await addDoc(col, msg);
  } catch (e: any) {
    console.error('[chat] addUserMessage:addDoc:error', { code: e?.code, message: String(e) });
    throw e;
  }
  // update chat meta
  const chatRef = doc(db, 'chats', chatId);
  try {
    await updateDoc(chatRef, {
      lastMessageAt: serverTimestamp(),
      lastMessagePreview: text.slice(0, 140),
      unreadForAdmin: increment(1),
      status: 'open',
    });
  } catch (e: any) {
    console.error('[chat] addUserMessage:updateMeta:error', { code: e?.code, message: String(e) });
    // do not rethrow; message was created, meta failed
  }
  if (DEBUG) console.log('[chat] addUserMessage:metaUpdated', { chatId });

  // Client-side email notification on first user message (atomic flip via transaction)
  try {
    let shouldSend = false;
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(chatRef);
      const data = snap.exists() ? (snap.data() as any) : {};
      if (!data?.firstNotified) {
        tx.set(chatRef, { firstNotified: true }, { merge: true });
        shouldSend = true;
      }
    });
    if (shouldSend) {
      const chatSnap3 = await getDoc(chatRef);
      const chatData2 = chatSnap3.exists() ? (chatSnap3.data() as ChatDoc) : undefined;
      const displayName = (chatData2?.name || '') || 'Cliente';
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://cvalente80.github.io';
      const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) ? String(import.meta.env.BASE_URL) : '/';
      const currentLang = (typeof window !== 'undefined' && window.location.pathname.startsWith('/en')) ? 'en' : 'pt';
      const inboxUrl = `${origin}${base}${currentLang}/admin/inbox`;
      const messageBody = `Primeira mensagem: ${text}\n\nAbrir inbox: ${inboxUrl}`;
      try {
        await safeEmailSend(
          EMAILJS_SERVICE_ID_CHAT,
          EMAILJS_TEMPLATE_ID_CHAT,
          { name: displayName, message: messageBody },
          EMAILJS_USER_ID_CHAT
        );
        if (DEBUG) console.log('[chat] emailjs:firstMessage:sent', { chatId });
      } catch (sendErr) {
        console.error('[chat] emailjs:firstMessage:error', sendErr);
      }
    }
  } catch (e) {
    // ignore failures; chat will remain without notification flag
    if (DEBUG) console.warn('[chat] emailjs:firstMessage:txn:error', e);
  }
}

export function subscribeMessages(
  chatId: string,
  cb: (messages: Array<{ id: string; text: string; authorRole: string; createdAt: Date | null }>) => void,
  onError?: (err: any) => void,
) {
  const col = collection(db, 'chats', chatId, 'messages');
  const q = query(col, orderBy('createdAt', 'asc'));
  const DEBUG = typeof import.meta !== 'undefined' && (import.meta.env?.DEV || import.meta.env?.VITE_CHAT_DEBUG === '1');
  if (DEBUG) console.log('[chat] subscribeMessages:start', { chatId });
  let fallbackUnsub: null | (() => void) = null;
  const unsub = onSnapshot(
    q,
    (snap) => {
      const out = snap.docs.map((d) => {
        const data = d.data() as any;
        const ts = data.createdAt;
        return {
          id: d.id,
          text: String(data.text || ''),
          authorRole: String(data.authorRole || ''),
          createdAt: ts && ts.toDate ? ts.toDate() : null,
        };
      });
      if (DEBUG) console.log('[chat] subscribeMessages:update', { chatId, count: out.length });
      cb(out);
    },
    (err) => {
      console.error('[chat] subscribeMessages:error', { chatId, code: err?.code, message: String(err) });
      if (onError) onError(err);
      // Fallback: listen without ordering to avoid index issues
      try {
        if (!fallbackUnsub) {
          fallbackUnsub = onSnapshot(col, (snap2) => {
            const out2 = snap2.docs
              .map((d) => {
                const data = d.data() as any;
                const ts = data.createdAt;
                return {
                  id: d.id,
                  text: String(data.text || ''),
                  authorRole: String(data.authorRole || ''),
                  createdAt: ts && ts.toDate ? ts.toDate() : null,
                };
              })
              .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
            cb(out2);
          }, (err2) => {
            console.error('[chat] subscribeMessages:fallback:error', { chatId, code: err2?.code, message: String(err2) });
            if (onError) onError(err2);
          });
        }
      } catch (e) {
        console.error('[chat] subscribeMessages:fallback:setupFailed', String(e));
      }
    }
  );
  return () => {
    try { unsub(); } catch {}
    try { if (fallbackUnsub) { fallbackUnsub(); fallbackUnsub = null; } } catch {}
  };
}

// Admin sends a message into a user's chat
export async function addAdminMessage(chatId: string, adminId: string, text: string) {
  const col = collection(db, 'chats', chatId, 'messages');
  const msg: ChatMessageDoc = {
    authorId: adminId,
    authorRole: 'admin',
    text,
    createdAt: serverTimestamp(),
  };
  await addDoc(col, msg);
  const chatRef = doc(db, 'chats', chatId);
  await updateDoc(chatRef, {
    lastMessageAt: serverTimestamp(),
    lastMessagePreview: text.slice(0, 140),
    unreadForUser: increment(1),
    status: 'open',
  });
}

// Mark that admin viewed the chat; reset unread counter
export async function markAdminOpened(chatId: string) {
  const chatRef = doc(db, 'chats', chatId);
  await updateDoc(chatRef, {
    unreadForAdmin: 0,
    lastReadAtAdmin: serverTimestamp(),
  });
}

// Mark that user viewed the chat; reset unread counter for the user
export async function markUserOpened(chatId: string) {
  const chatRef = doc(db, 'chats', chatId);
  console.log('[chat] markUserOpened', { chatId });
  await updateDoc(chatRef, {
    unreadForUser: 0,
    lastReadAtUser: serverTimestamp(),
  });
}

// Presence: user is typing
export async function setUserTyping(chatId: string, typing: boolean) {
  const chatRef = doc(db, 'chats', chatId);
  try {
    await updateDoc(chatRef, {
      typingUser: typing,
      typingUserAt: serverTimestamp(),
    });
  } catch (e) {
    // ignore (offline or permission)
  }
}

// Presence: admin is typing
export async function setAdminTyping(chatId: string, typing: boolean) {
  const chatRef = doc(db, 'chats', chatId);
  try {
    await updateDoc(chatRef, {
      typingAdmin: typing,
      typingAdminAt: serverTimestamp(),
    });
  } catch (e) {
    // ignore
  }
}

// Subscribe to single chat document (for presence indicators, identity)
export function subscribeChatDoc(
  chatId: string,
  cb: (doc: ChatDoc | null) => void,
  onError?: (err: any) => void,
) {
  const ref = doc(db, 'chats', chatId);
  return onSnapshot(ref, (snap) => {
    cb(snap.exists() ? (snap.data() as ChatDoc) : null);
  }, (err) => {
    console.error('[chat] subscribeChatDoc:error', { chatId, code: err?.code, message: String(err) });
    if (onError) onError(err);
  });
}

// Subscribe to chats list for admin inbox view
export function subscribeChats(
  cb: (items: Array<{ id: string; data: ChatDoc }>) => void,
  onError?: (err: any) => void,
) {
  const colRef = collection(db, 'chats');
  const primary = query(colRef, orderBy('lastMessageAt', 'desc'));
  let fallbackUnsub: null | (() => void) = null;
  const unsub = onSnapshot(
    primary,
    (snap) => {
      const raw = snap.docs.map((d) => ({ id: d.id, data: d.data() as ChatDoc }));
      // Deduplicate by userId: prefer chat doc whose id equals userId
      const byUser: Record<string, { id: string; data: ChatDoc }> = {};
      for (const row of raw) {
        const u = row.data.userId || row.id;
        const existing = byUser[u];
        if (!existing) {
          byUser[u] = row;
        } else {
          const preferCurrent = row.id === u;
          const preferExisting = existing.id === u;
          if (preferCurrent && !preferExisting) {
            byUser[u] = row;
          } else if (!preferExisting && !preferCurrent) {
            // If neither matches userId, pick the most recent by lastMessageAt
            const a: any = existing.data.lastMessageAt;
            const b: any = row.data.lastMessageAt;
            const ta = a && a.toDate ? a.toDate().getTime() : 0;
            const tb = b && b.toDate ? b.toDate().getTime() : 0;
            if (tb > ta) byUser[u] = row;
          }
        }
      }
      const rows = Object.values(byUser);
      cb(rows);
      // Enriquecer com displayName/email do perfil do utilizador se faltar nome
      Promise.all(rows.map(async (row) => {
        const u = row.data.userId || row.id;
        if (!row.data.name) {
          try {
            const userSnap = await getDoc(doc(db, 'users', u));
            if (userSnap.exists()) {
              const ud: any = userSnap.data();
              const name = ud.displayName || ud.name || null;
              const email = ud.email || null;
              const phone = ud.phone || ud.phoneNumber || null;
              if (name || email || phone) {
                row = { id: row.id, data: { ...row.data, name: name ?? row.data.name ?? null, email: email ?? row.data.email ?? null, phone: phone ?? row.data.phone ?? null } };
                // Persist enrichment back to chat doc to avoid future lookups
                try {
                  const chatRef = doc(db, 'chats', row.id);
                  const patch: any = {};
                  if (name && row.data.name !== name) patch.name = name;
                  if (email && row.data.email !== email) patch.email = email;
                  if (phone && row.data.phone !== phone) patch.phone = phone;
                  if (Object.keys(patch).length) {
                    await updateDoc(chatRef, patch);
                  }
                } catch {}
              }
            }
          } catch {}
        }
        return row;
      })).then((updated) => {
        cb(updated);
      }).catch(() => {
        // ignore enrichment failures
      });
    },
    (err) => {
      console.error('[chat] subscribeChats:error', { code: err?.code, message: String(err) });
      if (onError) onError(err);
      // Fallback: subscribe without ordering to avoid index/order issues so admin sees all
      try {
        if (!fallbackUnsub) {
          fallbackUnsub = onSnapshot(colRef, (snap2) => {
            const raw2 = snap2.docs.map((d) => ({ id: d.id, data: d.data() as ChatDoc }));
            const byUser2: Record<string, { id: string; data: ChatDoc }> = {};
            for (const row of raw2) {
              const u = row.data.userId || row.id;
              const existing = byUser2[u];
              if (!existing || row.id === u) byUser2[u] = row;
            }
            const rows2 = Object.values(byUser2);
            cb(rows2);
          }, (err2) => {
            console.error('[chat] subscribeChats:fallback:error', { code: err2?.code, message: String(err2) });
            if (onError) onError(err2);
          });
        }
      } catch (e) {
        console.error('[chat] subscribeChats:fallback:setupFailed', String(e));
      }
    }
  );
  return () => {
    try { unsub(); } catch {}
    try { if (fallbackUnsub) { fallbackUnsub(); fallbackUnsub = null; } } catch {}
  };
}

// Update identity fields on the chat document (name/email/phone)
export async function updateChatIdentity(chatId: string, partial: { name?: string | null; email?: string | null; phone?: string | null }) {
  const chatRef = doc(db, 'chats', chatId);
  await updateDoc(chatRef, {
    ...('name' in partial ? { name: partial.name ?? null } : {}),
    ...('email' in partial ? { email: partial.email ?? null } : {}),
    ...('phone' in partial ? { phone: partial.phone ?? null } : {}),
  });
}

// Fetch a chat document once
export async function getChat(chatId: string): Promise<ChatDoc | null> {
  const chatRef = doc(db, 'chats', chatId);
  const snap = await getDoc(chatRef);
  if (!snap.exists()) return null;
  return snap.data() as ChatDoc;
}
