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
import { useTheme } from '@/theme';
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
  theme,
}: {
  feature: Feature;
  onSelect: (id: FeatureId) => void;
  index: number;
  theme: import('@/theme/tokens').ThemeTokens;
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
      className="rounded-2xl overflow-hidden"
      style={{ opacity: fadeAnim, transform: [{ translateY }, { scale: scaleAnim }] }}
    >
      <Pressable
        onPress={() => isActive && onSelect(feature.id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className={`rounded-2xl p-5 overflow-hidden border ${!isActive ? 'opacity-65' : ''}`}
        style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
      >
        <View
          className="absolute top-0 left-5 right-5 h-px"
          style={{ backgroundColor: feature.accentColor }}
        />
        <View className="flex-row justify-between items-center">
          <View
            className="w-11 h-11 rounded-xl border justify-center items-center"
            style={{ borderColor: feature.accentColor + '40', backgroundColor: theme.darkBg }}
          >
            <Text className="text-[22px]" style={{ color: feature.accentColor }}>
              {feature.icon}
            </Text>
          </View>
          <View
            className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-full"
            style={{ backgroundColor: isActive ? feature.accentColor + '20' : theme.cardBg }}
          >
            {!isActive && (
              <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.muted }} />
            )}
            <Text
              className="text-[10px] font-bold tracking-wider"
              style={{ color: isActive ? feature.accentColor : theme.muted }}
            >
              {isActive ? 'LIVE' : 'SOON'}
            </Text>
          </View>
        </View>
        <Text className="text-xl font-bold tracking-tight mt-1" style={{ color: theme.white }}>
          {feature.title}
        </Text>
        <Text className="text-xs font-medium tracking-wide -mt-1.5" style={{ color: theme.grey }}>
          {feature.subtitle}
        </Text>
        <Text className="text-[13px] leading-5 mt-0.5" style={{ color: theme.muted }}>
          {feature.description}
        </Text>
        {feature.stats && (
          <View className="flex-row gap-0 mt-1 border-t pt-3.5" style={{ borderColor: theme.border }}>
            {feature.stats.map((stat, i) => (
              <View key={i} className="flex-1 items-center gap-0.5">
                <Text className="text-[15px] font-bold" style={{ color: feature.accentColor }}>
                  {stat.value}
                </Text>
                <Text className="text-[10px] font-medium tracking-wider" style={{ color: theme.grey }}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        )}
        {isActive && (
          <View
            className="border rounded-[10px] py-2.5 items-center mt-1"
            style={{
              backgroundColor: feature.accentColor + '15',
              borderColor: feature.accentColor + '40',
            }}
          >
            <Text className="text-[13px] font-bold tracking-wide" style={{ color: feature.accentColor }}>
              Launch →
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

function ObjectDetectionView({
  onBack,
  isFocused,
  theme,
}: {
  onBack: () => void;
  isFocused: boolean;
  theme: import('@/theme/tokens').ThemeTokens;
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
      className="flex-1 gap-3 px-4 pt-2"
      style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
    >
      <View className="flex-row items-center gap-3 py-2">
        <Pressable
          onPress={onBack}
          className="w-10 h-10 rounded-[10px] justify-center items-center border"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
        >
          <Text className="text-lg font-light" style={{ color: theme.grey }}>←</Text>
        </Pressable>
        <View className="flex-1 gap-0.5">
          <Text className="text-[17px] font-bold" style={{ color: theme.white }}>Object Detection</Text>
          <Text className="text-[11px] font-medium tracking-wide" style={{ color: theme.grey }}>
            YOLOv8n · 80 Classes
          </Text>
        </View>
        <View
          className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-lg border"
          style={{
            backgroundColor: isModelActive ? theme.primary + '15' : theme.cardBg,
            borderColor: isModelActive ? theme.primary + '35' : theme.border,
          }}
        >
          <View
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: isModelActive ? theme.primary : theme.tabInactive }}
          />
          <Text
            className="text-[10px] font-bold tracking-wider"
            style={{ color: isModelActive ? theme.primary : theme.grey }}
          >
            {isModelActive ? 'LIVE' : 'OFF'}
          </Text>
        </View>
      </View>

      <View className="flex-1 rounded-2xl border bg-black overflow-hidden" style={{ borderColor: theme.border }}>
        {permission === null ? (
          <View className="flex-1 justify-center items-center gap-3.5 p-6">
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : !permission.granted ? (
          <View className="flex-1 justify-center items-center gap-3.5 p-6">
            <Text className="text-4xl" style={{ color: theme.border }}>⬡</Text>
            <Text className="text-[15px] font-semibold text-center" style={{ color: theme.grey }}>
              Camera access required
            </Text>
            <Pressable
              className="px-5 py-2.5 rounded-[10px]"
              style={{ backgroundColor: theme.primary }}
              onPress={() => void handlePermissionButtonPress()}
            >
              <Text className="text-[13px] font-bold" style={{ color: '#111827' }}>
                {permission.canAskAgain ? 'Enable Camera' : 'Open Settings'}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View className="flex-1 relative">
            <CameraView
              style={StyleSheet.absoluteFill}
              isActive={isFocused}
              detectionEnabled={isModelActive}
              facing={facing}
            />
            <DetectionOverlay enabled={isModelActive} />
            {!isModelActive && (
              <View className="absolute bottom-4 left-0 right-0 items-center">
                <Text
                  className="text-xs font-medium px-3.5 py-1.5 rounded-full overflow-hidden"
                  style={{ color: theme.grey, backgroundColor: theme.screenBg + 'CC' }}
                >
                  Press Start to begin detection
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View className="flex-row gap-2.5 pb-2">
        <Pressable
          className={`w-[60px] py-2.5 rounded-xl justify-center items-center border gap-0.5 ${
            !canUseCamera ? 'opacity-40' : ''
          }`}
          style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
          onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
          disabled={!canUseCamera}
        >
          <Text className="text-xl" style={{ color: theme.grey }}>⟳</Text>
          <Text className="text-[10px] font-semibold" style={{ color: theme.grey }}>Flip</Text>
        </Pressable>
        <Pressable
          className={`flex-1 py-3.5 rounded-xl justify-center items-center border ${
            !canUseCamera ? 'opacity-40' : ''
          }`}
          style={{
            backgroundColor: isModelActive ? theme.cardBg : theme.primary,
            borderColor: isModelActive ? theme.warning + '50' : theme.primary,
          }}
          onPress={() => setIsLiveDetectionEnabled((v) => !v)}
          disabled={!canUseCamera}
        >
          <Text className="text-sm font-bold tracking-wide" style={{ color: theme.white }}>
            {isModelActive ? '◼ Stop Detection' : '▶ Start Detection'}
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const ExploreScreen = () => {
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [selectedFeature, setSelectedFeature] = useState<FeatureId | null>(null);
  useEffect(() => {
    if (!isFocused) setSelectedFeature(null);
  }, [isFocused]);

  if (selectedFeature === 'objectDetection') {
    return (
      <View
        className="flex-1"
        style={{
          backgroundColor: theme.screenBg,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        <ObjectDetectionView
          onBack={() => setSelectedFeature(null)}
          isFocused={isFocused}
          theme={theme}
        />
      </View>
    );
  }

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: theme.screenBg, paddingTop: insets.top }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="py-6 gap-2">
          <View
            className="self-start border rounded-md px-2.5 py-1 mb-1"
            style={{ borderColor: theme.exploreAccent + '35', backgroundColor: theme.exploreAccent + '18' }}
          >
            <Text className="text-[10px] font-bold tracking-widest" style={{ color: theme.exploreAccent }}>
              VISION AI
            </Text>
          </View>
          <Text className="text-3xl font-extrabold tracking-tight" style={{ color: theme.white }}>
            AI Tools
          </Text>
          <Text className="text-sm" style={{ color: theme.grey }}>Select a feature to get started</Text>
        </View>

        <View className="gap-3.5">
          {FEATURES.map((feature, index) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              onSelect={setSelectedFeature}
              index={index}
              theme={theme}
            />
          ))}
        </View>

        <Text className="text-xs text-center mt-6 tracking-wide" style={{ color: theme.border }}>
          More AI capabilities coming soon
        </Text>
      </ScrollView>
    </View>
  );
};

export default ExploreScreen;
