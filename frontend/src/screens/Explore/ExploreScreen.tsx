import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const [permission, requestPermission] = useCameraPermissions();
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

  const handleStartStop = useCallback(() => {
    if (!permission?.granted) {
      void requestPermission();
      return;
    }

    setIsScanning((previous) => !previous);
  }, [permission?.granted, requestPermission]);

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
          {permission?.granted ? (
            <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
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
            </CameraView>
          ) : (
            <View style={styles.permissionWrap}>
              <Ionicons name="camera-outline" size={34} color={ACCENT_YELLOW} />
              <Text style={styles.permissionTitle}>Camera access needed</Text>
              <Text style={styles.permissionText}>
                Enable camera permission to start live object detection.
              </Text>
              <Pressable
                onPress={() => void requestPermission()}
                style={[styles.controlButton, styles.startButton]}
              >
                <Text style={styles.startButtonText}>Enable Camera</Text>
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
  camera: {
    flex: 1,
    minHeight: 340,
    justifyContent: 'space-between',
  },
  badgesRow: {
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
