import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radii, typography, shadows } from '../theme/tokens';

interface ActionCardProps {
  title: string;
  subtitle?: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function ActionCard({ title, subtitle, onPress, style, accessibilityLabel }: ActionCardProps) {
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
      style={({ pressed }) => [pressed && styles.pressed]}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole="button"
      accessibilityHint={subtitle}
    >
      <Animated.View style={[styles.card, animatedStyle, style]}>
        <Text style={styles.title} maxFontSizeMultiplier={1.3}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>
            {subtitle}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  pressed: {
    opacity: 0.95,
  },
  title: {
    ...typography.titleMedium,
    color: colors.text,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
