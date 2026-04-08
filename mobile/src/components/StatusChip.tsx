import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radii, typography } from '../theme/tokens';

type Status = 'OPEN' | 'CLOSED';

interface StatusChipProps {
  status: Status;
  accessibilityLabel?: string;
}

export function StatusChip({ status, accessibilityLabel }: StatusChipProps) {
  const isOpen = status === 'OPEN';
  return (
    <View
      style={[styles.chip, isOpen ? styles.chipOpen : styles.chipClosed]}
      accessible
      accessibilityLabel={accessibilityLabel || `Status: ${status}`}
    >
      <Text
        style={[styles.text, isOpen ? styles.textOpen : styles.textClosed]}
        maxFontSizeMultiplier={1.2}
      >
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  chipOpen: {
    backgroundColor: colors.openBg,
  },
  chipClosed: {
    backgroundColor: colors.closedBg,
  },
  text: {
    ...typography.label,
  },
  textOpen: {
    color: colors.open,
  },
  textClosed: {
    color: colors.closed,
  },
});
