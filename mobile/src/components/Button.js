import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function Button({ title, onPress, loading, variant = 'primary', style }) {
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      style={[styles.base, isPrimary ? styles.primary : styles.secondary, style]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#fff' : '#4F46E5'} />
      ) : (
        <Text style={[styles.text, !isPrimary && styles.textSecondary]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: '#4F46E5' },
  secondary: { backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#4F46E5' },
  text: { color: '#fff', fontWeight: '600', fontSize: 16 },
  textSecondary: { color: '#4F46E5' },
});
