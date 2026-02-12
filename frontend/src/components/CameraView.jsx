import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Camera,
  runAsync,
  runAtTargetFps,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
} from 'react-native-vision-camera';
import { Worklets } from 'react-native-worklets-core';

import { createInferenceWorker } from '../workers/inferenceWorker';

const DEFAULT_MAX_INFERENCE_FPS = 8;
const DEFAULT_CAMERA_FPS = 30;
const DEFAULT_POSITION = 'back';

function asError(value) {
  if (value instanceof Error) {
    return value;
  }
  return new Error(String(value));
}

function normalizeFps(value, fallback) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(1, Math.min(30, Math.floor(value)));
}

function buildWorkerConfig({
  maxInferenceFps,
  inputResolution,
  confidenceThreshold,
  nmsIoU,
}) {
  return {
    maxInferenceFps,
    inputResolution,
    normalize: {
      // Keep tensor scaling in [0, 1] and apply optional centering for model-specific preprocessing.
      mean: [0, 0, 0],
      std: [1, 1, 1],
    },
    confidenceThreshold,
    nmsIoU,
  };
}

export function CameraView({
  modelManager,
  isActive = true,
  position = DEFAULT_POSITION,
  cameraFps = DEFAULT_CAMERA_FPS,
  maxInferenceFps = DEFAULT_MAX_INFERENCE_FPS,
  inputResolution = 640,
  confidenceThreshold = 0.25,
  nmsIoU = 0.45,
  onInferenceResult,
  onInferenceError,
  style,
}) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice(position);
  const workerRef = useRef(null);
  const inferenceBusy = useMemo(() => Worklets.createSharedValue(false), []);

  const normalizedCameraFps = normalizeFps(cameraFps, DEFAULT_CAMERA_FPS);
  const normalizedInferenceFps = normalizeFps(
    maxInferenceFps,
    DEFAULT_MAX_INFERENCE_FPS,
  );

  const workerConfig = useMemo(
    () =>
      buildWorkerConfig({
        maxInferenceFps: normalizedInferenceFps,
        inputResolution,
        confidenceThreshold,
        nmsIoU,
      }),
    [normalizedInferenceFps, inputResolution, confidenceThreshold, nmsIoU],
  );

  useEffect(() => {
    if (hasPermission) {
      return;
    }

    requestPermission().catch((error) => {
      if (typeof onInferenceError === 'function') {
        onInferenceError(asError(error));
      }
    });
  }, [hasPermission, requestPermission, onInferenceError]);

  useEffect(() => {
    if (!modelManager) {
      if (typeof onInferenceError === 'function') {
        onInferenceError(new Error('CameraView requires a modelManager instance.'));
      }
      return;
    }

    const worker = createInferenceWorker({
      modelManager,
      config: workerConfig,
      onResult: (result) => {
        if (typeof onInferenceResult === 'function') {
          onInferenceResult(result);
        }
      },
      onError: (error) => {
        if (typeof onInferenceError === 'function') {
          onInferenceError(error);
        }
      },
    });

    workerRef.current = worker;
    return () => {
      worker.dispose();
      workerRef.current = null;
    };
  }, [modelManager, onInferenceResult, onInferenceError]);

  useEffect(() => {
    workerRef.current?.updateConfig(workerConfig);
  }, [workerConfig]);

  const pushFrameToWorker = useMemo(
    () =>
      Worklets.createRunOnJS((framePayload) => {
        if (inferenceBusy.value) {
          return;
        }

        const worker = workerRef.current;
        if (!worker) {
          return;
        }

        inferenceBusy.value = true;
        void worker
          .processFrame(framePayload)
          .finally(() => {
            inferenceBusy.value = false;
          });
      }),
    [inferenceBusy],
  );

  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';

      if (inferenceBusy.value) {
        return;
      }

      runAtTargetFps(normalizedInferenceFps, () => {
        'worklet';
        runAsync(frame, () => {
          'worklet';

          const buffer = frame.toArrayBuffer();
          pushFrameToWorker({
            frameId: frame.timestamp,
            capturedAtMs: frame.timestamp,
            width: frame.width,
            height: frame.height,
            pixelFormat: frame.pixelFormat,
            bytesPerRow: frame.bytesPerRow,
            orientation: frame.orientation,
            isMirrored: frame.isMirrored,
            buffer,
          });
        });
      });
    },
    [normalizedInferenceFps, pushFrameToWorker, inferenceBusy],
  );

  if (!modelManager) {
    return (
      <View style={[styles.placeholder, style]}>
        <Text style={styles.placeholderText}>Model manager not configured.</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={[styles.placeholder, style]}>
        <Text style={styles.placeholderText}>Camera permission required.</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={[styles.placeholder, style]}>
        <Text style={styles.placeholderText}>No camera device available.</Text>
      </View>
    );
  }

  return (
    <Camera
      style={[styles.camera, style]}
      device={device}
      isActive={Boolean(isActive)}
      fps={normalizedCameraFps}
      pixelFormat="rgb"
      photo={false}
      video={false}
      audio={false}
      enableBufferCompression={false}
      frameProcessor={frameProcessor}
      onError={(cameraError) => {
        if (typeof onInferenceError === 'function') {
          onInferenceError(
            new Error(cameraError?.message ?? 'VisionCamera runtime error.'),
          );
        }
      }}
    />
  );
}

const styles = StyleSheet.create({
  camera: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f1117',
  },
  placeholderText: {
    color: '#ffffff',
    fontSize: 14,
  },
});

export default CameraView;
