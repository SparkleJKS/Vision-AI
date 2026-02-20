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
      className="rounded-2xl overflow-hidden"
      style={{ opacity: fadeAnim, transform: [{ translateY }, { scale: scaleAnim }] }}
    >
      <Pressable
        onPress={() => isActive && onSelect(feature.id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className={`bg-[#0F1620] border border-[#1E2D3D] rounded-2xl p-5 overflow-hidden ${!isActive ? 'opacity-65' : ''}`}
      >
        <View
          className="absolute top-0 left-5 right-5 h-px"
          style={{ backgroundColor: feature.accentColor }}
        />
        <View className="flex-row justify-between items-center">
          <View
            className="w-11 h-11 rounded-xl border bg-[#0A0F18] justify-center items-center"
            style={{ borderColor: feature.accentColor + '40' }}
          >
            <Text className="text-[22px]" style={{ color: feature.accentColor }}>
              {feature.icon}
            </Text>
          </View>
          <View
            className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-full"
            style={{ backgroundColor: isActive ? feature.accentColor + '20' : '#1E293B' }}
          >
            {!isActive && (
              <View className="w-1.5 h-1.5 rounded-full bg-[#64748B]" />
            )}
            <Text
              className="text-[10px] font-bold tracking-wider"
              style={{ color: isActive ? feature.accentColor : '#64748B' }}
            >
              {isActive ? 'LIVE' : 'SOON'}
            </Text>
          </View>
        </View>
        <Text className="text-[#F1F5F9] text-xl font-bold tracking-tight mt-1">
          {feature.title}
        </Text>
        <Text className="text-[#475569] text-xs font-medium tracking-wide -mt-1.5">
          {feature.subtitle}
        </Text>
        <Text className="text-[#64748B] text-[13px] leading-5 mt-0.5">
          {feature.description}
        </Text>
        {feature.stats && (
          <View className="flex-row gap-0 mt-1 border-t border-[#1E2D3D] pt-3.5">
            {feature.stats.map((stat, i) => (
              <View key={i} className="flex-1 items-center gap-0.5">
                <Text className="text-[15px] font-bold" style={{ color: feature.accentColor }}>
                  {stat.value}
                </Text>
                <Text className="text-[#475569] text-[10px] font-medium tracking-wider">
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
          className="w-10 h-10 rounded-[10px] bg-[#0F1620] border border-[#1E2D3D] justify-center items-center"
        >
          <Text className="text-[#94A3B8] text-lg font-light">←</Text>
        </Pressable>
        <View className="flex-1 gap-0.5">
          <Text className="text-[#F1F5F9] text-[17px] font-bold">Object Detection</Text>
          <Text className="text-[#475569] text-[11px] font-medium tracking-wide">
            YOLOv8n · 80 Classes
          </Text>
        </View>
        <View
          className={`flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${
            isModelActive ? 'bg-[#22C55E15] border-[#22C55E35]' : 'bg-[#0F1620] border-[#1E2D3D]'
          }`}
        >
          <View
            className={`w-1.5 h-1.5 rounded-full ${
              isModelActive ? 'bg-[#22C55E]' : 'bg-[#334155]'
            }`}
          />
          <Text
            className={`text-[10px] font-bold tracking-wider ${
              isModelActive ? 'text-[#22C55E]' : 'text-[#475569]'
            }`}
          >
            {isModelActive ? 'LIVE' : 'OFF'}
          </Text>
        </View>
      </View>

      <View className="flex-1 rounded-2xl border border-[#1E2D3D] bg-black overflow-hidden">
        {permission === null ? (
          <View className="flex-1 justify-center items-center gap-3.5 p-6">
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : !permission.granted ? (
          <View className="flex-1 justify-center items-center gap-3.5 p-6">
            <Text className="text-4xl text-[#1E2D3D]">⬡</Text>
            <Text className="text-[#94A3B8] text-[15px] font-semibold text-center">
              Camera access required
            </Text>
            <Pressable
              className="px-5 py-2.5 rounded-[10px] bg-[#22C55E]"
              onPress={() => void handlePermissionButtonPress()}
            >
              <Text className="text-black text-[13px] font-bold">
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
                <Text className="text-[#475569] text-xs font-medium bg-[#080B10CC] px-3.5 py-1.5 rounded-full overflow-hidden">
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
          } bg-[#0F1620] border-[#1E2D3D]`}
          onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
          disabled={!canUseCamera}
        >
          <Text className="text-[#94A3B8] text-xl">⟳</Text>
          <Text className="text-[#475569] text-[10px] font-semibold">Flip</Text>
        </Pressable>
        <Pressable
          className={`flex-1 py-3.5 rounded-xl justify-center items-center border ${
            !canUseCamera ? 'opacity-40' : ''
          } ${
            isModelActive
              ? 'bg-[#0F1620] border-[#F59E0B50]'
              : 'bg-[#22C55E] border-[#22C55E]'
          }`}
          onPress={() => setIsLiveDetectionEnabled((v) => !v)}
          disabled={!canUseCamera}
        >
          <Text className="text-[#F1F5F9] text-sm font-bold tracking-wide">
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
          <View className="self-start border border-[#22C55E35] rounded-md px-2.5 py-1 mb-1 bg-[#22C55E18]">
            <Text className="text-[#22C55E] text-[10px] font-bold tracking-widest">
              VISION AI
            </Text>
          </View>
          <Text className="text-[#F1F5F9] text-3xl font-extrabold tracking-tight">
            AI Tools
          </Text>
          <Text className="text-[#475569] text-sm">Select a feature to get started</Text>
        </View>

        <View className="gap-3.5">
          {FEATURES.map((feature, index) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              onSelect={setSelectedFeature}
              index={index}
            />
          ))}
        </View>

        <Text className="text-[#1E2D3D] text-xs text-center mt-6 tracking-wide">
          More AI capabilities coming soon
        </Text>
      </ScrollView>
    </View>
  );
};

export default ExploreScreen;
