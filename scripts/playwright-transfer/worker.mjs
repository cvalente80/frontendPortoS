import { randomUUID } from 'node:crypto';
import process from 'node:process';
import admin from 'firebase-admin';
import { runTransferJob } from './transfer.mjs';

const JOBS_COLLECTION = process.env.TRANSFER_JOBS_COLLECTION ?? 'simulationTransferJobs';
const POLL_INTERVAL_MS = Number(process.env.TRANSFER_POLL_INTERVAL_MS ?? 5000);
const workerId = process.env.TRANSFER_WORKER_ID ?? `worker-${randomUUID().slice(0, 8)}`;
const DEFAULT_TARGET_URL = 'https://myzurich.zurich.com.pt/';

function credentialHealthSummary() {
  const username = String(process.env.TRANSFER_LOGIN_USERNAME || '').trim();
  const password = String(process.env.TRANSFER_LOGIN_PASSWORD || '');
  const loginRequired = String(process.env.TRANSFER_LOGIN_REQUIRED || 'false').trim().toLowerCase() === 'true';

  const maskedUsername = username
    ? `${username.slice(0, 2)}***${username.slice(-2)}`
    : 'missing';

  return {
    loginRequired,
    hasUsername: Boolean(username),
    hasPassword: Boolean(password),
    usernameMasked: maskedUsername,
    passwordLength: password.length,
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getServiceAccountFromEnv() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  return JSON.parse(raw);
}

function initializeAdmin() {
  if (admin.apps.length) return;

  const serviceAccount = getServiceAccountFromEnv();
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
    });
    return;
  }

  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

async function claimNextQueuedJob(db) {
  const query = db
    .collection(JOBS_COLLECTION)
    .where('status', '==', 'queued')
    .orderBy('createdAt', 'asc')
    .limit(1);

  const snapshot = await query.get();
  if (snapshot.empty) return null;

  const docRef = snapshot.docs[0].ref;

  return db.runTransaction(async (tx) => {
    const latest = await tx.get(docRef);
    if (!latest.exists || latest.get('status') !== 'queued') {
      return null;
    }
    const attempts = Number(latest.get('attempts') ?? 0);
    tx.update(docRef, {
      status: 'running',
      attempts: attempts + 1,
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
      workerId,
    });
    return { id: docRef.id, ref: docRef, data: latest.data() };
  });
}

async function processOneJob(db) {
  const job = await claimNextQueuedJob(db);
  if (!job) return false;

  const data = job.data ?? {};
  const targetUrl = data.targetUrl || process.env.TRANSFER_TARGET_URL || DEFAULT_TARGET_URL;
  const login = {
    required: data.login?.required ?? process.env.TRANSFER_LOGIN_REQUIRED === 'true',
    username: data.login?.username ?? process.env.TRANSFER_LOGIN_USERNAME,
    password: data.login?.password ?? process.env.TRANSFER_LOGIN_PASSWORD,
    successUrlIncludes:
      data.login?.successUrlIncludes ?? process.env.TRANSFER_LOGIN_SUCCESS_URL_INCLUDES,
    successSelector: data.login?.successSelector ?? process.env.TRANSFER_LOGIN_SUCCESS_SELECTOR,
  };

  const result = await runTransferJob({
    targetUrl,
    payload: data.payload ?? {},
    selectors: data.selectors ?? {},
    login,
    headless: process.env.TRANSFER_HEADLESS !== 'false',
    timeoutMs: Number(process.env.TRANSFER_TIMEOUT_MS ?? 45000),
    jobId: job.id,
  });

  await job.ref.update({
    status: result.ok ? 'done' : 'failed',
    finishedAt: admin.firestore.FieldValue.serverTimestamp(),
    result,
  });

  return true;
}

async function start() {
  initializeAdmin();
  const db = admin.firestore();
  const runOnce = process.argv.includes('--once');
  const credentialHealth = credentialHealthSummary();

  console.log(`[playwright-transfer] started as ${workerId}, collection=${JOBS_COLLECTION}`);
  console.log(`[playwright-transfer] login health required=${credentialHealth.loginRequired} user=${credentialHealth.usernameMasked} password=${credentialHealth.hasPassword ? `set(${credentialHealth.passwordLength})` : 'missing'}`);
  if (credentialHealth.loginRequired && (!credentialHealth.hasUsername || !credentialHealth.hasPassword)) {
    console.warn('[playwright-transfer] WARNING: missing TRANSFER_LOGIN_USERNAME or TRANSFER_LOGIN_PASSWORD in current environment');
  }

  do {
    const handled = await processOneJob(db);
    if (!handled) {
      if (runOnce) break;
      await sleep(POLL_INTERVAL_MS);
    }
  } while (!runOnce);

  console.log('[playwright-transfer] stopped');
}

start().catch((error) => {
  console.error('[playwright-transfer] fatal error', error);
  process.exit(1);
});
