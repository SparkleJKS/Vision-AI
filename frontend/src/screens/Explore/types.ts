export type ModelRuntime = 'tflite' | 'onnx' | 'server';
export type TfliteDelegate = 'gpu' | 'nnapi' | 'xnnpack' | 'cpu';
export type RuntimeStatus = 'idle' | 'ready' | 'loading' | 'running' | 'error' | 'fallback';
export type CameraFacing = 'back' | 'front';

export interface Prediction {
  bbox?: number[];
  className?: string;
  classId?: number;
  class?: number;
  confidence?: number;
}

export interface InferenceResult {
  predictions?: Prediction[];
  inputSize?: number[];
  sourceSize?: number[];
  inferMs?: number;
  preprocessMs?: number;
  totalMs?: number;
  processEveryN?: number;
  droppedFramesSinceLast?: number;
  targetBudgetMs?: number;
  runtime?: string | null;
}

export interface ApplyRuntimeOptions {
  tfliteDelegate?: TfliteDelegate;
}

export interface CameraViewRef {
  takeSnapshot(options?: { quality?: number }): Promise<{
    path?: string;
    filePath?: string;
    uri?: string;
  }>;
}

export interface CameraViewProps {
  style?: object;
  isActive?: boolean;
  detectionEnabled?: boolean;
  facing?: CameraFacing;
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
  onInferenceResult?: (result: InferenceResult) => void;
  onInferenceError?: (error: unknown) => void;
}

export interface ConfidenceSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export interface LatencyBar {
  key: string;
  heightPct: number;
  isSlow: boolean;
}
