// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';

import CameraView from '../components/CameraView';
import BoxOverlay from '../components/BoxOverlay';
import modelManager from '../lib/modelManager';

const MODEL_OPTIONS = [
  { id: 'tflite', label: 'TFLite' },
  { id: 'onnx', label: 'ONNX' },
  { id: 'server', label: 'Server' },
];
const TFLITE_DELEGATE_OPTIONS = [
  { id: 'gpu', label: 'GPU' },
  { id: 'nnapi', label: 'NNAPI' },
  { id: 'xnnpack', label: 'XNNPACK' },
  { id: 'cpu', label: 'CPU' },
];

const INPUT_RESOLUTION = [512, 512];
const MAX_INFERENCE_FPS = 12;
const DEFAULT_CONFIDENCE = 0.25;
const NMS_IOU = 0.45;
const ONNX_EXECUTION_PROVIDERS = ['nnapi', 'cpu'];
const ONNX_GRAPH_OPT_LEVEL = 'all';
const ONNX_INTRA_OP_THREADS = 2;
const ONNX_INTER_OP_THREADS = 1;
const LATENCY_GRAPH_POINTS = 28;

const PANEL_BG = '#16191F';
const SURFACE_BG = '#0E1015';
const BORDER = '#2B313D';
const LABEL = '#9CA3AF';
const WHITE = '#FFFFFF';
const ACCENT = '#FFD54F';
const ERROR = '#F87171';
const SUCCESS = '#22C55E';
const WARNING = '#F59E0B';

function formatError(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Detection failed.';
}

function formatRuntime(runtime) {
  if (typeof runtime !== 'string' || !runtime.trim()) {
    return 'Unknown';
  }
  return runtime.toUpperCase();
}

function getStatusColor(status) {
  if (status === 'running') {
    return SUCCESS;
  }
  if (status === 'error') {
    return ERROR;
  }
  if (status === 'loading' || status === 'fallback') {
    return WARNING;
  }
  return LABEL;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function ConfidenceSlider({ value, onChange, min = 0.05, max = 0.95 }) {
  const [trackWidth, setTrackWidth] = useState(0);

  const normalizedValue = clamp(value, min, max);
  const normalizedProgress = (normalizedValue - min) / (max - min);

  const updateFromLocation = useCallback(
    (locationX) => {
      if (trackWidth <= 0) {
        return;
      }
      const progress = clamp(locationX / trackWidth, 0, 1);
      const next = min + progress * (max - min);
      onChange(Number(next.toFixed(2)));
    },
    [max, min, onChange, trackWidth],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          updateFromLocation(event.nativeEvent.locationX);
        },
        onPanResponderMove: (event) => {
          updateFromLocation(event.nativeEvent.locationX);
        },
      }),
    [updateFromLocation],
  );

  const fillStyle = useMemo(
    () => ({ width: `${Math.round(normalizedProgress * 100)}%` }),
    [normalizedProgress],
  );
  const thumbStyle = useMemo(
    () => ({
      left: normalizedProgress * trackWidth,
    }),
    [normalizedProgress, trackWidth],
  );

  const handleAccessibilityAction = useCallback(
    (event) => {
      if (event.nativeEvent.actionName === 'increment') {
        onChange(Number(clamp(normalizedValue + 0.05, min, max).toFixed(2)));
      } else if (event.nativeEvent.actionName === 'decrement') {
        onChange(Number(clamp(normalizedValue - 0.05, min, max).toFixed(2)));
      }
    },
    [max, min, normalizedValue, onChange],
  );

  return (
    <View style={styles.sliderSection}>
      <View
        style={styles.sliderTrackTouch}
        onLayout={(event) => setTrackWidth(Math.max(1, event.nativeEvent.layout.width))}
        {...panResponder.panHandlers}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Confidence threshold"
        accessibilityValue={{ min, max, now: Number(normalizedValue.toFixed(2)) }}
        accessibilityActions={[
          { name: 'increment', label: 'Increase confidence threshold' },
          { name: 'decrement', label: 'Decrease confidence threshold' },
        ]}
        onAccessibilityAction={handleAccessibilityAction}
      >
        <View style={styles.sliderTrack} />
        <View style={[styles.sliderFill, fillStyle]} />
        <View style={[styles.sliderThumb, thumbStyle]} />
      </View>
      <Text style={styles.sliderValue}>{Math.round(normalizedValue * 100)}%</Text>
    </View>
  );
}

export default function ExploreScreen() {
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef(null);
  const lastFrameAtRef = useRef(null);

  const panelAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;

  const [isDetecting, setIsDetecting] = useState(false);
  const [facing, setFacing] = useState('back');
  const [selectedRuntime, setSelectedRuntime] = useState('tflite');
  const [activeRuntime, setActiveRuntime] = useState(null);
  const [runtimeStatus, setRuntimeStatus] = useState('idle');
  const [statusMessage, setStatusMessage] = useState(null);
  const [confidenceThreshold, setConfidenceThreshold] = useState(DEFAULT_CONFIDENCE);
  const [nmsEnabled, setNmsEnabled] = useState(true);
  const [tfliteDelegate, setTfliteDelegate] = useState('gpu');
  const [predictions, setPredictions] = useState([]);
  const [fps, setFps] = useState(null);
  const [inferMs, setInferMs] = useState(null);
  const [preprocessMs, setPreprocessMs] = useState(null);
  const [totalMs, setTotalMs] = useState(null);
  const [latencyHistory, setLatencyHistory] = useState([]);
  const [currentStride, setCurrentStride] = useState(1);
  const [droppedFrames, setDroppedFrames] = useState(0);
  const [targetBudgetMs, setTargetBudgetMs] = useState(1000 / MAX_INFERENCE_FPS);
  const [showDebugOverlay, setShowDebugOverlay] = useState(false);
  const [modelSize, setModelSize] = useState(INPUT_RESOLUTION);
  const [sourceSize, setSourceSize] = useState(INPUT_RESOLUTION);
  const [snapshotInfo, setSnapshotInfo] = useState(null);
  const [isSwitchingRuntime, setIsSwitchingRuntime] = useState(false);

  const effectiveNmsIoU = nmsEnabled ? NMS_IOU : 1;
  const statusColor = useMemo(() => getStatusColor(runtimeStatus), [runtimeStatus]);
  const statusText = useMemo(() => {
    if (runtimeStatus === 'running') {
      return `Live (${formatRuntime(activeRuntime)})`;
    }
    if (runtimeStatus === 'loading') {
      return 'Loading runtime';
    }
    if (runtimeStatus === 'fallback') {
      return `Fallback (${formatRuntime(activeRuntime)})`;
    }
    if (runtimeStatus === 'error') {
      return 'Runtime error';
    }
    return 'Ready';
  }, [activeRuntime, runtimeStatus]);

  const fpsDisplay = useMemo(() => (fps ? `${fps.toFixed(1)} FPS` : '-- FPS'), [fps]);
  const inferDisplay = useMemo(
    () => (Number.isFinite(inferMs) ? `${Math.round(inferMs)} ms` : '-- ms'),
    [inferMs],
  );

  useEffect(() => {
    Animated.timing(panelAnim, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [panelAnim]);

  useEffect(() => {
    if (!isDetecting || !isFocused) {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(0);
      return;
    }

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    pulseLoop.start();

    return () => {
      pulseLoop.stop();
    };
  }, [isDetecting, isFocused, pulseAnim]);

  const statusDotStyle = useMemo(
    () => ({
      backgroundColor: statusColor,
      transform: [
        {
          scale: pulseAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.25],
          }),
        },
      ],
      opacity: pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.8, 1],
      }),
    }),
    [pulseAnim, statusColor],
  );

  const panelAnimatedStyle = useMemo(
    () => ({
      opacity: panelAnim,
      transform: [
        {
          translateY: panelAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [28, 0],
          }),
        },
      ],
    }),
    [panelAnim],
  );
  const latencyBars = useMemo(() => {
    if (latencyHistory.length === 0) {
      return [];
    }

    const maxLatency = Math.max(1, ...latencyHistory);
    return latencyHistory.map((value, index) => ({
      key: `lat-${index}`,
      heightPct: Math.max(8, Math.min(100, (value / maxLatency) * 100)),
      isSlow: value > targetBudgetMs * 1.15,
    }));
  }, [latencyHistory, targetBudgetMs]);

  const applyRuntimePreference = useCallback(
    async (runtime, options = {}) => {
      setIsSwitchingRuntime(true);
      setRuntimeStatus('loading');
      const resolvedDelegate =
        typeof options.tfliteDelegate === 'string'
          ? options.tfliteDelegate
          : tfliteDelegate;

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
      } catch (error) {
        setRuntimeStatus('fallback');
        setStatusMessage(formatError(error));
        return false;
      } finally {
        setIsSwitchingRuntime(false);
      }
    },
    [isDetecting, tfliteDelegate],
  );

  const handleStartStop = useCallback(async () => {
    if (isDetecting) {
      setIsDetecting(false);
      setRuntimeStatus('ready');
      setSnapshotInfo(null);
      return;
    }

    await applyRuntimePreference(selectedRuntime);
    lastFrameAtRef.current = null;
    setFps(null);
    setLatencyHistory([]);
    setDroppedFrames(0);
    setCurrentStride(1);
    setTotalMs(null);
    setIsDetecting(true);
  }, [applyRuntimePreference, isDetecting, selectedRuntime]);

  const handleFlipCamera = useCallback(() => {
    setFacing((previous) => (previous === 'back' ? 'front' : 'back'));
  }, []);

  const handleModelSelect = useCallback(
    async (runtime) => {
      setSelectedRuntime(runtime);
      await applyRuntimePreference(runtime);
    },
    [applyRuntimePreference],
  );

  const handleDelegateSelect = useCallback(
    async (delegate) => {
      setTfliteDelegate(delegate);
      modelManager.setConfig({
        tfliteDelegate: delegate,
        tfliteAllowNnapiFallback: true,
      });

      if (selectedRuntime === 'tflite') {
        await applyRuntimePreference('tflite', { tfliteDelegate: delegate });
      }
    },
    [applyRuntimePreference, selectedRuntime],
  );

  const handleInferenceResult = useCallback((result) => {
    const nextPredictions = Array.isArray(result?.predictions) ? result.predictions : [];
    setPredictions(nextPredictions);

    if (Array.isArray(result?.inputSize) && result.inputSize.length === 2) {
      setModelSize(result.inputSize);
    }
    if (Array.isArray(result?.sourceSize) && result.sourceSize.length === 2) {
      setSourceSize(result.sourceSize);
    }

    if (Number.isFinite(result?.inferMs)) {
      setInferMs(result.inferMs);
    }
    if (Number.isFinite(result?.preprocessMs)) {
      setPreprocessMs(result.preprocessMs);
    }
    if (Number.isFinite(result?.totalMs)) {
      setTotalMs(result.totalMs);
      setLatencyHistory((previous) => {
        const next = [...previous, result.totalMs];
        return next.slice(-LATENCY_GRAPH_POINTS);
      });
    }
    if (Number.isFinite(result?.processEveryN)) {
      setCurrentStride(Math.max(1, result.processEveryN));
    }
    if (Number.isFinite(result?.droppedFramesSinceLast)) {
      setDroppedFrames(result.droppedFramesSinceLast);
    }
    if (Number.isFinite(result?.targetBudgetMs)) {
      setTargetBudgetMs(result.targetBudgetMs);
    }

    const now = Date.now();
    if (lastFrameAtRef.current !== null) {
      const elapsed = Math.max(1, now - lastFrameAtRef.current);
      const instantFps = 1000 / elapsed;
      setFps((previous) => (previous === null ? instantFps : previous * 0.7 + instantFps * 0.3));
    }
    lastFrameAtRef.current = now;

    setActiveRuntime(result?.runtime ?? modelManager.getActiveRuntime?.() ?? activeRuntime);
    setRuntimeStatus('running');
    setStatusMessage(null);
  }, [activeRuntime]);

  const handleInferenceError = useCallback((error) => {
    setRuntimeStatus('error');
    setStatusMessage(formatError(error));
  }, []);

  const triggerSnapshotFlash = useCallback(() => {
    flashAnim.setValue(0.65);
    Animated.timing(flashAnim, {
      toValue: 0,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [flashAnim]);

  const handleSnapshot = useCallback(async () => {
    const camera = cameraRef.current;
    if (!camera || typeof camera.takeSnapshot !== 'function') {
      setSnapshotInfo('Snapshot unavailable on this build.');
      return;
    }

    try {
      const result = await camera.takeSnapshot({
        quality: 90,
      });
      triggerSnapshotFlash();
      const pathHint =
        result?.path ??
        result?.filePath ??
        result?.uri ??
        'Saved';
      setSnapshotInfo(`Snapshot: ${pathHint}`);
    } catch (error) {
      setSnapshotInfo(formatError(error));
    }
  }, [triggerSnapshotFlash]);

  const detectionEnabled = isDetecting && isFocused;
  const metricsSummary = useMemo(
    () =>
      Number.isFinite(preprocessMs)
        ? `Preprocess ${Math.round(preprocessMs)} ms`
        : 'Preprocess --',
    [preprocessMs],
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 8 }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Explore</Text>
          <Text style={styles.subtitle}>Real-time object detection</Text>
        </View>

        <View style={styles.headerStatus}>
          <Animated.View style={[styles.liveDot, statusDotStyle]} />
          <View>
            <Text style={styles.statusText}>{statusText}</Text>
            <Text style={styles.statusSubtext}>Selected: {formatRuntime(selectedRuntime)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.previewCard}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          isActive={isFocused}
          detectionEnabled={detectionEnabled}
          facing={facing}
          maxInferenceFps={MAX_INFERENCE_FPS}
          confidenceThreshold={confidenceThreshold}
          nmsIoU={effectiveNmsIoU}
          inputResolution={INPUT_RESOLUTION}
          tfliteDelegate={tfliteDelegate}
          tfliteAllowNnapiFallback
          onnxExecutionProviders={ONNX_EXECUTION_PROVIDERS}
          onnxGraphOptimizationLevel={ONNX_GRAPH_OPT_LEVEL}
          onnxIntraOpThreads={ONNX_INTRA_OP_THREADS}
          onnxInterOpThreads={ONNX_INTER_OP_THREADS}
          adaptiveFrameSkip
          processEveryNMax={6}
          preprocessOnJs={false}
          onInferenceResult={handleInferenceResult}
          onInferenceError={handleInferenceError}
        />

        <BoxOverlay
          predictions={predictions}
          modelSize={modelSize}
          sourceSize={sourceSize}
          resizeMode="cover"
          modelResizeMode="stretch"
          smoothingAlpha={0.35}
          enableTapDetails
        />

        <View style={styles.previewTopBar} pointerEvents="none">
          <View style={styles.metricChip}>
            <Ionicons name="speedometer-outline" size={14} color={WHITE} />
            <Text style={styles.metricChipText}>{fpsDisplay}</Text>
          </View>
          <View style={styles.metricChip}>
            <Ionicons name="timer-outline" size={14} color={WHITE} />
            <Text style={styles.metricChipText}>{inferDisplay}</Text>
          </View>
        </View>

        {showDebugOverlay ? (
          <View style={styles.debugOverlay} pointerEvents="none">
            <Text style={styles.debugTitle}>Debug</Text>
            <Text style={styles.debugText}>
              FPS {fps ? fps.toFixed(1) : '--'} | Infer {inferDisplay} | Total{' '}
              {Number.isFinite(totalMs) ? `${Math.round(totalMs)} ms` : '-- ms'}
            </Text>
            <Text style={styles.debugText}>
              Budget {Math.round(targetBudgetMs)} ms | Stride 1/{currentStride} | Dropped{' '}
              {droppedFrames}
            </Text>
            <View style={styles.graphRow}>
              {latencyBars.map((bar) => (
                <View
                  key={bar.key}
                  style={[
                    styles.graphBar,
                    { height: `${bar.heightPct}%` },
                    bar.isSlow ? styles.graphBarSlow : styles.graphBarFast,
                  ]}
                />
              ))}
            </View>
          </View>
        ) : null}

        <Animated.View pointerEvents="none" style={[styles.snapshotFlash, { opacity: flashAnim }]} />
      </View>

      <Animated.View style={[styles.panel, panelAnimatedStyle]}>
        <View style={styles.actionsRow}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              isDetecting ? styles.stopButton : styles.startButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => void handleStartStop()}
            accessibilityRole="button"
            accessibilityLabel={isDetecting ? 'Stop detection' : 'Start detection'}
            accessibilityHint="Toggles real-time detection"
          >
            <Ionicons
              name={isDetecting ? 'pause' : 'play'}
              size={16}
              color="#111827"
            />
            <Text style={styles.primaryButtonText}>
              {isDetecting ? 'Stop' : 'Start'}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
            onPress={handleFlipCamera}
            accessibilityRole="button"
            accessibilityLabel="Flip camera"
            accessibilityHint="Switches between front and back camera"
          >
            <Ionicons name="camera-reverse-outline" size={19} color={WHITE} />
            <Text style={styles.iconButtonText}>Flip</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
            onPress={() => void handleSnapshot()}
            accessibilityRole="button"
            accessibilityLabel="Take snapshot"
            accessibilityHint="Captures a still image from the current camera feed"
          >
            <Ionicons name="camera-outline" size={19} color={WHITE} />
            <Text style={styles.iconButtonText}>Snapshot</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Model Runtime</Text>
          <View style={styles.selectorRow}>
            {MODEL_OPTIONS.map((option) => {
              const selected = selectedRuntime === option.id;
              return (
                <Pressable
                  key={option.id}
                  style={({ pressed }) => [
                    styles.selectorButton,
                    selected && styles.selectorButtonSelected,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => void handleModelSelect(option.id)}
                  disabled={isSwitchingRuntime}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${option.label} runtime`}
                  accessibilityState={{ selected }}
                >
                  <Text
                    style={[
                      styles.selectorButtonText,
                      selected && styles.selectorButtonTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {selectedRuntime === 'tflite' ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TFLite Delegate</Text>
            <View style={styles.delegateRow}>
              {TFLITE_DELEGATE_OPTIONS.map((option) => {
                const selected = tfliteDelegate === option.id;
                return (
                  <Pressable
                    key={option.id}
                    style={({ pressed }) => [
                      styles.delegateButton,
                      selected && styles.delegateButtonSelected,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() => void handleDelegateSelect(option.id)}
                    disabled={isSwitchingRuntime}
                    accessibilityRole="button"
                    accessibilityLabel={`Use ${option.label} delegate`}
                    accessibilityState={{ selected }}
                  >
                    <Text
                      style={[
                        styles.delegateButtonText,
                        selected && styles.delegateButtonTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Confidence Threshold</Text>
          <ConfidenceSlider value={confidenceThreshold} onChange={setConfidenceThreshold} />
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>NMS</Text>
            <Switch
              value={nmsEnabled}
              onValueChange={setNmsEnabled}
              accessibilityLabel="Toggle non maximum suppression"
              trackColor={{ false: '#4B5563', true: '#FDE68A' }}
              thumbColor={nmsEnabled ? ACCENT : '#E5E7EB'}
            />
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Debug</Text>
            <Switch
              value={showDebugOverlay}
              onValueChange={setShowDebugOverlay}
              accessibilityLabel="Toggle debug overlay"
              trackColor={{ false: '#4B5563', true: '#93C5FD' }}
              thumbColor={showDebugOverlay ? '#BFDBFE' : '#E5E7EB'}
            />
          </View>
          <View style={styles.metaStats}>
            <Text style={styles.metaText}>Inference {inferDisplay}</Text>
            <Text style={styles.metaText}>{fpsDisplay}</Text>
            <Text style={styles.metaText}>{metricsSummary}</Text>
          </View>
        </View>

        {statusMessage ? <Text style={styles.errorText}>{statusMessage}</Text> : null}
        {snapshotInfo ? <Text style={styles.snapshotText}>{snapshotInfo}</Text> : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: SURFACE_BG,
    paddingHorizontal: 14,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    color: WHITE,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: LABEL,
    marginTop: -3,
    fontSize: 13,
  },
  headerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: PANEL_BG,
    gap: 8,
  },
  liveDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
  },
  statusText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: '700',
  },
  statusSubtext: {
    color: LABEL,
    fontSize: 11,
  },
  previewCard: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  previewTopBar: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  metricChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  metricChipText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: '700',
  },
  snapshotFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
  },
  debugOverlay: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    gap: 3,
  },
  debugTitle: {
    color: '#E0F2FE',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  debugText: {
    color: '#E5E7EB',
    fontSize: 11,
    fontWeight: '600',
  },
  graphRow: {
    marginTop: 3,
    height: 36,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  graphBar: {
    flex: 1,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  graphBarFast: {
    backgroundColor: 'rgba(34, 197, 94, 0.85)',
  },
  graphBarSlow: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
  },
  panel: {
    borderRadius: 16,
    backgroundColor: PANEL_BG,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  primaryButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  startButton: {
    backgroundColor: ACCENT,
  },
  stopButton: {
    backgroundColor: '#FBBF24',
  },
  primaryButtonText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '800',
  },
  iconButton: {
    minHeight: 50,
    minWidth: 92,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#1B1F28',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
  },
  iconButtonText: {
    color: WHITE,
    fontSize: 11,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.78,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    color: LABEL,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  selectorButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#1B1F28',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  selectorButtonSelected: {
    backgroundColor: '#FDE68A',
    borderColor: '#FCD34D',
  },
  selectorButtonText: {
    color: WHITE,
    fontSize: 13,
    fontWeight: '700',
  },
  selectorButtonTextSelected: {
    color: '#111827',
  },
  delegateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  delegateButton: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#1B1F28',
    justifyContent: 'center',
    alignItems: 'center',
  },
  delegateButtonSelected: {
    borderColor: '#FCD34D',
    backgroundColor: '#FDE68A',
  },
  delegateButtonText: {
    color: WHITE,
    fontSize: 11,
    fontWeight: '700',
  },
  delegateButtonTextSelected: {
    color: '#111827',
  },
  sliderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sliderTrackTouch: {
    flex: 1,
    minHeight: 36,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#374151',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    height: 6,
    borderRadius: 999,
    backgroundColor: ACCENT,
  },
  sliderThumb: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 999,
    marginLeft: -9,
    backgroundColor: WHITE,
    borderWidth: 2,
    borderColor: ACCENT,
  },
  sliderValue: {
    color: WHITE,
    fontSize: 12,
    fontWeight: '700',
    width: 46,
    textAlign: 'right',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#1B1F28',
  },
  metaLabel: {
    color: WHITE,
    fontSize: 12,
    fontWeight: '700',
  },
  metaStats: {
    alignItems: 'flex-end',
    flex: 1,
  },
  metaText: {
    color: LABEL,
    fontSize: 11,
    fontWeight: '600',
  },
  errorText: {
    color: ERROR,
    fontSize: 12,
    fontWeight: '600',
  },
  snapshotText: {
    color: '#93C5FD',
    fontSize: 11,
  },
});
