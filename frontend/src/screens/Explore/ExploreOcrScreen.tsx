import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { useTheme } from '@/theme';
import { showToast } from '@/utils/toast';
import { error, logEvent } from '@/utils/logger';
import { useExplorePermissions } from './hooks';
import {
  recognizeTextFromImage,
  type OcrBlock,
  type OcrLine,
} from '@/services';
import { ExploreHeader } from './components/ExploreHeader';
import { useTtsEngine } from './hooks/useTtsEngine';

const ExploreOcrScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { theme } = useTheme();
  const cameraRef = useRef<Camera | null>(null);
  const { permission, handlePermissionButtonPress } = useExplorePermissions();
  const cameraDevice = useCameraDevice('back');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [ocrText, setOcrText] = useState<string>('');
  const [capturedImagePath, setCapturedImagePath] = useState<string | null>(
    null,
  );

  const {
    isReady: isTtsReady,
    isSpeaking,
    speak,
    stop,
  } = useTtsEngine({
    logName: 'OCR',
    showInitToast: false,
  });

  useEffect(() => {
    void handlePermissionButtonPress();
  }, [handlePermissionButtonPress]);

  const canUseCamera = permission?.granted === true && cameraDevice != null;

  const speakExtractedText = useCallback(
    (text: string) => {
      if (!isTtsReady) {
        showToast.error(
          'Speech unavailable',
          'Text-to-speech is not ready yet.',
        );
        return;
      }
      speak(text);
    },
    [isTtsReady, speak],
  );

  const stopSpeaking = useCallback(() => {
    logEvent('OCR:StopSpeaking', {});
    stop();
  }, [stop]);

  const handleCaptureAndRead = useCallback(async () => {
    if (!cameraRef.current || !canUseCamera || isProcessing) return;

    try {
      logEvent('OCR:CaptureAndReadClicked', {});
      setIsProcessing(true);
      setOcrText('');
      const photo = await cameraRef.current.takePhoto();

      const imagePath = photo.path;
      const displayPath = imagePath.startsWith('file://')
        ? imagePath
        : `file://${imagePath}`;
      setCapturedImagePath(displayPath);

      const result = await recognizeTextFromImage(imagePath);
      const fallbackText = result.blocks
        .flatMap((block: OcrBlock) =>
          block.lines.map((line: OcrLine) => line.text),
        )
        .join('\n');
      const text = (result.text || fallbackText).trim();
      setOcrText(text);

      if (!text) {
        logEvent('OCR:NoTextFound', {});
        showToast.info('No text found', 'Try a clearer image or better light.');
      } else {
        logEvent('OCR:TextExtracted', { chars: text.length });
        speakExtractedText(text);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      error('OCR:CaptureAndRead', { message });
      showToast.error('OCR failed', message);
    } finally {
      setIsProcessing(false);
    }
  }, [canUseCamera, isProcessing, speakExtractedText]);

  const handleClearResult = useCallback(() => {
    logEvent('OCR:ClearResult', {
      hadText: Boolean(ocrText?.trim()),
    });
    setOcrText('');
    setCapturedImagePath(null);
  }, [ocrText]);

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: theme.screenBg,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}>
      <View className="flex-1 px-4 pt-2">
        <ExploreHeader
          title="Photo to Text"
          subtitle="OCR - Camera capture"
          onBack={() => navigation.goBack()}
          backGlyph="‹"
        />

        <View
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}>
          {permission === null ? (
            <View className="h-[300px] justify-center items-center">
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : !permission.granted ? (
            <View className="h-[300px] justify-center items-center gap-3 p-6">
              <Text
                className="text-[15px] font-semibold"
                style={{ color: theme.grey }}>
                Camera access required for OCR
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
          ) : cameraDevice == null ? (
            <View className="h-[300px] justify-center items-center p-6">
              <Text
                className="text-[15px] font-semibold text-center"
                style={{ color: theme.grey }}>
                Back camera not available on this device.
              </Text>
            </View>
          ) : (
            <View className="h-[300px]">
              <Camera
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                device={cameraDevice}
                isActive={isFocused}
                photo={true}
                video={false}
                audio={false}
              />
              {isProcessing && (
                <View className="absolute inset-0 items-center justify-center bg-black/50">
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text
                    className="text-[12px] mt-2"
                    style={{ color: theme.white }}>
                    Reading text...
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View className="flex-row gap-2.5 mt-3">
          <Pressable
            className={`flex-1 py-3.5 rounded-xl justify-center items-center border ${
              !canUseCamera || isProcessing ? 'opacity-50' : ''
            }`}
            style={{
              backgroundColor: theme.primary,
              borderColor: theme.primary,
            }}
            onPress={() => void handleCaptureAndRead()}
            disabled={!canUseCamera || isProcessing}>
            <Text
              className="text-sm font-bold tracking-wide"
              style={{ color: '#111827' }}>
              {isProcessing ? 'Processing...' : 'Capture & Read'}
            </Text>
          </Pressable>
          <Pressable
            className={`px-4 py-3.5 rounded-xl justify-center items-center border ${
              !ocrText ? 'opacity-50' : ''
            }`}
            style={{
              backgroundColor: theme.cardBg,
              borderColor: theme.border,
            }}
            onPress={handleClearResult}
            disabled={!ocrText}>
            <Text
              className="text-sm font-bold tracking-wide"
              style={{ color: theme.white }}>
              Clear
            </Text>
          </Pressable>
        </View>

        <View className="flex-row gap-2.5 mt-2.5">
          <Pressable
            className={`flex-1 py-3 rounded-xl justify-center items-center border ${
              !ocrText || !isTtsReady ? 'opacity-40' : ''
            }`}
            style={{
              backgroundColor: theme.primary + '22',
              borderColor: theme.primary + '55',
            }}
            onPress={() => speakExtractedText(ocrText)}
            disabled={!ocrText || !isTtsReady}>
            <Text
              className="text-[13px] font-bold tracking-wide"
              style={{ color: theme.white }}>
              {isSpeaking ? 'Speaking...' : 'Speak Text'}
            </Text>
          </Pressable>
          <Pressable
            className={`flex-1 py-3 rounded-xl justify-center items-center border ${
              !isTtsReady || !isSpeaking ? 'opacity-40' : ''
            }`}
            style={{
              backgroundColor: theme.cardBg,
              borderColor: theme.warning + '55',
            }}
            onPress={stopSpeaking}
            disabled={!isTtsReady || !isSpeaking}>
            <Text
              className="text-[13px] font-bold tracking-wide"
              style={{ color: theme.white }}>
              Stop Voice
            </Text>
          </Pressable>
        </View>

        <View
          className="mt-3 rounded-2xl border p-3"
          style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}>
          <Text
            className="text-[12px] font-semibold mb-2"
            style={{ color: theme.grey }}>
            Extracted Text
          </Text>
          <ScrollView
            className="max-h-[220px] rounded-xl border px-3 py-2.5"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.screenBg,
            }}>
            {ocrText ? (
              <Text
                className="text-[14px] leading-6"
                style={{ color: theme.white }}>
                {ocrText}
              </Text>
            ) : (
              <Text className="text-[13px]" style={{ color: theme.muted }}>
                Capture an image to extract text.
              </Text>
            )}
          </ScrollView>
          {capturedImagePath && (
            <Text
              className="text-[11px] mt-2"
              style={{ color: theme.muted }}
              numberOfLines={1}>
              Source: {capturedImagePath}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

export default ExploreOcrScreen;
