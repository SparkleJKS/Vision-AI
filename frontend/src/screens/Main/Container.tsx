import { useCallback, useEffect, useMemo, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { Splash } from "@/screens/Splash";
import Navigation from "./Navigation";
import AuthStack from "@/screens/Auth/AuthStack";
import { useAuth } from "@/auth/AuthContext";
import { useTheme } from "@/theme/ThemeContext";
import { navigationRef } from "@/navigators";
import { logEvent } from "@/utils/logger";

const SPLASH_DURATION_MS = 6_300;

const MainContainer = () => {
  const [isSplashVisible, setIsSplashVisible] = useState<boolean>(true);
  const { user, loading, authAvailable } = useAuth();
  const { theme } = useTheme();

  const navTheme = useMemo(
    () => ({
      ...DefaultTheme,
      dark: true,
      colors: {
        ...DefaultTheme.colors,
        primary: theme.primary,
        background: theme.screenBg,
        card: theme.cardBg,
        text: theme.white,
        border: theme.border,
        notification: theme.primary,
      },
    }),
    [theme],
  );

  const onNavStateChange = useCallback(() => {
    const route = navigationRef.getCurrentRoute();
    if (route?.name) {
      logEvent("Navigation:ScreenFocus", {
        screen: route.name,
        params: route.params,
      });
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
      <View
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: theme.screenBg }}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navTheme}
      onStateChange={onNavStateChange}
    >
      {user || !authAvailable ? <Navigation /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default MainContainer;
