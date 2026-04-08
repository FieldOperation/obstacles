import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, radii, typography, shadows } from '../theme/tokens';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      await login(username, password);
    } catch (error: any) {
      alert(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primaryLight, colors.primary, colors.primaryDark]}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Obstacles CMS</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          <View style={styles.card}>
            <TextInput
              label="Username"
              value={username}
              onChangeText={setUsername}
              mode="outlined"
              keyboardType="default"
              autoCapitalize="none"
              placeholder="e.g. admin"
              style={styles.input}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              textColor={colors.text}
            />
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry
              placeholder="••••••••"
              style={styles.input}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              textColor={colors.text}
            />
            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={[styles.button, shadows.button]}
              contentStyle={styles.buttonContent}
            >
              Sign In
            </Button>
            <Text style={styles.hint} maxFontSizeMultiplier={1.3}>
              Use the same username you use on the web app
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  title: {
    ...typography.titleLarge,
    textAlign: 'center',
    marginBottom: spacing.sm,
    color: colors.textInverse,
  },
  subtitle: {
    ...typography.bodyMedium,
    textAlign: 'center',
    marginBottom: spacing.xl,
    color: 'rgba(255,255,255,0.9)',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    ...shadows.modal,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  button: {
    marginTop: spacing.sm,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
  hint: {
    ...typography.caption,
    marginTop: spacing.md,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
