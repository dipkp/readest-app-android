import { describe, expect, test } from 'vitest';
import { userSyncDocumentPath } from '@/services/firebase/firebaseRealtime';

describe('userSyncDocumentPath', () => {
  test('keeps every user inside their own realtime sync namespace', () => {
    expect(userSyncDocumentPath('user-1', 'progress', 'book-1')).toBe(
      'users/user-1/progress/book-1',
    );
  });

  test('rejects values that could escape a path segment', () => {
    expect(() => userSyncDocumentPath('user/other', 'books', 'book-1')).toThrow(/userId/);
    expect(() => userSyncDocumentPath('user-1', 'books', 'folder/book-1')).toThrow(/documentId/);
  });
});
