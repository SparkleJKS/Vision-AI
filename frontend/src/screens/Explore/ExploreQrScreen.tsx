import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AppStateStatus } from 'react-native';
import {
  ActivityIndicator,
  Animated,
  AppState,
  Linking,
  Pressable,
  Text,
  View,
} from 'react-native';
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import type { CameraPermissionStatus, Code } from 'react-native-vision-camera';
import { useTheme } from '@/theme';
import { logEvent, warn, error } from '@/utils/logger';
import { showToast } from '@/utils/toast';
import { SCAN_BOX_SIZE, SUPPORTED_CODE_TYPES } from './constants';
import { getOpenableUrl } from './helpers';
import { QrScanBox } from './components/QrScanBox';
import { QrResultSheet } from './components/QrResultSheet';

const LOG_NAME = 'ExploreQr';

type ScannedResult = {
  value: string;
  type: Code['type'];
};

const ExploreQrScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const isFocused = useIsFocused();

  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();

  const [permissionStatus, setPermissionStatus] =
    useState<CameraPermissionStatus | null>(null);
  const [scanned, setScanned] = useState<boolean>(false);
  const [result, setResult] = useState<ScannedResult | null>(null);

  const scannedRef = useRef(false);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  const refreshPermissionStatus = useCallback(() => {
    setPermissionStatus(Camera.getCameraPermissionStatus());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshPermissionStatus();
      logEvent(`${LOG_NAME}_focus`, { screen: 'ExploreQrScanner' });
    }, [refreshPermissionStatus]),
  );

  useEffect(() => {
    refreshPermissionStatus();
  }, [refreshPermissionStatus]);

  useEffect(() => {
    if (permissionStatus === 'denied' || permissionStatus === 'restricted') {
      warn(LOG_NAME, 'Camera permission denied or restricted', {
        status: permissionStatus,
      });
    }
    if (hasPermission && !device) {
      warn(LOG_NAME, 'Back camera not available on this device');
    }
  }, [permissionStatus, hasPermission, device]);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'active') {
          refreshPermissionStatus();
        }
      },
    );
    return () => subscription.remove();
  }, [refreshPermissionStatus]);

  useEffect(() => {
    if (hasPermission || permissionStatus !== 'not-determined') return;
    void requestPermission().finally(refreshPermissionStatus);
  }, [
    hasPermission,
    permissionStatus,
    refreshPermissionStatus,
    requestPermission,
  ]);

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );

    const scanLineLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 1700,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    pulseLoop.start();
    scanLineLoop.start();

    return () => {
      pulseLoop.stop();
      scanLineLoop.stop();
    };
  }, [pulseAnim, scanLineAnim]);

  const handlePermissionButtonPress = useCallback(async () => {
    if (permissionStatus === 'not-determined') {
      await requestPermission();
      logEvent(`${LOG_NAME}_permission_request`, { status: 'asked' });
    } else {
      try {
        await Linking.openSettings();
        logEvent(`${LOG_NAME}_open_settings`, {});
      } catch (e) {
        error(LOG_NAME, 'Failed to open app settings', e);
        showToast.error(
          "Couldn't open Settings",
          'Open Settings manually from your device.',
        );
      }
    }
    refreshPermissionStatus();
  }, [permissionStatus, refreshPermissionStatus, requestPermission]);

  const handleScanAgain = useCallback(() => {
    scannedRef.current = false;
    setScanned(false);
    setResult(null);
    logEvent(`${LOG_NAME}_scan_again`, {});
  }, []);

  const codeScanner = useCodeScanner({
    codeTypes: SUPPORTED_CODE_TYPES,
    onCodeScanned: (codes: Code[]) => {
      if (scannedRef.current) return;
      const detected = codes.find(
        code => typeof code.value === 'string' && code.value.trim().length > 0,
      );
      if (!detected?.value) return;

      scannedRef.current = true;
      setScanned(true);
      setResult({ value: detected.value, type: detected.type });
      const openableUrl = getOpenableUrl(detected.value);
      logEvent(`${LOG_NAME}_scan_success`, {
        type: detected.type,
        valueLength: detected.value.length,
        hasOpenableUrl: Boolean(openableUrl),
      });
    },
  });

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [6, SCAN_BOX_SIZE - 10],
  });
  const cornerScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04],
  });
  const cornerOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.65, 1],
  });

  const urlToOpen = useMemo(() => {
    if (!result) return null;
    return getOpenableUrl(result.value);
  }, [result]);

  const isCameraActive = Boolean(
    isFocused && hasPermission && device && !scanned,
  );
  const canAskAgain = permissionStatus === 'not-determined';
  const cornerColor = scanned ? theme.warning : theme.primary;

  return (
    <View className="flex-1" style={{ backgroundColor: theme.screenBg }}>
      {hasPermission && device ? (
        <View className="flex-1">
          <Camera
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              right: 0,
              bottom: 0,
            }}
            device={device}
            isActive={isCameraActive}
            codeScanner={codeScanner}
            photo={false}
            video={false}
            audio={false}
          />

          <View
            className="absolute inset-0 items-center justify-center"
            pointerEvents="none">
            <QrScanBox
              scanned={scanned}
              cornerColor={cornerColor}
              scanLineColor={theme.primary + 'B3'}
              scanLineTranslateY={scanLineTranslateY}
              cornerScale={cornerScale}
              cornerOpacity={cornerOpacity}
            />
          </View>

          {result ? (
            <QrResultSheet
              insets={insets}
              logName={LOG_NAME}
              result={result}
              urlToOpen={urlToOpen}
              onScanAgain={handleScanAgain}
            />
          ) : null}
        </View>
      ) : (
        <View className="flex-1 justify-center items-center px-6">
          {permissionStatus === null ? (
            <ActivityIndicator size="large" color={theme.primary} />
          ) : hasPermission && !device ? (
            <View
              className="w-full rounded-2xl border p-6 items-center gap-3"
              style={{
                borderColor: theme.border,
                backgroundColor: theme.cardBg,
              }}>
              <Text className="text-4xl" style={{ color: theme.border }}>
                ◉
              </Text>
              <Text
                className="text-[15px] font-semibold text-center"
                style={{ color: theme.grey }}>
                Back camera not available on this device
              </Text>
            </View>
          ) : (
            <View
              className="w-full rounded-2xl border p-6 items-center gap-3.5"
              style={{
                borderColor: theme.border,
                backgroundColor: theme.cardBg,
              }}>
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
                  {canAskAgain ? 'Enable Camera' : 'Open Settings'}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      <View
        className="absolute left-4 right-4 flex-row items-center"
        style={{ top: insets.top + 10 }}>
        <Pressable
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-[10px] justify-center items-center border"
          style={{
            backgroundColor: theme.cardBg + 'E6',
            borderColor: theme.border,
          }}>
          <Text className="text-lg font-light" style={{ color: theme.grey }}>
            ←
          </Text>
        </Pressable>
        <View className="ml-3">
          <Text
            className="text-[16px] font-bold"
            style={{ color: theme.white }}>
            QR & Barcode
          </Text>
          <Text
            className="text-[11px] font-medium tracking-wide"
            style={{ color: theme.grey }}>
            Live scanner
          </Text>
        </View>
      </View>
    </View>
  );
};

export default ExploreQrScreen;
