// @ts-nocheck
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { runOnJS } from 'react-native-worklets';
import {
  Camera,
  runAsync,
  runAtTargetFps,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
} from 'react-native-vision-camera';

import { createInferenceWorker } from '../workers/inferenceWorker';

const DEFAULT_MAX_INFERENCE_FPS = 8;
const DEFAULT_INPUT_RESOLUTION = [512, 512];
const DEFAULT_ONNX_PROVIDERS = ['nnapi', 'cpu'];

function normalizeMaxInferenceFps(value) {
  const numericValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numericValue)) {
    return DEFAULT_MAX_INFERENCE_FPS;
  }
  return Math.min(Math.max(Math.trunc(numericValue), 1), 30);
}

function normalizeInputResolution(value) {
  if (Array.isArray(value) && value.length === 2) {
    const width = Math.trunc(Number(value[0]));
    const height = Math.trunc(Number(value[1]));
    if (width > 0 && height > 0) {
      return [width, height];
    }
  }
  return [...DEFAULT_INPUT_RESOLUTION];
}

function normalizeExecutionProviders(value) {
  if (!Array.isArray(value)) {
    return [...DEFAULT_ONNX_PROVIDERS];
  }

  const providers = value
    .map((provider) => String(provider).trim().toLowerCase())
    .filter((provider) => provider.length > 0);
  return providers.length > 0 ? providers : [...DEFAULT_ONNX_PROVIDERS];
}

const CameraView = forwardRef(function CameraView(
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

  const workerRef = useRef(null);
  const cameraRef = useRef(null);
  const permissionStateRef = useRef({
    requestAttempted: false,
    deniedReported: false,
    missingDeviceReportedFor: null,
  });
  if (!workerRef.current) {
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
      async takeSnapshot(options = {}) {
        const cameraInstance = cameraRef.current;
        if (!cameraInstance) {
          throw new Error('Camera is not initialized yet.');
        }

        if (typeof cameraInstance.takeSnapshot === 'function') {
          return cameraInstance.takeSnapshot(options);
        }

        if (typeof cameraInstance.takePhoto === 'function') {
          return cameraInstance.takePhoto(options);
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
      return () => {
        cancelled = true;
      };
    }

    const reportPermissionFailure = (message) => {
      if (permissionStateRef.current.deniedReported) {
        return;
      }
      permissionStateRef.current.deniedReported = true;
      if (typeof onInferenceError === 'function') {
        onInferenceError(new Error(message));
      }
    };

    const ensurePermission = async () => {
      if (permissionStateRef.current.requestAttempted) {
        reportPermissionFailure(
          'Camera permission is required for real-time detection. Enable it in app settings.',
        );
        return;
      }

      permissionStateRef.current.requestAttempted = true;
      try {
        const granted = await requestPermission();
        if (!granted && !cancelled) {
          reportPermissionFailure(
            'Camera permission is required for real-time detection. Enable it in app settings.',
          );
        }
      } catch (error) {
        if (!cancelled) {
          reportPermissionFailure(
            error instanceof Error ? error.message : 'Unable to request camera permission.',
          );
        }
      }
    };

    void ensurePermission();

    return () => {
      cancelled = true;
    };
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

    if (permissionStateRef.current.missingDeviceReportedFor === devicePosition) {
      return;
    }

    permissionStateRef.current.missingDeviceReportedFor = devicePosition;
    if (typeof onInferenceError === 'function') {
      onInferenceError(
        new Error(`No ${devicePosition} camera device is available on this device.`),
      );
    }
  }, [device, devicePosition, hasPermission, onInferenceError]);

  useEffect(() => {
    workerRef.current.setResultHandler(onInferenceResult);
    workerRef.current.setErrorHandler(onInferenceError);
  }, [onInferenceResult, onInferenceError]);

  useEffect(() => {
    workerRef.current.configure({
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
    // Keep inference worker idle unless camera permissions and device availability are valid.
    if (canRunDetection) {
      workerRef.current.start();
    } else {
      workerRef.current.stop();
    }
  }, [canRunDetection]);

  useEffect(() => {
    return () => {
      void workerRef.current?.dispose();
    };
  }, []);

  const dispatchFrameToWorker = useMemo(
    () =>
      runOnJS((framePacket) => {
        workerRef.current?.enqueueFrame(framePacket);
      }),
    [],
  );

  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';

      if (!detectionEnabled) {
        return;
      }

      // Frame-level throttle keeps UI-runtime overhead predictable before JS handoff.
      runAtTargetFps(normalizedMaxInferenceFps, () => {
        'worklet';
        runAsync(frame, () => {
          'worklet';

          if (typeof frame.toArrayBuffer !== 'function') {
            return;
          }

          const frameBuffer = frame.toArrayBuffer();
          const frameTimestamp =
            typeof frame.timestamp === 'number' ? frame.timestamp : Date.now();
          dispatchFrameToWorker({
            frameId: `${frameTimestamp}-${frame.width}x${frame.height}`,
            timestamp: frameTimestamp,
            width: frame.width,
            height: frame.height,
            pixelFormat: frame.pixelFormat ?? 'rgb',
            rotationDegrees:
              typeof frame.rotationDegrees === 'number' ? frame.rotationDegrees : 0,
            bytes: frameBuffer,
          });
        });
      });
    },
    [dispatchFrameToWorker, normalizedMaxInferenceFps, detectionEnabled],
  );

  return (
    <View style={[styles.container, style]}>
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
          frameProcessorFps={normalizedMaxInferenceFps}
          onInitialized={onInitialized ?? undefined}
          {...cameraProps}
        />
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
});

export default CameraView;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
