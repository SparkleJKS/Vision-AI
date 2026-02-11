import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

export function AlertsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Alerts</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f1117',
  },
  text: { fontSize: 20, color: '#ffffff' },
});
