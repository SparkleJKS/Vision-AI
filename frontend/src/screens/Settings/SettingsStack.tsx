import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsListScreen } from './SettingsListScreen';
import { ProfileScreen } from './ProfileScreen';

export type SettingsStackParamList = {
  SettingsList: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="SettingsList" component={SettingsListScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}
