import { Component, type ErrorInfo, type ReactNode } from 'react';
import {
  ActivityIndicator,
  useWindowDimensions,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Lottie } from '../../animations/components';
import { AppInit } from '../../animations/assets';

type Props = { children: ReactNode };

class SplashErrorBoundary extends Component<Props, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError = () => ({ hasError: true });

  componentDidCatch(error: Error, _info: ErrorInfo) {
    if (__DEV__) console.warn('[Splash] Lottie failed:', error?.message);
  }

  render() {
    if (this.state.hasError) return <FallbackSplash />;
    return this.props.children;
  }
}

function FallbackSplash() {
  const { width, height } = useWindowDimensions();
  return (
    <View style={[styles.container, { width, height }]}>
      <Text style={styles.title}>VisionAI</Text>
      <ActivityIndicator size="large" color="#2563eb" style={styles.spinner} />
    </View>
  );
}

export function Splash() {
  const { width, height } = useWindowDimensions();

  return (
    <SplashErrorBoundary>
      <View style={[styles.container, { width, height }]}>
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 24,
  },
  spinner: {
    marginTop: 8,
  },
});
