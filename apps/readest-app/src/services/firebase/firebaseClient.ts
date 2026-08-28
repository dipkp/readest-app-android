import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { readFirebaseConfig } from './firebaseConfig';

export interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

let cachedServices: FirebaseServices | null | undefined;

export const getFirebaseServices = (): FirebaseServices | null => {
  if (cachedServices !== undefined) return cachedServices;

  const config = readFirebaseConfig();
  if (!config) {
    cachedServices = null;
    return cachedServices;
  }

  const app = getApps().length > 0 ? getApp() : initializeApp(config);
  cachedServices = {
    app,
    auth: getAuth(app),
    firestore: getFirestore(app),
  };
  return cachedServices;
};

export const requireFirebaseServices = (): FirebaseServices => {
  const services = getFirebaseServices();
  if (!services) {
    throw new Error(
      'Firebase is not configured. Set the NEXT_PUBLIC_FIREBASE_* values for your project.',
    );
  }
  return services;
};
