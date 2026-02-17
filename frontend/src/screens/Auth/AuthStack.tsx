import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ScreenNames } from '@/configs/navigation';
import type { IAuthStackParamList } from '@/screens/screens.types';
import { SignInScreen, SignUpScreen } from './index';

const Stack = createNativeStackNavigator<IAuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name={ScreenNames.SignIn} component={SignInScreen} />
      <Stack.Screen name={ScreenNames.SignUp} component={SignUpScreen} />
    </Stack.Navigator>
  );
}
