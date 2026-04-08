import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

/** Expo push token requires a project ID (EAS project or Expo Go project) */
function getExpoProjectId(): string | undefined {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? process.env.EXPO_PUBLIC_PROJECT_ID;
  return typeof projectId === 'string' ? projectId : undefined;
}

/** Configure how notifications appear when app is in foreground */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request permission and register for push notifications.
 * Returns the Expo push token or null if denied/unsupported.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  try {
    const projectId = getExpoProjectId();
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    return tokenData.data;
  } catch (e) {
    console.warn('Push token error:', e);
    return null;
  }
}

/**
 * Save push token to Supabase for the current user.
 */
export async function savePushToken(token: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from('push_tokens').upsert(
    {
      user_id: user.id,
      expo_push_token: token,
      device_id: Platform.OS,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );
  if (error) console.warn('Save push token failed:', error.message);
}

/**
 * Register for push and save token. Call on login.
 */
export async function registerPushToken(): Promise<void> {
  const token = await registerForPushNotifications();
  if (token) await savePushToken(token);
}
