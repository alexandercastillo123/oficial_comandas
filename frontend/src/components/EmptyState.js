import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function EmptyState({ message, icon = '🍽️' }) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: 'transparent',
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  message: {
    fontSize: 14,
    fontWeight: '700',
    color: '#888888',
    textAlign: 'center',
    lineHeight: 20,
  },
});
