import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { CameraType, CameraView, PermissionResponse, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ensureCameraPermission } from '../../permissions';
import { detectObjects } from '../../services/detectionApi';
import type { DetectedObject } from '../../services/detectionApi';

const SCREEN_BG = '#0f1117';
const CARD_BG = '#1a1d24';
const CARD_BORDER = '#2d3142';
const WHITE = '#ffffff';
const GREY = '#9ca3af';
const ACCENT_YELLOW = '#FFD54F';
const RED = '#ef4444';

const FRAME_INTERVAL_MS = 1200;
const MAX_RESULTS = 6;

function formatError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Unable to detect objects right now.';
}

export function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView | null>(null);
  const [hookPermission, requestPermission, getPermission] = useCameraPermissions();
  const [permission, setPermission] = useState<PermissionResponse | null>(hookPermission);

  useEffect(() => {
    setPermission(hookPermission);
  }, [hookPermission]);

  const refreshPermission = useCallback(async () => {
    const result = await getPermission();
    setPermission(result);
  }, [getPermission]);

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [objects, setObjects] = useState<DetectedObject[]>([]);
  const [processingMs, setProcessingMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastFrameTime, setLastFrameTime] = useState<number | null>(null);

  const topObjects = useMemo(
    () =>
      [...objects]
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, MAX_RESULTS),
    [objects],
  );

  const runDetection = useCallback(async () => {
    if (isBusy || !cameraRef.current) {
      return;
    }

    try {
      setIsBusy(true);
      setError(null);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.35,
        skipProcessing: true,
      });

      const response = await detectObjects(photo.uri);
      setObjects(response.objects);
      setProcessingMs(response.processing_ms);
      setLastFrameTime(Date.now());
    } catch (detectionError) {
      setError(formatError(detectionError));
    } finally {
      setIsBusy(false);
    }
  }, [isBusy]);

  useEffect(() => {
    if (!isScanning || !permission?.granted) {
      return;
    }

    const interval = setInterval(() => {
      void runDetection();
    }, FRAME_INTERVAL_MS);

    void runDetection();
    return () => clearInterval(interval);
  }, [isScanning, permission?.granted, runDetection]);

  useEffect(() => {
    if (!isScanning) {
      setIsBusy(false);
    }
  }, [isScanning]);

  // Refetch permission when returning from Settings
  useFocusEffect(
    useCallback(() => {
      void refreshPermission();
    }, [refreshPermission]),
  );

  const handleStartStop = useCallback(async () => {
    if (!permission?.granted) {
      const granted = await ensureCameraPermission();
      if (granted) {
        await refreshPermission();
      }
      return;
    }

    setIsScanning((previous) => !previous);
  }, [permission?.granted, refreshPermission]);

  const handlePermissionButtonPress = useCallback(async () => {
    if (permission?.canAskAgain) {
      const result = await requestPermission();
      setPermission(result);
    } else {
      await ensureCameraPermission();
    }
  }, [permission?.canAskAgain, requestPermission]);

  const handleFlipCamera = useCallback(() => {
    setFacing((previous: CameraType) =>
      previous === 'back' ? 'front' : 'back',
    );
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 28 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.subtitle}>Live object detection from camera feed</Text>

        <View style={styles.cameraCard}>
          {permission === null ? (
            <View style={styles.permissionWrap}>
              <ActivityIndicator size="large" color={ACCENT_YELLOW} />
              <Text style={styles.permissionTitle}>Checking camera…</Text>
              <Text style={styles.permissionText}>
                Verifying camera access…
              </Text>
            </View>
          ) : permission.granted ? (
            <View style={styles.cameraWrap}>
              <CameraView ref={cameraRef} style={styles.camera} facing={facing} />
              <View style={styles.badgesRow}>
                <View
                  style={[
                    styles.statusBadge,
                    isScanning ? styles.statusBadgeActive : styles.statusBadgeIdle,
                  ]}
                >
                  <Text style={styles.statusText}>
                    {isScanning ? 'LIVE DETECT' : 'PAUSED'}
                  </Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>
                    {isBusy ? 'Processing' : 'Ready'}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.permissionWrap}>
              <Ionicons name="camera-outline" size={48} color={ACCENT_YELLOW} />
              <Text style={styles.permissionTitle}>Camera access needed</Text>
              <Text style={styles.permissionText}>
                {permission.canAskAgain
                  ? 'Enable camera permission to start live object detection.'
                  : 'Camera permission was denied. Open Settings to enable it.'}
              </Text>
              <Pressable
                onPress={handlePermissionButtonPress}
                style={[
                  styles.permissionButton,
                  permission.canAskAgain ? styles.permissionButtonPrimary : styles.permissionButtonOutline,
                ]}
              >
                <Text
                  style={
                    permission.canAskAgain
                      ? styles.permissionButtonPrimaryText
                      : styles.permissionButtonOutlineText
                  }
                >
                  {permission.canAskAgain ? 'Enable Camera' : 'Open Settings'}
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.controlsRow}>
          <Pressable
            onPress={handleStartStop}
            style={[
              styles.controlButton,
              isScanning ? styles.stopButton : styles.startButton,
            ]}
          >
            <Text style={isScanning ? styles.stopButtonText : styles.startButtonText}>
              {isScanning ? 'Stop Live Detect' : 'Start Live Detect'}
            </Text>
          </Pressable>

          <Pressable onPress={handleFlipCamera} style={styles.controlButtonOutline}>
            <Ionicons name="camera-reverse-outline" size={18} color={WHITE} />
            <Text style={styles.outlineButtonText}>Flip</Text>
          </Pressable>
        </View>

        <View style={styles.resultsCard}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>Detected Objects</Text>
            {isBusy ? <ActivityIndicator color={ACCENT_YELLOW} size="small" /> : null}
          </View>

          {processingMs !== null ? (
            <Text style={styles.metaText}>Inference: {processingMs} ms</Text>
          ) : null}
          {lastFrameTime ? (
            <Text style={styles.metaText}>
              Updated: {new Date(lastFrameTime).toLocaleTimeString()}
            </Text>
          ) : null}

          {error && <Text style={styles.errorText}>{error}</Text>}

          {topObjects.length === 0 ? (
            <Text style={styles.emptyText}>
              {isScanning ? 'No mapped objects detected yet.' : 'Start detection to see live results.'}
            </Text>
          ) : (
            topObjects.map((object, index) => (
              <View key={`${object.label}-${object.confidence}-${index}`} style={styles.resultRow}>
                <Text style={styles.resultLabel}>{object.label}</Text>
                <Text style={styles.resultConfidence}>
                  {Math.round(object.confidence * 100)}%
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: WHITE,
  },
  subtitle: {
    color: GREY,
    fontSize: 14,
    marginTop: -4,
    marginBottom: 4,
  },
  cameraCard: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: CARD_BORDER,
    minHeight: 340,
  },
  cameraWrap: {
    minHeight: 340,
    position: 'relative',
  },
  camera: {
    width: '100%',
    minHeight: 340,
  },
  badgesRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  statusBadge: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusBadgeActive: {
    borderWidth: 1,
    borderColor: ACCENT_YELLOW,
  },
  statusBadgeIdle: {
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  statusText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: '600',
  },
  permissionWrap: {
    minHeight: 340,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 10,
  },
  permissionTitle: {
    color: WHITE,
    fontSize: 18,
    fontWeight: '700',
  },
  permissionText: {
    color: GREY,
    textAlign: 'center',
    marginBottom: 6,
  },
  permissionButton: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    minWidth: 180,
  },
  permissionButtonPrimary: {
    backgroundColor: ACCENT_YELLOW,
  },
  permissionButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: ACCENT_YELLOW,
  },
  permissionButtonPrimaryText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 15,
  },
  permissionButtonOutlineText: {
    color: ACCENT_YELLOW,
    fontWeight: '700',
    fontSize: 15,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  controlButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  controlButtonOutline: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    flexDirection: 'row',
    gap: 6,
  },
  startButton: {
    backgroundColor: ACCENT_YELLOW,
  },
  stopButton: {
    backgroundColor: '#f59e0b',
  },
  startButtonText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 15,
  },
  stopButtonText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 15,
  },
  outlineButtonText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '600',
  },
  resultsCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 14,
    marginTop: 2,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultsTitle: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '700',
  },
  metaText: {
    color: GREY,
    fontSize: 12,
    marginBottom: 3,
  },
  errorText: {
    color: RED,
    marginTop: 4,
    marginBottom: 8,
    fontSize: 13,
  },
  emptyText: {
    color: GREY,
    fontSize: 14,
    marginTop: 6,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: CARD_BORDER,
  },
  resultLabel: {
    color: WHITE,
    fontSize: 14,
    textTransform: 'capitalize',
  },
  resultConfidence: {
    color: ACCENT_YELLOW,
    fontSize: 13,
    fontWeight: '700',
  },
});
