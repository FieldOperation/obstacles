import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { StatusChip } from './StatusChip';
import { formatCaseNumber } from '../lib/caseNumber';
import { colors, spacing, radii, typography, shadows } from '../theme/tokens';

interface CaseCardProps {
  id: string;
  type: string;
  status: 'OPEN' | 'CLOSED';
  zoneName?: string;
  roadName?: string;
  caseNumber?: number | null;
  createdAt: string;
  onPress: () => void;
}

export function CaseCard({
  id,
  type,
  status,
  zoneName,
  roadName,
  caseNumber,
  createdAt,
  onPress,
}: CaseCardProps) {
  const location = [zoneName, roadName].filter(Boolean).join(' · ') || '—';
  const dateStr = format(new Date(createdAt), 'MMM dd, yyyy');
  const displayId = formatCaseNumber(caseNumber, id);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: 100 });
  };
  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150 });
  };
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityLabel={`${displayId} ${type} case in ${location}, ${status}, ${dateStr}`}
      accessibilityRole="button"
    >
      <Animated.View style={[styles.card, animatedStyle]}>
        <View style={styles.header}>
          <Text style={styles.type} maxFontSizeMultiplier={1.2}>
            {displayId} · {type}
          </Text>
          <StatusChip status={status} />
        </View>
        <Text style={styles.location} maxFontSizeMultiplier={1.3} numberOfLines={2}>
          {location}
        </Text>
        <Text style={styles.date} maxFontSizeMultiplier={1.3}>
          {dateStr}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  type: {
    ...typography.titleSmall,
    color: colors.text,
    flex: 1,
  },
  location: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  date: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
