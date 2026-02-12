import { useCallback, useEffect, useState } from 'react';
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
