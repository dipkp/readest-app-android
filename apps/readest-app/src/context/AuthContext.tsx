'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  getFirebaseIdToken,
  observeFirebaseAuth,
  signInFirebaseWithGoogleAccessToken,
  signOutFirebase,
} from '@/services/firebase/firebaseAuth';
import {
  runGoogleDriveConnect,
  runGoogleDriveDisconnect,
} from '@/services/sync/providers/gdrive/googleDriveConnect';
import { useSettingsStore } from '@/store/settingsStore';

export interface User {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  user_metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapFirebaseUser = (user: FirebaseUser): User => ({
  id: user.uid,
  email: user.email,
  full_name: user.displayName,
  avatar_url: user.photoURL,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(
    () =>
      observeFirebaseAuth((firebaseUser) => {
        setUser(firebaseUser ? mapFirebaseUser(firebaseUser) : null);
        void (async () => setToken(firebaseUser ? await firebaseUser.getIdToken() : null))();
      }),
    [],
  );

  const login = useCallback(async () => {
    const result = await runGoogleDriveConnect();
    await signInFirebaseWithGoogleAccessToken(result.accessToken);

    const { settings, setSettings } = useSettingsStore.getState();
    setSettings({
      ...settings,
      googleDrive: {
        ...settings.googleDrive,
        enabled: true,
        syncBooks: true,
        accountLabel: result.accountLabel ?? undefined,
      },
    });
  }, []);

  const logout = useCallback(async () => {
    await Promise.allSettled([signOutFirebase(), runGoogleDriveDisconnect()]);
    setUser(null);
    setToken(null);

    const { settings, setSettings } = useSettingsStore.getState();
    setSettings({
      ...settings,
      googleDrive: {
        ...settings.googleDrive,
        enabled: false,
      },
    });
  }, []);

  const refresh = useCallback(async () => {
    setToken(await getFirebaseIdToken(true));
  }, []);

  const value = useMemo(
    () => ({ token, user, login, logout, refresh }),
    [token, user, login, logout, refresh],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
