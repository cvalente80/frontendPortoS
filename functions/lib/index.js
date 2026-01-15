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
function envAny(names, fallback = '') {
    for (const n of names) {
        const v = process.env[n];
        if (v)
            return v;
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
const notificationsEnabled = (envAny(['EMAIL_NOTIFICATIONS_ENABLED', 'MAIL_NOTIFICATIONS_ENABLED'], 'false')) === 'true';
function htmlEscape(s) {
    return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}
// Firestore trigger disabled: client-side handles notifications now.
// Intentionally not exported to avoid deployment.
const notifyOnFirstUserMessage = onDocumentCreated('chats/{chatId}/messages/{messageId}', async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const data = snap.data();
    const chatId = event.params.chatId;
    if (!data || data.authorRole !== 'user')
        return;
    const db = getFirestore();
    const chatRef = db.doc(`chats/${chatId}`);
    const chatSnap = await chatRef.get();
    if (!chatSnap.exists)
        return;
    const chat = chatSnap.data() || {};
    if (chat.firstNotified)
        return; // Already notified
    const name = chat.name || '(anónimo)';
    const email = chat.email || '(sem email)';
    const phone = chat.phone || '(sem telefone)';
    const text = String(data.text || '');
    const subject = `Novo chat iniciado — ${name}`;
    const inboxUrl = `${emailjsCfg.siteBase}/pt/admin/inbox`;
    // Send via EmailJS REST API
    if (!notificationsEnabled || !emailjsCfg.adminTo || !emailjsCfg.serviceId || !emailjsCfg.templateId || !emailjsCfg.publicKey) {
        logger.info('[notifyOnFirstUserMessage] EmailJS disabled or missing configuration; skipping send.', { enabled: notificationsEnabled });
    }
    else {
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
            };
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
        }
        catch (e) {
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
        };
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
    }
    catch (e) {
        logger.error('[sendContactEmail] Unexpected error', e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// --- Admin claims management ---
// Set or revoke the custom claim 'admin' based on Firestore documents.
async function setAdminClaim(uid, isAdmin) {
    try {
        const user = await getAuth().getUser(uid);
        const existing = user.customClaims || {};
        const nextClaims = { ...existing };
        if (isAdmin) {
            nextClaims.admin = true;
        }
        else {
            // Remove claim if present
            if (nextClaims.admin)
                delete nextClaims.admin;
        }
        await getAuth().setCustomUserClaims(uid, nextClaims);
        logger.info('[setAdminClaim] Updated claims', { uid, isAdmin });
    }
    catch (e) {
        logger.error('[setAdminClaim] Failed to update claims', { uid, isAdmin, error: e });
        throw e;
    }
}
// When an admin doc is created, grant admin claim
export const onAdminDocCreated = onDocumentCreated('admins/{uid}', async (event) => {
    const uid = event.params.uid;
    await setAdminClaim(uid, true);
});
// When an admin doc is deleted, revoke admin claim
export const onAdminDocDeleted = onDocumentDeleted('admins/{uid}', async (event) => {
    const uid = event.params.uid;
    await setAdminClaim(uid, false);
});
// If users/{uid}.isAdmin is toggled, sync claim accordingly
export const onUserIsAdminUpdated = onDocumentUpdated('users/{uid}', async (event) => {
    const uid = event.params.uid;
    const before = (event.data?.before?.data() || {});
    const after = (event.data?.after?.data() || {});
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
        const isAdmin = adminDoc.exists || !!(userDoc.exists && userDoc.data().isAdmin === true);
        await setAdminClaim(uid, isAdmin);
        res.status(200).json({ ok: true, uid, isAdmin });
    }
    catch (e) {
        logger.error('[syncAdminClaims] error', e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
