import { Alert, Linking } from 'react-native';
import { Camera } from 'react-native-vision-camera';
import type { CameraPermissionStatus } from 'react-native-vision-camera';

export type CameraPermissionResult = {
  granted: boolean;
  blocked: boolean;
  shouldOpenSettings: boolean;
};

/** Map vision-camera status to a permission-like object for UI compatibility */
export function statusToPermission(status: CameraPermissionStatus): {
  granted: boolean;
  canAskAgain: boolean;
} {
  return {
    granted: status === 'granted',
    canAskAgain: status === 'not-determined',
  };
}

/**
 * Check if camera permission is granted.
 */
export const hasCameraPermission = (): boolean => {
  const status = Camera.getCameraPermissionStatus();
  return status === 'granted';
};

/**
 * Get current camera permission status.
 */
export const getCameraPermissionStatus = (): CameraPermissionStatus => {
  return Camera.getCameraPermissionStatus();
};

/**
 * Request camera permission from the user.
 * Handles all 3 cases:
 * - Allow only while using app (granted)
 * - Ask every time (denied, canAskAgain - we request each time)
 * - Don't allow (blocked - must go to Settings)
 */
export const requestCameraPermission = async (): Promise<CameraPermissionResult> => {
  const status = Camera.getCameraPermissionStatus();

  if (status === 'granted') {
    return {
      granted: true,
      blocked: false,
      shouldOpenSettings: false,
    };
  }

  if (status === 'denied' || status === 'restricted') {
    return {
      granted: false,
      blocked: true,
      shouldOpenSettings: true,
    };
  }

  const result = await Camera.requestCameraPermission();

  if (result === 'granted') {
    return {
      granted: true,
      blocked: false,
      shouldOpenSettings: false,
    };
  }

  return {
    granted: false,
    blocked: true,
    shouldOpenSettings: true,
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

  return false;
};
