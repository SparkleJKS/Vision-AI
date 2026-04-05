import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { error as logError } from '@/utils/logger';
import {
  createOrGetUserDocument,
  subscribeToUserDocument,
  updateProfile,
  updateSettings,
  clearProfileAge,
} from './userProfileService';
import type {
  UserDocument,
  UserProfile,
  UserSettings,
  VoiceSettings,
  VisionSettings,
  AccessibilitySettings,
} from './types';
import { DEFAULT_USER_SETTINGS } from './types';

export const useUserProfile = () => {
  const { user } = useAuth();
  const [doc, setDoc] = useState<UserDocument | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setDoc(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    createOrGetUserDocument(user.uid)
      .then(initial => {
        setDoc(initial);
      })
      .catch(err => {
        logError('Firestore:useUserProfile bootstrap', {
          uid: user.uid,
          message: String(err?.message ?? err),
        });
        setError(err?.message ?? 'Failed to load profile');
        setDoc(null);
      })
      .finally(() => {
        setLoading(false);
      });

    const unsubscribe = subscribeToUserDocument(user.uid, data => {
      if (data) setDoc(data);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const updateProfileFields = useCallback(
    async (profile: Partial<UserProfile>) => {
      if (!user?.uid) return;
      await updateProfile(user.uid, profile);
    },
    [user?.uid],
  );

  const removeProfileAge = useCallback(async () => {
    if (!user?.uid) return;
    await clearProfileAge(user.uid);
  }, [user?.uid]);

  const updateUserSettings = useCallback(
    async (settings: Partial<UserSettings>) => {
      if (!user?.uid) return;
      await updateSettings(user.uid, settings);
    },
    [user?.uid],
  );

  const profile = doc?.profile ?? null;
  const settings = doc?.settings ?? DEFAULT_USER_SETTINGS;

  return {
    profile,
    settings,
    loading,
    error,
    updateProfile: updateProfileFields,
    removeProfileAge,
    updateSettings: updateUserSettings,
  };
};

export type {
  UserDocument,
  UserProfile,
  UserSettings,
  VoiceSettings,
  VisionSettings,
  AccessibilitySettings,
};
