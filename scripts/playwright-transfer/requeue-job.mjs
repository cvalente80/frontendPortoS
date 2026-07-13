import process from 'node:process';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

const jobId = String(process.argv[2] || '').trim();
if (!jobId) {
  console.error('Uso: node --env-file=.env.local scripts/playwright-transfer/requeue-job.mjs <jobId>');
  process.exit(1);
}

const cfg = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

if (!cfg.apiKey || !cfg.projectId) {
  console.error('Faltam variáveis VITE_FIREBASE_* no ambiente. Usa --env-file=.env.local.');
  process.exit(1);
}

const app = getApps().length ? getApp() : initializeApp(cfg);
const db = getFirestore(app);

await updateDoc(doc(db, 'simulationTransferJobs', jobId), {
  status: 'queued',
  simulationType: 'auto',
  error: null,
  failedAt: null,
  startedAt: null,
  completedAt: null,
  updatedAt: serverTimestamp(),
});

console.log(`requeued:${jobId}`);
