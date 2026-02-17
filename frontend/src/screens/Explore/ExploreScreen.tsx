import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import type { DimensionValue } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';

import CameraView from '@/components/CameraView';
import BoxOverlay from '@/components/BoxOverlay';
import modelManager from '@/lib/modelManager';
import { ConfidenceSlider } from '@/components/ConfidenceSlider';
import { ensureCameraPermission } from '@/permissions';
import { useExploreDetection, useExplorePermissions } from './hooks';
import { formatError, formatRuntime, getStatusColor } from './utils';
import { MODEL_OPTIONS, TFLITE_DELEGATE_OPTIONS } from './config';
import {
  DEFAULT_CONFIDENCE,
  EXPLORE_COLORS,
  INPUT_RESOLUTION,
  MAX_INFERENCE_FPS,
  ONNX_EXECUTION_PROVIDERS,
  ONNX_GRAPH_OPT_LEVEL,
  ONNX_INTRA_OP_THREADS,
  ONNX_INTER_OP_THREADS,
} from './config';
import { exploreStyles } from './styles';
import type { CameraViewRef, CameraViewProps, ModelRuntime, TfliteDelegate } from './types';
import { logEvent } from '@/utils/logger';

const styles = exploreStyles;
const { white, accent } = EXPLORE_COLORS;

export function ExploreScreen() {
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraViewRef | null>(null);

  const { permission, refreshPermission, handlePermissionButtonPress } = useExplorePermissions();

  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [selectedRuntime, setSelectedRuntime] = useState<ModelRuntime>('tflite');
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(DEFAULT_CONFIDENCE);
  const [nmsEnabled, setNmsEnabled] = useState<boolean>(true);
  const [tfliteDelegate, setTfliteDelegate] = useState<TfliteDelegate>('gpu');
  const [showDebugOverlay, setShowDebugOverlay] = useState<boolean>(false);
  const [snapshotInfo, setSnapshotInfo] = useState<string | null>(null);

  const detection = useExploreDetection({
    isFocused,
    selectedRuntime,
    tfliteDelegate,
    nmsEnabled,
  });

  const panelAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;

  const detectionEnabled = detection.isDetecting && isFocused;

  const statusColor = useMemo(() => getStatusColor(detection.runtimeStatus), [detection.runtimeStatus]);

  const statusText = useMemo(() => {
    if (detection.runtimeStatus === 'running') return `Live (${formatRuntime(detection.activeRuntime)})`;
    if (detection.runtimeStatus === 'loading') return 'Loading runtime';
    if (detection.runtimeStatus === 'fallback') return `Fallback (${formatRuntime(detection.activeRuntime)})`;
    if (detection.runtimeStatus === 'error') return 'Runtime error';
    return 'Ready';
  }, [detection.activeRuntime, detection.runtimeStatus]);

  const fpsDisplay = useMemo(() => (detection.fps != null ? `${detection.fps.toFixed(1)} FPS` : '-- FPS'), [detection.fps]);

  const inferDisplay = useMemo(
    () =>
      detection.inferMs != null && Number.isFinite(detection.inferMs)
        ? `${Math.round(detection.inferMs)} ms`
        : '-- ms',
    [detection.inferMs],
  );

  const metricsSummary = useMemo(
    () =>
      detection.preprocessMs != null && Number.isFinite(detection.preprocessMs)
        ? `Preprocess ${Math.round(detection.preprocessMs)} ms`
        : 'Preprocess --',
    [detection.preprocessMs],
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
    if (!detection.isDetecting || !isFocused) {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(0);
      return;
    }
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [detection.isDetecting, isFocused, pulseAnim]);

  const statusDotStyle = useMemo(
    () => ({
      backgroundColor: statusColor,
      transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] }) }],
      opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }),
    }),
    [pulseAnim, statusColor],
  );

  const panelAnimatedStyle = useMemo(
    () => ({
      opacity: panelAnim,
      transform: [
        { translateY: panelAnim.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) },
      ],
    }),
    [panelAnim],
  );

  const handleStartStop = useCallback(async () => {
    if (!permission?.granted) {
      const granted = await ensureCameraPermission();
      if (granted) await refreshPermission();
      return;
    }
    if (detection.isDetecting) {
      logEvent('Explore:DetectionStopped');
      detection.stopDetection();
      setSnapshotInfo(null);
      return;
    }
    logEvent('Explore:DetectionStarted', { runtime: selectedRuntime });
    await detection.startDetection(selectedRuntime);
  }, [permission?.granted, refreshPermission, detection, selectedRuntime]);

  const handleFlipCamera = useCallback(() => {
    setFacing((prev) => {
      const next = prev === 'back' ? 'front' : 'back';
      logEvent('Explore:FlipCamera', { from: prev, to: next });
      return next;
    });
  }, []);

  const handleModelSelect = useCallback(
    async (runtime: ModelRuntime) => {
      logEvent('Explore:ModelSelected', { runtime });
      setSelectedRuntime(runtime);
      await detection.applyRuntimePreference(runtime);
    },
    [detection.applyRuntimePreference],
  );

  const handleDelegateSelect = useCallback(
    async (delegate: TfliteDelegate) => {
      setTfliteDelegate(delegate);
      modelManager.setConfig({ tfliteDelegate: delegate, tfliteAllowNnapiFallback: true });
      if (selectedRuntime === 'tflite') {
        await detection.applyRuntimePreference('tflite', { tfliteDelegate: delegate });
      }
    },
    [detection.applyRuntimePreference, selectedRuntime],
  );

  const triggerSnapshotFlash = useCallback(() => {
    flashAnim.setValue(0.65);
    Animated.timing(flashAnim, { toValue: 0, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [flashAnim]);

  const handleSnapshot = useCallback(async () => {
    const camera = cameraRef.current;
    if (!camera || typeof camera.takeSnapshot !== 'function') {
      logEvent('Explore:SnapshotUnavailable');
      setSnapshotInfo('Snapshot unavailable on this build.');
      return;
    }
    logEvent('Explore:SnapshotTaken');
    try {
      const result = await camera.takeSnapshot({ quality: 90 });
      triggerSnapshotFlash();
      const pathHint = result?.path ?? result?.filePath ?? result?.uri ?? 'Saved';
      setSnapshotInfo(`Snapshot: ${pathHint}`);
    } catch (error: unknown) {
      logEvent('Explore:SnapshotError', { error: formatError(error) });
      setSnapshotInfo(formatError(error));
    }
  }, [triggerSnapshotFlash]);

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
        {permission === null ? (
          <View style={[styles.camera, styles.permissionPlaceholder]}>
            <ActivityIndicator size="large" color={white} />
            <Text style={styles.permissionPlaceholderText}>Checking camera…</Text>
          </View>
        ) : !permission.granted ? (
          <View style={[styles.camera, styles.permissionPlaceholder]}>
            <Ionicons name="camera-outline" size={64} color={white} />
            <Text style={styles.permissionPlaceholderText}>Camera access needed</Text>
            <Text style={styles.permissionPlaceholderSubtext}>
              Enable camera to use live object detection.
            </Text>
            <View
              style={[
                styles.permissionButton,
                permission.canAskAgain ? styles.permissionButtonPrimary : styles.permissionButtonOutline,
              ]}
            >
              <Pressable
                style={({ pressed }) => [StyleSheet.absoluteFill, styles.permissionButtonInner, pressed && styles.buttonPressed]}
                onPress={handlePermissionButtonPress}
                accessibilityRole="button"
                accessibilityLabel={permission.canAskAgain ? 'Enable camera' : 'Open settings'}
              >
                <Text
                  style={[
                    styles.permissionButtonText,
                    permission.canAskAgain ? styles.permissionButtonTextPrimary : styles.permissionButtonTextOutline,
                  ]}
                >
                  {permission.canAskAgain ? 'Enable Camera' : 'Open Settings'}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            {React.createElement(
              CameraView as React.ComponentType<CameraViewProps & { ref?: React.RefObject<CameraViewRef | null> }>,
              {
                ref: cameraRef,
                style: styles.camera,
                isActive: isFocused,
                detectionEnabled,
                facing,
                maxInferenceFps: MAX_INFERENCE_FPS,
                confidenceThreshold,
                nmsIoU: detection.effectiveNmsIoU,
                inputResolution: [...INPUT_RESOLUTION],
                tfliteDelegate,
                tfliteAllowNnapiFallback: true,
                onnxExecutionProviders: [...ONNX_EXECUTION_PROVIDERS],
                onnxGraphOptimizationLevel: ONNX_GRAPH_OPT_LEVEL,
                onnxIntraOpThreads: ONNX_INTRA_OP_THREADS,
                onnxInterOpThreads: ONNX_INTER_OP_THREADS,
                adaptiveFrameSkip: true,
                processEveryNMax: 6,
                preprocessOnJs: false,
                onInferenceResult: detection.handleInferenceResult,
                onInferenceError: detection.handleInferenceError,
              },
            )}

            <BoxOverlay
              predictions={detection.predictions as Parameters<typeof BoxOverlay>[0]['predictions']}
              modelSize={detection.modelSize}
              sourceSize={detection.sourceSize}
              resizeMode="cover"
              modelResizeMode="stretch"
              smoothingAlpha={0.35}
              enableTapDetails
              style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.previewTopBar} pointerEvents="none">
              <View style={styles.metricChip}>
                <Ionicons name="speedometer-outline" size={14} color={white} />
                <Text style={styles.metricChipText}>{fpsDisplay}</Text>
              </View>
              <View style={styles.metricChip}>
                <Ionicons name="timer-outline" size={14} color={white} />
                <Text style={styles.metricChipText}>{inferDisplay}</Text>
              </View>
            </View>

            {showDebugOverlay && (
              <View style={styles.debugOverlay} pointerEvents="none">
                <Text style={styles.debugTitle}>Debug</Text>
                <Text style={styles.debugText}>
                  FPS {detection.fps != null ? detection.fps.toFixed(1) : '--'} | Infer {inferDisplay} | Total{' '}
                  {detection.totalMs != null && Number.isFinite(detection.totalMs)
                    ? `${Math.round(detection.totalMs)} ms`
                    : '-- ms'}
                </Text>
                <Text style={styles.debugText}>
                  Budget {Math.round(detection.targetBudgetMs)} ms | Stride 1/{detection.currentStride} | Dropped{' '}
                  {detection.droppedFrames}
                </Text>
                <View style={styles.graphRow}>
                  {detection.latencyBars.map((bar) => (
                    <View
                      key={bar.key}
                      style={[
                        styles.graphBar,
                        { height: `${bar.heightPct}%` as DimensionValue },
                        bar.isSlow ? styles.graphBarSlow : styles.graphBarFast,
                      ]}
                    />
                  ))}
                </View>
              </View>
            )}

            <Animated.View pointerEvents="none" style={[styles.snapshotFlash, { opacity: flashAnim }]} />
          </>
        )}
      </View>

      <Animated.View style={[styles.panel, panelAnimatedStyle]}>
        <View style={styles.actionsRow}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              detection.isDetecting ? styles.stopButton : styles.startButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => void handleStartStop()}
            accessibilityRole="button"
            accessibilityLabel={detection.isDetecting ? 'Stop detection' : 'Start detection'}
          >
            <Ionicons name={detection.isDetecting ? 'pause' : 'play'} size={16} color="#111827" />
            <Text style={styles.primaryButtonText}>{detection.isDetecting ? 'Stop' : 'Start'}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
            onPress={handleFlipCamera}
            accessibilityRole="button"
            accessibilityLabel="Flip camera"
          >
            <Ionicons name="camera-reverse-outline" size={19} color={white} />
            <Text style={styles.iconButtonText}>Flip</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
            onPress={() => void handleSnapshot()}
            accessibilityRole="button"
            accessibilityLabel="Take snapshot"
          >
            <Ionicons name="camera-outline" size={19} color={white} />
            <Text style={styles.iconButtonText}>Snapshot</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Model Runtime</Text>
          <View style={styles.selectorRow}>
            {MODEL_OPTIONS.map((option) => (
              <Pressable
                key={option.id}
                style={({ pressed }) => [
                  styles.selectorButton,
                  selectedRuntime === option.id && styles.selectorButtonSelected,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => void handleModelSelect(option.id)}
                disabled={detection.isSwitchingRuntime}
                accessibilityRole="button"
                accessibilityLabel={`Select ${option.label} runtime`}
                accessibilityState={{ selected: selectedRuntime === option.id }}
              >
                <Text
                  style={[
                    styles.selectorButtonText,
                    selectedRuntime === option.id && styles.selectorButtonTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {selectedRuntime === 'tflite' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TFLite Delegate</Text>
            <View style={styles.delegateRow}>
              {TFLITE_DELEGATE_OPTIONS.map((option) => (
                <Pressable
                  key={option.id}
                  style={({ pressed }) => [
                    styles.delegateButton,
                    tfliteDelegate === option.id && styles.delegateButtonSelected,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => void handleDelegateSelect(option.id)}
                  disabled={detection.isSwitchingRuntime}
                  accessibilityRole="button"
                  accessibilityLabel={`Use ${option.label} delegate`}
                  accessibilityState={{ selected: tfliteDelegate === option.id }}
                >
                  <Text
                    style={[
                      styles.delegateButtonText,
                      tfliteDelegate === option.id && styles.delegateButtonTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

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
              thumbColor={nmsEnabled ? accent : '#E5E7EB'}
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

        {detection.statusMessage && (<Text style={styles.errorText}>{detection.statusMessage}</Text>)}
        {snapshotInfo && (<Text style={styles.snapshotText}>{snapshotInfo}</Text>)}
      </Animated.View>
    </View>
  );
}
