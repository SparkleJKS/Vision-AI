import Toast from 'react-native-toast-message';

const bottomDefaults = {
  position: 'bottom' as const,
  visibilityTime: 3500,
};

export const showToast = {
  success: (text1: string, text2?: string) =>
    Toast.show({
      type: 'success',
      text1,
      text2,
      ...bottomDefaults,
    }),

  error: (text1: string, text2?: string) =>
    Toast.show({
      type: 'error',
      text1,
      text2,
      ...bottomDefaults,
      visibilityTime: 4500,
    }),

  info: (text1: string, text2?: string) =>
    Toast.show({
      type: 'info',
      text1,
      text2,
      ...bottomDefaults,
    }),
};
