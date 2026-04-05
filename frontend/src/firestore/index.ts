export { useUserProfile } from './useUserProfile';
export {
  getUserDocument,
  createOrGetUserDocument,
  updateProfile,
  updateSettings,
  subscribeToUserDocument,
  clearProfileAge,
  clearProfileBloodGroup,
  updateEmergencyContacts,
} from './userProfileService';
export type {
  UserDocument,
  EmergencyContactEntry,
  UserProfile,
  UserSettings,
  VoiceSettings,
  VisionSettings,
  AccessibilitySettings,
  FirebaseTimestamp,
  GenderOption,
  BloodGroupOption,
} from './types';
export {
  DEFAULT_VOICE_SETTINGS,
  DEFAULT_VISION_SETTINGS,
  DEFAULT_ACCESSIBILITY_SETTINGS,
  DEFAULT_USER_SETTINGS,
  GENDER_OPTIONS,
  labelForGender,
  BLOOD_GROUP_OPTIONS,
  labelForBloodGroup,
  MAX_EMERGENCY_CONTACTS,
  normalizeEmergencyContacts,
  emergencyContactsFromStored,
  emergencyContactsDraftFromProfile,
  emergencyContactsEqual,
} from './types';
