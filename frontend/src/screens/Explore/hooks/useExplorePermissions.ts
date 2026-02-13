import { useCallback, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Camera, useCameraPermissions } from 'expo-camera';
import { useFocusEffect } from '@react-navigation/native';
import { ensureCameraPermission } from '../../../permissions';

export function useExplorePermissions() {
  const [hookPermission, requestPermission] = useCameraPermissions();
  const [permission, setPermission] = useState(hookPermission);

  useEffect(() => {
    setPermission(hookPermission);
  }, [hookPermission]);

  const refreshPermission = useCallback(async () => {
    const result = await Camera.getCameraPermissionsAsync();
    setPermission(result);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshPermission();
    }, [refreshPermission]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        void refreshPermission();
      }
    });
    return () => subscription.remove();
  }, [refreshPermission]);

  const handlePermissionButtonPress = useCallback(async () => {
    if (permission?.canAskAgain) {
      const result = await requestPermission();
      setPermission(result);
    } else {
      await ensureCameraPermission();
    }
  }, [permission?.canAskAgain, requestPermission]);

  return { permission, refreshPermission, handlePermissionButtonPress };
}
