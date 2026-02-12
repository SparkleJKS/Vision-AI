import { useEffect } from 'react';
import { BackHandler, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

interface UseBackHandlerOptions {
  enabled?: boolean;
  onBack?: () => void;
  showExitPrompt?: boolean;
}

export function useBackHandler({
  enabled = true,
  onBack,
  showExitPrompt = false,
}: UseBackHandlerOptions = {}): void {
  const navigation = useNavigation<NavigationProp<Record<string, object | undefined>>>();

  useEffect(() => {
    if (!enabled) return;

    const backAction = (): boolean => {
      if (onBack) {
        onBack();
        return true;
      }

      if (navigation.canGoBack()) {
        navigation.goBack();
        return true;
      }

      if (showExitPrompt) {
        Alert.alert('Exit App', 'Are you sure you want to exit?', [
          { text: 'Cancel', onPress: () => null, style: 'cancel' },
          { text: 'Exit', onPress: () => BackHandler.exitApp(), style: 'destructive' },
        ]);
        return true;
      }

      return false;
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => subscription.remove();
  }, [enabled, onBack, showExitPrompt, navigation]);
}
