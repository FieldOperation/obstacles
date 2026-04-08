import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, radii } from '../theme/tokens';

interface EmptyStateProps {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
}

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
  icon = 'document-text-outline',
}: EmptyStateProps) {
  const handleAction = () => {
    if (onAction) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onAction();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={48} color={colors.textMuted} />
      </View>
      <Text style={styles.title} maxFontSizeMultiplier={1.3}>
        {title}
      </Text>
      {message && (
        <Text style={styles.message} maxFontSizeMultiplier={1.3}>
          {message}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button
          mode="contained"
          onPress={handleAction}
          style={styles.button}
          contentStyle={styles.buttonContent}
          accessibilityLabel={actionLabel}
        >
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: radii.full,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.titleMedium,
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  button: {
    marginTop: spacing.lg,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
});
