import Config from 'react-native-config';

/**
 * Auth configuration.
 *
 * For Google Sign-In: Get the Web client ID from Firebase Console:
 * 1. Project Settings → Your apps → Android app
 * 2. Under "SDK setup and configuration", find "Web client ID" (or add a Web app to get it)
 * 3. Or: Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs → Web client
 *
 * Set GOOGLE_WEB_CLIENT_ID in .env (see .env.example).
 * Format: XXXXX-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
 */
export const AUTH_CONFIG = {
  /** OAuth 2.0 Web Client ID for Google Sign-In. Required for Google auth. */
  GOOGLE_WEB_CLIENT_ID: Config.GOOGLE_WEB_CLIENT_ID ?? '',
} as const;
