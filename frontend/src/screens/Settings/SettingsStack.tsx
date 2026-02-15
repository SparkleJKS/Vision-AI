import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ScreenNames } from '../../configs/navigation';
import type { ISettingsStackParamList } from '../screens.types';
import { SettingsListScreen } from './SettingsListScreen';
import {
  ProfileScreen,
  VoiceAndAudioScreen,
  VisionSettingsScreen,
  ConnectedDevicesScreen,
  AccessibilityScreen,
} from './screens';

const Stack = createNativeStackNavigator<ISettingsStackParamList>();

export function SettingsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name={ScreenNames.SettingsList} component={SettingsListScreen} />
      <Stack.Screen name={ScreenNames.Profile} component={ProfileScreen} />
      <Stack.Screen name={ScreenNames.VoiceAndAudio} component={VoiceAndAudioScreen} />
      <Stack.Screen name={ScreenNames.VisionSettings} component={VisionSettingsScreen} />
      <Stack.Screen name={ScreenNames.ConnectedDevices} component={ConnectedDevicesScreen} />
      <Stack.Screen name={ScreenNames.Accessibility} component={AccessibilityScreen} />
    </Stack.Navigator>
  );
}
