import { Platform } from 'react-native';

const RUNTIME_PRIORITY = Object.freeze(['tflite', 'onnx', 'server']);
const SERVER_DETECT_PATH = '/v1/detect';
const DEFAULT_RUNTIME_COOLDOWN_MS = 10_000;

const DEFAULT_CONFIG = Object.freeze({
  confidenceThreshold: 0.25,
  nmsIoU: 0.45,
  inputResolution: 640,
  serverTimeoutMs: 300,
});

const GLOBAL_TFLITE_BINDING_KEY = '__VISIONAI_TFLITE__';
const GLOBAL_ONNX_BINDING_KEY = '__VISIONAI_ONNX__';

function nowMs() {
  if (typeof globalThis.performance?.now === 'function') {
    return globalThis.performance.now();
  }
  return Date.now();
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
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

  return { width: DEFAULT_CONFIG.inputResolution, height: DEFAULT_CONFIG.inputResolution };
}

function normalizeConfig(config = {}) {
  const normalizedResolution = normalizeInputResolution(config.inputResolution);

  return {
    confidenceThreshold: clamp(
      isFiniteNumber(config.confidenceThreshold)
        ? config.confidenceThreshold
        : DEFAULT_CONFIG.confidenceThreshold,
      0,
      1,
    ),
    nmsIoU: clamp(
      isFiniteNumber(config.nmsIoU) ? config.nmsIoU : DEFAULT_CONFIG.nmsIoU,
      0,
      1,
    ),
    inputResolution: normalizedResolution,
    serverTimeoutMs:
      isFiniteNumber(config.serverTimeoutMs) && config.serverTimeoutMs > 0
        ? Math.floor(config.serverTimeoutMs)
        : DEFAULT_CONFIG.serverTimeoutMs,
  };
}

function getDefaultServerBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv && typeof fromEnv === 'string') {
    return fromEnv.replace(/\/+$/, '');
  }

  const defaultHost = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
  return `http://${defaultHost}:8000`;
}

function resolveModelUri(rawValue, runtime) {
  if (typeof rawValue === 'string' && rawValue.trim().length > 0) {
    return rawValue.trim();
  }

  // TODO(native): Replace with resolved asset URI from your selected runtime package.
  return runtime === 'tflite' ? 'yolov8n.tflite' : 'yolov8n.onnx';
}

function resolveNativeBinding(explicitBinding, globalKey) {
  if (explicitBinding) {
    return explicitBinding;
  }

  if (globalThis && globalThis[globalKey]) {
    return globalThis[globalKey];
  }

  return null;
}

function pickMethod(target, names) {
  for (const methodName of names) {
    if (typeof target?.[methodName] === 'function') {
      return target[methodName].bind(target);
    }
  }
  return null;
}

function isBinaryLike(value) {
  if (!value) {
    return false;
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return true;
  }

  if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView(value)) {
    return true;
  }

  return false;
}

function isImageUriLike(value) {
  return Boolean(
    value &&
      typeof value === 'object' &&
      typeof value.uri === 'string' &&
      value.uri.length > 0,
  );
}

function normalizeInferInput(input) {
  if (!input) {
    throw new Error('infer(frameTensor | imageBuffer) requires a non-empty input.');
  }

  if (typeof input === 'object' && ('frameTensor' in input || 'imageBuffer' in input)) {
    return {
      frameTensor: input.frameTensor ?? null,
      imageBuffer: input.imageBuffer ?? null,
    };
  }

  if (isBinaryLike(input) || isImageUriLike(input)) {
    return { frameTensor: null, imageBuffer: input };
  }

  // Default assumption: this is a tensor-like object from the frame processor.
  return { frameTensor: input, imageBuffer: null };
}

function asNumber(value, fallback = 0) {
  return isFiniteNumber(value) ? value : fallback;
}

function normalizeBBox(rawValue) {
  if (!Array.isArray(rawValue) || rawValue.length < 4) {
    return null;
  }
  return [
    asNumber(rawValue[0]),
    asNumber(rawValue[1]),
    asNumber(rawValue[2]),
    asNumber(rawValue[3]),
  ];
}

function normalizePrediction(rawPrediction) {
  if (!rawPrediction || typeof rawPrediction !== 'object') {
    return null;
  }

  const bbox = normalizeBBox(
    rawPrediction.bbox ??
      rawPrediction.box ??
      rawPrediction.bbox_xyxy ??
      rawPrediction.xyxy,
  );
  if (!bbox) {
    return null;
  }

  const confidence = asNumber(rawPrediction.confidence ?? rawPrediction.score, NaN);
  if (!Number.isFinite(confidence)) {
    return null;
  }

  const classIdRaw = rawPrediction.class_id ?? rawPrediction.classId ?? rawPrediction.cls;
  const classId = Number.isInteger(classIdRaw) ? classIdRaw : null;

  const classNameRaw =
    rawPrediction.class_name ?? rawPrediction.className ?? rawPrediction.label;
  const className =
    typeof classNameRaw === 'string' && classNameRaw.length > 0
      ? classNameRaw
      : classId !== null
        ? String(classId)
        : 'unknown';

  return {
    bbox,
    class: className,
    classId,
    className,
    confidence,
  };
}

function intersectionOverUnion(a, b) {
  const x1 = Math.max(a[0], b[0]);
  const y1 = Math.max(a[1], b[1]);
  const x2 = Math.min(a[2], b[2]);
  const y2 = Math.min(a[3], b[3]);

  const overlapW = Math.max(0, x2 - x1);
  const overlapH = Math.max(0, y2 - y1);
  const overlapArea = overlapW * overlapH;

  if (overlapArea <= 0) {
    return 0;
  }

  const areaA = Math.max(0, a[2] - a[0]) * Math.max(0, a[3] - a[1]);
  const areaB = Math.max(0, b[2] - b[0]) * Math.max(0, b[3] - b[1]);
  const denom = areaA + areaB - overlapArea;

  if (denom <= 0) {
    return 0;
  }

  return overlapArea / denom;
}

function applyClassAwareNms(predictions, iouThreshold) {
  const grouped = new Map();
  for (const prediction of predictions) {
    const key = prediction.className || prediction.classId || 'unknown';
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(prediction);
  }

  const selected = [];
  for (const classPredictions of grouped.values()) {
    const sorted = [...classPredictions].sort((a, b) => b.confidence - a.confidence);

    while (sorted.length > 0) {
      const current = sorted.shift();
      selected.push(current);

      for (let i = sorted.length - 1; i >= 0; i -= 1) {
        const other = sorted[i];
        const iou = intersectionOverUnion(current.bbox, other.bbox);
        if (iou > iouThreshold) {
          sorted.splice(i, 1);
        }
      }
    }
  }

  return selected.sort((a, b) => b.confidence - a.confidence);
}

function postprocessPredictions(rawPredictions, config) {
  const normalized = [];
  for (const rawPrediction of rawPredictions ?? []) {
    const prediction = normalizePrediction(rawPrediction);
    if (!prediction) {
      continue;
    }
    if (prediction.confidence < config.confidenceThreshold) {
      continue;
    }
    normalized.push(prediction);
  }

  return applyClassAwareNms(normalized, config.nmsIoU);
}

function formatError(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return String(error);
}

function parseServerPredictions(payload) {
  if (Array.isArray(payload?.detections)) {
    return payload.detections;
  }
  if (Array.isArray(payload?.objects)) {
    return payload.objects;
  }
  return [];
}

function extractInferMs(payload, fallbackMs) {
  const fromTiming = asNumber(payload?.timings_ms?.total, NaN);
  if (Number.isFinite(fromTiming)) {
    return Math.round(fromTiming);
  }

  const fromProcessing = asNumber(payload?.processing_ms, NaN);
  if (Number.isFinite(fromProcessing)) {
    return Math.round(fromProcessing);
  }

  return Math.round(fallbackMs);
}

function toUint8Array(input) {
  if (typeof ArrayBuffer !== 'undefined' && input instanceof ArrayBuffer) {
    return new Uint8Array(input);
  }

  if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView(input)) {
    return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  }

  throw new Error('Unsupported binary input for server fallback.');
}

function appendImagePart(formData, imageBuffer) {
  if (isImageUriLike(imageBuffer)) {
    formData.append('file', {
      uri: imageBuffer.uri,
      name: imageBuffer.name || `frame-${Date.now()}.jpg`,
      type: imageBuffer.type || imageBuffer.mimeType || 'image/jpeg',
    });
    return;
  }

  if (isBinaryLike(imageBuffer) && typeof Blob !== 'undefined') {
    const bytes = toUint8Array(imageBuffer);
    const blob = new Blob([bytes], { type: 'image/jpeg' });
    formData.append('file', blob, `frame-${Date.now()}.jpg`);
    return;
  }

  throw new Error(
    'Server fallback expects an imageBuffer as { uri, type?, name? } or binary bytes.',
  );
}

async function fetchWithTimeout(fetchImpl, url, init, timeoutMs) {
  const timeout = Math.max(1, timeoutMs);
  const controller =
    typeof AbortController !== 'undefined' ? new AbortController() : null;

  let timeoutId = null;
  if (controller) {
    timeoutId = setTimeout(() => controller.abort(), timeout);
  }

  try {
    return await fetchImpl(url, controller ? { ...init, signal: controller.signal } : init);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

class NativeRuntimeBackend {
  constructor({ runtime, binding, modelUri, config }) {
    this.runtime = runtime;
    this.binding = binding;
    this.modelUri = modelUri;
    this.config = config;
    this.isLoaded = false;
  }

  available() {
    if (!this.binding) {
      return false;
    }

    const isAvailable = pickMethod(this.binding, ['isAvailable']);
    if (!isAvailable) {
      return true;
    }

    try {
      return Boolean(isAvailable());
    } catch {
      return false;
    }
  }

  async load() {
    if (this.isLoaded) {
      return;
    }

    const loadModel = pickMethod(this.binding, ['loadModel', 'load', 'initialize']);
    if (!loadModel) {
      throw new Error(`${this.runtime} binding does not expose loadModel/load/initialize.`);
    }

    // TODO(native): Align this payload with the final native module API.
    await loadModel({
      modelUri: this.modelUri,
      inputResolution: this.config.inputResolution,
    });
    this.isLoaded = true;
  }

  async unload() {
    if (!this.isLoaded) {
      return;
    }

    const unloadModel = pickMethod(this.binding, ['unloadModel', 'unload', 'dispose']);
    if (unloadModel) {
      await unloadModel();
    }
    this.isLoaded = false;
  }

  async infer(normalizedInput) {
    if (!this.isLoaded) {
      await this.load();
    }

    const runInference = pickMethod(this.binding, ['runInference', 'infer', 'run']);
    if (!runInference) {
      throw new Error(`${this.runtime} binding does not expose runInference/infer/run.`);
    }

    const startMs = nowMs();
    // TODO(native): Replace this generic payload with concrete tensor/image interfaces.
    const output = await runInference({
      frameTensor: normalizedInput.frameTensor,
      imageBuffer: normalizedInput.imageBuffer,
      confidenceThreshold: this.config.confidenceThreshold,
      nmsIoU: this.config.nmsIoU,
      inputResolution: this.config.inputResolution,
    });
    const elapsedMs = nowMs() - startMs;

    if (Array.isArray(output)) {
      return { predictions: output, inferMs: elapsedMs };
    }

    return {
      predictions: output?.predictions ?? [],
      inferMs: asNumber(output?.inferMs, elapsedMs),
    };
  }
}

class ServerRuntimeBackend {
  constructor({ baseUrl, path, fetchImpl, config }) {
    this.runtime = 'server';
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.path = path;
    this.fetchImpl = fetchImpl;
    this.config = config;
  }

  available() {
    return typeof this.fetchImpl === 'function';
  }

  async load() {
    // No persistent model load step on client side for server runtime.
  }

  async unload() {
    // No local resources to free for server runtime.
  }

  async infer(normalizedInput) {
    if (!normalizedInput.imageBuffer) {
      // TODO(native): Add tensor-to-image encoding if server fallback should accept frameTensor-only input.
      throw new Error('Server fallback requires imageBuffer input.');
    }

    const formData = new FormData();
    appendImagePart(formData, normalizedInput.imageBuffer);
    formData.append(
      'meta',
      JSON.stringify({
        schema_version: '1.0',
        score_threshold: this.config.confidenceThreshold,
        iou_threshold: this.config.nmsIoU,
        input_resolution: this.config.inputResolution,
      }),
    );

    const url = `${this.baseUrl}${this.path}`;
    const startMs = nowMs();
    const response = await fetchWithTimeout(
      this.fetchImpl,
      url,
      {
        method: 'POST',
        body: formData,
      },
      this.config.serverTimeoutMs,
    );

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const detail =
        typeof payload?.detail === 'string'
          ? payload.detail
          : `Server inference failed with status ${response.status}.`;
      throw new Error(detail);
    }

    const elapsedMs = nowMs() - startMs;
    return {
      predictions: parseServerPredictions(payload),
      inferMs: extractInferMs(payload, elapsedMs),
    };
  }
}

export class ModelManager {
  constructor(options = {}) {
    this.config = normalizeConfig(options.config);
    this.runtimeCooldownMs =
      isFiniteNumber(options.runtimeCooldownMs) && options.runtimeCooldownMs >= 0
        ? options.runtimeCooldownMs
        : DEFAULT_RUNTIME_COOLDOWN_MS;

    this.modelUris = {
      tflite: resolveModelUri(options.tfliteModelUri, 'tflite'),
      onnx: resolveModelUri(options.onnxModelUri, 'onnx'),
    };

    this.serverBaseUrl =
      typeof options.serverBaseUrl === 'string' && options.serverBaseUrl.trim().length > 0
        ? options.serverBaseUrl.trim()
        : getDefaultServerBaseUrl();

    this.nativeBindings = {
      tflite: resolveNativeBinding(options.tfliteBinding, GLOBAL_TFLITE_BINDING_KEY),
      onnx: resolveNativeBinding(options.onnxBinding, GLOBAL_ONNX_BINDING_KEY),
    };

    this.fetchImpl =
      options.fetchImpl || (typeof globalThis.fetch === 'function' ? globalThis.fetch.bind(globalThis) : null);

    this.backendInstances = new Map();
    this.runtimeAvailability = {
      tflite: false,
      onnx: false,
      server: false,
    };
    this.runtimeBackoffUntilMs = {
      tflite: 0,
      onnx: 0,
      server: 0,
    };
    this.activeRuntime = null;
  }

  updateConfig(nextConfig = {}) {
    this.config = normalizeConfig({ ...this.config, ...nextConfig });

    for (const backend of this.backendInstances.values()) {
      backend.config = this.config;
    }
  }

  getActiveRuntime() {
    return this.activeRuntime;
  }

  async detectAvailableRuntimes({ refresh = false } = {}) {
    if (!refresh && Object.values(this.runtimeAvailability).some(Boolean)) {
      return { ...this.runtimeAvailability };
    }

    const now = nowMs();
    const tfliteBackend = this._buildBackend('tflite');
    const onnxBackend = this._buildBackend('onnx');
    const serverBackend = this._buildBackend('server');

    this.runtimeAvailability.tflite =
      now >= this.runtimeBackoffUntilMs.tflite && tfliteBackend.available();
    this.runtimeAvailability.onnx =
      now >= this.runtimeBackoffUntilMs.onnx && onnxBackend.available();
    this.runtimeAvailability.server =
      now >= this.runtimeBackoffUntilMs.server && serverBackend.available();

    return { ...this.runtimeAvailability };
  }

  async load() {
    await this.detectAvailableRuntimes({ refresh: true });

    let lastError = null;
    for (const runtime of RUNTIME_PRIORITY) {
      if (!this.runtimeAvailability[runtime]) {
        continue;
      }

      try {
        const backend = this._getOrCreateBackend(runtime);
        await backend.load();
        this.activeRuntime = runtime;
        return runtime;
      } catch (error) {
        lastError = error;
        this._markRuntimeFailure(runtime);
        await this._unloadRuntime(runtime);
      }
    }

    throw new Error(
      `No runtime could be loaded. Last error: ${formatError(lastError)}`,
    );
  }

  async unload() {
    const runtimes = [...this.backendInstances.keys()];
    for (const runtime of runtimes) {
      await this._unloadRuntime(runtime);
    }
    this.activeRuntime = null;
  }

  async infer(frameTensorOrImageBuffer) {
    const normalizedInput = normalizeInferInput(frameTensorOrImageBuffer);
    const availability = await this.detectAvailableRuntimes({ refresh: true });

    let lastError = null;
    for (const runtime of RUNTIME_PRIORITY) {
      if (!availability[runtime]) {
        continue;
      }

      try {
        const backend = this._getOrCreateBackend(runtime);
        await backend.load();
        const output = await backend.infer(normalizedInput);
        const predictions = postprocessPredictions(output.predictions, this.config);

        this.activeRuntime = runtime;
        this.runtimeBackoffUntilMs[runtime] = 0;
        return {
          predictions,
          inferMs: Math.round(asNumber(output.inferMs, 0)),
        };
      } catch (error) {
        lastError = error;
        this._markRuntimeFailure(runtime);
        await this._unloadRuntime(runtime);
      }
    }

    throw new Error(
      `Inference failed across runtimes (tflite -> onnx -> server): ${formatError(lastError)}`,
    );
  }

  _markRuntimeFailure(runtime) {
    this.runtimeAvailability[runtime] = false;
    this.runtimeBackoffUntilMs[runtime] = nowMs() + this.runtimeCooldownMs;
  }

  _getOrCreateBackend(runtime) {
    const existing = this.backendInstances.get(runtime);
    if (existing) {
      return existing;
    }

    const backend = this._buildBackend(runtime);
    this.backendInstances.set(runtime, backend);
    return backend;
  }

  _buildBackend(runtime) {
    if (runtime === 'tflite') {
      return new NativeRuntimeBackend({
        runtime: 'tflite',
        binding: this.nativeBindings.tflite,
        modelUri: this.modelUris.tflite,
        config: this.config,
      });
    }

    if (runtime === 'onnx') {
      return new NativeRuntimeBackend({
        runtime: 'onnx',
        binding: this.nativeBindings.onnx,
        modelUri: this.modelUris.onnx,
        config: this.config,
      });
    }

    return new ServerRuntimeBackend({
      baseUrl: this.serverBaseUrl,
      path: SERVER_DETECT_PATH,
      fetchImpl: this.fetchImpl,
      config: this.config,
    });
  }

  async _unloadRuntime(runtime) {
    const backend = this.backendInstances.get(runtime);
    if (!backend) {
      return;
    }

    try {
      await backend.unload();
    } finally {
      this.backendInstances.delete(runtime);
    }
  }
}

export function createModelManager(options = {}) {
  return new ModelManager(options);
}
