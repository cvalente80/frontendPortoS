/**
 * local-queue-watcher.mjs
 *
 * Watcher local que poleia a coleção `simulationTransferJobs` no Firestore
 * e lança o script `navigate-zurich-auto.mjs` em background para cada job
 * com status 'queued'.
 *
 * Uso:
 *   node --env-file=.env.local scripts/playwright-transfer/local-queue-watcher.mjs
 *
 * Ou via npm:
 *   npm run pw:watcher
 */

import { spawn } from 'node:child_process';
import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  collection,
  getFirestore,
  onSnapshot,
  query,
  where,
  updateDoc,
  getDocs,
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

const POLL_INTERVAL_MS = Number(process.env.TRANSFER_WATCHER_POLL_MS ?? 4000);
const MAX_CONCURRENT = Number(process.env.TRANSFER_WATCHER_MAX_CONCURRENT ?? 1);

function cleanEnv(value) {
  if (!value) return '';
  return String(value).split('#')[0].trim();
}

function getFirebaseConfig() {
  const apiKey = cleanEnv(process.env.VITE_FIREBASE_API_KEY);
  const authDomain = cleanEnv(process.env.VITE_FIREBASE_AUTH_DOMAIN);
  const projectId = cleanEnv(process.env.VITE_FIREBASE_PROJECT_ID);
  const storageBucket = cleanEnv(process.env.VITE_FIREBASE_STORAGE_BUCKET);
  const messagingSenderId = cleanEnv(process.env.VITE_FIREBASE_MESSAGING_SENDER_ID);
  const appId = cleanEnv(process.env.VITE_FIREBASE_APP_ID);

  if (!apiKey || !projectId) {
    console.error('[watcher] ERRO: variáveis VITE_FIREBASE_* não encontradas. Carrega com --env-file=.env.local');
    process.exit(1);
  }

  return { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId };
}

const app = getApps().length ? getApp() : initializeApp(getFirebaseConfig());
const db = getFirestore(app);

// Conjunto de jobIds já em processamento (evita arrancar o mesmo job duas vezes)
const activeJobs = new Set();

async function claimAndLaunchJob(jobId) {
  if (activeJobs.has(jobId)) return;
  if (activeJobs.size >= MAX_CONCURRENT) {
    console.log(`[watcher] Já existe ${activeJobs.size} job(s) ativo(s). Job ${jobId} aguarda próxima iteração.`);
    return;
  }

  // Marcar como 'running' atomicamente antes de lançar o processo
  try {
    await updateDoc(doc(db, 'simulationTransferJobs', jobId), {
      status: 'running',
      startedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      workerId: 'local-watcher',
    });
  } catch (err) {
    console.warn(`[watcher] Não foi possível marcar job ${jobId} como running:`, err?.message);
    return;
  }

  activeJobs.add(jobId);
  console.log(`[watcher] A lançar script para job ${jobId} (${activeJobs.size}/${MAX_CONCURRENT} ativos)`);

  const envVars = {
    ...process.env,
    TRANSFER_JOB_ID: jobId,
    TRANSFER_SOURCE_PREFERENCE: process.env.TRANSFER_SOURCE_PREFERENCE ?? 'firestore',
    TRANSFER_VEHICLE_RESULT_INDEX: '1',
    TRANSFER_VEHICLE_PREFERRED_SELECTOR:
      'table#Zurich_PT_Theme_wtZurich_PT_Theme_Layout_SideBar_block_WebPatterns_wt24_block_wtColumn1_wtMainContent_wt20_wtItems_wt893_wtContent_wt350_wtMessage_wttr_Versoes > tbody > tr:nth-of-type(2) > td.TableRecords_EvenLine:nth-of-type(1) > div',
    TRANSFER_FINAL_STEP_ACTIONS: 'drag-accordion-calcular',
    TRANSFER_ACCORDION_MANUAL_CLICK_COUNT: '4',
    TRANSFER_ACCORDION_SETTLE_MS: '1500',
    TRANSFER_ACCORDION_MANUAL_CLICK_TIMEOUT_MS: '300000',
    TRANSFER_MATRICULA_LUPA_CLICKS: '2',
    TRANSFER_MATRICULA_FOCUS_CLICKS: '4',
    TRANSFER_MATRICULA_FOCUS_CLICK_GAP_MS: '50',
    PW_HEADLESS: process.env.PW_HEADLESS ?? 'true',
    PW_SLOW_MO: process.env.PW_SLOW_MO ?? '0',
  };

  const scriptPath = path.join(__dirname, 'navigate-zurich-auto.mjs');
  const child = spawn('node', [scriptPath], {
    env: envVars,
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach((line) => console.log(`[job:${jobId.slice(0, 8)}] ${line}`));
  });
  child.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach((line) => console.error(`[job:${jobId.slice(0, 8)}][err] ${line}`));
  });

  child.on('close', (code) => {
    activeJobs.delete(jobId);
    if (code === 0) {
      console.log(`[watcher] ✅ Job ${jobId} concluído com sucesso.`);
    } else {
      console.warn(`[watcher] ⚠️  Job ${jobId} terminou com código ${code}.`);
      // Marcar como failed se o script saiu com erro e o Firestore ainda está 'running'
      updateDoc(doc(db, 'simulationTransferJobs', jobId), {
        status: 'failed',
        failedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        error: `script exited with code ${code}`,
      }).catch(() => null);
    }
  });
}

// Recuperar jobs 'running' há mais de 10 minutos (stale — processo morreu sem cleanup)
const STALE_TIMEOUT_MS = 10 * 60 * 1000;
async function recoverStaleJobs() {
  try {
    const staleQuery = query(
      collection(db, 'simulationTransferJobs'),
      where('status', '==', 'running'),
      where('simulationType', '==', 'auto')
    );
    const snap = await getDocs(staleQuery);
    const now = Date.now();
    for (const d of snap.docs) {
      const data = d.data();
      const startedAt = data.startedAt;
      const startMs = startedAt?.toMillis?.() ?? startedAt?.seconds * 1000 ?? 0;
      if (startMs && (now - startMs) > STALE_TIMEOUT_MS) {
        console.warn(`[watcher] Job ${d.id} está 'running' há ${Math.round((now - startMs) / 60000)} min — a marcar como failed`);
        await updateDoc(doc(db, 'simulationTransferJobs', d.id), {
          status: 'failed',
          failedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          error: 'stale: processo terminou sem cleanup',
        }).catch(() => null);
      } else if (startMs) {
        console.log(`[watcher] Job ${d.id} está 'running' há ${Math.round((now - startMs) / 60000)} min (dentro do limite)`);
      }
    }
  } catch (err) {
    console.warn('[watcher] Erro ao recuperar stale jobs:', err?.message);
  }
}

await recoverStaleJobs();

// ─── Listener em tempo real + heartbeat/reconnect ──────────────────────────

const HEARTBEAT_INTERVAL_MS = Number(process.env.TRANSFER_WATCHER_HEARTBEAT_MS ?? 30_000); // 30s
const LISTENER_DEAD_TIMEOUT_MS = Number(process.env.TRANSFER_WATCHER_DEAD_TIMEOUT_MS ?? 2 * 60_000); // 2min sem snapshot = morto
const POLLING_TIMEOUT_MS = 15_000; // getDocs não pode ficar pendurado mais de 15s

let lastSnapshotAt = 0; // 0 = nunca recebeu snapshot → polling imediato no primeiro heartbeat
let currentUnsubscribe = null;
let pollingInFlight = false;

const q = query(
  collection(db, 'simulationTransferJobs'),
  where('status', '==', 'queued'),
  where('simulationType', '==', 'auto')
);

// getDocs com timeout para não ficar pendurado em caso de rede morta
function getDocsWithTimeout(query, timeoutMs) {
  return Promise.race([
    getDocs(query),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`getDocs timeout após ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

function startListener() {
  if (currentUnsubscribe) {
    try { currentUnsubscribe(); } catch (_) {}
    currentUnsubscribe = null;
  }

  console.log('[watcher] 👀 A escutar novos jobs em simulationTransferJobs (status=queued, type=auto)...');
  console.log(`[watcher] Máximo de jobs simultâneos: ${MAX_CONCURRENT}`);

  currentUnsubscribe = onSnapshot(
    q,
    (snapshot) => {
      lastSnapshotAt = Date.now();
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const jobId = change.doc.id;
          const data = change.doc.data();
          if (data.status === 'queued') {
            console.log(`[watcher] Novo job detectado: ${jobId}`);
            claimAndLaunchJob(jobId).catch((err) =>
              console.error(`[watcher] Erro ao lançar job ${jobId}:`, err?.message)
            );
          }
        }
      });
    },
    (err) => {
      console.error('[watcher] ❌ Erro no listener Firestore:', err?.message, '— a reconectar em 5s...');
      lastSnapshotAt = 0;
      setTimeout(startListener, 5_000);
    }
  );
}

startListener();

// Heartbeat: polling de fallback a cada HEARTBEAT_INTERVAL_MS
// Apanha jobs que o listener tenha perdido e reconecta se o listener estiver morto
setInterval(async () => {
  // Reconectar listener se não recebeu snapshot em LISTENER_DEAD_TIMEOUT_MS
  if (lastSnapshotAt > 0) {
    const silentMs = Date.now() - lastSnapshotAt;
    if (silentMs > LISTENER_DEAD_TIMEOUT_MS) {
      console.warn(`[watcher] ⚠️  Sem snapshot há ${Math.round(silentMs / 1000)}s — a reconectar listener...`);
      lastSnapshotAt = Date.now();
      startListener();
    }
  }

  // Polling direto com timeout — não fica pendurado
  if (pollingInFlight) return;
  pollingInFlight = true;
  try {
    const snap = await getDocsWithTimeout(q, POLLING_TIMEOUT_MS);
    lastSnapshotAt = Date.now(); // getDocs bem-sucedido = rede ok
    snap.forEach((d) => {
      if (d.data().status === 'queued') {
        console.log(`[watcher] [heartbeat] Job pendente via polling: ${d.id}`);
        claimAndLaunchJob(d.id).catch((err) =>
          console.error(`[watcher] Erro ao lançar job ${d.id}:`, err?.message)
        );
      }
    });
  } catch (err) {
    console.warn(`[watcher] [heartbeat] Polling falhou: ${err?.message}`);
  } finally {
    pollingInFlight = false;
  }
}, HEARTBEAT_INTERVAL_MS);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[watcher] A terminar...');
  if (currentUnsubscribe) currentUnsubscribe();
  process.exit(0);
});
process.on('SIGTERM', () => {
  if (currentUnsubscribe) currentUnsubscribe();
  process.exit(0);
});
