import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { scheduleOnRN } from 'react-native-worklets';
import {
  Camera,
  runAsync,
  runAtTargetFps,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
} from 'react-native-vision-camera';
import type { Frame } from 'react-native-vision-camera';

import { createInferenceWorker } from '@/workers/inferenceWorker';
import type { InferenceWorker } from '@/workers/inferenceWorker';
import { DEFAULT_MAX_INFERENCE_FPS, DEFAULT_INPUT_RESOLUTION, DEFAULT_ONNX_PROVIDERS } from './config';
import { normalizeMaxInferenceFps, normalizeInputResolution, normalizeExecutionProviders } from './utils';
import type { CameraViewRef, CameraViewProps, FramePacket } from './types';

const CameraView = forwardRef<CameraViewRef | null, CameraViewProps>(function CameraView(
  {
    style,
    isActive = true,
    detectionEnabled = isActive,
    facing = 'back',
    maxInferenceFps = DEFAULT_MAX_INFERENCE_FPS,
    confidenceThreshold = 0.25,
    nmsIoU = 0.45,
    inputResolution = DEFAULT_INPUT_RESOLUTION,
    tfliteDelegate = 'gpu',
    tfliteAllowNnapiFallback = true,
    tfliteNumThreads = 4,
    onnxExecutionProviders = DEFAULT_ONNX_PROVIDERS,
    onnxGraphOptimizationLevel = 'all',
    onnxIntraOpThreads = 2,
    onnxInterOpThreads = 1,
    onnxEnableCpuMemArena = true,
    onnxEnableMemPattern = true,
    adaptiveFrameSkip = true,
    processEveryNMax = 6,
    preprocessOnJs = false,
    enablePhotoCapture = true,
    onInferenceResult = null,
    onInferenceError = null,
    onInitialized = null,
    cameraProps = {},
  },
  ref,
) {
  const normalizedMaxInferenceFps = useMemo(
    () => normalizeMaxInferenceFps(maxInferenceFps),
    [maxInferenceFps],
  );
  const normalizedInputResolution = useMemo(
    () => normalizeInputResolution(inputResolution),
    [inputResolution],
  );
  const normalizedOnnxProviders = useMemo(
    () => normalizeExecutionProviders(onnxExecutionProviders),
    [onnxExecutionProviders],
  );

  const workerRef = useRef<InferenceWorker | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const permissionStateRef = useRef<{
    requestAttempted: boolean;
    deniedReported: boolean;
    missingDeviceReportedFor: string | null;
  }>({
    requestAttempted: false,
    deniedReported: false,
    missingDeviceReportedFor: null,
  });

  if (workerRef.current === null) {
    workerRef.current = createInferenceWorker({
      config: {
        maxInferenceFps: normalizedMaxInferenceFps,
        confidenceThreshold,
        nmsIoU,
        inputResolution: normalizedInputResolution,
        tfliteDelegate,
        tfliteAllowNnapiFallback,
        tfliteNumThreads,
        onnxExecutionProviders: normalizedOnnxProviders,
        onnxGraphOptimizationLevel,
        onnxIntraOpThreads,
        onnxInterOpThreads,
        onnxEnableCpuMemArena,
        onnxEnableMemPattern,
        adaptiveFrameSkip,
        processEveryNMax,
        preprocessOnJs,
      },
      onResult: onInferenceResult,
      onError: onInferenceError,
    });
  }

  useImperativeHandle(
    ref,
    () => ({
      async takeSnapshot(options?: { quality?: number }) {
        const cameraInstance = cameraRef.current;
        if (!cameraInstance) throw new Error('Camera is not initialized yet.');
        if (typeof cameraInstance.takeSnapshot === 'function') {
          const result = await cameraInstance.takeSnapshot(options ?? {});
          return result as { path?: string; filePath?: string; uri?: string };
        }
        if (typeof cameraInstance.takePhoto === 'function') {
          const result = await cameraInstance.takePhoto(options as Record<string, unknown>);
          return result as { path?: string; filePath?: string; uri?: string };
        }
        throw new Error('Snapshot capture is not supported by this camera runtime.');
      },
    }),
    [],
  );

  const { hasPermission, requestPermission } = useCameraPermission();
  const devicePosition = facing === 'front' ? 'front' : 'back';
  const device = useCameraDevice(devicePosition);

  useEffect(() => {
    let cancelled = false;
    if (hasPermission) {
      permissionStateRef.current.requestAttempted = false;
      permissionStateRef.current.deniedReported = false;
      return () => { cancelled = true; };
    }

    const reportPermissionFailure = (message: string) => {
      if (permissionStateRef.current.deniedReported) return;
      permissionStateRef.current.deniedReported = true;
      if (typeof onInferenceError === 'function') onInferenceError(new Error(message));
    };

    const ensurePermission = async () => {
      if (permissionStateRef.current.requestAttempted) {
        reportPermissionFailure('Camera permission is required for real-time detection. Enable it in app settings.');
        return;
      }
      permissionStateRef.current.requestAttempted = true;
      try {
        const granted = await requestPermission();
        if (!granted && !cancelled) {
          reportPermissionFailure('Camera permission is required for real-time detection. Enable it in app settings.');
        }
      } catch (error) {
        if (!cancelled) {
          reportPermissionFailure(error instanceof Error ? error.message : 'Unable to request camera permission.');
        }
      }
    };

    void ensurePermission();
    return () => { cancelled = true; };
  }, [hasPermission, onInferenceError, requestPermission]);

  useEffect(() => {
    if (!hasPermission) {
      permissionStateRef.current.missingDeviceReportedFor = null;
      return;
    }
    if (device) {
      permissionStateRef.current.missingDeviceReportedFor = null;
      return;
    }
    if (permissionStateRef.current.missingDeviceReportedFor === devicePosition) return;
    permissionStateRef.current.missingDeviceReportedFor = devicePosition;
    if (typeof onInferenceError === 'function') {
      onInferenceError(new Error(`No ${devicePosition} camera device is available on this device.`));
    }
  }, [device, devicePosition, hasPermission, onInferenceError]);

  useEffect(() => {
    const worker = workerRef.current;
    if (worker) {
      worker.setResultHandler(onInferenceResult);
      worker.setErrorHandler(onInferenceError);
    }
  }, [onInferenceResult, onInferenceError]);

  useEffect(() => {
    const worker = workerRef.current;
    if (!worker) return;
    worker.configure({
      maxInferenceFps: normalizedMaxInferenceFps,
      confidenceThreshold,
      nmsIoU,
      inputResolution: normalizedInputResolution,
      tfliteDelegate,
      tfliteAllowNnapiFallback,
      tfliteNumThreads,
      onnxExecutionProviders: normalizedOnnxProviders,
      onnxGraphOptimizationLevel,
      onnxIntraOpThreads,
      onnxInterOpThreads,
      onnxEnableCpuMemArena,
      onnxEnableMemPattern,
      adaptiveFrameSkip,
      processEveryNMax,
      preprocessOnJs,
    });
  }, [
    normalizedMaxInferenceFps,
    confidenceThreshold,
    nmsIoU,
    normalizedInputResolution,
    tfliteDelegate,
    tfliteAllowNnapiFallback,
    tfliteNumThreads,
    normalizedOnnxProviders,
    onnxGraphOptimizationLevel,
    onnxIntraOpThreads,
    onnxInterOpThreads,
    onnxEnableCpuMemArena,
    onnxEnableMemPattern,
    adaptiveFrameSkip,
    processEveryNMax,
    preprocessOnJs,
  ]);

  const canRunDetection = isActive && detectionEnabled && hasPermission && Boolean(device);

  useEffect(() => {
    const worker = workerRef.current;
    if (!worker) return;
    if (canRunDetection) worker.start();
    else worker.stop();
  }, [canRunDetection]);

  useEffect(() => () => void workerRef.current?.dispose(), []);

  const dispatchFrameToWorker = useCallback((framePacket: FramePacket) => {
    workerRef.current?.enqueueFrame(framePacket);
  }, []);

  const frameProcessor = useFrameProcessor(
    (frame: Frame) => {
      'worklet';
      if (!detectionEnabled) return;
      runAtTargetFps(normalizedMaxInferenceFps, () => {
        'worklet';
        runAsync(frame, () => {
          'worklet';
          if (typeof frame.toArrayBuffer !== 'function') return;
          const frameBuffer = frame.toArrayBuffer();
          const frameTimestamp = typeof frame.timestamp === 'number' ? frame.timestamp : Date.now();
          const frameExt = frame as Frame & { rotationDegrees?: number };
          const rotationDegrees = typeof frameExt.rotationDegrees === 'number' ? frameExt.rotationDegrees : 0;
          const packet: FramePacket = {
            frameId: `${frameTimestamp}-${frame.width}x${frame.height}`,
            timestamp: frameTimestamp,
            width: frame.width,
            height: frame.height,
            pixelFormat: frame.pixelFormat ?? 'rgb',
            rotationDegrees,
            bytes: frameBuffer,
          };
          scheduleOnRN(dispatchFrameToWorker, packet);
        });
      });
    },
    [dispatchFrameToWorker, normalizedMaxInferenceFps, detectionEnabled],
  );

  return (
    <View style={style} className="w-full h-full overflow-hidden">
      {hasPermission && device ? (
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isActive}
          pixelFormat="rgb"
          photo={enablePhotoCapture}
          video={false}
          audio={false}
          frameProcessor={frameProcessor}
          onInitialized={onInitialized ?? undefined}
          {...cameraProps}
        />
      ) : (
        <View className='flex-1 bg-black' />
      )}
    </View>
  );
});

export default CameraView;