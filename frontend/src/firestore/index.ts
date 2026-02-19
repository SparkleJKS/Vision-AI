export { useUserProfile } from './useUserProfile';
export {
  getUserDocument,
  createOrGetUserDocument,
  updateProfile,
  updateSettings,
  subscribeToUserDocument,
} from './userProfileService';
export type {
  UserDocument,
  UserProfile,
  UserSettings,
  VoiceSettings,
  VisionSettings,
  AccessibilitySettings,
  FirebaseTimestamp,
} from './types';
export {
  DEFAULT_VOICE_SETTINGS,
  DEFAULT_VISION_SETTINGS,
  DEFAULT_ACCESSIBILITY_SETTINGS,
  DEFAULT_USER_SETTINGS,
} from './types';
