import React from 'react';
import {
  ActivityIndicator,
  useWindowDimensions,
  View,
  Text,
  StyleSheet,
} from 'react-native';

/**
 * Splash screen shown on app init.
 * Uses text + ActivityIndicator so it works in Expo Go and dev builds.
 * Replace with Lottie (assets/animations/splash-placeholder.json) when using a dev client.
 */
export function Splash() {
  const { width, height } = useWindowDimensions();

  return (
    <View style={[styles.container, { width, height }]}>
      <Text style={styles.title}>VisionAI</Text>
      <ActivityIndicator size="large" color="#2563eb" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 16,
  },
  spinner: {
    marginTop: 8,
  },
});
