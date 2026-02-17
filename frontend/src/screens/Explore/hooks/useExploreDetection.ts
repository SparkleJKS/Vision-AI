import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import modelManager from '@/lib/modelManager';
import { formatError } from '../utils';
import type {
  InferenceResult,
  ModelRuntime,
  Prediction,
  RuntimeStatus,
  TfliteDelegate,
} from '../types';
import type { ApplyRuntimeOptions } from '../types';
import {
  INPUT_RESOLUTION,
  LATENCY_GRAPH_POINTS,
  MAX_INFERENCE_FPS,
  NMS_IOU,
  ONNX_EXECUTION_PROVIDERS,
  ONNX_GRAPH_OPT_LEVEL,
  ONNX_INTER_OP_THREADS,
  ONNX_INTRA_OP_THREADS,
} from '../config';

export interface UseExploreDetectionOptions {
  isFocused: boolean;
  selectedRuntime: ModelRuntime;
  tfliteDelegate: TfliteDelegate;
  nmsEnabled: boolean;
}

export function useExploreDetection({
  isFocused,
  selectedRuntime,
  tfliteDelegate,
  nmsEnabled,
}: UseExploreDetectionOptions) {
  const lastFrameAtRef = useRef<number | null>(null);

  const [isDetecting, setIsDetecting] = useState(false);
  const [activeRuntime, setActiveRuntime] = useState<string | null>(null);
  const [runtimeStatus, setRuntimeStatus] = useState<RuntimeStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [fps, setFps] = useState<number | null>(null);
  const [inferMs, setInferMs] = useState<number | null>(null);
  const [preprocessMs, setPreprocessMs] = useState<number | null>(null);
  const [totalMs, setTotalMs] = useState<number | null>(null);
  const [latencyHistory, setLatencyHistory] = useState<number[]>([]);
  const [currentStride, setCurrentStride] = useState(1);
  const [droppedFrames, setDroppedFrames] = useState(0);
  const [targetBudgetMs, setTargetBudgetMs] = useState(1000 / MAX_INFERENCE_FPS);
  const [modelSize, setModelSize] = useState<number[]>(INPUT_RESOLUTION as unknown as number[]);
  const [sourceSize, setSourceSize] = useState<number[]>(INPUT_RESOLUTION as unknown as number[]);
  const [isSwitchingRuntime, setIsSwitchingRuntime] = useState(false);

  const effectiveNmsIoU = nmsEnabled ? NMS_IOU : 1;

  const applyRuntimePreference = useCallback(
    async (runtime: ModelRuntime, options: ApplyRuntimeOptions = {}) => {
      setIsSwitchingRuntime(true);
      setRuntimeStatus('loading');
      const resolvedDelegate =
        typeof options.tfliteDelegate === 'string' ? options.tfliteDelegate : tfliteDelegate;

      try {
        modelManager.setConfig({
          inputResolution: INPUT_RESOLUTION,
          tfliteDelegate: resolvedDelegate,
          tfliteAllowNnapiFallback: true,
          tfliteNumThreads: 4,
          onnxExecutionProviders: ONNX_EXECUTION_PROVIDERS,
          onnxGraphOptimizationLevel: ONNX_GRAPH_OPT_LEVEL,
          onnxIntraOpThreads: ONNX_INTRA_OP_THREADS,
          onnxInterOpThreads: ONNX_INTER_OP_THREADS,
          onnxEnableCpuMemArena: true,
          onnxEnableMemPattern: true,
        });
        await modelManager.loadRuntime(runtime);
        const active = modelManager.getActiveRuntime?.() ?? runtime;
        setActiveRuntime(active);
        setRuntimeStatus(isDetecting ? 'running' : 'ready');
        setStatusMessage(null);
        return true;
      } catch (error: unknown) {
        setRuntimeStatus('fallback');
        setStatusMessage(formatError(error));
        return false;
      } finally {
        setIsSwitchingRuntime(false);
      }
    },
    [isDetecting, tfliteDelegate],
  );

  const handleInferenceResult = useCallback((result: InferenceResult) => {
    const nextPredictions = Array.isArray(result?.predictions) ? result.predictions : [];
    setPredictions(nextPredictions);

    if (Array.isArray(result?.inputSize) && result.inputSize.length === 2) {
      setModelSize(result.inputSize);
    }
    if (Array.isArray(result?.sourceSize) && result.sourceSize.length === 2) {
      setSourceSize(result.sourceSize);
    }

    const inferMsVal = result?.inferMs;
    if (inferMsVal != null && Number.isFinite(inferMsVal)) setInferMs(inferMsVal);

    const preprocessMsVal = result?.preprocessMs;
    if (preprocessMsVal != null && Number.isFinite(preprocessMsVal)) setPreprocessMs(preprocessMsVal);

    const totalMsVal = result?.totalMs;
    if (totalMsVal != null && Number.isFinite(totalMsVal)) {
      setTotalMs(totalMsVal);
      setLatencyHistory((prev) => [...prev, totalMsVal].slice(-LATENCY_GRAPH_POINTS));
    }

    const processEveryNVal = result?.processEveryN;
    if (processEveryNVal != null && Number.isFinite(processEveryNVal)) {
      setCurrentStride(Math.max(1, processEveryNVal));
    }

    const droppedVal = result?.droppedFramesSinceLast;
    if (droppedVal != null && Number.isFinite(droppedVal)) setDroppedFrames(droppedVal);

    const budgetVal = result?.targetBudgetMs;
    if (budgetVal != null && Number.isFinite(budgetVal)) setTargetBudgetMs(budgetVal);

    const now = Date.now();
    if (lastFrameAtRef.current !== null) {
      const elapsed = Math.max(1, now - lastFrameAtRef.current);
      const instantFps = 1000 / elapsed;
      setFps((prev) => (prev === null ? instantFps : prev * 0.7 + instantFps * 0.3));
    }
    lastFrameAtRef.current = now;

    setActiveRuntime(result?.runtime ?? modelManager.getActiveRuntime?.() ?? null);
    setRuntimeStatus('running');
    setStatusMessage(null);
  }, []);

  const handleInferenceError = useCallback((error: unknown) => {
    setRuntimeStatus('error');
    setStatusMessage(formatError(error));
  }, []);

  const stopDetection = useCallback(() => {
    setIsDetecting(false);
    setRuntimeStatus('ready');
    lastFrameAtRef.current = null;
  }, []);

  const startDetection = useCallback(
    async (runtime: ModelRuntime) => {
      lastFrameAtRef.current = null;
      setFps(null);
      setLatencyHistory([]);
      setDroppedFrames(0);
      setCurrentStride(1);
      setTotalMs(null);
      const ok = await applyRuntimePreference(runtime);
      if (ok) setIsDetecting(true);
    },
    [applyRuntimePreference],
  );

  const latencyBars = useMemo(() => {
    if (latencyHistory.length === 0) return [];
    const maxLatency = Math.max(1, ...latencyHistory);
    return latencyHistory.map((value, index) => ({
      key: `lat-${index}`,
      heightPct: Math.max(8, Math.min(100, (value / maxLatency) * 100)),
      isSlow: value > targetBudgetMs * 1.15,
    }));
  }, [latencyHistory, targetBudgetMs]);

  return {
    isDetecting,
    setIsDetecting,
    activeRuntime,
    runtimeStatus,
    statusMessage,
    predictions,
    fps,
    inferMs,
    preprocessMs,
    totalMs,
    currentStride,
    droppedFrames,
    targetBudgetMs,
    modelSize,
    sourceSize,
    isSwitchingRuntime,
    effectiveNmsIoU,
    applyRuntimePreference,
    handleInferenceResult,
    handleInferenceError,
    startDetection,
    stopDetection,
    latencyBars,
  };
}
