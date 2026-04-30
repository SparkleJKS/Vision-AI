import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  useIsFocused,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import CameraView from '../../components/CameraView';
import DetectionOverlay from '../../components/DetectionOverlay';
import { useExplorePermissions } from './hooks';
import { ExploreHeader } from './components/ExploreHeader';
import { StatusPill } from './components/StatusPill';

const ObjectDetectionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const isFocused = useIsFocused();
  const { permission, handlePermissionButtonPress } = useExplorePermissions();
  const [isLiveDetectionEnabled, setIsLiveDetectionEnabled] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const autoStartRequestedRef = useRef(
    Boolean((route.params as { autoStart?: boolean } | undefined)?.autoStart),
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const canUseCamera = permission?.granted === true;
  const isModelActive = useMemo(
    () => Boolean(canUseCamera && isFocused && isLiveDetectionEnabled),
    [canUseCamera, isFocused, isLiveDetectionEnabled],
  );

  useEffect(() => {
    if (!canUseCamera && isLiveDetectionEnabled)
      setIsLiveDetectionEnabled(false);
  }, [canUseCamera, isLiveDetectionEnabled]);

  useEffect(() => {
    void handlePermissionButtonPress();
  }, []);

  useEffect(() => {
    if (!autoStartRequestedRef.current || !canUseCamera) return;
    setIsLiveDetectionEnabled(true);
    autoStartRequestedRef.current = false;
  }, [canUseCamera]);

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: theme.screenBg,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}>
      <Animated.View
        className="flex-1 gap-3 px-4 pt-2"
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <ExploreHeader
          title="Object Detection"
          subtitle="YOLOv8n · 80 Classes"
          onBack={() => navigation.goBack()}
          right={<StatusPill isOn={isModelActive} onLabel="LIVE" offLabel="OFF" />}
        />

        <View
          className="flex-1 rounded-2xl border bg-black overflow-hidden"
          style={{ borderColor: theme.border }}>
          {permission === null ? (
            <View className="flex-1 justify-center items-center gap-3.5 p-6">
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : !permission.granted ? (
            <View className="flex-1 justify-center items-center gap-3.5 p-6">
              <Text className="text-4xl" style={{ color: theme.border }}>
                ⬡
              </Text>
              <Text
                className="text-[15px] font-semibold text-center"
                style={{ color: theme.grey }}>
                Camera access required
              </Text>
              <Pressable
                className="px-5 py-2.5 rounded-[10px]"
                style={{ backgroundColor: theme.primary }}
                onPress={() => void handlePermissionButtonPress()}>
                <Text
                  className="text-[13px] font-bold"
                  style={{ color: '#111827' }}>
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
                    style={{
                      color: theme.grey,
                      backgroundColor: theme.screenBg + 'CC',
                    }}>
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
            onPress={() => setFacing(f => (f === 'back' ? 'front' : 'back'))}
            disabled={!canUseCamera}>
            <Text className="text-xl" style={{ color: theme.grey }}>
              ⟳
            </Text>
            <Text
              className="text-[10px] font-semibold"
              style={{ color: theme.grey }}>
              Flip
            </Text>
          </Pressable>
          <Pressable
            className={`flex-1 py-3.5 rounded-xl justify-center items-center border ${
              !canUseCamera ? 'opacity-40' : ''
            }`}
            style={{
              backgroundColor: isModelActive ? theme.cardBg : theme.primary,
              borderColor: isModelActive ? theme.warning + '50' : theme.primary,
            }}
            onPress={() => setIsLiveDetectionEnabled(v => !v)}
            disabled={!canUseCamera}>
            <Text
              className="text-sm font-bold tracking-wide"
              style={{ color: theme.white }}>
              {isModelActive ? '◼ Stop Detection' : '▶ Start Detection'}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
};

export default ObjectDetectionScreen;
