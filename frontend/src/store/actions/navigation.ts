import { createAction } from '@reduxjs/toolkit';
import { ScreenNames } from '@/configs/navigation';

const NAV_PREFIX = 'navigation/';

export const navigationActions = {
  toBack: createAction(`${NAV_PREFIX}back`),
  toSignIn: createAction(`${NAV_PREFIX}${ScreenNames.SignIn}`),
  toSignUp: createAction(`${NAV_PREFIX}${ScreenNames.SignUp}`),
  toHome: createAction(`${NAV_PREFIX}${ScreenNames.Home}`),
  toExplore: createAction(`${NAV_PREFIX}${ScreenNames.Explore}`),
  toVoice: createAction(`${NAV_PREFIX}${ScreenNames.Voice}`),
  toAlerts: createAction(`${NAV_PREFIX}${ScreenNames.Alerts}`),
  toSettings: createAction<Record<string, unknown> | undefined>(
    `${NAV_PREFIX}${ScreenNames.Settings}`,
  ),
  toSettingsList: createAction(`${NAV_PREFIX}${ScreenNames.SettingsList}`),
  toProfile: createAction<Record<string, unknown> | undefined>(
    `${NAV_PREFIX}${ScreenNames.Profile}`,
  ),
  toVoiceAndAudio: createAction(`${NAV_PREFIX}${ScreenNames.VoiceAndAudio}`),
  toVisionSettings: createAction(`${NAV_PREFIX}${ScreenNames.VisionSettings}`),
  toConnectedDevices: createAction(`${NAV_PREFIX}${ScreenNames.ConnectedDevices}`),
  toAccessibility: createAction(`${NAV_PREFIX}${ScreenNames.Accessibility}`),
};
