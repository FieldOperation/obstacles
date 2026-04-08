import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { spacing, radii, colors } from '../theme/tokens';

export function CaseCardSkeleton() {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1200 }),
      -1,
      true
    );
  }, [progress]);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.4, 0.9]),
  }));

  return (
    <Animated.View style={[styles.card, shimmerStyle]}>
      <View style={[styles.line, styles.lineTitle]} />
      <View style={[styles.line, styles.lineSub]} />
      <View style={[styles.line, styles.lineShort]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.skeleton,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  line: {
    backgroundColor: colors.skeletonHighlight,
    borderRadius: radii.xs,
  },
  lineTitle: {
    height: 18,
    width: '40%',
    marginBottom: spacing.sm,
  },
  lineSub: {
    height: 14,
    width: '80%',
    marginBottom: spacing.xs,
  },
  lineShort: {
    height: 12,
    width: '30%',
  },
});
