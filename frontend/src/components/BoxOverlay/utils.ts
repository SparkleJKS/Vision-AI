import { DEFAULT_MODEL_SIZE, DEFAULT_MAX_BOXES, MIN_CONFIDENCE, MAX_CONFIDENCE, COLOR_PALETTE } from './config';

export function toFiniteNumber(value: unknown, fallback = NaN): number {
  const numericValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function normalizeSize(
  size: unknown,
  fallback: number[] = [...DEFAULT_MODEL_SIZE] as number[],
): number[] {
  if (Array.isArray(size) && size.length === 2) {
    const width = Math.trunc(toFiniteNumber(size[0], NaN));
    const height = Math.trunc(toFiniteNumber(size[1], NaN));
    if (width > 0 && height > 0) return [width, height];
  }
  return [...fallback];
}

export function normalizeBbox(bbox: unknown): number[] | null {
  if (!Array.isArray(bbox) || bbox.length < 4) return null;
  const x1 = toFiniteNumber(bbox[0], NaN);
  const y1 = toFiniteNumber(bbox[1], NaN);
  const x2 = toFiniteNumber(bbox[2], NaN);
  const y2 = toFiniteNumber(bbox[3], NaN);
  if ([x1, y1, x2, y2].some((v) => !Number.isFinite(v))) return null;
  return [Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2)];
}

export function isNormalizedBbox([x1, y1, x2, y2]: number[]): boolean {
  return x1 >= 0 && y1 >= 0 && x2 <= 1.01 && y2 <= 1.01;
}

export function getPredictionClassKey(prediction: Record<string, unknown>): string {
  const className =
    typeof prediction?.className === 'string' && (prediction.className as string).trim()
      ? (prediction.className as string).trim().toLowerCase()
      : null;
  if (className) return className;
  const classId = prediction?.classId ?? prediction?.class;
  if (typeof classId === 'number' && Number.isFinite(classId)) return `class_${Math.trunc(classId)}`;
  if (typeof classId === 'string' && (classId as string).trim()) return (classId as string).trim().toLowerCase();
  return 'unknown';
}

export function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash *= 16777619;
  }
  return Math.abs(hash >>> 0);
}

export function getClassColor(classKey: string): string {
  return COLOR_PALETTE[hashString(classKey) % COLOR_PALETTE.length];
}

export function hexToRgba(hexColor: string, alpha: number): string {
  const hex = hexColor.replace('#', '');
  const value = hex.length === 3
    ? hex.split('').map((char) => char + char).join('')
    : hex;
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  const normalizedAlpha = clamp(alpha, 0, 1);
  return `rgba(${red}, ${green}, ${blue}, ${normalizedAlpha})`;
}

export interface DisplayTransform {
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
}

export function getDisplayTransform(
  sourceWidth: number,
  sourceHeight: number,
  overlayWidth: number,
  overlayHeight: number,
  resizeMode: string,
): DisplayTransform {
  if (resizeMode === 'stretch') {
    return {
      scaleX: overlayWidth / sourceWidth,
      scaleY: overlayHeight / sourceHeight,
      offsetX: 0,
      offsetY: 0,
    };
  }
  const uniformScale =
    resizeMode === 'contain'
      ? Math.min(overlayWidth / sourceWidth, overlayHeight / sourceHeight)
      : Math.max(overlayWidth / sourceWidth, overlayHeight / sourceHeight);
  return {
    scaleX: uniformScale,
    scaleY: uniformScale,
    offsetX: (overlayWidth - sourceWidth * uniformScale) / 2,
    offsetY: (overlayHeight - sourceHeight * uniformScale) / 2,
  };
}

export function modelToSourceBox(
  modelBox: number[],
  modelSize: number[],
  sourceSize: number[],
  modelResizeMode: string,
): number[] {
  const [modelWidth, modelHeight] = modelSize;
  const [sourceWidth, sourceHeight] = sourceSize;
  if (modelResizeMode === 'letterbox') {
    const gain = Math.min(modelWidth / sourceWidth, modelHeight / sourceHeight);
    const padX = (modelWidth - sourceWidth * gain) / 2;
    const padY = (modelHeight - sourceHeight * gain) / 2;
    return [
      (modelBox[0] - padX) / gain,
      (modelBox[1] - padY) / gain,
      (modelBox[2] - padX) / gain,
      (modelBox[3] - padY) / gain,
    ];
  }
  return [
    modelBox[0] * (sourceWidth / modelWidth),
    modelBox[1] * (sourceHeight / modelHeight),
    modelBox[2] * (sourceWidth / modelWidth),
    modelBox[3] * (sourceHeight / modelHeight),
  ];
}

export function sourceToScreenBox(
  sourceBox: number[],
  sourceSize: number[],
  overlaySize: number[],
  resizeMode: string,
): number[] {
  const [sourceWidth, sourceHeight] = sourceSize;
  const [overlayWidth, overlayHeight] = overlaySize;
  const transform = getDisplayTransform(sourceWidth, sourceHeight, overlayWidth, overlayHeight, resizeMode);
  const x1 = sourceBox[0] * transform.scaleX + transform.offsetX;
  const y1 = sourceBox[1] * transform.scaleY + transform.offsetY;
  const x2 = sourceBox[2] * transform.scaleX + transform.offsetX;
  const y2 = sourceBox[3] * transform.scaleY + transform.offsetY;
  const left = clamp(Math.min(x1, x2), 0, overlayWidth);
  const top = clamp(Math.min(y1, y2), 0, overlayHeight);
  const right = clamp(Math.max(x1, x2), 0, overlayWidth);
  const bottom = clamp(Math.max(y1, y2), 0, overlayHeight);
  return [left, top, right, bottom];
}

export function toModelSpaceBox(bbox: number[], modelSize: number[]): number[] {
  if (isNormalizedBbox(bbox)) {
    return [
      bbox[0] * modelSize[0],
      bbox[1] * modelSize[1],
      bbox[2] * modelSize[0],
      bbox[3] * modelSize[1],
    ];
  }
  return bbox;
}

export interface SanitizedPrediction {
  raw: Record<string, unknown>;
  bbox: number[];
  confidence: number;
  classKey: string;
  label: string;
}

export function sanitizePrediction(prediction: Record<string, unknown>): SanitizedPrediction | null {
  const bbox = normalizeBbox(prediction?.bbox ?? prediction?.box);
  if (!bbox) return null;
  const confidence = clamp(toFiniteNumber(prediction?.confidence, MIN_CONFIDENCE), MIN_CONFIDENCE, MAX_CONFIDENCE);
  const classKey = getPredictionClassKey(prediction);
  const label =
    typeof prediction?.className === 'string' && (prediction.className as string).trim()
      ? (prediction.className as string).trim()
      : classKey.replace(/^class_/, 'class ');
  return { raw: prediction, bbox, confidence, classKey, label };
}

export interface MapPredictionsOptions {
  predictions: Record<string, unknown>[];
  modelSize: number[];
  sourceSize: number[];
  overlaySize: number[];
  resizeMode: string;
  modelResizeMode: string;
  maxBoxes: number;
  minBoxSize: number;
}

export interface ScreenBox {
  trackKey: string;
  classKey: string;
  label: string;
  confidence: number;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  modelBox: number[];
  sourceBox: number[];
}

export function mapPredictionsToScreen(options: MapPredictionsOptions): ScreenBox[] {
  const {
    predictions,
    modelSize,
    sourceSize,
    overlaySize,
    resizeMode,
    modelResizeMode,
    maxBoxes,
    minBoxSize,
  } = options;

  const valid = predictions
    .map(sanitizePrediction)
    .filter((p): p is SanitizedPrediction => p !== null)
    .sort((a, b) => {
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      return a.classKey.localeCompare(b.classKey);
    })
    .slice(0, maxBoxes);

  const classOrder = new Map<string, number>();

  return valid
    .map((item) => {
      const classCount = classOrder.get(item.classKey) ?? 0;
      classOrder.set(item.classKey, classCount + 1);
      const trackKey = `${item.classKey}:${classCount}`;
      const modelSpaceBox = toModelSpaceBox(item.bbox, modelSize);
      const sourceBox = modelToSourceBox(modelSpaceBox, modelSize, sourceSize, modelResizeMode);
      const screenBox = sourceToScreenBox(sourceBox, sourceSize, overlaySize, resizeMode);
      const width = screenBox[2] - screenBox[0];
      const height = screenBox[3] - screenBox[1];
      if (width < minBoxSize || height < minBoxSize) return null;
      return {
        trackKey,
        classKey: item.classKey,
        label: item.label,
        confidence: item.confidence,
        color: getClassColor(item.classKey),
        x: screenBox[0],
        y: screenBox[1],
        width,
        height,
        modelBox: modelSpaceBox,
        sourceBox,
      };
    })
    .filter((b): b is ScreenBox => b !== null);
}

export interface SmoothBoxesResult {
  boxes: ScreenBox[];
  nextBoxesByKey: Map<string, ScreenBox>;
}

export function smoothBoxes(
  targetBoxes: ScreenBox[],
  previousBoxesByKey: Map<string, ScreenBox>,
  smoothingAlpha: number,
): SmoothBoxesResult {
  const alpha = clamp(smoothingAlpha, 0, 1);
  const nextBoxesByKey = new Map<string, ScreenBox>();

  const smoothed = targetBoxes.map((target) => {
    const previous = previousBoxesByKey.get(target.trackKey);
    if (!previous) {
      nextBoxesByKey.set(target.trackKey, target);
      return target;
    }
    const blended: ScreenBox = {
      ...target,
      x: previous.x + alpha * (target.x - previous.x),
      y: previous.y + alpha * (target.y - previous.y),
      width: previous.width + alpha * (target.width - previous.width),
      height: previous.height + alpha * (target.height - previous.height),
    };
    nextBoxesByKey.set(target.trackKey, blended);
    return blended;
  });

  return { boxes: smoothed, nextBoxesByKey };
}
