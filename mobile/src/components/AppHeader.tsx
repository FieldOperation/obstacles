import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../theme/tokens';

const CONTRACTOR_LOGO = require('../../assets/contractor-logo.png');
const OWNER_LOGO = require('../../assets/owner-logo.jpg');

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  leftAction?: { icon?: 'back'; onPress: () => void };
  rightAction?: { label?: string; icon?: string; onPress: () => void };
  logos?: { contractor?: string; owner?: string };
}

export function AppHeader({ title, subtitle, leftAction, rightAction, logos }: AppHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.headerWrap, { paddingTop: insets.top + spacing.md }]}>
      <LinearGradient
        colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.header}>
        <View style={styles.logosRow}>
          <Image
            source={logos?.contractor ? { uri: logos.contractor } : CONTRACTOR_LOGO}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Contractor logo"
          />
          <Image
            source={logos?.owner ? { uri: logos.owner } : OWNER_LOGO}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Owner logo"
          />
        </View>

        {title && (
          <View style={styles.titleRow}>
            {leftAction && (
              <TouchableOpacity
                onPress={leftAction.onPress}
                style={styles.leftAction}
                accessibilityLabel="Go back"
                accessibilityRole="button"
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
              </TouchableOpacity>
            )}
            <View style={styles.titleBlock}>
              <Text style={styles.title} maxFontSizeMultiplier={1.3}>
                {title}
              </Text>
              {subtitle && (
                <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>
                  {subtitle}
                </Text>
              )}
            </View>
            {rightAction && (
              <TouchableOpacity
                onPress={rightAction.onPress}
                style={styles.rightAction}
                accessibilityLabel={rightAction.label || 'Filter'}
                accessibilityRole="button"
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                activeOpacity={0.8}
              >
                {rightAction.icon ? (
                  <Ionicons
                    name={(rightAction.icon as any) || 'options'}
                    size={22}
                    color={colors.textInverse}
                  />
                ) : rightAction.label ? (
                  <Text style={styles.rightActionText}>{rightAction.label}</Text>
                ) : null}
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    overflow: 'hidden',
  },
  header: {
    borderRadius: radii.lg,
  },
  logosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logo: {
    height: 40,
    width: 100,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    ...typography.titleLarge,
    color: colors.textInverse,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: 'rgba(255,255,255,0.9)',
    marginTop: spacing.xs,
  },
  leftAction: {
    marginRight: spacing.sm,
    padding: spacing.xs,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
  },
  rightAction: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  rightActionText: {
    ...typography.bodyMedium,
    color: colors.textInverse,
    fontWeight: '600',
  },
});
