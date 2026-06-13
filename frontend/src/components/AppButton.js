import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants/colors';

export default function AppButton({ title, onPress, variant = 'primary', loading = false, disabled = false, style }) {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isDestructive = variant === 'destructive';

  const buttonStyle = [
    styles.button,
    isPrimary && styles.primaryBtn,
    isSecondary && styles.secondaryBtn,
    isDestructive && styles.destructiveBtn,
    (disabled || loading) && styles.disabledBtn,
    style
  ];

  const textStyle = [
    styles.text,
    isPrimary && styles.primaryText,
    isSecondary && styles.secondaryText,
    isDestructive && styles.destructiveText,
    disabled && styles.disabledText
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={isSecondary ? COLORS.primary : '#ffffff'} size="small" />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    flexDirection: 'row',
  },
  primaryBtn: {
    backgroundColor: '#745c00',
  },
  secondaryBtn: {
    backgroundColor: '#ffdf9d',
    borderWidth: 1,
    borderColor: '#745c00',
  },
  destructiveBtn: {
    backgroundColor: '#ba1a1a',
  },
  disabledBtn: {
    backgroundColor: '#e6e1da',
    borderColor: '#e6e1da',
  },
  text: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  primaryText: {
    color: '#ffffff',
  },
  secondaryText: {
    color: '#745c00',
  },
  destructiveText: {
    color: '#ffffff',
  },
  disabledText: {
    color: '#999999',
  },
});
