import { call, takeLatest } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { ScreenNames } from '@/configs/navigation';
import { getNavigationRef, navigate } from '@/navigators';
import { navigationActions } from '../actions/navigation';

type NavPayload = { name: string; params?: Record<string, unknown> };

const getNavigationPayload = (action: PayloadAction<unknown>): NavPayload | null => {
  let navigationPayload: NavPayload | null = null;
  const payload = action.payload as Record<string, unknown> | undefined;

  switch (action.type) {
    case navigationActions.toSignIn.type:
      navigationPayload = { name: ScreenNames.SignIn };
      break;
    case navigationActions.toSignUp.type:
      navigationPayload = { name: ScreenNames.SignUp };
      break;
    case navigationActions.toHome.type:
      navigationPayload = { name: ScreenNames.Home };
      break;
    case navigationActions.toExplore.type:
      navigationPayload = { name: ScreenNames.Explore };
      break;
    case navigationActions.toVoice.type:
      navigationPayload = { name: ScreenNames.Voice };
      break;
    case navigationActions.toAlerts.type:
      navigationPayload = { name: ScreenNames.Alerts };
      break;
    case navigationActions.toSettings.type:
      navigationPayload = {
        name: ScreenNames.Settings,
        params: payload ?? undefined,
      };
      break;
    case navigationActions.toSettingsList.type:
      navigationPayload = { name: ScreenNames.Settings, params: { screen: ScreenNames.SettingsList } };
      break;
    case navigationActions.toProfile.type:
      navigationPayload = {
        name: ScreenNames.Settings,
        params: {
          screen: ScreenNames.Profile,
          params: payload ?? undefined,
        },
      };
      break;
    case navigationActions.toVoiceAndAudio.type:
      navigationPayload = {
        name: ScreenNames.Settings,
        params: { screen: ScreenNames.VoiceAndAudio },
      };
      break;
    case navigationActions.toVisionSettings.type:
      navigationPayload = {
        name: ScreenNames.Settings,
        params: { screen: ScreenNames.VisionSettings },
      };
      break;
    case navigationActions.toConnectedDevices.type:
      navigationPayload = {
        name: ScreenNames.Settings,
        params: { screen: ScreenNames.ConnectedDevices },
      };
      break;
    case navigationActions.toAccessibility.type:
      navigationPayload = {
        name: ScreenNames.Settings,
        params: { screen: ScreenNames.Accessibility },
      };
      break;
    default:
      break;
  }

  return navigationPayload;
}

function* onNavigate(action: PayloadAction<unknown>) {
  const payload = getNavigationPayload(action);
  if (payload) {
    yield call(navigate, payload);
  }
}

function* onBack() {
  const ref = getNavigationRef();
  if (ref?.canGoBack()) {
    ref.goBack();
  } else {
    yield call(navigate, { name: ScreenNames.Home });
  }
}

const NAV_ACTION_REGEX = /^navigation\//;

const navActionMatcher = (action: { type: string }) =>
  action.type !== navigationActions.toBack.type && NAV_ACTION_REGEX.test(action.type);

export default [
  takeLatest(navActionMatcher, onNavigate),
  takeLatest(navigationActions.toBack.type, onBack),
];
