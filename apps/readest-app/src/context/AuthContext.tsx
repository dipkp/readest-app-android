'use client';

import {
  createContext,
  useContext,
  useMemo,
  ReactNode,
  useState,
  useEffect,
} from 'react';
import { runGoogleDriveConnect, runGoogleDriveDisconnect } from '@/services/sync/providers/gdrive/googleDriveConnect';
import { useSettingsStore } from '@/store/settingsStore';

export interface User {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  [key: string]: any;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const { setSettings, settings } = useSettingsStore();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('readest_google_user');
      if (stored && settings.googleDrive?.enabled) {
        setUser(JSON.parse(stored));
      } else if (!settings.googleDrive?.enabled) {
        localStorage.removeItem('readest_google_user');
        setUser(null);
      }
    } catch (e) {}
  }, [settings.googleDrive?.enabled]);

  const login = async () => {
    try {
      const result = await runGoogleDriveConnect();
      if (result?.accountProfile) {
        const newUser: User = {
          id: result.accountProfile.email || 'google_user',
          email: result.accountProfile.email,
          full_name: result.accountProfile.name,
          avatar_url: result.accountProfile.picture,
        };
        setUser(newUser);
        localStorage.setItem('readest_google_user', JSON.stringify(newUser));
        
        setSettings({
          ...settings,
          googleDrive: {
            ...settings.googleDrive,
            enabled: true,
            syncBooks: true,
            accountLabel: result.accountLabel ?? undefined,
          }
        });
      }
    } catch (e) {
      console.error('Google Sign In failed', e);
      throw e;
    }
  };

  const logout = async () => {
    try {
      await runGoogleDriveDisconnect();
    } catch(e) {
      console.error('Google Sign Out failed', e);
    }
    setUser(null);
    localStorage.removeItem('readest_google_user');
    
    setSettings({
      ...settings,
      googleDrive: {
        ...settings.googleDrive,
        enabled: false,
      }
    });
  };

  const refresh = () => {};

  const value = useMemo(
    () => ({ token: null, user, login, logout, refresh }),
    [user]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
