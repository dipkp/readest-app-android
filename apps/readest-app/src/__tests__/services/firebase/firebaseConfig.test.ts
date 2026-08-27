import { describe, expect, test } from 'vitest';
import { readFirebaseConfig } from '@/services/firebase/firebaseConfig';

const completeConfig = {
  NEXT_PUBLIC_FIREBASE_API_KEY: 'api-key',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'reader.firebaseapp.com',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'reader',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'reader.firebasestorage.app',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '123',
  NEXT_PUBLIC_FIREBASE_APP_ID: '1:123:web:abc',
};

describe('readFirebaseConfig', () => {
  test('returns a Firebase web config when every public value is present', () => {
    expect(readFirebaseConfig(completeConfig)).toEqual({
      apiKey: 'api-key',
      authDomain: 'reader.firebaseapp.com',
      projectId: 'reader',
      storageBucket: 'reader.firebasestorage.app',
      messagingSenderId: '123',
      appId: '1:123:web:abc',
    });
  });

  test('returns null instead of partially initializing Firebase', () => {
    expect(
      readFirebaseConfig({
        ...completeConfig,
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: '',
      }),
    ).toBeNull();
  });
});
