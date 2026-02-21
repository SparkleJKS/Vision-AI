import { Component, type ErrorInfo, type ReactNode } from "react";
import {
  ActivityIndicator,
  useWindowDimensions,
  View,
  Text,
} from "react-native";
import { Lottie } from "@/animations/components";
import { AppInit } from "@/animations/assets";
import { useTheme } from "@/theme/ThemeContext";

type Props = { children: ReactNode };

class SplashErrorBoundary extends Component<Props, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError = () => ({ hasError: true });

  componentDidCatch(error: Error, _info: ErrorInfo) {
    if (__DEV__) console.warn("[Splash] Lottie failed:", error?.message);
  }

  render() {
    if (this.state.hasError) return <FallbackSplash />;
    return this.props.children;
  }
}

function FallbackSplash() {
  const { width, height } = useWindowDimensions();
  const { theme } = useTheme();
  return (
    <View
      className="justify-center items-center"
      style={{ width, height, backgroundColor: theme.screenBg }}
    >
      <Text
        className="mb-6 text-3xl font-semibold"
        style={{ color: theme.white }}
      >
        VisionAI
      </Text>
      <ActivityIndicator size="large" color={theme.primary} className="mt-2" />
    </View>
  );
}

const Splash = () => {
  const { width, height } = useWindowDimensions();
  const { theme } = useTheme();

  return (
    <SplashErrorBoundary>
      <View
        className="justify-center items-center"
        style={{ width, height, backgroundColor: theme.screenBg }}
      >
        <Lottie
          source={AppInit}
          width={width}
          height={height}
          loop={false}
          autoPlay
          resizeMode="contain"
          speed={1.75}
        />
      </View>
    </SplashErrorBoundary>
  );
};

export default Splash;
