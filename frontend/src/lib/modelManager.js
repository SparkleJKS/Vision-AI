import { API_BASE_URL } from '../configs/rest/api';

// Runtime preference is on-device first for latency and privacy.
// TFLite is prioritized because mobile delegates (GPU/NNAPI/XNNPACK) generally
// provide the best real-time throughput per watt on phones.
const RUNTIME_PRIORITY = ['tflite', 'onnx', 'server'];
const DEFAULT_SERVER_TIMEOUT_MS = 350;
const TFLITE_DELEGATES = ['auto', 'gpu', 'nnapi', 'xnnpack', 'cpu'];
const ONNX_OPT_LEVELS = ['disabled', 'basic', 'extended', 'all'];

const DEFAULT_CONFIG = Object.freeze({
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
});

const DEFAULT_MODEL_ASSETS = Object.freeze({
  tflite: 'assets/yolov8n.tflite',
  onnx: 'assets/yolov8n.onnx',
});
// Model swap safety:
// 1) Keep large binaries out of tracked git paths.
// 2) Ensure the new model matches expected inputResolution and YOLOv8-style output shape.
// 3) Call unload() before switching runtimes so native sessions are recreated cleanly.

function nowMs() {
  if (typeof globalThis?.performance?.now === 'function') {
    return globalThis.performance.now();
  }
  return Date.now();
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function toFiniteNumber(value, fallback = NaN) {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : fallback;
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

function normalizeConfig(config) {
  const merged = {
    ...DEFAULT_CONFIG,
    ...(config ?? {}),
  };

  const tfliteDelegate = TFLITE_DELEGATES.includes(merged.tfliteDelegate)
    ? merged.tfliteDelegate
    : DEFAULT_CONFIG.tfliteDelegate;
  const onnxGraphOptimizationLevel = ONNX_OPT_LEVELS.includes(merged.onnxGraphOptimizationLevel)
    ? merged.onnxGraphOptimizationLevel
    : DEFAULT_CONFIG.onnxGraphOptimizationLevel;

  const onnxExecutionProviders = Array.isArray(merged.onnxExecutionProviders)
    ? merged.onnxExecutionProviders
        .map((provider) => String(provider).trim().toLowerCase())
        .filter((provider) => provider.length > 0)
    : [...DEFAULT_CONFIG.onnxExecutionProviders];

  return {
    confidenceThreshold: clamp(
      toFiniteNumber(merged.confidenceThreshold, DEFAULT_CONFIG.confidenceThreshold),
      0,
      1,
    ),
    nmsIoU: clamp(toFiniteNumber(merged.nmsIoU, DEFAULT_CONFIG.nmsIoU), 0, 1),
    inputResolution: normalizeInputResolution(merged.inputResolution),
    serverTimeoutMs: Math.max(
      1,
      Math.trunc(toFiniteNumber(merged.serverTimeoutMs, DEFAULT_SERVER_TIMEOUT_MS)),
    ),
    tfliteDelegate,
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
    onnxGraphOptimizationLevel,
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
  };
}

function getRuntimeOptions(config, runtimeName) {
  if (runtimeName === 'tflite') {
    const fallbackDelegates =
      config.tfliteAllowNnapiFallback && config.tfliteDelegate === 'gpu'
        ? ['nnapi', 'xnnpack', 'cpu']
        : [];

    return {
      delegate: config.tfliteDelegate,
      fallbackDelegates,
      numThreads: config.tfliteNumThreads,
    };
  }

  if (runtimeName === 'onnx') {
    return {
      executionProviders: [...config.onnxExecutionProviders],
      sessionOptions: {
        graphOptimizationLevel: config.onnxGraphOptimizationLevel,
        intraOpNumThreads: config.onnxIntraOpThreads,
        interOpNumThreads: config.onnxInterOpThreads,
        enableCpuMemArena: config.onnxEnableCpuMemArena,
        enableMemPattern: config.onnxEnableMemPattern,
      },
    };
  }

  return {};
}

function parseErrorDetail(payload) {
  if (typeof payload === 'object' && payload !== null && 'detail' in payload) {
    const detail = payload.detail;
    if (typeof detail === 'string' && detail.trim().length > 0) {
      return detail;
    }
  }
  return null;
}

function normalizeBbox(input) {
  if (Array.isArray(input) && input.length >= 4) {
    const x1 = toFiniteNumber(input[0], NaN);
    const y1 = toFiniteNumber(input[1], NaN);
    const x2 = toFiniteNumber(input[2], NaN);
    const y2 = toFiniteNumber(input[3], NaN);
    if ([x1, y1, x2, y2].every(Number.isFinite)) {
      return [Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2)];
    }
  }

  if (typeof input === 'object' && input !== null) {
    const x1 = toFiniteNumber(input.x1 ?? input.left, NaN);
    const y1 = toFiniteNumber(input.y1 ?? input.top, NaN);
    const x2 = toFiniteNumber(input.x2 ?? input.right, NaN);
    const y2 = toFiniteNumber(input.y2 ?? input.bottom, NaN);
    if ([x1, y1, x2, y2].every(Number.isFinite)) {
      return [Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2)];
    }

    const x = toFiniteNumber(input.x, NaN);
    const y = toFiniteNumber(input.y, NaN);
    const width = toFiniteNumber(input.width ?? input.w, NaN);
    const height = toFiniteNumber(input.height ?? input.h, NaN);
    if ([x, y, width, height].every(Number.isFinite)) {
      return [x, y, x + width, y + height];
    }
  }

  return null;
}

function normalizeClassFields(prediction) {
  const rawClass = prediction.class ?? prediction.class_id ?? prediction.classId ?? prediction.cls;
  const rawName =
    prediction.class_name ?? prediction.className ?? prediction.label ?? prediction.name ?? null;

  let classId = null;
  let className = typeof rawName === 'string' && rawName.trim() ? rawName.trim() : null;

  if (typeof rawClass === 'number' && Number.isFinite(rawClass)) {
    classId = Math.trunc(rawClass);
  } else if (typeof rawClass === 'string' && rawClass.trim()) {
    const numericClass = Number(rawClass);
    if (Number.isFinite(numericClass)) {
      classId = Math.trunc(numericClass);
    } else if (!className) {
      className = rawClass.trim();
    }
  }

  if (className === null && classId !== null) {
    className = `class_${classId}`;
  }

  if (className === null) {
    className = 'unknown';
  }

  return {
    classId,
    className,
    classValue: classId ?? className,
  };
}

function normalizePrediction(prediction) {
  if (typeof prediction !== 'object' || prediction === null) {
    return null;
  }

  const bbox = normalizeBbox(prediction.bbox ?? prediction.box ?? prediction.xyxy ?? prediction.coords);
  if (!bbox) {
    return null;
  }

  const confidenceRaw =
    prediction.confidence ?? prediction.score ?? prediction.conf ?? prediction.probability;
  const confidence = clamp(toFiniteNumber(confidenceRaw, 0), 0, 1);
  const { classId, className, classValue } = normalizeClassFields(prediction);

  return {
    bbox,
    class: classValue,
    classId,
    className,
    confidence,
  };
}

function normalizeRuntimeResult(rawResult) {
  if (Array.isArray(rawResult)) {
    return {
      predictions: rawResult.map(normalizePrediction).filter(Boolean),
      inferMs: NaN,
    };
  }

  if (typeof rawResult === 'object' && rawResult !== null) {
    const rawPredictions = Array.isArray(rawResult.predictions)
      ? rawResult.predictions
      : Array.isArray(rawResult.objects)
        ? rawResult.objects
        : [];

    return {
      predictions: rawPredictions.map(normalizePrediction).filter(Boolean),
      inferMs: toFiniteNumber(
        rawResult.inferMs ?? rawResult.inference_ms ?? rawResult.processing_ms,
        NaN,
      ),
    };
  }

  return {
    predictions: [],
    inferMs: NaN,
  };
}

function iou(a, b) {
  const x1 = Math.max(a[0], b[0]);
  const y1 = Math.max(a[1], b[1]);
  const x2 = Math.min(a[2], b[2]);
  const y2 = Math.min(a[3], b[3]);

  const interW = Math.max(0, x2 - x1);
  const interH = Math.max(0, y2 - y1);
  const intersection = interW * interH;

  const areaA = Math.max(0, a[2] - a[0]) * Math.max(0, a[3] - a[1]);
  const areaB = Math.max(0, b[2] - b[0]) * Math.max(0, b[3] - b[1]);
  const union = areaA + areaB - intersection;

  if (union <= 0) {
    return 0;
  }
  return intersection / union;
}

function applyNms(predictions, confidenceThreshold, nmsIoU) {
  const filtered = predictions
    .filter((prediction) => prediction.confidence >= confidenceThreshold)
    .sort((a, b) => b.confidence - a.confidence);

  const groupedByClass = new Map();
  for (const prediction of filtered) {
    const classKey = `${prediction.classId ?? 'na'}:${prediction.className}`;
    if (!groupedByClass.has(classKey)) {
      groupedByClass.set(classKey, []);
    }
    groupedByClass.get(classKey).push(prediction);
  }

  const kept = [];
  for (const classPredictions of groupedByClass.values()) {
    const working = [...classPredictions];
    while (working.length > 0) {
      const current = working.shift();
      kept.push(current);

      for (let index = working.length - 1; index >= 0; index -= 1) {
        if (iou(current.bbox, working[index].bbox) > nmsIoU) {
          working.splice(index, 1);
        }
      }
    }
  }

  return kept.sort((a, b) => b.confidence - a.confidence);
}

function getNativeModules() {
  try {
    const reactNative = require('react-native');
    return reactNative?.NativeModules ?? {};
  } catch {
    return {};
  }
}

function getGlobalNativeBindings() {
  const bindings = globalThis?.__VISION_AI_BINDINGS__;
  if (typeof bindings === 'object' && bindings !== null) {
    return bindings;
  }
  return {};
}

class NativeRuntimeAdapter {
  constructor({ runtimeName, bindingCandidates, modelAsset }) {
    this.runtimeName = runtimeName;
    this.bindingCandidates = bindingCandidates;
    this.modelAsset = modelAsset;
    this.loaded = false;
    this.boundName = null;
  }

  resolveBinding() {
    const nativeModules = getNativeModules();
    const globalBindings = getGlobalNativeBindings();

    for (const candidate of this.bindingCandidates) {
      if (nativeModules[candidate]) {
        return { name: candidate, binding: nativeModules[candidate] };
      }
      if (globalBindings[candidate]) {
        return { name: candidate, binding: globalBindings[candidate] };
      }
    }

    return { name: null, binding: null };
  }

  async isAvailable() {
    const { binding } = this.resolveBinding();
    return Boolean(binding);
  }

  async load(config) {
    const { name, binding } = this.resolveBinding();
    if (!binding) {
      throw new Error(`${this.runtimeName} runtime is not available on this build.`);
    }

    this.boundName = name;

    // TODO(native): Wire this to the concrete Expo Module / JSI binding contract.
    // Expected native methods:
    // 1) loadModel({ modelAsset, inputResolution })
    // 2) infer({ input, confidenceThreshold, nmsIoU, inputResolution })
    // 3) unloadModel()
    if (typeof binding.loadModel === 'function') {
      await binding.loadModel({
        modelAsset: this.modelAsset,
        inputResolution: config.inputResolution,
        runtimeOptions: getRuntimeOptions(config, this.runtimeName),
      });
    }

    this.loaded = true;
  }

  async unload() {
    if (!this.loaded) {
      return;
    }

    const { binding } = this.resolveBinding();
    if (binding && typeof binding.unloadModel === 'function') {
      await binding.unloadModel();
    }

    this.loaded = false;
    this.boundName = null;
  }

  async infer(input, config) {
    const { binding } = this.resolveBinding();
    if (!binding) {
      throw new Error(`${this.runtimeName} runtime is no longer available.`);
    }

    const inferCall = binding.infer ?? binding.runInference ?? binding.run;
    if (typeof inferCall !== 'function') {
      throw new Error(`${this.runtimeName} binding does not expose an infer method.`);
    }

    const localInput = input?.frameTensor ?? input?.imageBuffer ?? input;
    if (localInput == null) {
      throw new Error(`${this.runtimeName} runtime requires frameTensor or imageBuffer input.`);
    }

    const startedAt = nowMs();
    const rawResult = await inferCall.call(binding, {
      input: localInput,
      frameTensor: input?.frameTensor ?? null,
      imageBuffer: input?.imageBuffer ?? null,
      frameMeta: input?.frameMeta ?? null,
      confidenceThreshold: config.confidenceThreshold,
      nmsIoU: config.nmsIoU,
      inputResolution: config.inputResolution,
      runtimeOptions: getRuntimeOptions(config, this.runtimeName),
    });
    const normalized = normalizeRuntimeResult(rawResult);

    return {
      predictions: normalized.predictions,
      inferMs: toFiniteNumber(normalized.inferMs, nowMs() - startedAt),
    };
  }
}

function isBlobInstance(value) {
  return typeof Blob !== 'undefined' && value instanceof Blob;
}

function toByteArray(value) {
  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  }

  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }

  return null;
}

function resolveUploadValue(input) {
  const candidate = input?.imageBuffer ?? input;

  if (typeof candidate === 'string' && candidate.trim()) {
    return {
      uri: candidate,
      name: `frame-${Date.now()}.jpg`,
      type: 'image/jpeg',
    };
  }

  if (typeof candidate === 'object' && candidate !== null) {
    if (typeof candidate.uri === 'string' && candidate.uri.trim()) {
      return {
        uri: candidate.uri,
        name: candidate.name ?? `frame-${Date.now()}.jpg`,
        type: candidate.type ?? candidate.mimeType ?? 'image/jpeg',
      };
    }

    if (isBlobInstance(candidate)) {
      return candidate;
    }

    const bytes = toByteArray(candidate);
    if (bytes && typeof Blob !== 'undefined') {
      return new Blob([bytes], { type: 'image/jpeg' });
    }
  }

  return null;
}

class ServerRuntimeAdapter {
  constructor({ baseUrl, timeoutMs }) {
    this.runtimeName = 'server';
    this.baseUrl = baseUrl;
    this.timeoutMs = timeoutMs;
  }

  async isAvailable() {
    return typeof this.baseUrl === 'string' && this.baseUrl.trim().length > 0;
  }

  async load() {}

  async unload() {}

  async infer(input) {
    const uploadValue = resolveUploadValue(input);
    if (!uploadValue) {
      throw new Error('Server fallback requires an imageBuffer or URI-compatible input.');
    }

    const formData = new FormData();
    if (isBlobInstance(uploadValue)) {
      formData.append('file', uploadValue, `frame-${Date.now()}.jpg`);
    } else {
      formData.append('file', uploadValue);
    }

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutHandle =
      controller !== null
        ? setTimeout(() => {
            controller.abort();
          }, this.timeoutMs)
        : null;

    const startedAt = nowMs();

    try {
      const response = await fetch(`${this.baseUrl}/v1/detect`, {
        method: 'POST',
        body: formData,
        signal: controller?.signal,
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const detail = parseErrorDetail(payload);
        throw new Error(detail ?? `Server inference failed with status ${response.status}.`);
      }

      const normalized = normalizeRuntimeResult(payload);
      return {
        predictions: normalized.predictions,
        inferMs: toFiniteNumber(normalized.inferMs, nowMs() - startedAt),
      };
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw new Error(`Server inference timed out after ${this.timeoutMs} ms.`);
      }
      throw error;
    } finally {
      if (timeoutHandle !== null) {
        clearTimeout(timeoutHandle);
      }
    }
  }
}

function formatError(error) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export class ModelManager {
  constructor(config = {}) {
    this.config = normalizeConfig(config);
    this.activeRuntime = null;
    this.loadedRuntime = null;

    this.adapters = new Map([
      [
        'tflite',
        new NativeRuntimeAdapter({
          runtimeName: 'tflite',
          bindingCandidates: ['VisionAITFLite', 'VisionAiTFLite', 'TFLiteInference'],
          modelAsset: DEFAULT_MODEL_ASSETS.tflite,
        }),
      ],
      [
        'onnx',
        new NativeRuntimeAdapter({
          runtimeName: 'onnx',
          bindingCandidates: ['VisionAIOnnx', 'VisionAIONNX', 'ONNXInference'],
          modelAsset: DEFAULT_MODEL_ASSETS.onnx,
        }),
      ],
      [
        'server',
        new ServerRuntimeAdapter({
          baseUrl: API_BASE_URL,
          timeoutMs: this.config.serverTimeoutMs,
        }),
      ],
    ]);
  }

  getConfig() {
    return {
      ...this.config,
      inputResolution: [...this.config.inputResolution],
      onnxExecutionProviders: [...this.config.onnxExecutionProviders],
    };
  }

  setConfig(nextConfig = {}) {
    this.config = normalizeConfig({
      ...this.config,
      ...nextConfig,
    });

    const serverAdapter = this.adapters.get('server');
    if (serverAdapter) {
      serverAdapter.timeoutMs = this.config.serverTimeoutMs;
    }
  }

  async detectAvailableRuntimes() {
    const availability = [];

    for (const runtimeName of RUNTIME_PRIORITY) {
      const adapter = this.adapters.get(runtimeName);
      const available = adapter ? await adapter.isAvailable() : false;
      availability.push({ runtime: runtimeName, available });
    }

    return availability;
  }

  getActiveRuntime() {
    return this.activeRuntime;
  }

  async load() {
    const errors = [];

    for (const runtimeName of RUNTIME_PRIORITY) {
      const adapter = this.adapters.get(runtimeName);
      if (!adapter || !(await adapter.isAvailable())) {
        continue;
      }

      try {
        await this.loadRuntime(runtimeName);
        return runtimeName;
      } catch (error) {
        errors.push(`${runtimeName}: ${formatError(error)}`);
      }
    }

    const message = errors.length
      ? `No runtime could be loaded (${errors.join(' | ')}).`
      : 'No runtime is currently available.';
    throw new Error(message);
  }

  async loadRuntime(runtimeName) {
    const adapter = this.adapters.get(runtimeName);
    if (!adapter) {
      throw new Error(`Unknown runtime "${runtimeName}".`);
    }

    if (!(await adapter.isAvailable())) {
      throw new Error(`Runtime "${runtimeName}" is not available.`);
    }

    if (this.loadedRuntime && this.loadedRuntime !== runtimeName) {
      await this.unload();
    }

    if (this.loadedRuntime !== runtimeName) {
      await adapter.load(this.config);
      this.loadedRuntime = runtimeName;
    }

    this.activeRuntime = runtimeName;
    return runtimeName;
  }

  async unload() {
    if (!this.loadedRuntime) {
      this.activeRuntime = null;
      return;
    }

    const adapter = this.adapters.get(this.loadedRuntime);
    if (adapter) {
      await adapter.unload();
    }

    this.loadedRuntime = null;
    this.activeRuntime = null;
  }

  // Single async inference API used by camera/worker layers:
  // infer(frameTensor | imageBuffer) -> { predictions, inferMs }
  async infer(input) {
    const attemptOrder = this.getAttemptOrder();
    const errors = [];

    for (const runtimeName of attemptOrder) {
      const adapter = this.adapters.get(runtimeName);
      if (!adapter || !(await adapter.isAvailable())) {
        continue;
      }

      try {
        await this.loadRuntime(runtimeName);
        const result = await adapter.infer(input, this.config);
        const postNms = applyNms(
          result.predictions,
          this.config.confidenceThreshold,
          this.config.nmsIoU,
        );

        this.activeRuntime = runtimeName;
        return {
          predictions: postNms,
          inferMs: toFiniteNumber(result.inferMs, NaN),
        };
      } catch (error) {
        errors.push(`${runtimeName}: ${formatError(error)}`);
        // Fail over immediately to the next runtime.
        // Server is deliberately the final fallback when on-device runtimes fail.

        if (this.loadedRuntime === runtimeName) {
          const loadedAdapter = this.adapters.get(runtimeName);
          if (loadedAdapter) {
            try {
              await loadedAdapter.unload();
            } catch {
              // Intentionally swallow unload failures while failing over.
            }
          }
          this.loadedRuntime = null;
        }
      }
    }

    throw new Error(`Inference failed for all runtimes (${errors.join(' | ')}).`);
  }

  getAttemptOrder() {
    if (!this.activeRuntime || !RUNTIME_PRIORITY.includes(this.activeRuntime)) {
      return [...RUNTIME_PRIORITY];
    }

    const ordered = [this.activeRuntime];
    for (const runtimeName of RUNTIME_PRIORITY) {
      if (runtimeName !== this.activeRuntime) {
        ordered.push(runtimeName);
      }
    }

    return ordered;
  }
}

export function createModelManager(config = {}) {
  return new ModelManager(config);
}

const modelManager = createModelManager();
export default modelManager;
