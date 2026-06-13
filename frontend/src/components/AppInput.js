import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

export default function AppInput({ label, error, style, ...props }) {
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor="#999999"
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666666',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e6e1da',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#222222',
  },
  inputError: {
    borderColor: '#ba1a1a',
  },
  errorText: {
    color: '#ba1a1a',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
});
