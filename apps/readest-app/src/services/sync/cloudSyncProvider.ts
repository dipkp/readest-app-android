import type { SystemSettings } from '@/types/settings';
import type { UserPlan } from '@/types/quota';
import type { FileSyncBackendKind } from '@/services/sync/file/providerRegistry';

/**
 * Compatibility union for persisted settings. This fork exposes Google Drive
 * only; Readest Cloud and the non-Google backends are always inactive.
 */
export type CloudSyncProviderKind = 'readest' | FileSyncBackendKind;

/** Settings slice key for a third-party backend kind. */
export const settingsKeyForBackend = (
  kind: FileSyncBackendKind,
): 'webdav' | 'googleDrive' | 's3' | 'onedrive' => (kind === 'gdrive' ? 'googleDrive' : kind);

/** Human-readable provider name (product names — deliberately untranslated). */
export const cloudProviderDisplayName = (kind: CloudSyncProviderKind): string =>
  kind === 'gdrive'
    ? 'Google Drive'
    : kind === 'webdav'
      ? 'WebDAV'
      : kind === 's3'
        ? 'S3'
        : kind === 'onedrive'
          ? 'OneDrive'
          : 'DOD Cloud';

/**
 * The third-party backends the user has switched on, in a STABLE order that
 * every loop, list, and sync pass in the app relies on.
 */
export const getEnabledFileSyncBackends = (
  settings: SystemSettings | null | undefined,
): FileSyncBackendKind[] => {
  return settings?.googleDrive?.enabled ? ['gdrive'] : [];
};

/** Any third-party file-sync backend switched on. */
export const hasAnyThirdPartyEnabled = (settings: SystemSettings | null | undefined): boolean =>
  getEnabledFileSyncBackends(settings).length > 0;

/**
 * Whether Readest Cloud syncs the library channels on this device.
 *
 * The `??` is load-bearing: an absent `readestCloud.enabled` reproduces the
 * pre-#5062 exclusive derivation (Readest Cloud owned the library exactly when
 * no third-party provider was enabled), so upgrading users need no migration
 * and disconnecting the last third-party provider still falls back to Readest
 * Cloud. Once the user touches a Cloud Sync checkbox the flag is explicit and
 * wins.
 */
export const isReadestCloudEnabled = (_settings: SystemSettings | null | undefined): boolean => false;

/** Every provider syncing the library on this device, Readest Cloud first. */
export const getCloudSyncProviders = (
  settings: SystemSettings | null | undefined,
): CloudSyncProviderKind[] => [
  ...(isReadestCloudEnabled(settings) ? (['readest'] as const) : []),
  ...getEnabledFileSyncBackends(settings),
];

/** Comma-joined product names, for the "Synced via {{provider}}" copy. */
export const cloudProvidersDisplayName = (kinds: CloudSyncProviderKind[]): string =>
  kinds.map(cloudProviderDisplayName).join(', ');

/**
 * Kept for compatibility with callers that still publish a plan refresh. The
 * Google-only fork never uses this value to gate sync.
 */
let cachedUserPlan: UserPlan = 'free';

export const setCachedUserPlan = (plan: UserPlan | undefined): void => {
  cachedUserPlan = plan ?? 'free';
};

export const getCachedUserPlan = (): UserPlan => cachedUserPlan;

export interface CloudSyncGate {
  /** Readest Cloud syncs the library channels (rows, progress, notes, files). */
  readest: boolean;
  /** Google Drive when it is switched on. */
  backends: FileSyncBackendKind[];
  /**
   * Always false: Google Drive sync is free in this fork.
   */
  paused: boolean;
}

export const resolveCloudSyncGate = (
  settings: SystemSettings | null | undefined,
  _plan: UserPlan = cachedUserPlan,
): CloudSyncGate => {
  const backends = getEnabledFileSyncBackends(settings);
  return {
    readest: isReadestCloudEnabled(settings),
    backends,
    paused: false,
  };
};

/** The backends that may actually run right now (empty when paused). */
export const getActiveFileSyncBackends = (
  settings: SystemSettings | null | undefined,
  plan?: UserPlan,
): FileSyncBackendKind[] => {
  const gate = resolveCloudSyncGate(settings, plan);
  return gate.backends;
};

/**
 * Upgrade helper: ensure an already-enabled Google Drive account also syncs
 * book files.
 * Mutates `settings` in place (the migration runner saves the same
 * snapshot afterwards) and returns whether anything changed.
 */
export const applySyncBooksAutoEnable = (settings: SystemSettings): boolean => {
  if (!settings.googleDrive?.enabled || settings.googleDrive.syncBooks) return false;
  settings.googleDrive = { ...settings.googleDrive, syncBooks: true };
  return true;
};

/**
 * Original hosted storage is never writable in the Google-only fork.
 */
export const isReadestCloudStorageActive = (
  _settings: SystemSettings | null | undefined,
  _plan?: UserPlan,
): boolean => false;
