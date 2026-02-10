import './global.css';
import React from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MainContainer } from './src/screens/Main';

export default function App() {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
        <MainContainer />
      </View>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
