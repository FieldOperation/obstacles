import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../theme/tokens';

type LocationState = 'loading' | 'success' | 'error';

interface LocationRowProps {
  state: LocationState;
  coords?: { lat: number; lng: number };
  onRetry?: () => void;
}

export function LocationRow({ state, coords, onRetry }: LocationRowProps) {
  return (
    <View style={styles.container}>
      {state === 'loading' && (
        <>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.text} maxFontSizeMultiplier={1.3}>
            Getting location…
          </Text>
        </>
      )}
      {state === 'success' && coords && (
        <>
          <Ionicons name="location" size={20} color={colors.success} />
          <Text style={styles.text} maxFontSizeMultiplier={1.3}>
            {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
          </Text>
        </>
      )}
      {state === 'error' && (
        <>
          <Ionicons name="warning" size={20} color={colors.danger} />
          <Text style={styles.textMuted} maxFontSizeMultiplier={1.3}>
            Location unavailable
          </Text>
          {onRetry && (
            <TouchableOpacity
              onPress={onRetry}
              style={styles.retry}
              accessibilityLabel="Retry getting location"
              accessibilityRole="button"
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.bg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    ...typography.bodyMedium,
    color: colors.text,
    flex: 1,
  },
  textMuted: {
    ...typography.bodyMedium,
    color: colors.textMuted,
    flex: 1,
  },
  retry: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  retryText: {
    ...typography.label,
    color: colors.primary,
  },
});
