/**
 * Orchestrates connecting / disconnecting Google Drive: run the platform OAuth
 * flow, persist the token, and resolve the account label. Kept free of platform
 * specifics (the OAuth runner is injected) so it is unit-testable and shared by
 * every platform's connect button.
 */
import { createGoogleDriveAuth, resolveGoogleAccountProfile, type GoogleAccountProfile } from './googleDriveAuth';
import { buildGoogleOAuthConfig } from './googleOAuthConfig';
import type { FetchFn } from './GoogleDriveProvider';
import type { TokenPersistence } from './driveTokenStore';
import type { OAuthClientConfig } from '@/services/sync/providers/oauth/oauthFlow';
import type { TokenSet } from '@/services/sync/providers/oauth/tokenEndpoint';

/**
 * Google identity plus Drive's private app-file scope. The identity scopes let
 * the same consent complete Firebase Auth without asking the user to sign in a
 * second time; Drive still sees only files created by this app.
 */
export const DRIVE_FILE_SCOPE =
  'openid email profile https://www.googleapis.com/auth/drive.file';

export interface ConnectGoogleDriveDeps {
  /** The env-baked official OAuth client id. */
  clientId: string;
  /** Platform `fetch` for the token exchange + `about.get`. */
  fetchFn: FetchFn;
  /** Where the token set is saved (keychain). */
  persistence: TokenPersistence;
  /** Platform OAuth runner (desktop deep-link / Android Custom Tab / iOS Safari). */
  runOAuth: (config: OAuthClientConfig, fetchFn: FetchFn) => Promise<TokenSet>;
}

export interface ConnectGoogleDriveResult {
  accountLabel: string | null;
  accountProfile: GoogleAccountProfile | null;
  /** Short-lived token used immediately to exchange for a Firebase session. */
  accessToken: string;
}

/**
 * Run the platform OAuth flow, persist the resulting token set, and resolve the
 * connected account's label.
 *
 * The token is saved BEFORE success is reported, and a save failure THROWS — the
 * caller must not mark Drive enabled if the refresh token did not persist, since
 * a "connected" account that vanishes on the next launch is worse than a failed
 * connect. The account label is best-effort (null when `about.get` fails).
 */
export const connectGoogleDrive = async (
  deps: ConnectGoogleDriveDeps,
): Promise<ConnectGoogleDriveResult> => {
  const tokens = await deps.runOAuth(
    buildGoogleOAuthConfig(deps.clientId, DRIVE_FILE_SCOPE),
    deps.fetchFn,
  );
  // Fail-loud: if the keychain rejects the token, surface it so the UI does not
  // enable Drive against a token that won't survive a restart.
  await deps.persistence.save(tokens);

  createGoogleDriveAuth({
    clientId: deps.clientId,
    fetchFn: deps.fetchFn,
    persistence: deps.persistence,
    initialTokens: tokens,
  });
  let accountProfile: GoogleAccountProfile | null = null;
  let accountLabel: string | null = null;
  try {
    accountProfile = await resolveGoogleAccountProfile(tokens.accessToken, deps.fetchFn);
    accountLabel = accountProfile ? (accountProfile.email ?? accountProfile.name) : null;
  } catch (e) {
    console.warn('[gdrive] account profile fetch failed', e);
  }
  return { accountLabel, accountProfile, accessToken: tokens.accessToken };
};

/** Forget the stored Drive credentials (the settings flag is cleared by the caller). */
export const disconnectGoogleDrive = async (persistence: TokenPersistence): Promise<void> => {
  await persistence.clear();
};
