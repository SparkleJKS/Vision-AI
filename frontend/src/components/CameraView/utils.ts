import { DEFAULT_MAX_INFERENCE_FPS, DEFAULT_INPUT_RESOLUTION, DEFAULT_ONNX_PROVIDERS } from './config';

export function normalizeMaxInferenceFps(value: unknown): number {
  const numericValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numericValue)) return DEFAULT_MAX_INFERENCE_FPS;
  return Math.min(Math.max(Math.trunc(numericValue), 1), 30);
}

export function normalizeInputResolution(value: unknown): number[] {
  if (Array.isArray(value) && value.length === 2) {
    const width = Math.trunc(Number(value[0]));
    const height = Math.trunc(Number(value[1]));
    if (width > 0 && height > 0) return [width, height];
  }
  return [...DEFAULT_INPUT_RESOLUTION];
}

export function normalizeExecutionProviders(value: unknown): string[] {
  if (!Array.isArray(value)) return [...DEFAULT_ONNX_PROVIDERS];
  const providers = value
    .map((p) => String(p).trim().toLowerCase())
    .filter((p) => p.length > 0);
  return providers.length > 0 ? providers : [...DEFAULT_ONNX_PROVIDERS];
}
