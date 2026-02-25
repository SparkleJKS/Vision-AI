import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Tts from "react-native-tts";
import { useTheme } from "@/theme";
import { logEvent, warn, error } from "@/utils/logger";

const LOG_NAME = "ExploreTts";

type ValueAdjustButtonProps = {
  icon: string;
  onPress: () => void;
};

const ValueAdjustButton = ({ icon, onPress }: ValueAdjustButtonProps) => {
  const { theme } = useTheme();

  return (
    <Pressable
      className="w-12 py-2 rounded-lg border items-center justify-center"
      style={{ borderColor: theme.border, backgroundColor: theme.screenBg }}
      onPress={onPress}
    >
      <Text className="text-base font-bold" style={{ color: theme.white }}>
        {icon}
      </Text>
    </Pressable>
  );
};

const ExploreTtsScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [text, setText] = useState<string>(
    "Welcome to Vision AI. Type your message and press Speak.",
  );
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(0.5);
  const [pitch, setPitch] = useState<number>(1.0);
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    const handleStart = () => {
      setIsSpeaking(true);
      logEvent(`${LOG_NAME}_tts_start`, {});
    };
    const handleFinish = () => {
      setIsSpeaking(false);
      logEvent(`${LOG_NAME}_tts_finish`, {});
    };
    const handleCancel = () => {
      setIsSpeaking(false);
      logEvent(`${LOG_NAME}_tts_cancel`, {});
    };
    const handleError = (err: { message?: string; code?: string }) => {
      setIsSpeaking(false);
      error(LOG_NAME, "TTS error", err?.message ?? err?.code ?? err);
    };

    const initializeTts = async () => {
      try {
        await Tts.getInitStatus();
        await Tts.setDefaultLanguage("en-US");
        await Tts.setDefaultRate(speechRate);
        await Tts.setDefaultPitch(pitch);
        setIsReady(true);
        logEvent(`${LOG_NAME}_ready`, { language: "en-US" });
      } catch (e) {
        setIsReady(false);
        warn(LOG_NAME, "TTS initialization failed", e);
      }
    };

    const startSubscription = Tts.addListener("tts-start", handleStart);
    const finishSubscription = Tts.addListener("tts-finish", handleFinish);
    const cancelSubscription = Tts.addListener("tts-cancel", handleCancel);
    const errorSubscription = Tts.addListener("tts-error", handleError);
    void initializeTts();

    return () => {
      void Tts.stop();
      startSubscription.remove();
      finishSubscription.remove();
      cancelSubscription.remove();
      errorSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;
    void Tts.setDefaultRate(speechRate);
  }, [isReady, speechRate]);

  useEffect(() => {
    if (!isReady) return;
    void Tts.setDefaultPitch(pitch);
  }, [isReady, pitch]);

  const adjustSpeechRate = (delta: number) => {
    setSpeechRate((value) => {
      const next = Number((value + delta).toFixed(2));
      return Math.min(1, Math.max(0.1, next));
    });
  };

  const adjustPitch = (delta: number) => {
    setPitch((value) => {
      const next = Number((value + delta).toFixed(2));
      return Math.min(2, Math.max(0.5, next));
    });
  };

  const handleSpeak = () => {
    const nextText = text.trim();
    if (!nextText || !isReady) {
      if (!isReady) warn(LOG_NAME, "Speak pressed while TTS not ready");
      return;
    }
    logEvent(`${LOG_NAME}_speak`, {
      length: nextText.length,
      rate: speechRate,
      pitch,
    });
    setIsSpeaking(true);
    void Tts.stop()
      .catch(() => undefined)
      .finally(() => {
        Tts.speak(nextText);
      });
  };

  const handleStop = () => {
    logEvent(`${LOG_NAME}_stop`, {});
    setIsSpeaking(false);
    void Tts.stop();
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{
        backgroundColor: theme.screenBg,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: insets.bottom + 12,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center gap-3 py-2">
          <Pressable
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-[10px] justify-center items-center border"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
          >
            <Text className="text-lg font-light" style={{ color: theme.grey }}>
              ←
            </Text>
          </Pressable>
          <View className="flex-1 gap-0.5">
            <Text className="text-[17px] font-bold" style={{ color: theme.white }}>
              Text to Speech
            </Text>
            <Text
              className="text-[11px] font-medium tracking-wide"
              style={{ color: theme.grey }}
            >
              Neural voice synthesis
            </Text>
          </View>
          <View
            className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-lg border"
            style={{
              backgroundColor: isSpeaking ? theme.primary + "15" : theme.cardBg,
              borderColor: isSpeaking ? theme.primary + "35" : theme.border,
            }}
          >
            <View
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: isSpeaking ? theme.primary : theme.tabInactive,
              }}
            />
            <Text
              className="text-[10px] font-bold tracking-wider"
              style={{ color: isSpeaking ? theme.primary : theme.grey }}
            >
              {isSpeaking ? "SPEAKING" : "IDLE"}
            </Text>
          </View>
        </View>

        <View
          className="rounded-2xl border p-4 mt-2"
          style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}
        >
          <Text className="text-[12px] font-semibold mb-2" style={{ color: theme.grey }}>
            Input Text
          </Text>
          <TextInput
            className="rounded-xl border px-3.5 py-3 text-[14px] min-h-[180px]"
            style={{
              backgroundColor: theme.screenBg,
              borderColor: theme.border,
              color: theme.white,
              textAlignVertical: "top",
            }}
            multiline
            value={text}
            onChangeText={setText}
            placeholder="Type or paste text to speak..."
            placeholderTextColor={theme.muted}
          />
          <Text className="text-[11px] mt-2" style={{ color: theme.muted }}>
            {text.trim().length} characters
          </Text>
        </View>

        <View
          className="rounded-2xl border p-4 mt-3 gap-3"
          style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}
        >
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-[12px] font-semibold" style={{ color: theme.grey }}>
                Speech Rate
              </Text>
              <Text className="text-[12px] font-bold" style={{ color: theme.primary }}>
                {speechRate.toFixed(2)}
              </Text>
            </View>
            <View className="flex-row gap-2">
              <ValueAdjustButton icon="-" onPress={() => adjustSpeechRate(-0.1)} />
              <View
                className="flex-1 rounded-lg border items-center justify-center"
                style={{ borderColor: theme.border, backgroundColor: theme.screenBg }}
              >
                <Text className="text-[12px]" style={{ color: theme.grey }}>
                  0.10 to 1.00
                </Text>
              </View>
              <ValueAdjustButton icon="+" onPress={() => adjustSpeechRate(0.1)} />
            </View>
          </View>

          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-[12px] font-semibold" style={{ color: theme.grey }}>
                Pitch
              </Text>
              <Text className="text-[12px] font-bold" style={{ color: theme.primary }}>
                {pitch.toFixed(2)}
              </Text>
            </View>
            <View className="flex-row gap-2">
              <ValueAdjustButton icon="-" onPress={() => adjustPitch(-0.1)} />
              <View
                className="flex-1 rounded-lg border items-center justify-center"
                style={{ borderColor: theme.border, backgroundColor: theme.screenBg }}
              >
                <Text className="text-[12px]" style={{ color: theme.grey }}>
                  0.50 to 2.00
                </Text>
              </View>
              <ValueAdjustButton icon="+" onPress={() => adjustPitch(0.1)} />
            </View>
          </View>
        </View>

        <View className="flex-row gap-2.5 mt-3">
          <Pressable
            className={`flex-1 py-3.5 rounded-xl justify-center items-center border ${
              !isReady || !text.trim() ? "opacity-40" : ""
            }`}
            style={{
              backgroundColor: theme.primary,
              borderColor: theme.primary,
            }}
            onPress={handleSpeak}
            disabled={!isReady || !text.trim()}
          >
            <Text className="text-sm font-bold tracking-wide" style={{ color: theme.screenBg }}>
              ▶ Speak
            </Text>
          </Pressable>
          <Pressable
            className={`flex-1 py-3.5 rounded-xl justify-center items-center border ${
              !isReady ? "opacity-40" : ""
            }`}
            style={{
              backgroundColor: theme.cardBg,
              borderColor: theme.warning + "50",
            }}
            onPress={handleStop}
            disabled={!isReady}
          >
            <Text className="text-sm font-bold tracking-wide" style={{ color: theme.white }}>
              ◼ Stop
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ExploreTtsScreen;
