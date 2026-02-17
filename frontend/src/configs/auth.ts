import Config from 'react-native-config';

/**
 * Auth configuration for Firebase Authentication.
 * GOOGLE_WEB_CLIENT_ID — OAuth 2.0 Web client ID used for Google Sign-In.
 * When empty, Google auth is disabled and only email/password sign-in is available.
 */
export const AUTH_CONFIG = {
  GOOGLE_WEB_CLIENT_ID: Config.GOOGLE_WEB_CLIENT_ID ?? '',
} as const;
