/**
 * API Configuration
 * 
 * In development, uses relative paths (proxied by Vite)
 * In production, uses VITE_API_BASE_URL environment variable
 */

const getApiBaseUrl = (): string => {
  // In development, use relative path (Vite proxy handles it)
  if (import.meta.env.DEV) {
    return '/api';
  }
  
  // In production, use environment variable
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  if (!apiUrl) {
    console.error(
      '⚠️ VITE_API_BASE_URL not set in production!\n' +
      'Set it in your .env.production file\n' +
      'Example: VITE_API_BASE_URL=https://api.yourdomain.com/api'
    );
    return '/api'; // Fallback (will likely fail)
  }
  return apiUrl;
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Get Socket.IO server URL
 */
export const getSocketUrl = (): string => {
  const apiUrl = API_BASE_URL;
  // Remove /api suffix for Socket.IO
  if (apiUrl.includes('/api')) {
    return apiUrl.replace('/api', '');
  }
  // If it's a full URL, use it directly
  if (apiUrl.startsWith('http')) {
    return apiUrl.replace('/api', '');
  }
  // Default to same origin
  return window.location.origin.replace(':3000', ':3001');
};
