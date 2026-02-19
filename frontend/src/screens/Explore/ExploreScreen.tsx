import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CameraView from '../../components/CameraView';
import DetectionOverlay from '../../components/DetectionOverlay';
import { useExplorePermissions } from './hooks';

type FeatureId = 'objectDetection' | 'ocr' | 'tts';

type Feature = {
  id: FeatureId;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  status: 'active' | 'coming_soon';
  accentColor: string;
  stats?: { label: string; value: string }[];
};

const FEATURES: Feature[] = [
  {
    id: 'objectDetection',
    title: 'Object Detection',
    subtitle: 'Real-time AI Vision',
    description: 'Detect and identify objects in your environment instantly using YOLOv8 neural network.',
    icon: '⬡',
    status: 'active',
    accentColor: '#22C55E',
    stats: [
      { label: 'Model', value: 'YOLOv8n' },
      { label: 'Classes', value: '80' },
      { label: 'Input', value: '320px' },
    ],
  },
  {
    id: 'ocr',
    title: 'Photo to Text',
    subtitle: 'Optical Character Recognition',
    description: 'Extract and digitize text from images, documents, signs, and handwriting with high accuracy.',
    icon: '◈',
    status: 'coming_soon',
    accentColor: '#6366F1',
    stats: [
      { label: 'Languages', value: '50+' },
      { label: 'Mode', value: 'Offline' },
      { label: 'Format', value: 'PDF/IMG' },
    ],
  },
  {
    id: 'tts',
    title: 'Text to Speech',
    subtitle: 'Neural Voice Synthesis',
    description: 'Convert any text into natural-sounding speech with multiple voice profiles and languages.',
    icon: '◎',
    status: 'coming_soon',
    accentColor: '#F59E0B',
    stats: [
      { label: 'Voices', value: '12' },
      { label: 'Languages', value: '30+' },
      { label: 'Quality', value: 'Neural' },
    ],
  },
];

function FeatureCard({
  feature,
  onSelect,
  index,
}: {
  feature: Feature;
  onSelect: (id: FeatureId) => void;
  index: number;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 120,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay: index * 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const isActive = feature.status === 'active';

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        { opacity: fadeAnim, transform: [{ translateY }, { scale: scaleAnim }] },
      ]}
    >
      <Pressable
        onPress={() => isActive && onSelect(feature.id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.card, !isActive && styles.cardDisabled]}
      >
        {/* Accent line */}
        <View style={[styles.cardAccent, { backgroundColor: feature.accentColor }]} />

        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { borderColor: feature.accentColor + '40' }]}>
            <Text style={[styles.icon, { color: feature.accentColor }]}>{feature.icon}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: isActive ? feature.accentColor + '20' : '#1E293B' },
            ]}
          >
            {!isActive && <View style={styles.statusDot} />}
            <Text
              style={[
                styles.statusText,
                { color: isActive ? feature.accentColor : '#64748B' },
              ]}
            >
              {isActive ? 'LIVE' : 'SOON'}
            </Text>
          </View>
        </View>

        <Text style={styles.cardTitle}>{feature.title}</Text>
        <Text style={styles.cardSubtitle}>{feature.subtitle}</Text>
        <Text style={styles.cardDescription}>{feature.description}</Text>

        {feature.stats && (
          <View style={styles.statsRow}>
            {feature.stats.map((stat, i) => (
              <View key={i} style={styles.statItem}>
                <Text style={[styles.statValue, { color: feature.accentColor }]}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        )}

        {isActive && (
          <View
            style={[
              styles.launchButton,
              { backgroundColor: feature.accentColor + '15', borderColor: feature.accentColor + '40' },
            ]}
          >
            <Text style={[styles.launchText, { color: feature.accentColor }]}>Launch →</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

function ObjectDetectionView({
  onBack,
  isFocused,
}: {
  onBack: () => void;
  isFocused: boolean;
}) {
  const { permission, handlePermissionButtonPress } = useExplorePermissions();
  const [isLiveDetectionEnabled, setIsLiveDetectionEnabled] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const canUseCamera = permission?.granted === true;
  const isModelActive = useMemo(
    () => Boolean(canUseCamera && isFocused && isLiveDetectionEnabled),
    [canUseCamera, isFocused, isLiveDetectionEnabled],
  );

  useEffect(() => {
    if (!canUseCamera && isLiveDetectionEnabled) setIsLiveDetectionEnabled(false);
  }, [canUseCamera, isLiveDetectionEnabled]);

  useEffect(() => {
    void handlePermissionButtonPress();
  }, []);

  return (
    <Animated.View
      style={[styles.detectionView, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
    >
      {/* Header */}
      <View style={styles.detectionHeader}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <View style={styles.detectionHeaderText}>
          <Text style={styles.detectionTitle}>Object Detection</Text>
          <Text style={styles.detectionSubtitle}>YOLOv8n · 80 Classes</Text>
        </View>
        <View style={[styles.liveIndicator, isModelActive && styles.liveIndicatorActive]}>
          <View style={[styles.liveDot, isModelActive && styles.liveDotActive]} />
          <Text style={[styles.liveText, isModelActive && styles.liveTextActive]}>
            {isModelActive ? 'LIVE' : 'OFF'}
          </Text>
        </View>
      </View>

      {/* Camera */}
      <View style={styles.cameraCard}>
        {permission === null ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#22C55E" />
          </View>
        ) : !permission.granted ? (
          <View style={styles.centerContent}>
            <Text style={styles.permissionIcon}>⬡</Text>
            <Text style={styles.permissionText}>Camera access required</Text>
            <Pressable
              style={styles.permissionButton}
              onPress={() => void handlePermissionButtonPress()}
            >
              <Text style={styles.permissionButtonText}>
                {permission.canAskAgain ? 'Enable Camera' : 'Open Settings'}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.cameraContainer}>
            <CameraView
              style={StyleSheet.absoluteFill}
              isActive={isFocused}
              detectionEnabled={isModelActive}
              facing={facing}
            />
            <DetectionOverlay enabled={isModelActive} />
            {!isModelActive && (
              <View style={styles.cameraOverlayHint}>
                <Text style={styles.cameraHintText}>Press Start to begin detection</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controlsRow}>
        <Pressable
          style={[
            styles.controlButton,
            styles.flipControlButton,
            !canUseCamera && styles.controlButtonDisabled,
          ]}
          onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
          disabled={!canUseCamera}
        >
          <Text style={styles.controlButtonIcon}>⟳</Text>
          <Text style={styles.controlButtonLabel}>Flip</Text>
        </Pressable>

        <Pressable
          style={[
            styles.controlButton,
            styles.mainControlButton,
            isModelActive ? styles.stopControlButton : styles.startControlButton,
            !canUseCamera && styles.controlButtonDisabled,
          ]}
          onPress={() => setIsLiveDetectionEnabled((v) => !v)}
          disabled={!canUseCamera}
        >
          <Text style={styles.mainControlButtonText}>
            {isModelActive ? '◼ Stop Detection' : '▶ Start Detection'}
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

export function ExploreScreen() {
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const [selectedFeature, setSelectedFeature] = useState<FeatureId | null>(null);
  useEffect(() => {
    if (!isFocused) setSelectedFeature(null);
  }, [isFocused]);

  if (selectedFeature === 'objectDetection') {
    return (
      <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}> 
        <ObjectDetectionView onBack={() => setSelectedFeature(null)} isFocused={isFocused} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}> 
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>VISION AI</Text>
          </View>
          <Text style={styles.headerTitle}>AI Tools</Text>
          <Text style={styles.headerSubtitle}>Select a feature to get started</Text>
        </View>

        {/* Feature Cards */}
        <View style={styles.cardsContainer}>
          {FEATURES.map((feature, index) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              onSelect={setSelectedFeature}
              index={index}
            />
          ))}
        </View>

        {/* Footer note */}
        <Text style={styles.footerNote}>More AI capabilities coming soon</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#080B10',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // Header
  header: {
    paddingVertical: 24,
    gap: 8,
  },
  headerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#22C55E18',
    borderWidth: 1,
    borderColor: '#22C55E35',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 4,
  },
  headerBadgeText: {
    color: '#22C55E',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },
  headerTitle: {
    color: '#F1F5F9',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '400',
  },

  // Cards
  cardsContainer: {
    gap: 14,
  },
  cardWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: '#0F1620',
    borderWidth: 1,
    borderColor: '#1E2D3D',
    borderRadius: 16,
    padding: 20,
    gap: 10,
    overflow: 'hidden',
  },
  cardDisabled: {
    opacity: 0.65,
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#0A0F18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 22,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#64748B',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  cardTitle: {
    color: '#F1F5F9',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginTop: 4,
  },
  cardSubtitle: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
    marginTop: -6,
  },
  cardDescription: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 0,
    marginTop: 4,
    borderTopWidth: 1,
    borderColor: '#1E2D3D',
    paddingTop: 14,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  statLabel: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  launchButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  launchText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footerNote: {
    color: '#1E2D3D',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
    letterSpacing: 0.5,
  },

  // Detection View
  detectionView: {
    flex: 1,
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  detectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#0F1620',
    borderWidth: 1,
    borderColor: '#1E2D3D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    color: '#94A3B8',
    fontSize: 18,
    fontWeight: '300',
  },
  detectionHeaderText: {
    flex: 1,
    gap: 2,
  },
  detectionTitle: {
    color: '#F1F5F9',
    fontSize: 17,
    fontWeight: '700',
  },
  detectionSubtitle: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#0F1620',
    borderWidth: 1,
    borderColor: '#1E2D3D',
  },
  liveIndicatorActive: {
    backgroundColor: '#22C55E15',
    borderColor: '#22C55E35',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#334155',
  },
  liveDotActive: {
    backgroundColor: '#22C55E',
  },
  liveText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  liveTextActive: {
    color: '#22C55E',
  },
  cameraCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E2D3D',
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  cameraOverlayHint: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  cameraHintText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '500',
    backgroundColor: '#080B10CC',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    padding: 24,
  },
  permissionIcon: {
    fontSize: 40,
    color: '#1E2D3D',
  },
  permissionText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  permissionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#22C55E',
  },
  permissionButtonText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '700',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 8,
  },
  controlButton: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  flipControlButton: {
    width: 60,
    paddingVertical: 10,
    backgroundColor: '#0F1620',
    borderColor: '#1E2D3D',
    gap: 2,
  },
  controlButtonIcon: {
    color: '#94A3B8',
    fontSize: 20,
  },
  controlButtonLabel: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '600',
  },
  controlButtonDisabled: {
    opacity: 0.4,
  },
  mainControlButton: {
    flex: 1,
    paddingVertical: 14,
  },
  startControlButton: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  stopControlButton: {
    backgroundColor: '#0F1620',
    borderColor: '#F59E0B50',
  },
  mainControlButtonText: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default ExploreScreen;
