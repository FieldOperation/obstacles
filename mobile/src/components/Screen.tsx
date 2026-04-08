import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ScrollViewProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme/tokens';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  backgroundColor?: string;
  scrollViewProps?: ScrollViewProps;
}

export function Screen({
  children,
  scroll = false,
  padded = true,
  backgroundColor = colors.bg,
  scrollViewProps,
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  const content = (
    <View
      style={[
        styles.content,
        padded && { paddingHorizontal: spacing.md, paddingBottom: spacing.lg + insets.bottom },
      ]}
    >
      {children}
    </View>
  );

  if (scroll) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.container, { backgroundColor }]}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingTop: insets.top }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          {...scrollViewProps}
        >
          {content}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor, paddingTop: insets.top }]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
});
