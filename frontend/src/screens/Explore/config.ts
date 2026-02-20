import type { ModelRuntime, TfliteDelegate } from './types';

export const MODEL_OPTIONS: { id: ModelRuntime; label: string }[] = [
  { id: 'tflite', label: 'TFLite' },
  { id: 'onnx', label: 'ONNX' },
  { id: 'server', label: 'Server' },
];

export const TFLITE_DELEGATE_OPTIONS: { id: TfliteDelegate; label: string }[] = [
  { id: 'gpu', label: 'GPU' },
  { id: 'nnapi', label: 'NNAPI' },
  { id: 'xnnpack', label: 'XNNPACK' },
  { id: 'cpu', label: 'CPU' },
];

export const INPUT_RESOLUTION = [512, 512] as const;
export const MAX_INFERENCE_FPS = 12;
export const DEFAULT_CONFIDENCE = 0.25;
export const NMS_IOU = 0.45;
export const LATENCY_GRAPH_POINTS = 28;

export const ONNX_EXECUTION_PROVIDERS = ['nnapi', 'cpu'] as const;
export const ONNX_GRAPH_OPT_LEVEL = 'all';
export const ONNX_INTRA_OP_THREADS = 2;
export const ONNX_INTER_OP_THREADS = 1;

export const EXPLORE_COLORS = {
  panelBg: '#16191F',
  surfaceBg: '#0E1015',
  border: '#2B313D',
  label: '#9CA3AF',
  white: '#FFFFFF',
  accent: '#FFD54F',
  error: '#F87171',
  success: '#22C55E',
  warning: '#F59E0B',
} as const;
