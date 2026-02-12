const DEFAULT_WORKER_CONFIG = Object.freeze({
  maxInferenceFps: 8,
  inputResolution: 640,
  confidenceThreshold: 0.25,
  nmsIoU: 0.45,
  normalize: {
    mean: [0, 0, 0],
    std: [1, 1, 1],
  },
});

function nowMs() {
  if (typeof globalThis.performance?.now === 'function') {
    return globalThis.performance.now();
  }
  return Date.now();
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeInputResolution(inputResolution) {
  if (isFiniteNumber(inputResolution) && inputResolution > 0) {
    const side = Math.floor(inputResolution);
    return { width: side, height: side };
  }

  if (
    inputResolution &&
    typeof inputResolution === 'object' &&
    isFiniteNumber(inputResolution.width) &&
    isFiniteNumber(inputResolution.height) &&
    inputResolution.width > 0 &&
    inputResolution.height > 0
  ) {
    return {
      width: Math.floor(inputResolution.width),
      height: Math.floor(inputResolution.height),
    };
  }

  return {
    width: DEFAULT_WORKER_CONFIG.inputResolution,
    height: DEFAULT_WORKER_CONFIG.inputResolution,
  };
}

function normalizeMeanStd(input, fallback) {
  if (!Array.isArray(input) || input.length !== 3) {
    return [...fallback];
  }

  return input.map((value, index) => {
    if (!isFiniteNumber(value)) {
      return fallback[index];
    }
    return value;
  });
}

function normalizeWorkerConfig(config = {}) {
  const normalizeConfig = config.normalize ?? {};
  const mean = normalizeMeanStd(
    normalizeConfig.mean,
    DEFAULT_WORKER_CONFIG.normalize.mean,
  );
  const std = normalizeMeanStd(
    normalizeConfig.std,
    DEFAULT_WORKER_CONFIG.normalize.std,
  ).map((value, index) => {
    if (value === 0) {
      return DEFAULT_WORKER_CONFIG.normalize.std[index];
    }
    return value;
  });

  const maxInferenceFps = Math.floor(
    clamp(
      isFiniteNumber(config.maxInferenceFps)
        ? config.maxInferenceFps
        : DEFAULT_WORKER_CONFIG.maxInferenceFps,
      1,
      30,
    ),
  );

  return {
    maxInferenceFps,
    inputResolution: normalizeInputResolution(config.inputResolution),
    confidenceThreshold: clamp(
      isFiniteNumber(config.confidenceThreshold)
        ? config.confidenceThreshold
        : DEFAULT_WORKER_CONFIG.confidenceThreshold,
      0,
      1,
    ),
    nmsIoU: clamp(
      isFiniteNumber(config.nmsIoU) ? config.nmsIoU : DEFAULT_WORKER_CONFIG.nmsIoU,
      0,
      1,
    ),
    normalize: {
      mean,
      std,
    },
  };
}

function toByteView(bufferLike) {
  if (
    typeof ArrayBuffer !== 'undefined' &&
    bufferLike &&
    bufferLike instanceof ArrayBuffer
  ) {
    return new Uint8Array(bufferLike);
  }

  if (
    typeof ArrayBuffer !== 'undefined' &&
    bufferLike &&
    ArrayBuffer.isView(bufferLike)
  ) {
    return new Uint8Array(
      bufferLike.buffer,
      bufferLike.byteOffset,
      bufferLike.byteLength,
    );
  }

  throw new Error('Frame payload must contain an ArrayBuffer or typed array.');
}

function getPixelStride(framePacket, bytesLength) {
  const width = framePacket.width;
  const height = framePacket.height;
  const expectedRgb = width * height * 3;
  const expectedRgba = width * height * 4;

  if (framePacket.pixelFormat === 'rgb') {
    return 3;
  }
  if (bytesLength === expectedRgb) {
    return 3;
  }
  if (bytesLength === expectedRgba) {
    return 4;
  }

  if (framePacket.pixelFormat === 'yuv') {
    // TODO(native): Convert YUV->RGB in native plugin to avoid this unsupported path.
    throw new Error('YUV frame preprocessing is not yet supported in JS worker.');
  }

  throw new Error(
    `Unsupported frame layout (pixelFormat=${framePacket.pixelFormat ?? 'unknown'}).`,
  );
}

function createTensorCache() {
  return {
    srcWidth: 0,
    srcHeight: 0,
    dstWidth: 0,
    dstHeight: 0,
    xMap: null,
    yMap: null,
    tensor: null,
  };
}

function ensureTensorCache(cache, srcWidth, srcHeight, dstWidth, dstHeight) {
  const cacheMatches =
    cache.srcWidth === srcWidth &&
    cache.srcHeight === srcHeight &&
    cache.dstWidth === dstWidth &&
    cache.dstHeight === dstHeight &&
    cache.xMap !== null &&
    cache.yMap !== null &&
    cache.tensor !== null;

  if (cacheMatches) {
    return cache;
  }

  const xMap = new Int32Array(dstWidth);
  const yMap = new Int32Array(dstHeight);

  for (let x = 0; x < dstWidth; x += 1) {
    xMap[x] = Math.min(srcWidth - 1, Math.floor((x * srcWidth) / dstWidth));
  }

  for (let y = 0; y < dstHeight; y += 1) {
    yMap[y] = Math.min(srcHeight - 1, Math.floor((y * srcHeight) / dstHeight));
  }

  cache.srcWidth = srcWidth;
  cache.srcHeight = srcHeight;
  cache.dstWidth = dstWidth;
  cache.dstHeight = dstHeight;
  cache.xMap = xMap;
  cache.yMap = yMap;
  cache.tensor = new Float32Array(dstWidth * dstHeight * 3);
  return cache;
}

function preprocessFrame(framePacket, config, cache) {
  if (!framePacket || typeof framePacket !== 'object') {
    throw new Error('Frame payload is required.');
  }
  if (!isFiniteNumber(framePacket.width) || !isFiniteNumber(framePacket.height)) {
    throw new Error('Frame payload must include numeric width and height.');
  }

  const srcWidth = Math.floor(framePacket.width);
  const srcHeight = Math.floor(framePacket.height);
  if (srcWidth <= 0 || srcHeight <= 0) {
    throw new Error('Frame dimensions must be greater than zero.');
  }

  const sourceBytes = toByteView(framePacket.buffer);
  const pixelStride = getPixelStride(framePacket, sourceBytes.byteLength);
  const dstWidth = config.inputResolution.width;
  const dstHeight = config.inputResolution.height;
  const preparedCache = ensureTensorCache(
    cache,
    srcWidth,
    srcHeight,
    dstWidth,
    dstHeight,
  );
  const xMap = preparedCache.xMap;
  const yMap = preparedCache.yMap;
  const tensor = preparedCache.tensor;
  const mean = config.normalize.mean;
  const std = config.normalize.std;

  let dstOffset = 0;
  for (let y = 0; y < dstHeight; y += 1) {
    const srcY = yMap[y];
    const srcRowStart = srcY * srcWidth * pixelStride;

    for (let x = 0; x < dstWidth; x += 1) {
      const srcX = xMap[x];
      const srcOffset = srcRowStart + srcX * pixelStride;

      const r = sourceBytes[srcOffset] / 255;
      const g = sourceBytes[srcOffset + 1] / 255;
      const b = sourceBytes[srcOffset + 2] / 255;

      tensor[dstOffset] = (r - mean[0]) / std[0];
      tensor[dstOffset + 1] = (g - mean[1]) / std[1];
      tensor[dstOffset + 2] = (b - mean[2]) / std[2];
      dstOffset += 3;
    }
  }

  return {
    data: tensor,
    shape: [1, dstHeight, dstWidth, 3],
    layout: 'NHWC',
    normalized: true,
    source: {
      width: srcWidth,
      height: srcHeight,
      pixelFormat: framePacket.pixelFormat ?? 'unknown',
      orientation: framePacket.orientation ?? 'unknown',
      isMirrored: Boolean(framePacket.isMirrored),
      timestamp: framePacket.timestamp ?? null,
    },
  };
}

function toError(error) {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}

export function createInferenceWorker({
  modelManager,
  onResult,
  onError,
  config = {},
} = {}) {
  if (!modelManager || typeof modelManager.infer !== 'function') {
    throw new Error(
      'createInferenceWorker requires a modelManager with an infer() method.',
    );
  }

  let workerConfig = normalizeWorkerConfig(config);
  let busy = false;
  let disposed = false;
  let lastInferAtMs = 0;
  let droppedFramesSinceLast = 0;
  const tensorCache = createTensorCache();

  function syncModelConfig(nextConfig) {
    if (typeof modelManager.updateConfig !== 'function') {
      return;
    }

    modelManager.updateConfig({
      confidenceThreshold: nextConfig.confidenceThreshold,
      nmsIoU: nextConfig.nmsIoU,
      inputResolution: nextConfig.inputResolution,
    });
  }

  syncModelConfig(workerConfig);

  async function processFrame(framePacket) {
    if (disposed) {
      return { accepted: false, reason: 'disposed' };
    }

    const requestStartedAt = nowMs();
    const minIntervalMs = 1000 / workerConfig.maxInferenceFps;

    if (busy) {
      droppedFramesSinceLast += 1;
      return { accepted: false, reason: 'busy' };
    }
    if (requestStartedAt - lastInferAtMs < minIntervalMs) {
      droppedFramesSinceLast += 1;
      return { accepted: false, reason: 'throttled' };
    }

    busy = true;
    lastInferAtMs = requestStartedAt;

    try {
      const preprocessStart = nowMs();
      const frameTensor = preprocessFrame(framePacket, workerConfig, tensorCache);
      const preprocessMs = nowMs() - preprocessStart;

      // Single entry point: keep inference backend decisions inside modelManager.
      // TODO(server): add JPEG/PNG encoding for framePacket.buffer to support server fallback from live frames.
      const inferStart = nowMs();
      const inferResult = await modelManager.infer({ frameTensor });
      const inferElapsedMs = nowMs() - inferStart;
      const inferMs = isFiniteNumber(inferResult?.inferMs)
        ? inferResult.inferMs
        : inferElapsedMs;
      const totalMs = nowMs() - requestStartedAt;

      const result = {
        frameId: framePacket?.frameId ?? null,
        capturedAtMs: framePacket?.capturedAtMs ?? null,
        droppedFramesSinceLast,
        runtime:
          typeof modelManager.getActiveRuntime === 'function'
            ? modelManager.getActiveRuntime()
            : null,
        predictions: Array.isArray(inferResult?.predictions)
          ? inferResult.predictions
          : [],
        timingsMs: {
          preprocess: Math.round(preprocessMs),
          infer: Math.round(inferMs),
          total: Math.round(totalMs),
        },
      };

      droppedFramesSinceLast = 0;
      if (typeof onResult === 'function') {
        onResult(result);
      }
      return { accepted: true, result };
    } catch (error) {
      const normalizedError = toError(error);
      if (typeof onError === 'function') {
        onError(normalizedError);
      }
      return { accepted: false, reason: 'error', error: normalizedError };
    } finally {
      busy = false;
    }
  }

  return {
    processFrame,
    updateConfig(nextConfig = {}) {
      workerConfig = normalizeWorkerConfig({ ...workerConfig, ...nextConfig });
      syncModelConfig(workerConfig);
    },
    getConfig() {
      return {
        ...workerConfig,
        inputResolution: { ...workerConfig.inputResolution },
        normalize: {
          mean: [...workerConfig.normalize.mean],
          std: [...workerConfig.normalize.std],
        },
      };
    },
    isBusy() {
      return busy;
    },
    dispose() {
      disposed = true;
    },
  };
}

export function preprocessFrameForInference(framePacket, config = {}) {
  const workerConfig = normalizeWorkerConfig(config);
  return preprocessFrame(framePacket, workerConfig, createTensorCache());
}
