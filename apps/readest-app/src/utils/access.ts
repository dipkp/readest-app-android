import { UserPlan } from '@/types/quota';

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
  return null;
};

export const getUserID = async (): Promise<string | null> => {
  return null;
};

export const validateUserAndToken = async (_authHeader: string | null | undefined) => {
  return { user: { id: 'dummy' }, token: 'dummy' };
};
