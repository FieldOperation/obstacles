import { Platform } from 'react-native';

/**
 * Get API base URL based on environment
 * 
 * Development:
 * - Android Emulator: http://10.0.2.2:3001/api
 * - iOS Simulator: http://localhost:3001/api
 * - Physical Device: Use your computer's IP address
 * 
 * Production:
 * - Uses EXPO_PUBLIC_API_URL environment variable (set in app.json or .env)
 * - Falls back to placeholder if not set (will fail - must be configured)
 * 
 * To configure for production:
 * 1. Set EXPO_PUBLIC_API_URL in your .env file
 * 2. Or add to app.json under expo.extra.apiUrl
 */
export const getApiBaseUrl = (): string => {
  // Check for environment variable (set via app.json or .env)
  // @ts-ignore - process.env may have EXPO_PUBLIC_API_URL
  const envApiUrl = process.env.EXPO_PUBLIC_API_URL;
  
  if (__DEV__) {
    // Development mode
    if (envApiUrl && !envApiUrl.includes('your-production-api.com')) {
      return envApiUrl;
    }
    
    // Default development URLs
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3001/api'; // Android emulator
    }
    return 'http://localhost:3001/api'; // iOS simulator
  }
  
  // Production mode - must be set via environment variable
  if (!envApiUrl || envApiUrl.includes('your-production-api.com')) {
    console.error(
      '⚠️ PRODUCTION API URL NOT CONFIGURED!\n' +
      'Set EXPO_PUBLIC_API_URL in your .env file or app.json\n' +
      'Example: EXPO_PUBLIC_API_URL=https://api.yourdomain.com/api'
    );
  }
  return envApiUrl || 'https://your-production-api.com/api';
};

/**
 * Get Socket.IO server URL
 */
export const getSocketUrl = (): string => {
  const apiUrl = getApiBaseUrl();
  // Remove /api suffix and protocol for Socket.IO
  if (apiUrl.includes('/api')) {
    return apiUrl.replace('/api', '');
  }
  return apiUrl;
};
