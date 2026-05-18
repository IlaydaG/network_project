import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Firestore, Timestamp } from 'firebase-admin/firestore';

export let db: Firestore;

export const firebaseBaslat = (): void => {
  const app = initializeApp({
    credential: cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // .env'deki \n kaçış karakteri gerçek satır sonuna çevrilir
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
  db = getFirestore(app);
  console.log('[Firebase] Firestore bağlantısı kuruldu →', process.env.FIREBASE_PROJECT_ID);
};

// Firestore Timestamp veya string/Date → JS Date dönüşümü
export const toDate = (val: unknown): Date => {
  if (val instanceof Timestamp) return val.toDate();
  return new Date(val as string | Date);
};
