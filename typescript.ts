/// <reference types="vite/client" />
import { initializeApp, setLogLevel, getApp, getApps } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  browserPopupRedirectResolver,
  browserLocalPersistence,
  inMemoryPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
} from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
} as const;

// Replace direct initializeApp with singleton init
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Reduce SDK logs (guarded to avoid older SDK issues)
try {
  setLogLevel("error");
} catch {
  // ignore
}

// Initialize Auth with popup resolver and persistence configured upfront
export const auth = (() => {
  try {
    if (typeof window === "undefined") {
      return getAuth(app);
    }
    return initializeAuth(app, {
      popupRedirectResolver: browserPopupRedirectResolver,
      // Tenta guardar sessão em storage; se não der, cai para in-memory
      persistence: [browserLocalPersistence, inMemoryPersistence],
    });
  } catch {
    return getAuth(app);
  }
})();

// Set UI language to Portuguese
auth.languageCode = "pt";

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Try popup first; fallback to redirect on COOP/popup issues
export async function signInWithGoogle() {
  if (typeof window === "undefined") return null;
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (e: any) {
    const msg = String(e?.message || "");
    const code = String(e?.code || "");
    const coopIssue =
      msg.includes("Cross-Origin-Opener-Policy") ||
      msg.includes("window.closed") ||
      code === "auth/popup-blocked" ||
      code === "auth/popup-closed-by-user" ||
      code === "auth/cancelled-popup-request";
    if (coopIssue) {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw e;
  }
}

// Complete redirect flow after return (guard non-browser)
export async function handleAuthRedirect() {
  if (typeof window === "undefined") return null;
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      try {
        await result.user.reload();
      } catch {
        // ignore reload failures
      }
      return result.user;
    }
    return null;
  } catch {
    return null;
  }
}

export const signOutUser = () => signOut(auth);

// Firestore singleton
export const db = getFirestore(app);
export const storage = getStorage(app);

// Email/password auth helpers
export async function signInWithEmailPassword(email: string, password: string) {
  const res = await signInWithEmailAndPassword(auth, email, password);
  return res.user;
}

export async function registerWithEmailPassword(email: string, password: string) {
  const res = await createUserWithEmailAndPassword(auth, email, password);
  // Ensure a user profile doc exists with default isAdmin false
  try {
    const ref = doc(db, 'users', res.user.uid);
    await setDoc(ref, {
      email: res.user.email ?? email,
      displayName: res.user.displayName ?? '',
      createdAt: serverTimestamp(),
      isAdmin: false,
    }, { merge: true });
  } catch {
    // ignore profile creation failures
  }
  return res.user;
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}

// Send verification email to current user
export async function sendVerification() {
  const u = auth.currentUser;
  if (!u) throw { code: 'auth/no-current-user' };
  await sendEmailVerification(u);
}