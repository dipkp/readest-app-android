import {
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type DocumentData,
  type FirestoreError,
  type Unsubscribe,
} from 'firebase/firestore';
import { requireFirebaseServices } from './firebaseClient';

export type FirebaseSyncChannel = 'books' | 'progress' | 'annotations' | 'settings';

const assertPathSegment = (value: string, label: string): void => {
  if (!value || value.includes('/')) throw new Error(`${label} must be one Firestore path segment`);
};

export const userSyncDocumentPath = (
  userId: string,
  channel: FirebaseSyncChannel,
  documentId: string,
): string => {
  assertPathSegment(userId, 'userId');
  assertPathSegment(channel, 'channel');
  assertPathSegment(documentId, 'documentId');
  return `users/${userId}/${channel}/${documentId}`;
};

export const writeRealtimeSyncDocument = async (
  userId: string,
  channel: FirebaseSyncChannel,
  documentId: string,
  data: DocumentData,
): Promise<void> => {
  const { firestore } = requireFirebaseServices();
  await setDoc(
    doc(firestore, userSyncDocumentPath(userId, channel, documentId)),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true },
  );
};

export const deleteRealtimeSyncDocument = async (
  userId: string,
  channel: FirebaseSyncChannel,
  documentId: string,
): Promise<void> => {
  const { firestore } = requireFirebaseServices();
  await deleteDoc(doc(firestore, userSyncDocumentPath(userId, channel, documentId)));
};

export const subscribeRealtimeSyncDocument = <T extends DocumentData>(
  userId: string,
  channel: FirebaseSyncChannel,
  documentId: string,
  onValue: (value: T | null) => void,
  onError?: (error: FirestoreError) => void,
): Unsubscribe => {
  const { firestore } = requireFirebaseServices();
  return onSnapshot(
    doc(firestore, userSyncDocumentPath(userId, channel, documentId)),
    (snapshot) => onValue(snapshot.exists() ? (snapshot.data() as T) : null),
    onError,
  );
};
