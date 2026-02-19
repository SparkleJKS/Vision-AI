import firestore from '@react-native-firebase/firestore';
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

function serverTimestamp(): FirebaseTimestamp {
  return firestore.Timestamp.now() as unknown as FirebaseTimestamp;
}

function mergeWithDefaults<T extends object>(defaults: T, partial: Partial<T> | null): T {
  if (!partial) return defaults;
  return { ...defaults, ...partial };
}

export async function getUserDocument(uid: string): Promise<UserDocument | null> {
  const doc = await firestore().collection(USERS_COLLECTION).doc(uid).get();
  if (!doc.exists()) return null;
  return doc.data() as UserDocument;
}

export async function createOrGetUserDocument(uid: string): Promise<UserDocument> {
  const ref = firestore().collection(USERS_COLLECTION).doc(uid);
  const existing = await ref.get();

  if (existing.exists()) {
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
  return newDoc;
}

export async function updateProfile(uid: string, profile: Partial<UserProfile>): Promise<void> {
  const ref = firestore().collection(USERS_COLLECTION).doc(uid);
  const existing = (await ref.get()).data() as UserDocument | undefined;
  const current = existing?.profile ?? {};
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
}

export async function updateSettings(uid: string, settings: Partial<UserSettings>): Promise<void> {
  const ref = firestore().collection(USERS_COLLECTION).doc(uid);
  const existing = (await ref.get()).data() as UserDocument | undefined;
  const current = existing?.settings ?? DEFAULT_USER_SETTINGS;

  const next = {
    voice: mergeWithDefaults(DEFAULT_VOICE_SETTINGS, settings.voice ?? current.voice),
    vision: mergeWithDefaults(DEFAULT_VISION_SETTINGS, settings.vision ?? current.vision),
    accessibility: mergeWithDefaults(
      DEFAULT_ACCESSIBILITY_SETTINGS,
      settings.accessibility ?? current.accessibility,
    ),
    updatedAt: serverTimestamp(),
  };

  await ref.set({ settings: next }, { merge: true });
}

export function subscribeToUserDocument(
  uid: string,
  onData: (doc: UserDocument | null) => void,
): () => void {
  return firestore()
    .collection(USERS_COLLECTION)
    .doc(uid)
    .onSnapshot(
      (snapshot) => {
        if (!snapshot.exists()) {
          onData(null);
          return;
        }
        onData(snapshot.data() as UserDocument);
      },
      (error) => {
        if (__DEV__) {
          console.warn('[Firestore] subscribeToUserDocument error:', error?.message);
        }
        onData(null);
      },
    );
}
