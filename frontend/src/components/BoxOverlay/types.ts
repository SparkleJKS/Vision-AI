import type { StyleProp, ViewStyle } from 'react-native';

export interface BoxOverlayPrediction {
  bbox?: number[];
  className?: string;
  classId?: number;
  class?: number;
  confidence?: number;
}

export interface BoxOverlayProps {
  predictions?: BoxOverlayPrediction[];
  modelSize?: number[];
  sourceSize?: number[];
  resizeMode?: string;
  modelResizeMode?: string;
  smoothingAlpha?: number;
  maxBoxes?: number;
  minBoxSize?: number;
  showLabels?: boolean;
  enableTapDetails?: boolean;
  onBoxPress?: ((box: unknown) => void) | null;
  style?: StyleProp<ViewStyle>;
}
