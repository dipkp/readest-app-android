import clsx from 'clsx';
import React, { useEffect, useState } from 'react';
import { MdChevronRight } from 'react-icons/md';
import { RiCloudLine } from 'react-icons/ri';
import { useEnv } from '@/context/EnvContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useKeyDownActions } from '@/hooks/useKeyDownActions';
import { useSettingsStore } from '@/store/settingsStore';
import { useFileSyncStore } from '@/store/fileSyncStore';
import GoogleDriveForm from './integrations/GoogleDriveForm';
import { persistCloudProviderEnabled } from './integrations/cloudSync';
import {
  canToggleCloudProvider,
  getThirdPartyRowStatus,
} from './integrations/cloudSyncStatus';
import { getCloudSyncProviders } from '@/services/sync/cloudSyncProvider';
import SubPageHeader from './SubPageHeader';
import { SectionTitle, SettingLabel, Tips } from './primitives';

const IntegrationsPanel: React.FC = () => {
  const _ = useTranslation();
  const { envConfig } = useEnv();
  const { settings, requestedSubPage, setRequestedSubPage } = useSettingsStore();
  const isGoogleDriveSyncing = useFileSyncStore((state) => state.byKind.gdrive?.isSyncing ?? false);
  const googleDriveLastError = useFileSyncStore((state) => state.lastErrorByKind.gdrive);
  const [showGoogleDrive, setShowGoogleDrive] = useState(false);

  useKeyDownActions({
    enabled: showGoogleDrive,
    onCancel: () => setShowGoogleDrive(false),
  });

  useEffect(() => {
    if (!requestedSubPage) return;
    if (requestedSubPage === 'gdrive') setShowGoogleDrive(true);
    setRequestedSubPage(null);
  }, [requestedSubPage, setRequestedSubPage]);

  if (showGoogleDrive) {
    return (
      <div className='my-4 w-full'>
        <SubPageHeader
          parentLabel={_('Integrations')}
          currentLabel={_('Google Drive')}
          description={_(
            'Sync your library, reading progress, and highlights with Google Drive.',
          )}
          onBack={() => setShowGoogleDrive(false)}
        />
        <GoogleDriveForm />
        {settings.googleDrive?.enabled && (
          <div className='mt-5'>
            <Tips>
              <li>
                {_('{{provider}} keeps a full copy of your books, progress, and annotations.', {
                  provider: _('Google Drive'),
                })}
              </li>
            </Tips>
          </div>
        )}
      </div>
    );
  }

  const configured = !!settings.googleDrive?.accountLabel;
  const enabled = !!settings.googleDrive?.enabled;
  const status = getThirdPartyRowStatus(_, {
    enabled,
    configured,
    syncing: isGoogleDriveSyncing,
    paused: false,
    lastError: googleDriveLastError,
    syncBooks: settings.googleDrive?.syncBooks ?? false,
    booksBackedUpElsewhere: false,
  });
  const providers = getCloudSyncProviders(settings);

  return (
    <div className='my-4 w-full space-y-6'>
      <div className='w-full px-4'>
        <h2 className='mb-1.5 text-lg font-semibold tracking-tight'>{_('Integrations')}</h2>
        <p className='text-base-content/70 text-sm leading-relaxed'>
          {_('Google Drive is the only external sync service in this build.')}
        </p>
      </div>

      <div className='w-full' data-setting-id='settings.integrations.cloudSync'>
        <SectionTitle className='mb-2'>{_('Cloud Sync')}</SectionTitle>
        <div className='card eink-bordered border-base-200 bg-base-100 overflow-hidden border'>
          <div role='group' aria-label={_('Cloud sync providers')}>
            <div className='group flex w-full items-center gap-3 px-4 py-3'>
              <button
                type='button'
                onClick={() => setShowGoogleDrive(true)}
                className={clsx(
                  'flex min-w-0 flex-1 items-center gap-3 text-left',
                  'focus-visible:ring-base-content/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset',
                )}
              >
                <span
                  className={clsx(
                    'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full',
                    'bg-base-200 text-base-content/70 transition-colors duration-150',
                    'group-hover:bg-base-300/70',
                  )}
                >
                  <RiCloudLine className='h-5 w-5' />
                </span>
                <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
                  <SettingLabel>{_('Google Drive')}</SettingLabel>
                  <span className='text-base-content/65 truncate text-[0.85em]'>{status}</span>
                </div>
              </button>
              <input
                type='checkbox'
                className='checkbox checkbox-sm flex-shrink-0'
                checked={enabled}
                disabled={
                  !canToggleCloudProvider({
                    isPremium: true,
                    isConfigured: configured,
                    isEnabled: enabled,
                  })
                }
                onChange={(event) =>
                  void persistCloudProviderEnabled(envConfig, 'gdrive', event.target.checked)
                }
                aria-label={_('Sync with Google Drive')}
                title={_('Sync with Google Drive')}
              />
              <button
                type='button'
                onClick={() => setShowGoogleDrive(true)}
                aria-label={_('Google Drive')}
                className={clsx(
                  'text-base-content/50 hover:text-base-content/80 flex-shrink-0 rounded',
                  'focus-visible:ring-base-content/15 focus-visible:outline-none focus-visible:ring-2',
                )}
              >
                <MdChevronRight className='h-5 w-5' />
              </button>
            </div>
          </div>
        </div>

        {providers.length === 0 && (
          <div className='mt-5'>
            <Tips>
              <li>
                {_(
                  'Library sync is off. Your books, progress, and annotations stay on this device.',
                )}
              </li>
            </Tips>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegrationsPanel;
