import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { onDocumentCreated, onDocumentDeleted, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';

// Initialize Admin SDK once
if (getApps().length === 0) {
  initializeApp();
}

// Helper to read env vars with fallback.
function envAny(names: string[], fallback = ''): string {
  for (const n of names) {
    const v = process.env[n];
    if (v) return v;
  }
  return fallback;
}

// EmailJS configuration via environment variables
// Set using CI secrets or Firebase runtime variables:
//   EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, ADMIN_TO, SITE_BASE_URL
const emailjsCfg = {
  serviceId: envAny(['EMAILJS_SERVICE_ID'], 'service_4ltybjl'),
  templateId: envAny(['EMAILJS_TEMPLATE_ID'], 'template_k0tx9hp'),
  publicKey: envAny(['EMAILJS_PUBLIC_KEY', 'EMAILJS_USER_ID'], ''),
  adminTo: envAny(['ADMIN_TO'], ''),
  siteBase: envAny(['SITE_BASE_URL'], 'https://ansiao.pt'),
};

// Toggle via EMAIL_NOTIFICATIONS_ENABLED (preferred) or legacy MAIL_NOTIFICATIONS_ENABLED
const notificationsEnabled = (
  envAny(['EMAIL_NOTIFICATIONS_ENABLED', 'MAIL_NOTIFICATIONS_ENABLED'], 'false')
) === 'true';

function htmlEscape(s: string) {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

// --- News aggregation with AI summaries ---
// Collection: news
// Document shape:
// { title, url, source, publishedAt, region, summary }
// This endpoint expects JSON body { title, url, source, region }
// and calls OpenAI Chat Completions to generate a short summary in PT-PT.
// Env vars:
//   OPENAI_API_KEY (obrigatório)
//   OPENAI_MODEL   (opcional, default "gpt-4o-mini")

export const upsertNewsWithAiSummary = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const { title, url, source, region = 'nacional' } = req.body ?? {};
    if (!title || !url || !source) {
      res.status(400).json({ error: 'Missing title, url or source' });
      return;
    }

    const openaiKey = envAny(['OPENAI_API_KEY'], '');
    const openaiModel = envAny(['OPENAI_MODEL'], 'gpt-4o-mini');

    let summary = '';
    if (openaiKey) {
      try {
        const prompt = `Redige um resumo curto (2-3 frases, em português de Portugal) para esta notícia, de forma neutra e informativa, sem copiar texto literal. Título: "${title}". URL: ${url}.`; // A API pode opcionalmente ler o conteúdo completo da página do lado do provedor.
        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: openaiModel,
            messages: [
              { role: 'system', content: 'Escreves sempre em português de Portugal.' },
              { role: 'user', content: prompt },
            ],
            temperature: 0.4,
          }),
        });
        if (!resp.ok) {
          const txt = await resp.text().catch(() => '');
          throw new Error(`OpenAI error: ${resp.status} ${resp.statusText} ${txt}`);
        }
        const data: any = await resp.json().catch(() => ({}));
        const firstChoice = data && Array.isArray(data.choices) ? data.choices[0] : undefined;
        const content = firstChoice && firstChoice.message && typeof firstChoice.message.content === 'string'
          ? firstChoice.message.content
          : '';
        summary = content.trim();
      } catch (e) {
        logger.error('[upsertNewsWithAiSummary] AI call failed, falling back to empty summary', e);
        summary = '';
      }
    }

    const db = getFirestore();
    const newsRef = db.collection('news').doc();
    const nowIso = new Date().toISOString();
    await newsRef.set({
      title,
      url,
      source,
      region,
      summary,
      publishedAt: nowIso,
    }, { merge: true });

    res.status(200).json({ ok: true, id: newsRef.id, summary });
  } catch (e: any) {
    logger.error('[upsertNewsWithAiSummary] Unexpected error', e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Firestore trigger disabled: client-side handles notifications now.
// Intentionally not exported to avoid deployment.
const notifyOnFirstUserMessage = onDocumentCreated('chats/{chatId}/messages/{messageId}', async (event) => {
  const snap = event.data;
  if (!snap) return;
  const data = snap.data() as any;
  const chatId = event.params.chatId as string;

  if (!data || data.authorRole !== 'user') return;

  const db = getFirestore();
  const chatRef = db.doc(`chats/${chatId}`);
  const chatSnap = await chatRef.get();
  if (!chatSnap.exists) return;

  const chat = chatSnap.data() || {};
  if (chat.firstNotified) return; // Already notified

  const name = chat.name || '(anónimo)';
  const email = chat.email || '(sem email)';
  const phone = chat.phone || '(sem telefone)';
  const text = String(data.text || '');

  const subject = `Novo chat iniciado — ${name}`;
  const inboxUrl = `${emailjsCfg.siteBase}/pt/admin/inbox`;

  // Send via EmailJS REST API
  if (!notificationsEnabled || !emailjsCfg.adminTo || !emailjsCfg.serviceId || !emailjsCfg.templateId || !emailjsCfg.publicKey) {
    logger.info('[notifyOnFirstUserMessage] EmailJS disabled or missing configuration; skipping send.', { enabled: notificationsEnabled });
  } else {
    try {
      const body = {
        service_id: emailjsCfg.serviceId,
        template_id: emailjsCfg.templateId,
        user_id: emailjsCfg.publicKey,
        template_params: {
          // Template expects {{name}} for subject and body, and {{message}} for content
          to_email: emailjsCfg.adminTo,
          name,
          message: `Primeira mensagem: ${text}\n\nAbrir inbox: ${inboxUrl}`,
        },
      } as const;
      const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`EmailJS send failed: ${res.status} ${res.statusText} ${txt}`);
      }
      logger.info('[notifyOnFirstUserMessage] EmailJS send OK');
    } catch (e) {
      logger.error('[notifyOnFirstUserMessage] EmailJS send error', e);
    }
  }

  await chatRef.update({ firstNotified: true });
});

// HTTPS proxy to send EmailJS from server side to avoid client-side 412 errors (domain restrictions).
// Expects JSON body: { service_id, template_id, user_id, template_params }
export const sendContactEmail = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const { service_id, template_id, user_id, template_params } = req.body ?? {};
    if (!service_id || !template_id || !user_id || !template_params || typeof template_params !== 'object') {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const body = {
      service_id,
      template_id,
      user_id,
      template_params,
    } as const;

    const r = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const txt = await r.text().catch(() => '');
    if (!r.ok) {
      logger.error('[sendContactEmail] EmailJS error', { status: r.status, statusText: r.statusText, body: txt });
      res.status(r.status).send(txt || r.statusText);
      return;
    }
    res.status(200).json({ ok: true });
  } catch (e: any) {
    logger.error('[sendContactEmail] Unexpected error', e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Admin claims management ---
// Set or revoke the custom claim 'admin' based on Firestore documents.
async function setAdminClaim(uid: string, isAdmin: boolean) {
  try {
    const user = await getAuth().getUser(uid);
    const existing = user.customClaims || {};
    const nextClaims = { ...existing } as Record<string, any>;
    if (isAdmin) {
      nextClaims.admin = true;
    } else {
      // Remove claim if present
      if (nextClaims.admin) delete nextClaims.admin;
    }
    await getAuth().setCustomUserClaims(uid, nextClaims);
    logger.info('[setAdminClaim] Updated claims', { uid, isAdmin });
  } catch (e) {
    logger.error('[setAdminClaim] Failed to update claims', { uid, isAdmin, error: e });
    throw e;
  }
}

// When an admin doc is created, grant admin claim
export const onAdminDocCreated = onDocumentCreated('admins/{uid}', async (event) => {
  const uid = event.params.uid as string;
  await setAdminClaim(uid, true);
});

// When an admin doc is deleted, revoke admin claim
export const onAdminDocDeleted = onDocumentDeleted('admins/{uid}', async (event) => {
  const uid = event.params.uid as string;
  await setAdminClaim(uid, false);
});

// If users/{uid}.isAdmin is toggled, sync claim accordingly
export const onUserIsAdminUpdated = onDocumentUpdated('users/{uid}', async (event) => {
  const uid = event.params.uid as string;
  const before = (event.data?.before?.data() || {}) as any;
  const after = (event.data?.after?.data() || {}) as any;
  const prev = !!before.isAdmin;
  const next = !!after.isAdmin;
  if (prev !== next) {
    await setAdminClaim(uid, next);
  }
});

// HTTPS endpoint to sync admin claim for current user
export const syncAdminClaims = onRequest({ cors: true }, async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const m = authHeader.match(/^Bearer\s+(.*)$/i);
    if (!m) {
      res.status(401).json({ error: 'Missing Authorization: Bearer <ID_TOKEN>' });
      return;
    }
    const idToken = m[1];
    const decoded = await getAuth().verifyIdToken(idToken);
    const uid = decoded.uid;
    const db = getFirestore();
    const adminDoc = await db.doc(`admins/${uid}`).get();
    const userDoc = await db.doc(`users/${uid}`).get();
    const isAdmin = adminDoc.exists || !!(userDoc.exists && (userDoc.data() as any).isAdmin === true);
    await setAdminClaim(uid, isAdmin);
    res.status(200).json({ ok: true, uid, isAdmin });
  } catch (e: any) {
    logger.error('[syncAdminClaims] error', e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
