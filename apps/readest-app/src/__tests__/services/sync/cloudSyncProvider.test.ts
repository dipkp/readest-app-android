import { describe, expect, test } from 'vitest';
import type { SystemSettings } from '@/types/settings';
import {
  applySyncBooksAutoEnable,
  cloudProviderDisplayName,
  getActiveFileSyncBackends,
  getCloudSyncProviders,
  getEnabledFileSyncBackends,
  isReadestCloudEnabled,
  isReadestCloudStorageActive,
  resolveCloudSyncGate,
} from '@/services/sync/cloudSyncProvider';

const settings = (partial: Partial<SystemSettings> = {}): SystemSettings =>
  partial as SystemSettings;

describe('Google-only cloud sync', () => {
  test('keeps the original hosted cloud disabled', () => {
    expect(isReadestCloudEnabled(settings())).toBe(false);
    expect(isReadestCloudStorageActive(settings({ readestCloud: { enabled: true } }))).toBe(false);
  });

  test('enables Google Drive and ignores stale non-Google provider settings', () => {
    const configured = settings({
      googleDrive: { enabled: true },
      webdav: { enabled: true },
      onedrive: { enabled: true },
      s3: { enabled: true },
    } as Partial<SystemSettings>);

    expect(getEnabledFileSyncBackends(configured)).toEqual(['gdrive']);
    expect(getCloudSyncProviders(configured)).toEqual(['gdrive']);
  });

  test('makes Google Drive free for every plan', () => {
    const configured = settings({ googleDrive: { enabled: true } });

    expect(resolveCloudSyncGate(configured, 'free')).toEqual({
      readest: false,
      backends: ['gdrive'],
      paused: false,
    });
    expect(getActiveFileSyncBackends(configured, 'free')).toEqual(['gdrive']);
  });

  test('returns no provider until Google Drive is enabled', () => {
    expect(getCloudSyncProviders(settings())).toEqual([]);
    expect(getActiveFileSyncBackends(settings(), 'free')).toEqual([]);
  });

  test('auto-enables book syncing for Google Drive only', () => {
    const configured = settings({
      googleDrive: { enabled: true, syncBooks: false },
      webdav: { enabled: true, syncBooks: false },
    } as Partial<SystemSettings>);

    expect(applySyncBooksAutoEnable(configured)).toBe(true);
    expect(configured.googleDrive?.syncBooks).toBe(true);
    expect(configured.webdav?.syncBooks).toBe(false);
  });

  test('uses the Google Drive product name', () => {
    expect(cloudProviderDisplayName('gdrive')).toBe('Google Drive');
  });
});
