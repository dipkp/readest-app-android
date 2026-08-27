import { Book, BookConfig, BookNote, BookDataRecord } from '@/types/book';
import {
  collection,
  doc,
  limit as firestoreLimit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  where,
  type DocumentData,
  type QueryConstraint,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseUserId } from '@/services/firebase/firebaseAuth';
import { requireFirebaseServices } from '@/services/firebase/firebaseClient';
import {
  transformBookConfigToDB,
  transformBookNoteToDB,
  transformBookToDB,
} from '@/utils/transform';

export type SyncType = 'books' | 'configs' | 'notes' | 'stats';
export type SyncOp = 'push' | 'pull' | 'both';

interface BookRecord extends BookDataRecord, Book {}
interface BookConfigRecord extends BookDataRecord, BookConfig {}
interface BookNoteRecord extends BookDataRecord, BookNote {}

export interface StatBookRecord {
  user_id?: string;
  book_hash: string;
  title: string;
  authors: string;
  updated_at?: string;
  updated_at_ms?: number; // epoch ms, attached by the GET response for cursor math
  deleted_at?: string | null;
}

export interface StatPageRecord {
  user_id?: string;
  book_hash: string;
  page: number;
  start_time: number;
  duration: number;
  total_pages: number;
  ext?: unknown;
  updated_at?: string;
  updated_at_ms?: number; // epoch ms, attached by the GET response for cursor math
  deleted_at?: string | null;
}

export interface SyncResult {
  books: BookRecord[] | null;
  notes: BookNoteRecord[] | null;
  configs: BookConfigRecord[] | null;
  statBooks?: StatBookRecord[] | null;
  statPages?: StatPageRecord[] | null;
}

export type SyncRecord = BookRecord & BookConfigRecord & BookNoteRecord;

export interface SyncData {
  books?: Partial<BookRecord>[];
  notes?: Partial<BookNoteRecord>[];
  configs?: Partial<BookConfigRecord>[];
  statBooks?: StatBookRecord[];
  statPages?: StatPageRecord[];
}

const emptySyncResult = (): SyncResult => ({ books: null, notes: null, configs: null });

type FirebaseSyncCollection = Exclude<SyncType, 'stats'> | 'statBooks' | 'statPages';

const collectionName = (type: FirebaseSyncCollection): string =>
  type === 'statBooks' ? 'stat-books' : type === 'statPages' ? 'stat-pages' : type;

const cleanFirestoreData = (value: DocumentData): DocumentData =>
  Object.fromEntries(Object.entries(value).filter(([, field]) => field !== undefined));

const recordId = (type: FirebaseSyncCollection, record: DocumentData): string => {
  if (type === 'books' || type === 'configs') return String(record['book_hash']);
  if (type === 'notes') return `${String(record['book_hash'])}:${String(record['id'])}`;
  if (type === 'statBooks') return String(record['book_hash']);
  return `${String(record['book_hash'])}:${String(record['page'])}:${String(record['start_time'])}`;
};

const updatedAt = (record: DocumentData): string =>
  String(record['updated_at'] ?? new Date().toISOString());

const toDatabaseRecords = (
  payload: SyncData,
  userId: string,
): Partial<Record<FirebaseSyncCollection, DocumentData[]>> => ({
  books: payload.books?.map((book) => transformBookToDB(book, userId)),
  configs: payload.configs?.map((config) => transformBookConfigToDB(config, userId)),
  notes: payload.notes?.map((note) => transformBookNoteToDB(note, userId)),
  statBooks: payload.statBooks?.map((record) => ({
    ...record,
    user_id: userId,
    updated_at: record.updated_at ?? new Date().toISOString(),
    updated_at_ms: record.updated_at_ms ?? Date.now(),
  })),
  statPages: payload.statPages?.map((record) => ({
    ...record,
    user_id: userId,
    updated_at: record.updated_at ?? new Date().toISOString(),
    updated_at_ms: record.updated_at_ms ?? Date.now(),
  })),
});

export class SyncClient {
  /**
   * Pull incremental changes since a given timestamp (in ms).
   * Returns updated or deleted records since that time.
   */
  async pullChanges(
    since: number,
    type?: SyncType,
    book?: string,
    metaHash?: string,
    limit?: number,
  ): Promise<SyncResult> {
    const userId = getFirebaseUserId();
    if (!userId) throw new Error('Not authenticated');
    if (!type) return emptySyncResult();

    const { firestore } = requireFirebaseServices();
    const constraints: QueryConstraint[] = [
      where('updated_at', '>=', new Date(Math.max(0, since)).toISOString()),
      orderBy('updated_at', 'asc'),
    ];
    if (limit && limit > 0) constraints.push(firestoreLimit(limit));

    const readCollection = async (collectionType: FirebaseSyncCollection) => {
      const { getDocs } = await import('firebase/firestore');
      const snapshot = await getDocs(
        query(
          collection(firestore, `users/${userId}/${collectionName(collectionType)}`),
          ...constraints,
        ),
      );
      return snapshot.docs.map((item) => item.data());
    };

    if (type === 'stats') {
      const [statBooks, statPages] = await Promise.all([
        readCollection('statBooks'),
        readCollection('statPages'),
      ]);
      return { ...emptySyncResult(), statBooks, statPages } as SyncResult;
    }

    let records = await readCollection(type);
    if (book || metaHash) {
      records = records.filter(
        (record) =>
          (!book || record['book_hash'] === book) ||
          (!!metaHash && record['meta_hash'] === metaHash),
      );
    }

    return {
      ...emptySyncResult(),
      [type]: records,
    } as SyncResult;
  }

  /**
   * Push local changes to the server.
   * Uses last-writer-wins logic as implemented on the server side.
   */
  async pushChanges(payload: SyncData): Promise<SyncResult> {
    const userId = getFirebaseUserId();
    if (!userId) throw new Error('Not authenticated');
    const { firestore } = requireFirebaseServices();
    const recordsByType = toDatabaseRecords(payload, userId);
    const result = emptySyncResult();

    for (const [rawType, records] of Object.entries(recordsByType)) {
      const type = rawType as FirebaseSyncCollection;
      if (!records?.length) continue;
      for (const rawRecord of records) {
        const record = cleanFirestoreData(rawRecord);
        const target = doc(
          firestore,
          `users/${userId}/${collectionName(type)}/${recordId(type, record)}`,
        );
        await runTransaction(firestore, async (transaction) => {
          const existing = await transaction.get(target);
          if (existing.exists() && updatedAt(existing.data()) > updatedAt(record)) return;
          transaction.set(target, record, { merge: true });
        });
      }
      if (type === 'books' || type === 'configs' || type === 'notes') {
        if (type === 'books') result.books = records as BookRecord[];
        if (type === 'configs') result.configs = records as BookConfigRecord[];
        if (type === 'notes') result.notes = records as BookNoteRecord[];
      }
    }
    return result;
  }

  subscribeToChanges(
    type: 'books' | 'configs' | 'notes',
    listener: (result: SyncResult) => void,
    book?: string,
    metaHash?: string,
  ): Unsubscribe {
    const userId = getFirebaseUserId();
    if (!userId) return () => {};
    const { firestore } = requireFirebaseServices();
    return onSnapshot(collection(firestore, `users/${userId}/${type}`), (snapshot) => {
      let records = snapshot.docs.map((item) => item.data());
      if (book || metaHash) {
        records = records.filter(
          (record) =>
            (!book || record['book_hash'] === book) ||
            (!!metaHash && record['meta_hash'] === metaHash),
        );
      }
      listener({ ...emptySyncResult(), [type]: records } as SyncResult);
    });
  }
}
