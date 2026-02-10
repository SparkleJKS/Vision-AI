import React from 'react';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { Tabs } from './Tabs';

const lightTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2563eb',
    background: '#ffffff',
    card: '#ffffff',
    text: '#1e293b',
    border: '#e2e8f0',
    notification: '#2563eb',
  },
};

export function Navigation() {
  return (
    <NavigationContainer theme={lightTheme}>
      <Tabs />
    </NavigationContainer>
  );
}
