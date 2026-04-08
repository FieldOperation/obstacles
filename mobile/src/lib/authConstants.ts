/**
 * Username-only auth: we store login as email internally (Supabase requires email).
 * Format: username@obstacles.local so users log in with just username + password.
 */
export const AUTH_EMAIL_SUFFIX = '@obstacles.local';

export function usernameToEmail(username: string): string {
  const trimmed = (username || '').trim();
  if (!trimmed) return '';
  return trimmed.includes('@') ? trimmed : trimmed + AUTH_EMAIL_SUFFIX;
}

export function emailToUsername(email: string): string {
  if (!email) return '';
  return email.endsWith(AUTH_EMAIL_SUFFIX)
    ? email.slice(0, -AUTH_EMAIL_SUFFIX.length)
    : email;
}
