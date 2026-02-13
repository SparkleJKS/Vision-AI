import type { RefObject } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export interface CameraViewRef {
  takeSnapshot(options?: { quality?: number }): Promise<{
    path?: string;
    filePath?: string;
    uri?: string;
  }>;
}

export type CameraFacing = 'back' | 'front';

export interface CameraViewProps {
  style?: StyleProp<ViewStyle>;
  isActive?: boolean;
  detectionEnabled?: boolean;
  facing?: CameraFacing;
  maxInferenceFps?: number;
  confidenceThreshold?: number;
  nmsIoU?: number;
  inputResolution?: number[];
  tfliteDelegate?: string;
  tfliteAllowNnapiFallback?: boolean;
  tfliteNumThreads?: number;
  onnxExecutionProviders?: string[];
  onnxGraphOptimizationLevel?: string;
  onnxIntraOpThreads?: number;
  onnxInterOpThreads?: number;
  onnxEnableCpuMemArena?: boolean;
  onnxEnableMemPattern?: boolean;
  adaptiveFrameSkip?: boolean;
  processEveryNMax?: number;
  preprocessOnJs?: boolean;
  enablePhotoCapture?: boolean;
  onInferenceResult?: ((result: unknown) => void) | null;
  onInferenceError?: ((error: unknown) => void) | null;
  onInitialized?: (() => void) | null;
  cameraProps?: Record<string, unknown>;
}

/** Frame packet passed to the inference worker from the frame processor */
export interface FramePacket {
  frameId: string;
  timestamp: number;
  width: number;
  height: number;
  pixelFormat?: string;
  rotationDegrees?: number;
  bytes: ArrayBuffer;
}
