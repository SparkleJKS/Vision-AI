import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

export function Loader() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>VisionAI</Text>
      <ActivityIndicator size="large" color="#2563eb" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
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
