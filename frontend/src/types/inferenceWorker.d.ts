export interface InferenceWorkerConfig {
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
}

export interface InferenceWorkerOptions {
  config?: InferenceWorkerConfig;
  onResult?: ((result: unknown) => void) | null;
  onError?: ((error: unknown) => void) | null;
}

export interface InferenceWorker {
  setResultHandler(handler: ((result: unknown) => void) | null): void;
  setErrorHandler(handler: ((error: unknown) => void) | null): void;
  configure(config: Partial<InferenceWorkerConfig>): void;
  start(): void;
  stop(): void;
  dispose(): Promise<void>;
  enqueueFrame(framePacket: FramePacket): boolean;
}

export interface FramePacket {
  frameId: string;
  timestamp: number;
  width: number;
  height: number;
  pixelFormat?: string;
  rotationDegrees?: number;
  bytes: ArrayBuffer;
}

export function createInferenceWorker(options?: InferenceWorkerOptions): InferenceWorker;
