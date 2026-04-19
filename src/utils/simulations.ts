import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export type SimulationType = 'auto' | 'vida' | 'saude' | 'habitacao' | 'rc_prof' | 'condominio' | string;

export type SimulationRecord = {
  type: SimulationType;
  title?: string;
  summary?: string;
  status?: string; // 'submitted' | 'quoted' | 'archived' | ...
  cotacaoConfirmada?: boolean;
  payload?: any;   // raw form data or selected fields
  createdAt?: any; // serverTimestamp will set this
};

/**
 * Persist a simulation for a user. Optionally provide an idempotencyKey to avoid duplicates.
 * When idempotencyKey is provided, the document ID is fixed, so repeated calls will upsert the same doc
 * instead of creating multiple records. This is useful to prevent double clicks or re-submits.
 */
export async function saveSimulation(
  uid: string,
  data: SimulationRecord,
  opts?: { idempotencyKey?: string }
) {
  const colRef = collection(db, 'users', uid, 'simulations');
  const toSave = {
    ...data,
    status: data.status ?? 'submitted',
    createdAt: serverTimestamp(),
  };
  if (opts?.idempotencyKey) {
    const docRef = doc(colRef, opts.idempotencyKey);
    await setDoc(docRef, toSave, { merge: true });
    return docRef.id;
  } else {
    const ref = await addDoc(colRef, toSave);
    return ref.id;
  }
}
