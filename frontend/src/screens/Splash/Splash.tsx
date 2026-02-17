import { Component, type ErrorInfo, type ReactNode } from "react";
import {
  ActivityIndicator,
  useWindowDimensions,
  View,
  Text,
} from "react-native";
import { Lottie } from "@/animations/components";
import { AppInit } from "@/animations/assets";
import tokens from "@/theme/tokens";

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
  return (
    <View
      className={`justify-center items-center bg-${tokens.screenBg}`}
      style={{ width, height }}
    >
      <Text className="mb-6 font-semibold text-3xl text-white">VisionAI</Text>
      <ActivityIndicator
        size="large"
        color={tokens.accentYellow}
        className="mt-2"
      />
    </View>
  );
}

export function Splash() {
  const { width, height } = useWindowDimensions();

  return (
    <SplashErrorBoundary>
      <View
        className={`justify-center items-center bg-${tokens.screenBg}`}
        style={{ width, height }}
      >
        <Lottie
          source={AppInit}
          width={width}
          height={height}
          loop={false}
          autoPlay
          resizeMode="contain"
        />
      </View>
    </SplashErrorBoundary>
  );
}
