/**
 * Firestore document types for user profile and settings.
 * Stored at: users/{uid}
 */

export interface UserProfile {
  displayName?: string;
  photoURL?: string;
  updatedAt: FirebaseTimestamp;
}

export interface VoiceSettings {
  speed: number; // 0.5 - 2.0
  pitch: number; // 0.5 - 2.0
}

export interface VisionSettings {
  contrast: number; // 0 - 100
  detectionSensitivity: number; // 0 - 100
}

export interface AccessibilitySettings {
  hapticsEnabled: boolean;
  reduceMotion: boolean;
}

export interface UserSettings {
  voice: VoiceSettings;
  vision: VisionSettings;
  accessibility: AccessibilitySettings;
  updatedAt: FirebaseTimestamp;
}

export interface UserDocument {
  profile: UserProfile;
  settings: UserSettings;
  createdAt: FirebaseTimestamp;
}

export type FirebaseTimestamp = { seconds: number; nanoseconds: number };

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  speed: 1,
  pitch: 1,
};

export const DEFAULT_VISION_SETTINGS: VisionSettings = {
  contrast: 50,
  detectionSensitivity: 50,
};

export const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  hapticsEnabled: true,
  reduceMotion: false,
};

export const DEFAULT_USER_SETTINGS: UserSettings = {
  voice: DEFAULT_VOICE_SETTINGS,
  vision: DEFAULT_VISION_SETTINGS,
  accessibility: DEFAULT_ACCESSIBILITY_SETTINGS,
  updatedAt: { seconds: 0, nanoseconds: 0 },
};
