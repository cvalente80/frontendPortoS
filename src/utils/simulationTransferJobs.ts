import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export type SimulationTransferPayload = {
  plate?: string;
  matricula?: string;
  licensePlate?: string;
  postalCode?: string;
  codigoPostal?: string;
  zipCode?: string;
  birthDate?: string;
  dataNascimento?: string;
  email?: string;
  phone?: string;
  telefone?: string;
  [key: string]: unknown;
};

export type SimulationTransferJobInput = {
  uid: string;
  simulationType: string;
  sourceSimulationId?: string;
  idempotencyKey: string;
  payload: SimulationTransferPayload;
  targetUrl?: string;
  selectors?: Record<string, string>;
};

export async function enqueueSimulationTransferJob(input: SimulationTransferJobInput) {
  const jobsRef = collection(db, 'simulationTransferJobs');
  const job = {
    uid: input.uid,
    simulationType: input.simulationType,
    sourceSimulationId: input.sourceSimulationId ?? null,
    idempotencyKey: input.idempotencyKey,
    payload: input.payload,
    targetUrl: input.targetUrl ?? null,
    selectors: input.selectors ?? null,
    status: 'queued',
    attempts: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(jobsRef, job);
  return ref.id;
}
