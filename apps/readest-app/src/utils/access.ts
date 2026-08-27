import { UserPlan } from '@/types/quota';
import { getFirebaseIdToken, getFirebaseUserId } from '@/services/firebase/firebaseAuth';
import { readFirebaseConfig } from '@/services/firebase/firebaseConfig';

export const getSubscriptionPlan = (_token: string): UserPlan => 'purchase';

export const getUserProfilePlan = (_token: string): UserPlan => 'purchase';

export const EMAIL_IN_PLANS: readonly UserPlan[] = ['plus', 'pro', 'purchase'];

export const isEmailInPlan = (_plan: UserPlan): boolean => true;

export const CLOUD_SYNC_PLANS: readonly UserPlan[] = ['plus', 'pro', 'purchase'];

export const isCloudSyncInPlan = (_plan: UserPlan): boolean => true;

export const CLOUD_SYNC_REQUIRES_PREMIUM = false;

export const isCloudSyncAllowed = (_plan: UserPlan): boolean => true;

export const TTS_CACHE_PLANS: readonly UserPlan[] = ['plus', 'pro', 'purchase'];

export const isTTSCacheInPlan = (_plan: UserPlan): boolean => true;

export const TTS_CACHE_REQUIRES_PREMIUM = false;

export const isTTSCacheAllowed = (_plan: UserPlan): boolean => true;

export const STORAGE_QUOTA_GRACE_BYTES = 10 * 1024 * 1024;

export const getStoragePlanData = (_token: string) => {
  return {
    plan: 'purchase' as UserPlan,
    usage: 0,
    quota: Number.MAX_SAFE_INTEGER,
  };
};

export const getTranslationQuota = (_plan: UserPlan): number => Number.MAX_SAFE_INTEGER;

export const getTranslationPlanData = (_token: string) => {
  return {
    plan: 'purchase' as UserPlan,
    usage: 0,
    quota: Number.MAX_SAFE_INTEGER,
  };
};

export const getDailyTranslationPlanData = (_token: string) => {
  return {
    plan: 'purchase' as UserPlan,
    quota: Number.MAX_SAFE_INTEGER,
  };
};

export const getAccessToken = async (): Promise<string | null> => {
  return getFirebaseIdToken();
};

export const getUserID = async (): Promise<string | null> => {
  return getFirebaseUserId();
};

interface FirebaseAccountLookupResponse {
  users?: Array<{ localId: string; email?: string; displayName?: string; photoUrl?: string }>;
}

export const validateUserAndToken = async (authHeader: string | null | undefined) => {
  const token = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1] ?? null;
  const apiKey = readFirebaseConfig()?.apiKey;
  if (!token || typeof apiKey !== 'string') return { user: null, token: null };

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
    },
  );
  if (!response.ok) return { user: null, token: null };

  const account = ((await response.json()) as FirebaseAccountLookupResponse).users?.[0];
  return account
    ? {
        user: {
          id: account.localId,
          email: account.email ?? null,
          full_name: account.displayName ?? null,
          avatar_url: account.photoUrl ?? null,
        },
        token,
      }
    : { user: null, token: null };
};
