import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii } from '../theme/tokens';

interface PhotoThumbnailProps {
  uri: string;
  onRemove: () => void;
  index: number;
}

export function PhotoThumbnail({ uri, onRemove, index }: PhotoThumbnailProps) {
  return (
    <View style={styles.wrapper}>
      <Image source={{ uri }} style={styles.image} resizeMode="cover" />
      <TouchableOpacity
        onPress={onRemove}
        style={styles.remove}
        accessibilityLabel={`Remove photo ${index + 1}`}
        accessibilityRole="button"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="close-circle" size={24} color={colors.danger} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: radii.sm,
  },
  remove: {
    position: 'absolute',
    top: -6,
    right: -6,
  },
});
