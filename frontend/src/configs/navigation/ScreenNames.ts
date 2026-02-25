/**
 * Centralized enum for all screen names in the app.
 * Use these instead of string literals when registering or navigating to screens.
 *
 * To add a new screen:
 * 1. Add the enum entry here
 * 2. Add its params to the relevant param list in `screens/screens.types.ts`
 * 3. Register the screen in the appropriate navigator (Tabs, SettingsStack, etc.)
 */
export enum ScreenNames {
  // ── Auth ───────────────────────────────────────
  SignIn = 'SignIn',
  SignUp = 'SignUp',

  // ── Bottom Tabs ────────────────────────────────
  HomeTabs = 'HomeTabs',
  Home = 'Home',
  Explore = 'Explore',
  ExploreObjectDetection = 'ExploreObjectDetection',
  ExploreOcr = 'ExploreOcr',
  ExploreQrScanner = 'ExploreQrScanner',
  ExploreTts = 'ExploreTts',
  Voice = 'Voice',
  Alerts = 'Alerts',

  // ── Settings Stack ─────────────────────────────
  Settings = 'Settings',
  SettingsList = 'SettingsList',
  Profile = 'Profile',
  VoiceAndAudio = 'VoiceAndAudio',
  VisionSettings = 'VisionSettings',
  ConnectedDevices = 'ConnectedDevices',
  Accessibility = 'Accessibility',
}
