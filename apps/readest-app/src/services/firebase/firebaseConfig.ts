import type { FirebaseOptions } from 'firebase/app';

export interface FirebasePublicEnvironment {
  NEXT_PUBLIC_FIREBASE_API_KEY?: string;
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?: string;
  NEXT_PUBLIC_FIREBASE_PROJECT_ID?: string;
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?: string;
  NEXT_PUBLIC_FIREBASE_APP_ID?: string;
}

const publicEnvironment = (): FirebasePublicEnvironment => ({
  // @ts-expect-error Next.js requires direct property access to inline public environment values.
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  // @ts-expect-error Next.js requires direct property access to inline public environment values.
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  // @ts-expect-error Next.js requires direct property access to inline public environment values.
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // @ts-expect-error Next.js requires direct property access to inline public environment values.
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  // @ts-expect-error Next.js requires direct property access to inline public environment values.
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});

export const readFirebaseConfig = (
  environment: FirebasePublicEnvironment = publicEnvironment(),
): FirebaseOptions | null => {
  const config: FirebaseOptions = {
    apiKey: environment.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: environment.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: environment.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    messagingSenderId: environment.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: environment.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  return Object.values(config).every((value) => typeof value === 'string' && value.length > 0)
    ? config
    : null;
};
