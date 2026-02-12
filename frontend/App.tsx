import './global.css';
import React from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MainContainer } from './src/screens/Main';

export default function App() {
  return (
    <SafeAreaProvider>
      <View className="flex-1 bg-screen">
        <MainContainer />
      </View>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
