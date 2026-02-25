import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AppStateStatus } from "react-native";
import {
  ActivityIndicator,
  Animated,
  AppState,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from "react-native-vision-camera";
import type { CameraPermissionStatus, Code } from "react-native-vision-camera";
import { useTheme } from "@/theme";
import { logEvent, warn, error } from "@/utils/logger";
import {
  CORNER_SIZE,
  CORNER_THICKNESS,
  SCAN_BOX_SIZE,
  SUPPORTED_CODE_TYPES,
} from "./constants";
import { getCodeTypeLabel, getOpenableUrl } from "./helpers";

const LOG_NAME = "ExploreQr";

type ScannedResult = {
  value: string;
  type: Code["type"];
};

type CornerPosition = "topLeft" | "topRight" | "bottomLeft" | "bottomRight";

type CornerBracketProps = {
  position: CornerPosition;
  color: string;
};

const CornerBracket = memo(function CornerBracket({
  position,
  color,
}: CornerBracketProps) {
  const style = useMemo(
    () => [
      styles.corner,
      CORNER_POSITION_STYLES[position],
      { borderColor: color },
    ],
    [position, color],
  );
  return <View style={style} />;
});

const ExploreQrScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const isFocused = useIsFocused();

  const device = useCameraDevice("back");
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
      logEvent(`${LOG_NAME}_focus`, { screen: "ExploreQrScanner" });
    }, [refreshPermissionStatus]),
  );

  useEffect(() => {
    refreshPermissionStatus();
  }, [refreshPermissionStatus]);

  useEffect(() => {
    if (permissionStatus === "denied" || permissionStatus === "restricted") {
      warn(LOG_NAME, "Camera permission denied or restricted", {
        status: permissionStatus,
      });
    }
    if (hasPermission && !device) {
      warn(LOG_NAME, "Back camera not available on this device");
    }
  }, [permissionStatus, hasPermission, device]);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (nextState === "active") {
          refreshPermissionStatus();
        }
      },
    );
    return () => subscription.remove();
  }, [refreshPermissionStatus]);

  useEffect(() => {
    if (hasPermission || permissionStatus !== "not-determined") return;
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
    if (permissionStatus === "not-determined") {
      await requestPermission();
      logEvent(`${LOG_NAME}_permission_request`, { status: "asked" });
    } else {
      try {
        await Linking.openSettings();
        logEvent(`${LOG_NAME}_open_settings`, {});
      } catch (e) {
        error(LOG_NAME, "Failed to open app settings", e);
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
        (code) =>
          typeof code.value === "string" && code.value.trim().length > 0,
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
  const canAskAgain = permissionStatus === "not-determined";
  const cornerColor = scanned ? theme.warning : theme.primary;

  return (
    <View className="flex-1" style={{ backgroundColor: theme.screenBg }}>
      {hasPermission && device ? (
        <View className="flex-1">
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={isCameraActive}
            codeScanner={codeScanner}
            photo={false}
            video={false}
            audio={false}
          />

          <View
            className="absolute inset-0 items-center justify-center"
            pointerEvents="none"
          >
            <Animated.View
              style={{
                width: SCAN_BOX_SIZE,
                height: SCAN_BOX_SIZE,
                transform: [{ scale: cornerScale }],
                opacity: cornerOpacity,
              }}
            >
              <CornerBracket position="topLeft" color={cornerColor} />
              <CornerBracket position="topRight" color={cornerColor} />
              <CornerBracket position="bottomLeft" color={cornerColor} />
              <CornerBracket position="bottomRight" color={cornerColor} />
              {!scanned && (
                <Animated.View
                  style={[
                    styles.scanLine,
                    {
                      backgroundColor: theme.primary + "B3",
                      transform: [{ translateY: scanLineTranslateY }],
                    },
                  ]}
                />
              )}
            </Animated.View>
          </View>

          {result && (
            <View
              className="absolute left-4 right-4 rounded-2xl border px-4 py-3.5 gap-3"
              style={{
                bottom: insets.bottom + 14,
                backgroundColor: theme.cardBg + "F2",
                borderColor: theme.border,
              }}
            >
              <View className="flex-row items-center justify-between">
                <Text
                  className="text-[12px] font-bold tracking-wider"
                  style={{ color: theme.primary }}
                >
                  CODE DETECTED
                </Text>
                <Text
                  className="text-[12px] font-semibold"
                  style={{ color: theme.grey }}
                >
                  {getCodeTypeLabel(result.type)}
                </Text>
              </View>

              <View
                className="rounded-xl border px-3 py-2.5"
                style={{
                  borderColor: theme.border,
                  backgroundColor: theme.screenBg + "B3",
                }}
              >
                <Text
                  selectable
                  className="text-[13px] font-medium"
                  style={{ color: theme.white }}
                >
                  {result.value}
                </Text>
              </View>

              <View className="flex-row gap-2.5">
                <Pressable
                  className="flex-1 rounded-xl py-3 border items-center justify-center"
                  style={{
                    borderColor: theme.primary,
                    backgroundColor: theme.primary + "20",
                  }}
                  onPress={handleScanAgain}
                >
                  <Text
                    className="text-[13px] font-bold"
                    style={{ color: theme.primary }}
                  >
                    Scan Again
                  </Text>
                </Pressable>
                {urlToOpen && (
                  <Pressable
                    className="flex-1 rounded-xl py-3 border items-center justify-center"
                    style={{
                      borderColor: theme.border,
                      backgroundColor: theme.cardBg,
                    }}
                    onPress={() => {
                      logEvent(`${LOG_NAME}_open_link`, { url: urlToOpen });
                      Linking.openURL(urlToOpen).catch((e) =>
                        error(LOG_NAME, "Failed to open URL", urlToOpen, e),
                      );
                    }}
                  >
                    <Text
                      className="text-[13px] font-bold"
                      style={{ color: theme.white }}
                    >
                      Open Link
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}
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
              }}
            >
              <Text className="text-4xl" style={{ color: theme.border }}>
                ◉
              </Text>
              <Text
                className="text-[15px] font-semibold text-center"
                style={{ color: theme.grey }}
              >
                Back camera not available on this device
              </Text>
            </View>
          ) : (
            <View
              className="w-full rounded-2xl border p-6 items-center gap-3.5"
              style={{
                borderColor: theme.border,
                backgroundColor: theme.cardBg,
              }}
            >
              <Text className="text-4xl" style={{ color: theme.border }}>
                ⬡
              </Text>
              <Text
                className="text-[15px] font-semibold text-center"
                style={{ color: theme.grey }}
              >
                Camera access required
              </Text>
              <Pressable
                className="px-5 py-2.5 rounded-[10px]"
                style={{ backgroundColor: theme.primary }}
                onPress={() => void handlePermissionButtonPress()}
              >
                <Text
                  className="text-[13px] font-bold"
                  style={{ color: "#111827" }}
                >
                  {canAskAgain ? "Enable Camera" : "Open Settings"}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      <View
        className="absolute left-4 right-4 flex-row items-center"
        style={{ top: insets.top + 10 }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-[10px] justify-center items-center border"
          style={{
            backgroundColor: theme.cardBg + "E6",
            borderColor: theme.border,
          }}
        >
          <Text className="text-lg font-light" style={{ color: theme.grey }}>
            ←
          </Text>
        </Pressable>
        <View className="ml-3">
          <Text
            className="text-[16px] font-bold"
            style={{ color: theme.white }}
          >
            QR & Barcode
          </Text>
          <Text
            className="text-[11px] font-medium tracking-wide"
            style={{ color: theme.grey }}
          >
            Live scanner
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderBottomRightRadius: 12,
  },
  scanLine: {
    position: "absolute",
    left: 10,
    right: 10,
    height: 2,
    borderRadius: 999,
  },
});

const CORNER_POSITION_STYLES: Record<CornerPosition, object> = {
  topLeft: styles.topLeft,
  topRight: styles.topRight,
  bottomLeft: styles.bottomLeft,
  bottomRight: styles.bottomRight,
};

export default ExploreQrScreen;
