import React from 'react';
import LottieView from 'lottie-react-native';
import type { LottieProps } from './Lottie.types';

export function Lottie({
  source,
  autoPlay = true,
  loop = false,
  resizeMode = 'cover',
  onAnimationFinish,
  style,
  width,
  height,
  speed,
  ...props
}: LottieProps) {
  return (
    <LottieView
      source={source}
      autoPlay={autoPlay}
      loop={loop}
      resizeMode={resizeMode}
      onAnimationFinish={onAnimationFinish}
      speed={speed}
      style={[{ zIndex: 20 }, width && height ? { width, height } : undefined, style]}
      {...props}
    />
  );
}
