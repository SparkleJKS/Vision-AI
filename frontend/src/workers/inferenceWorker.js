import modelManager from '@/lib/modelManager';

const DEFAULT_CONFIG = Object.freeze({
  maxInferenceFps: 8,
  confidenceThreshold: 0.25,
  nmsIoU: 0.45,
  inputResolution: [512, 512],
  tfliteDelegate: 'gpu',
  tfliteAllowNnapiFallback: true,
  tfliteNumThreads: 4,
  onnxExecutionProviders: ['nnapi', 'cpu'],
  onnxGraphOptimizationLevel: 'all',
  onnxIntraOpThreads: 2,
  onnxInterOpThreads: 1,
  onnxEnableCpuMemArena: true,
  onnxEnableMemPattern: true,
  preprocessOnJs: false,
  adaptiveFrameSkip: true,
  processEveryNStart: 1,
  processEveryNMin: 1,
  processEveryNMax: 6,
  overBudgetWindow: 3,
  underBudgetWindow: 8,
  highBudgetFactor: 1.15,
  lowBudgetFactor: 0.75,
});

function nowMs() {
  if (typeof globalThis?.performance?.now === 'function') {
    return globalThis.performance.now();
  }
  return Date.now();
}

function toFiniteNumber(value, fallback) {
  const numericValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeInputResolution(value) {
  if (Array.isArray(value) && value.length === 2) {
    const width = Math.trunc(toFiniteNumber(value[0], NaN));
    const height = Math.trunc(toFiniteNumber(value[1], NaN));
    if (width > 0 && height > 0) {
      return [width, height];
    }
  }

  const square = Math.trunc(toFiniteNumber(value, NaN));
  if (square > 0) {
    return [square, square];
  }

  return [...DEFAULT_CONFIG.inputResolution];
}

function normalizeConfig(config = {}) {
  const merged = {
    ...DEFAULT_CONFIG,
    ...(config ?? {}),
  };
  const onnxExecutionProviders = Array.isArray(merged.onnxExecutionProviders)
    ? merged.onnxExecutionProviders
        .map((provider) => String(provider).trim().toLowerCase())
        .filter((provider) => provider.length > 0)
    : [...DEFAULT_CONFIG.onnxExecutionProviders];

  return {
    maxInferenceFps: clamp(
      Math.trunc(toFiniteNumber(merged.maxInferenceFps, DEFAULT_CONFIG.maxInferenceFps)),
      1,
      30,
    ),
    confidenceThreshold: clamp(
      toFiniteNumber(merged.confidenceThreshold, DEFAULT_CONFIG.confidenceThreshold),
      0,
      1,
    ),
    nmsIoU: clamp(toFiniteNumber(merged.nmsIoU, DEFAULT_CONFIG.nmsIoU), 0, 1),
    inputResolution: normalizeInputResolution(merged.inputResolution),
    tfliteDelegate: String(merged.tfliteDelegate ?? DEFAULT_CONFIG.tfliteDelegate).toLowerCase(),
    tfliteAllowNnapiFallback: Boolean(merged.tfliteAllowNnapiFallback),
    tfliteNumThreads: clamp(
      Math.trunc(toFiniteNumber(merged.tfliteNumThreads, DEFAULT_CONFIG.tfliteNumThreads)),
      1,
      8,
    ),
    onnxExecutionProviders:
      onnxExecutionProviders.length > 0
        ? onnxExecutionProviders
        : [...DEFAULT_CONFIG.onnxExecutionProviders],
    onnxGraphOptimizationLevel: String(
      merged.onnxGraphOptimizationLevel ?? DEFAULT_CONFIG.onnxGraphOptimizationLevel,
    ).toLowerCase(),
    onnxIntraOpThreads: clamp(
      Math.trunc(toFiniteNumber(merged.onnxIntraOpThreads, DEFAULT_CONFIG.onnxIntraOpThreads)),
      1,
      8,
    ),
    onnxInterOpThreads: clamp(
      Math.trunc(toFiniteNumber(merged.onnxInterOpThreads, DEFAULT_CONFIG.onnxInterOpThreads)),
      1,
      4,
    ),
    onnxEnableCpuMemArena: Boolean(merged.onnxEnableCpuMemArena),
    onnxEnableMemPattern: Boolean(merged.onnxEnableMemPattern),
    preprocessOnJs: Boolean(merged.preprocessOnJs),
    adaptiveFrameSkip: Boolean(merged.adaptiveFrameSkip),
    processEveryNStart: clamp(
      Math.trunc(toFiniteNumber(merged.processEveryNStart, DEFAULT_CONFIG.processEveryNStart)),
      1,
      12,
    ),
    processEveryNMin: clamp(
      Math.trunc(toFiniteNumber(merged.processEveryNMin, DEFAULT_CONFIG.processEveryNMin)),
      1,
      12,
    ),
    processEveryNMax: clamp(
      Math.trunc(toFiniteNumber(merged.processEveryNMax, DEFAULT_CONFIG.processEveryNMax)),
      1,
      12,
    ),
    overBudgetWindow: clamp(
      Math.trunc(toFiniteNumber(merged.overBudgetWindow, DEFAULT_CONFIG.overBudgetWindow)),
      1,
      12,
    ),
    underBudgetWindow: clamp(
      Math.trunc(toFiniteNumber(merged.underBudgetWindow, DEFAULT_CONFIG.underBudgetWindow)),
      1,
      30,
    ),
    highBudgetFactor: clamp(
      toFiniteNumber(merged.highBudgetFactor, DEFAULT_CONFIG.highBudgetFactor),
      1.01,
      3,
    ),
    lowBudgetFactor: clamp(
      toFiniteNumber(merged.lowBudgetFactor, DEFAULT_CONFIG.lowBudgetFactor),
      0.1,
      0.99,
    ),
  };
}

function normalizeFrameStrideBounds(config) {
  const minValue = Math.min(config.processEveryNMin, config.processEveryNMax);
  const maxValue = Math.max(config.processEveryNMin, config.processEveryNMax);
  const startValue = clamp(config.processEveryNStart, minValue, maxValue);

  return {
    ...config,
    processEveryNMin: minValue,
    processEveryNMax: maxValue,
    processEveryNStart: startValue,
  };
}

function toUint8Array(bytes) {
  if (bytes instanceof Uint8Array) {
    return bytes;
  }

  if (bytes instanceof ArrayBuffer) {
    return new Uint8Array(bytes);
  }

  if (ArrayBuffer.isView(bytes)) {
    return new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  return null;
}

function getSourceChannels(sourceLength, width, height) {
  const pixelCount = width * height;
  if (pixelCount <= 0) {
    return 0;
  }

  const channels = Math.floor(sourceLength / pixelCount);
  if (channels >= 4) {
    return 4;
  }
  if (channels >= 3) {
    return 3;
  }
  return 1;
}

function readRgbPixel(source, pixelIndex, channels, pixelFormat) {
  if (channels === 4) {
    const offset = pixelIndex * 4;
    const c1 = source[offset];
    const c2 = source[offset + 1];
    const c3 = source[offset + 2];

    if (pixelFormat === 'bgra' || pixelFormat === 'bgr') {
      return [c3, c2, c1];
    }
    return [c1, c2, c3];
  }

  if (channels === 3) {
    const offset = pixelIndex * 3;
    const c1 = source[offset];
    const c2 = source[offset + 1];
    const c3 = source[offset + 2];

    if (pixelFormat === 'bgr') {
      return [c3, c2, c1];
    }
    return [c1, c2, c3];
  }

  // For non-RGB (for example Y-plane only), replicate luminance.
  const luminance = source[pixelIndex];
  return [luminance, luminance, luminance];
}

export function preprocessFrame(framePacket, inputResolution) {
  const sourceWidth = Math.trunc(toFiniteNumber(framePacket?.width, NaN));
  const sourceHeight = Math.trunc(toFiniteNumber(framePacket?.height, NaN));
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    throw new Error('Invalid source frame dimensions.');
  }

  const sourceBytes = toUint8Array(framePacket?.bytes ?? framePacket?.buffer ?? framePacket?.imageBuffer);
  if (!sourceBytes || sourceBytes.length === 0) {
    throw new Error('Frame buffer is empty or unsupported.');
  }

  const [targetWidth, targetHeight] = normalizeInputResolution(inputResolution);
  const channels = getSourceChannels(sourceBytes.length, sourceWidth, sourceHeight);
  if (channels === 0) {
    throw new Error('Unable to determine frame channel layout.');
  }

  const pixelFormat = typeof framePacket?.pixelFormat === 'string' ? framePacket.pixelFormat : 'rgb';
  const output = new Float32Array(targetWidth * targetHeight * 3);
  const xScale = sourceWidth / targetWidth;
  const yScale = sourceHeight / targetHeight;

  let outputOffset = 0;
  for (let y = 0; y < targetHeight; y += 1) {
    const sourceY = Math.min(sourceHeight - 1, Math.floor(y * yScale));
    const sourceRowOffset = sourceY * sourceWidth;

    for (let x = 0; x < targetWidth; x += 1) {
      const sourceX = Math.min(sourceWidth - 1, Math.floor(x * xScale));
      const sourcePixelIndex = sourceRowOffset + sourceX;
      const [r, g, b] = readRgbPixel(sourceBytes, sourcePixelIndex, channels, pixelFormat);

      output[outputOffset] = r / 255;
      output[outputOffset + 1] = g / 255;
      output[outputOffset + 2] = b / 255;
      outputOffset += 3;
    }
  }

  // The worker emits NHWC float32 because mobile runtimes usually accept this layout directly.
  return {
    tensor: {
      data: output,
      shape: [1, targetHeight, targetWidth, 3],
      dtype: 'float32',
      layout: 'nhwc',
      sourceWidth,
      sourceHeight,
      rotationDegrees: Math.trunc(toFiniteNumber(framePacket?.rotationDegrees, 0)),
    },
    sourceSize: [sourceWidth, sourceHeight],
    inputSize: [targetWidth, targetHeight],
  };
}

function normalizeError(error) {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}

export class InferenceWorker {
  constructor({
    manager = modelManager,
    config,
    onResult = null,
    onError = null,
  } = {}) {
    this.manager = manager;
    this.config = normalizeFrameStrideBounds(normalizeConfig(config));
    this.onResult = typeof onResult === 'function' ? onResult : null;
    this.onError = typeof onError === 'function' ? onError : null;

    this.started = false;
    this.disposed = false;
    this.isBusy = false;
    this.pendingFrame = null;
    this.lastInferenceStartedAt = 0;
    this.pendingDroppedFrames = 0;
    this.frameCounter = 0;
    this.processEveryN = this.config.processEveryNStart;
    this.overBudgetCount = 0;
    this.underBudgetCount = 0;
  }

  setResultHandler(handler) {
    this.onResult = typeof handler === 'function' ? handler : null;
  }

  setErrorHandler(handler) {
    this.onError = typeof handler === 'function' ? handler : null;
  }

  configure(nextConfig = {}) {
    this.config = normalizeFrameStrideBounds(normalizeConfig({
      ...this.config,
      ...nextConfig,
    }));
    this.processEveryN = clamp(
      this.processEveryN,
      this.config.processEveryNMin,
      this.config.processEveryNMax,
    );

    this.manager.setConfig({
      confidenceThreshold: this.config.confidenceThreshold,
      nmsIoU: this.config.nmsIoU,
      inputResolution: this.config.inputResolution,
      tfliteDelegate: this.config.tfliteDelegate,
      tfliteAllowNnapiFallback: this.config.tfliteAllowNnapiFallback,
      tfliteNumThreads: this.config.tfliteNumThreads,
      onnxExecutionProviders: this.config.onnxExecutionProviders,
      onnxGraphOptimizationLevel: this.config.onnxGraphOptimizationLevel,
      onnxIntraOpThreads: this.config.onnxIntraOpThreads,
      onnxInterOpThreads: this.config.onnxInterOpThreads,
      onnxEnableCpuMemArena: this.config.onnxEnableCpuMemArena,
      onnxEnableMemPattern: this.config.onnxEnableMemPattern,
    });
  }

  start() {
    this.started = true;
    this.disposed = false;
    this.frameCounter = 0;
    this.processEveryN = this.config.processEveryNStart;
    this.overBudgetCount = 0;
    this.underBudgetCount = 0;
    this.manager.setConfig({
      confidenceThreshold: this.config.confidenceThreshold,
      nmsIoU: this.config.nmsIoU,
      inputResolution: this.config.inputResolution,
      tfliteDelegate: this.config.tfliteDelegate,
      tfliteAllowNnapiFallback: this.config.tfliteAllowNnapiFallback,
      tfliteNumThreads: this.config.tfliteNumThreads,
      onnxExecutionProviders: this.config.onnxExecutionProviders,
      onnxGraphOptimizationLevel: this.config.onnxGraphOptimizationLevel,
      onnxIntraOpThreads: this.config.onnxIntraOpThreads,
      onnxInterOpThreads: this.config.onnxInterOpThreads,
      onnxEnableCpuMemArena: this.config.onnxEnableCpuMemArena,
      onnxEnableMemPattern: this.config.onnxEnableMemPattern,
    });
  }

  stop() {
    this.started = false;
    this.pendingFrame = null;
    this.frameCounter = 0;
  }

  async dispose() {
    this.stop();
    this.disposed = true;
    this.isBusy = false;
    try {
      await this.manager.unload();
    } catch {
      // Unload failures should not crash screen teardown.
    }
  }

  getMinFrameIntervalMs() {
    return 1000 / this.config.maxInferenceFps;
  }

  getTargetBudgetMs() {
    return 1000 / this.config.maxInferenceFps;
  }

  shouldProcessCurrentFrame() {
    this.frameCounter += 1;
    return this.frameCounter % this.processEveryN === 0;
  }

  updateAdaptiveFrameSkipping(totalMs) {
    if (!this.config.adaptiveFrameSkip || !Number.isFinite(totalMs)) {
      return;
    }

    const budgetMs = this.getTargetBudgetMs();
    const isOverBudget = totalMs > budgetMs * this.config.highBudgetFactor;
    const isUnderBudget = totalMs < budgetMs * this.config.lowBudgetFactor;

    if (isOverBudget) {
      this.overBudgetCount += 1;
      this.underBudgetCount = 0;
      if (
        this.overBudgetCount >= this.config.overBudgetWindow &&
        this.processEveryN < this.config.processEveryNMax
      ) {
        this.processEveryN += 1;
        this.overBudgetCount = 0;
      }
      return;
    }

    if (isUnderBudget) {
      this.underBudgetCount += 1;
      this.overBudgetCount = 0;
      if (
        this.underBudgetCount >= this.config.underBudgetWindow &&
        this.processEveryN > this.config.processEveryNMin
      ) {
        this.processEveryN -= 1;
        this.underBudgetCount = 0;
      }
      return;
    }

    this.overBudgetCount = 0;
    this.underBudgetCount = 0;
  }

  enqueueFrame(framePacket) {
    if (this.disposed || !this.started) {
      return false;
    }

    if (this.isBusy) {
      // Keep only latest pending frame to avoid queue growth and latency drift.
      this.pendingFrame = framePacket;
      this.pendingDroppedFrames += 1;
      return false;
    }

    if (!this.shouldProcessCurrentFrame()) {
      this.pendingDroppedFrames += 1;
      return false;
    }

    const now = nowMs();
    const elapsed = now - this.lastInferenceStartedAt;
    if (elapsed < this.getMinFrameIntervalMs()) {
      this.pendingDroppedFrames += 1;
      return false;
    }

    this.lastInferenceStartedAt = now;
    this.processFrame(framePacket);
    return true;
  }

  async processFrame(framePacket) {
    this.isBusy = true;
    const frameStartedAt = nowMs();
    const frameId = framePacket?.frameId ?? `frame-${Date.now()}`;
    const droppedFramesSinceLast = this.pendingDroppedFrames;
    this.pendingDroppedFrames = 0;

    try {
      let processed = {
        tensor: null,
        sourceSize: [
          Math.trunc(toFiniteNumber(framePacket?.width, 0)),
          Math.trunc(toFiniteNumber(framePacket?.height, 0)),
        ],
        inputSize: [...this.config.inputResolution],
      };
      let preprocessMs = 0;

      if (this.config.preprocessOnJs) {
        const preprocessStartedAt = nowMs();
        processed = preprocessFrame(framePacket, this.config.inputResolution);
        preprocessMs = nowMs() - preprocessStartedAt;
      }

      const inferInput = {
        frameTensor: processed.tensor,
        imageBuffer: framePacket?.imageBuffer ?? framePacket?.bytes ?? null,
        frameMeta: {
          width: Math.trunc(toFiniteNumber(framePacket?.width, 0)),
          height: Math.trunc(toFiniteNumber(framePacket?.height, 0)),
          pixelFormat: framePacket?.pixelFormat ?? 'rgb',
          rotationDegrees: Math.trunc(toFiniteNumber(framePacket?.rotationDegrees, 0)),
          inputResolution: [...this.config.inputResolution],
        },
      };

      const inferenceResult = await this.manager.infer(inferInput);
      const fallbackInferMs = Math.max(0, nowMs() - frameStartedAt - preprocessMs);
      const inferMs = Number.isFinite(inferenceResult?.inferMs)
        ? inferenceResult.inferMs
        : fallbackInferMs;
      const totalMs = nowMs() - frameStartedAt;
      this.updateAdaptiveFrameSkipping(totalMs);

      if (this.onResult) {
        this.onResult({
          frameId,
          runtime: this.manager.getActiveRuntime?.() ?? null,
          predictions: Array.isArray(inferenceResult?.predictions)
            ? inferenceResult.predictions
            : [],
          preprocessMs,
          inferMs,
          totalMs,
          sourceSize: processed.sourceSize,
          inputSize: processed.inputSize,
          droppedFramesSinceLast,
          processEveryN: this.processEveryN,
          adaptiveFrameSkip: this.config.adaptiveFrameSkip,
          targetBudgetMs: this.getTargetBudgetMs(),
          capturedAt: toFiniteNumber(framePacket?.timestamp, Date.now()),
        });
      }
    } catch (error) {
      if (this.onError) {
        this.onError(normalizeError(error), {
          frameId,
          stage: 'inference',
          droppedFramesSinceLast,
        });
      }
    } finally {
      this.isBusy = false;

      if (this.pendingFrame) {
        const latestFrame = this.pendingFrame;
        this.pendingFrame = null;
        this.enqueueFrame(latestFrame);
      }
    }
  }
}

export function createInferenceWorker(options = {}) {
  return new InferenceWorker(options);
}
