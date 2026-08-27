import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signOut,
  type User,
  type Unsubscribe,
} from 'firebase/auth';
import { getFirebaseServices, requireFirebaseServices } from './firebaseClient';

export const observeFirebaseAuth = (listener: (user: User | null) => void): Unsubscribe => {
  const services = getFirebaseServices();
  return services ? onAuthStateChanged(services.auth, listener) : () => {};
};

export const signInFirebaseWithGoogleAccessToken = async (accessToken: string): Promise<User> => {
  const { auth } = requireFirebaseServices();
  const credential = GoogleAuthProvider.credential(null, accessToken);
  const result = await signInWithCredential(auth, credential);
  return result.user;
};

export const signOutFirebase = async (): Promise<void> => {
  const services = getFirebaseServices();
  if (services) await signOut(services.auth);
};

export const getFirebaseIdToken = async (forceRefresh = false): Promise<string | null> => {
  const user = getFirebaseServices()?.auth.currentUser;
  return user ? user.getIdToken(forceRefresh) : null;
};

export const getFirebaseUserId = (): string | null =>
  getFirebaseServices()?.auth.currentUser?.uid ?? null;
