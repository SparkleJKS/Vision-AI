import { useCallback, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Camera } from 'react-native-vision-camera';
import { useFocusEffect } from '@react-navigation/native';
import { ensureCameraPermission, statusToPermission } from '@/permissions';

type PermissionState = {
  granted: boolean;
  canAskAgain: boolean;
} | null;

export function useExplorePermissions() {
  const [permission, setPermission] = useState<PermissionState>(null);

  const refreshPermission = useCallback(() => {
    const status = Camera.getCameraPermissionStatus();
    setPermission(statusToPermission(status));
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshPermission();
    }, [refreshPermission]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        refreshPermission();
      }
    });
    return () => subscription.remove();
  }, [refreshPermission]);

  const handlePermissionButtonPress = useCallback(async () => {
    if (permission?.canAskAgain) {
      const result = await Camera.requestCameraPermission();
      setPermission({ granted: result === 'granted', canAskAgain: result !== 'granted' });
    } else {
      await ensureCameraPermission();
      refreshPermission();
    }
  }, [permission?.canAskAgain, refreshPermission]);

  return { permission, refreshPermission, handlePermissionButtonPress };
}
