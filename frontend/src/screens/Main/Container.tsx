import { useCallback, useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { Splash } from '@/screens/Splash';
import { Navigation } from './Navigation';
import { AuthStack } from '@/screens/Auth/AuthStack';
import { useAuth } from '@/auth/AuthContext';
import { navigationRef } from '@/navigators';
import { colors } from '@/theme/colors';
import { logEvent } from '@/utils/logger';

const SPLASH_DURATION_MS = 6_300;

const darkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.accentYellow,
    background: colors.screenBg,
    card: colors.cardBg,
    text: colors.white,
    border: colors.border,
    notification: colors.accentYellow,
  },
};

export function MainContainer() {
  const [isSplashVisible, setIsSplashVisible] = useState<boolean>(true);
  const { user, loading, authAvailable } = useAuth();

  const onNavStateChange = useCallback(() => {
    const route = navigationRef.getCurrentRoute();
    if (route?.name) {
      logEvent('Navigation:ScreenFocus', { screen: route.name, params: route.params });
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setIsSplashVisible(false);
    }, SPLASH_DURATION_MS);
    return () => clearTimeout(t);
  }, []);

  if (isSplashVisible) {
    return <Splash />;
  }

  if (loading) {
    return (
      <View className="flex-1 bg-screen items-center justify-center">
        <ActivityIndicator size="large" color={colors.accentYellow} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} theme={darkTheme} onStateChange={onNavStateChange}>
      {user || !authAvailable ? <Navigation /> : <AuthStack />}
    </NavigationContainer>
  );
}
