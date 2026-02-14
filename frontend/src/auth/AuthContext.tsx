import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { AUTH_CONFIG } from '../configs/auth';

type User = FirebaseAuthTypes.User;

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  /** False when Firebase auth fails to initialize - app shows main UI without auth */
  authAvailable: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authAvailable, setAuthAvailable] = useState<boolean> (false);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      const auth = require('@react-native-firebase/auth').default;
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');

      if (AUTH_CONFIG.GOOGLE_WEB_CLIENT_ID) {
        GoogleSignin.configure({
          webClientId: AUTH_CONFIG.GOOGLE_WEB_CLIENT_ID,
        });
      }

      setAuthAvailable(true);
      unsubscribe = auth().onAuthStateChanged((u: User | null) => {
        setUser(u);
        setLoading(false);
      });
    } catch {
      // Firebase auth not available - skip auth, show app
      setAuthAvailable(false);
      setUser(null);
      setLoading(false);
    }
    return () => unsubscribe?.();
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    try {
      const auth = require('@react-native-firebase/auth').default;
      await auth().signInWithEmailAndPassword(email, password);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Sign in failed';
      setAuthError(msg);
      throw e;
    }
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    try {
      const auth = require('@react-native-firebase/auth').default;
      await auth().createUserWithEmailAndPassword(email, password);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Sign up failed';
      setAuthError(msg);
      throw e;
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      const auth = require('@react-native-firebase/auth').default;
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');

      if (!AUTH_CONFIG.GOOGLE_WEB_CLIENT_ID) {
        throw new Error('Google Web Client ID not configured. See configs/auth.ts');
      }

      await GoogleSignin.hasPlayServices();
      const { idToken } = await GoogleSignin.signIn();
      if (!idToken) {
        throw new Error('Google Sign-In was cancelled');
      }
      const credential = auth.GoogleAuthProvider.credential(idToken);
      await auth().signInWithCredential(credential);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Google sign in failed';
      setAuthError(msg);
      throw e;
    }
  }, []);

  const signOut = useCallback(async () => {
    setAuthError(null);
    try {
      const auth = require('@react-native-firebase/auth').default;
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      await GoogleSignin.signOut();
      await auth().signOut();
    } catch {
      // Best-effort sign out
    }
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    authAvailable,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    authError,
    clearAuthError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
