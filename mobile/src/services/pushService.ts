import { supabase } from '../lib/supabase';

export interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Send push notifications via Expo Push API.
 * Call after case create/close to notify OTHERS users.
 */
export async function sendPushNotifications(messages: PushMessage[]): Promise<void> {
  if (messages.length === 0) return;

  const payload = messages.map((m) => ({
    to: m.to,
    sound: 'default',
    title: m.title,
    body: m.body,
    data: m.data || {},
  }));

  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.text();
      console.warn('Expo push error:', res.status, err);
    }
  } catch (e) {
    console.warn('Expo push fetch error:', e);
  }
}

/**
 * Get push tokens for users with role OTHERS (to notify on new cases).
 */
export async function getOthersUserPushTokens(): Promise<string[]> {
  const { data: others } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'OTHERS');
  if (!others?.length) return [];

  const userIds = others.map((u) => u.id);
  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('expo_push_token')
    .in('user_id', userIds);
  return (tokens || []).map((t) => t.expo_push_token).filter(Boolean);
}
