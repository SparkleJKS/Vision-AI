import { Alert, Linking } from 'react-native';
import { Camera } from 'expo-camera';
import type { PermissionResponse } from 'expo-modules-core';

export type CameraPermissionResult = {
  granted: boolean;
  blocked: boolean;
  shouldOpenSettings: boolean;
};

/**
 * Check if camera permission is granted.
 */
export const hasCameraPermission = async (): Promise<boolean> => {
  const response = await Camera.getCameraPermissionsAsync();
  return response.granted;
};

/**
 * Get current camera permission status.
 */
export const getCameraPermissionStatus = async (): Promise<PermissionResponse | null> => {
  return Camera.getCameraPermissionsAsync();
};

/**
 * Request camera permission from the user.
 * Handles all 3 cases:
 * - Allow only while using app (granted)
 * - Ask every time (denied, canAskAgain - we request each time)
 * - Don't allow (blocked - must go to Settings)
 */
export const requestCameraPermission = async (): Promise<CameraPermissionResult> => {
  const status = await Camera.getCameraPermissionsAsync();

  // Already granted
  if (status.granted) {
    return {
      granted: true,
      blocked: false,
      shouldOpenSettings: false,
    };
  }

  // Permanently blocked - must go to Settings
  if (status.canAskAgain === false) {
    return {
      granted: false,
      blocked: true,
      shouldOpenSettings: true,
    };
  }

  // Try to request permission (covers: undetermined, or "ask every time" on Android)
  const requestResult = await Camera.requestCameraPermissionsAsync();

  if (requestResult.granted) {
    return {
      granted: true,
      blocked: false,
      shouldOpenSettings: false,
    };
  }

  // Denied or blocked after request
  return {
    granted: false,
    blocked: requestResult.canAskAgain === false,
    shouldOpenSettings: requestResult.canAskAgain === false,
  };
};

/**
 * Check and request camera permission, handling all cases.
 * Shows alert and opens Settings when permission is blocked.
 * @returns Promise<boolean> - true if permission is granted and user can proceed
 */
export const ensureCameraPermission = async (): Promise<boolean> => {
  const result = await requestCameraPermission();

  if (result.granted) {
    return true;
  }

  // Blocked - show alert to guide user to Settings
  if (result.shouldOpenSettings) {
    return new Promise<boolean>((resolve) => {
      Alert.alert(
        'Camera Access Required',
        'To use live object detection, please allow camera access in Settings.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Open Settings',
            onPress: async () => {
              try {
                await Linking.openSettings();
              } catch (error) {
                console.error('Failed to open settings:', error);
              }
              resolve(false);
            },
          },
        ],
      );
    });
  }

  // Can ask again - permission was denied but we could retry (e.g. "Ask every time" on Android)
  // User dismissed the system dialog - return false, they can tap again
  return false;
};
