import type { AnimationObject } from 'lottie-react-native';
import type { ViewStyle } from 'react-native';

export interface LottieProps {
  source: AnimationObject;
  autoPlay?: boolean;
  loop?: boolean;
  resizeMode?: 'cover' | 'contain' | 'center';
  onAnimationFinish?: () => void;
  style?: ViewStyle;
  width?: number;
  height?: number;
  speed?: number;
}
