declare module '../../components/CameraView' {
  import type { RefObject } from 'react';
  import type { StyleProp, ViewStyle } from 'react-native';

  export interface CameraViewRef {
    takeSnapshot(options?: { quality?: number }): Promise<{ path?: string; filePath?: string; uri?: string }>;
  }

  export interface CameraViewProps {
    ref?: RefObject<CameraViewRef | null>;
    style?: StyleProp<ViewStyle>;
    isActive?: boolean;
    detectionEnabled?: boolean;
    facing?: 'back' | 'front';
    maxInferenceFps?: number;
    confidenceThreshold?: number;
    nmsIoU?: number;
    inputResolution?: number[];
    tfliteDelegate?: string;
    tfliteAllowNnapiFallback?: boolean;
    onnxExecutionProviders?: string[];
    onnxGraphOptimizationLevel?: string;
    onnxIntraOpThreads?: number;
    onnxInterOpThreads?: number;
    adaptiveFrameSkip?: boolean;
    processEveryNMax?: number;
    preprocessOnJs?: boolean;
    onInferenceResult?: (result: unknown) => void;
    onInferenceError?: (error: unknown) => void;
  }

  const CameraView: React.ForwardRefExoticComponent<
    CameraViewProps & React.RefAttributes<CameraViewRef | null>
  >;
  export default CameraView;
}

declare module '../../components/BoxOverlay' {
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
    style?: unknown;
  }

  const BoxOverlay: React.FC<BoxOverlayProps>;
  export default BoxOverlay;
  export type { BoxOverlayProps };
}
