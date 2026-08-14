import { initializeApp, getApps, getApp, type FirebaseOptions, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, enableMultiTabIndexedDbPersistence, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

// O SDK do Firebase é feito para rodar no navegador. Como este app é 100%
// client-side (todas as telas usam "use client"), qualquer chamada ao
// Firebase só acontece dentro de useEffect/handlers, depois da hidratação.
// Por isso a inicialização real só ocorre quando existe `window` — durante o
// `next build`/prerender (ambiente Node, sem window) isso é pulado, evitando
// que a build quebre por falta de variáveis de ambiente do Firebase.
//
// Além disso, só chamamos getAuth/getFirestore/getStorage quando as env vars
// realmente existem: com uma apiKey vazia/inválida, o próprio SDK lança
// `auth/invalid-api-key` de forma síncrona (não dentro de uma Promise), o
// que derrubaria a árvore de componentes inteira antes de qualquer render.
// Quem decide se a UI real pode montar é <Providers> (src/app/providers.tsx),
// usando `isFirebaseConfigured` — os objetos abaixo só existem de fato depois
// que ele libera a passagem.
const canInitFirebase = typeof window !== "undefined" && isFirebaseConfigured;

function initFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export const firebaseApp: FirebaseApp | undefined = canInitFirebase ? initFirebaseApp() : undefined;

export const auth = (firebaseApp ? getAuth(firebaseApp) : ({} as Auth)) as Auth;
export const db = (firebaseApp ? getFirestore(firebaseApp) : ({} as Firestore)) as Firestore;
export const storage = (firebaseApp ? getStorage(firebaseApp) : ({} as FirebaseStorage)) as FirebaseStorage;

if (typeof window !== "undefined" && firebaseApp) {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    console.warn("Firestore persistence error:", err.code);
  });
}

// Único método de login do app (cliente e admin). Quem vira admin ou não é
// decidido depois, checando a coleção `admins` no Firestore — não existe
// nenhum cadastro de senha para gerenciar.
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Analytics é opcional: só existe se houver measurementId e o navegador
// suportar (bloqueadores de anúncio, Safari com ITP etc. podem recusar).
// `isSupported()` é assíncrono, então guardamos a Promise e reaproveitamos.
let analyticsPromise: Promise<Analytics | null> | null = null;

export function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (!firebaseApp || !firebaseConfig.measurementId) return Promise.resolve(null);
  const app = firebaseApp;
  if (!analyticsPromise) {
    analyticsPromise = isSupported()
      .then((supported) => (supported ? getAnalytics(app) : null))
      .catch(() => null);
  }
  return analyticsPromise;
}
