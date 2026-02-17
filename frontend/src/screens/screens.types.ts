/**
 * Central navigation type definitions.
 *
 * Every navigator's param list and typed screen props live here so the
 * whole app shares a single source of truth for route params.
 */
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type {
  CompositeScreenProps,
  NavigatorScreenParams,
} from '@react-navigation/native';
import { ScreenNames } from '@/configs/navigation';

// ── Auth Stack Param List ────────────────────────────────────────────
export type IAuthStackParamList = {
  [ScreenNames.SignIn]: undefined;
  [ScreenNames.SignUp]: undefined;
};

// ── Home Tab Param List ──────────────────────────────────────────────
export type IHomeTabParamList = {
  [ScreenNames.Home]: undefined;
  [ScreenNames.Explore]: undefined;
  [ScreenNames.Voice]: undefined;
  [ScreenNames.Alerts]: undefined;
  [ScreenNames.Settings]: NavigatorScreenParams<ISettingsStackParamList>;
};

// ── Settings Stack Param List ────────────────────────────────────────
export type ISettingsStackParamList = {
  [ScreenNames.SettingsList]: undefined;
  [ScreenNames.Profile]: undefined;
  [ScreenNames.VoiceAndAudio]: undefined;
  [ScreenNames.VisionSettings]: undefined;
  [ScreenNames.ConnectedDevices]: undefined;
  [ScreenNames.Accessibility]: undefined;
};

// ── Screen Props ─────────────────────────────────────────────────────
// Tab screens
export type IHomeScreenProps = BottomTabScreenProps<
  IHomeTabParamList,
  ScreenNames.Home
>;
export type IExploreScreenProps = BottomTabScreenProps<
  IHomeTabParamList,
  ScreenNames.Explore
>;
export type IVoiceScreenProps = BottomTabScreenProps<
  IHomeTabParamList,
  ScreenNames.Voice
>;
export type IAlertsScreenProps = BottomTabScreenProps<
  IHomeTabParamList,
  ScreenNames.Alerts
>;

// Settings stack screens
export type ISettingsListScreenProps = NativeStackScreenProps<
  ISettingsStackParamList,
  ScreenNames.SettingsList
>;
export type IProfileScreenProps = NativeStackScreenProps<
  ISettingsStackParamList,
  ScreenNames.Profile
>;
export type IVoiceAndAudioScreenProps = NativeStackScreenProps<
  ISettingsStackParamList,
  ScreenNames.VoiceAndAudio
>;
export type IVisionSettingsScreenProps = NativeStackScreenProps<
  ISettingsStackParamList,
  ScreenNames.VisionSettings
>;
export type IConnectedDevicesScreenProps = NativeStackScreenProps<
  ISettingsStackParamList,
  ScreenNames.ConnectedDevices
>;
export type IAccessibilityScreenProps = NativeStackScreenProps<
  ISettingsStackParamList,
  ScreenNames.Accessibility
>;

// ── Composite props (for navigating between navigators) ──────────────
export type ISettingsScreenCompositeProps = CompositeScreenProps<
  NativeStackScreenProps<ISettingsStackParamList>,
  BottomTabScreenProps<IHomeTabParamList>
>;
