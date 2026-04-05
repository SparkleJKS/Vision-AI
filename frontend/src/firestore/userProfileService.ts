import firestore from '@react-native-firebase/firestore';
import { error, logFirestore, serializeForLog } from '@/utils/logger';
import type {
  UserDocument,
  UserProfile,
  UserSettings,
  FirebaseTimestamp,
} from './types';
import {
  DEFAULT_USER_SETTINGS,
  DEFAULT_VOICE_SETTINGS,
  DEFAULT_VISION_SETTINGS,
  DEFAULT_ACCESSIBILITY_SETTINGS,
} from './types';

const USERS_COLLECTION = 'users';

const userDocPath = (uid: string) => `${USERS_COLLECTION}/${uid}`;

const serverTimestamp = (): FirebaseTimestamp => {
  return firestore.Timestamp.now() as unknown as FirebaseTimestamp;
};

const mergeWithDefaults = <T extends object>(
  defaults: T,
  partial: Partial<T> | null,
): T => {
  if (!partial) return defaults;
  return { ...defaults, ...partial };
};

export const getUserDocument = async (
  uid: string,
): Promise<UserDocument | null> => {
  const path = userDocPath(uid);
  try {
    const doc = await firestore().collection(USERS_COLLECTION).doc(uid).get();
    const exists = doc.exists();
    logFirestore('get', path, { exists });
    if (!exists) return null;
    return doc.data() as UserDocument;
  } catch (e) {
    error('Firestore:getUserDocument', { path, message: String(e) });
    throw e;
  }
};

export const createOrGetUserDocument = async (
  uid: string,
): Promise<UserDocument> => {
  const path = userDocPath(uid);
  try {
    const ref = firestore().collection(USERS_COLLECTION).doc(uid);
    const existing = await ref.get();

    if (existing.exists()) {
      logFirestore('get', path, { branch: 'createOrGet_existing' });
      const data = existing.data() as UserDocument;
      return {
        profile: data.profile ?? { updatedAt: serverTimestamp() },
        settings: mergeWithDefaults(DEFAULT_USER_SETTINGS, data.settings),
        createdAt: data.createdAt ?? serverTimestamp(),
      };
    }

    const now = serverTimestamp();
    const newDoc: UserDocument = {
      profile: { updatedAt: now },
      settings: {
        ...DEFAULT_USER_SETTINGS,
        updatedAt: now,
      },
      createdAt: now,
    };

    await ref.set(newDoc);
    logFirestore('create', path, {
      keys: ['profile', 'settings', 'createdAt'],
    });
    return newDoc;
  } catch (e) {
    error('Firestore:createOrGetUserDocument', { path, message: String(e) });
    throw e;
  }
};

export const updateProfile = async (
  uid: string,
  profile: Partial<UserProfile>,
): Promise<void> => {
  const path = userDocPath(uid);
  try {
    const ref = firestore().collection(USERS_COLLECTION).doc(uid);
    const existing = (await ref.get()).data() as UserDocument | undefined;
    const current: Partial<UserProfile> = existing?.profile ?? {};
    await ref.set(
      {
        profile: {
          ...current,
          ...profile,
          updatedAt: serverTimestamp(),
        },
      },
      { merge: true },
    );
    const profileKeys = Object.keys(profile).filter(k => k !== 'updatedAt');
    const changes: Record<string, { before: unknown; after: unknown }> = {};
    for (const k of profileKeys) {
      const key = k as keyof UserProfile;
      changes[k] = {
        before: serializeForLog(current[key]),
        after: serializeForLog(profile[key]),
      };
    }
    logFirestore('set_merge', path, {
      target: 'profile',
      keys: profileKeys,
      changes,
    });
  } catch (e) {
    error('Firestore:updateProfile', { path, message: String(e) });
    throw e;
  }
};

/** Removes `profile.age` from the user document (e.g. user cleared the field). */
export const clearProfileAge = async (uid: string): Promise<void> => {
  const path = userDocPath(uid);
  try {
    const snap = await firestore().collection(USERS_COLLECTION).doc(uid).get();
    const beforeAge = (snap.data() as UserDocument | undefined)?.profile?.age;
    await firestore().collection(USERS_COLLECTION).doc(uid).update({
      'profile.age': firestore.FieldValue.delete(),
      'profile.updatedAt': firestore.Timestamp.now(),
    });
    logFirestore('delete_field', path, {
      field: 'profile.age',
      changes: {
        age: { before: serializeForLog(beforeAge), after: null },
      },
    });
  } catch (e) {
    error('Firestore:clearProfileAge', { path, message: String(e) });
    throw e;
  }
};

export const updateSettings = async (
  uid: string,
  settings: Partial<UserSettings>,
): Promise<void> => {
  const path = userDocPath(uid);
  try {
    const ref = firestore().collection(USERS_COLLECTION).doc(uid);
    const existing = (await ref.get()).data() as UserDocument | undefined;
    const current = existing?.settings ?? DEFAULT_USER_SETTINGS;

    const next = {
      voice: mergeWithDefaults(
        DEFAULT_VOICE_SETTINGS,
        settings.voice ?? current.voice,
      ),
      vision: mergeWithDefaults(
        DEFAULT_VISION_SETTINGS,
        settings.vision ?? current.vision,
      ),
      accessibility: mergeWithDefaults(
        DEFAULT_ACCESSIBILITY_SETTINGS,
        settings.accessibility ?? current.accessibility,
      ),
      updatedAt: serverTimestamp(),
    };

    await ref.set({ settings: next }, { merge: true });
    const touched: string[] = [];
    if (settings.voice !== undefined) touched.push('voice');
    if (settings.vision !== undefined) touched.push('vision');
    if (settings.accessibility !== undefined) touched.push('accessibility');
    const changes: Record<string, { before: unknown; after: unknown }> = {};
    if (settings.voice !== undefined) {
      changes.voice = {
        before: serializeForLog(current.voice),
        after: serializeForLog(next.voice),
      };
    }
    if (settings.vision !== undefined) {
      changes.vision = {
        before: serializeForLog(current.vision),
        after: serializeForLog(next.vision),
      };
    }
    if (settings.accessibility !== undefined) {
      changes.accessibility = {
        before: serializeForLog(current.accessibility),
        after: serializeForLog(next.accessibility),
      };
    }
    if (Object.keys(changes).length === 0) {
      changes.updatedAt = {
        before: serializeForLog(current.updatedAt),
        after: serializeForLog(next.updatedAt),
      };
    }
    logFirestore('set_merge', path, {
      target: 'settings',
      sections: touched.length > 0 ? touched : ['full_settings_merge'],
      changes,
    });
  } catch (e) {
    error('Firestore:updateSettings', { path, message: String(e) });
    throw e;
  }
};

export const subscribeToUserDocument = (
  uid: string,
  onData: (doc: UserDocument | null) => void,
): (() => void) => {
  const path = userDocPath(uid);
  logFirestore('listen_start', path, {});

  return firestore()
    .collection(USERS_COLLECTION)
    .doc(uid)
    .onSnapshot(
      snapshot => {
        if (!snapshot.exists()) {
          onData(null);
          return;
        }
        onData(snapshot.data() as UserDocument);
      },
      err => {
        logFirestore('listen_error', path, { message: err?.message });
        if (__DEV__) {
          console.warn(
            '[Firestore] subscribeToUserDocument error:',
            err?.message,
          );
        }
        onData(null);
      },
    );
};
