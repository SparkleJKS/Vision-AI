import { PermissionsAndroid, Platform } from 'react-native';

export const ensureMicrophonePermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return false;

  const permission = PermissionsAndroid.PERMISSIONS.RECORD_AUDIO;
  const hasPermission = await PermissionsAndroid.check(permission);
  if (hasPermission) return true;

  const result = await PermissionsAndroid.request(permission, {
    title: 'Microphone Permission',
    message:
      'VisionAI needs microphone access to listen for voice commands in Voice Mode.',
    buttonPositive: 'Allow',
    buttonNegative: 'Deny',
  });
  return result === PermissionsAndroid.RESULTS.GRANTED;
};
