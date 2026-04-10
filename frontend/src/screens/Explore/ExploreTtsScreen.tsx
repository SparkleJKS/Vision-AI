import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { ExploreHeader } from './components/ExploreHeader';
import { StatusPill } from './components/StatusPill';
import { useTtsEngine } from './hooks/useTtsEngine';

const LOG_NAME = 'ExploreTts';

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
      onPress={onPress}>
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
    'Welcome to Vision AI. Type your message and press Speak.',
  );
  const {
    isReady,
    isSpeaking,
    rate,
    pitch,
    adjustRate,
    adjustPitch,
    speak,
    stop,
  } = useTtsEngine({ logName: LOG_NAME });

  const handleSpeak = () => speak(text);
  const handleStop = () => stop();

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{
        backgroundColor: theme.screenBg,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: insets.bottom + 12,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <ExploreHeader
          title="Text to Speech"
          subtitle="Neural voice synthesis"
          onBack={() => navigation.goBack()}
          right={
            <StatusPill isOn={isSpeaking} onLabel="SPEAKING" offLabel="IDLE" />
          }
        />

        <View
          className="rounded-2xl border p-4 mt-2"
          style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}>
          <Text
            className="text-[12px] font-semibold mb-2"
            style={{ color: theme.grey }}>
            Input Text
          </Text>
          <TextInput
            className="rounded-xl border px-3.5 py-3 text-[14px] min-h-[180px]"
            style={{
              backgroundColor: theme.screenBg,
              borderColor: theme.border,
              color: theme.white,
              textAlignVertical: 'top',
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
          style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}>
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text
                className="text-[12px] font-semibold"
                style={{ color: theme.grey }}>
                Speech Rate
              </Text>
              <Text
                className="text-[12px] font-bold"
                style={{ color: theme.primary }}>
                {rate.toFixed(2)}
              </Text>
            </View>
            <View className="flex-row gap-2">
              <ValueAdjustButton icon="-" onPress={() => adjustRate(-0.1)} />
              <View
                className="flex-1 rounded-lg border items-center justify-center"
                style={{
                  borderColor: theme.border,
                  backgroundColor: theme.screenBg,
                }}>
                <Text className="text-[12px]" style={{ color: theme.grey }}>
                  0.10 to 1.00
                </Text>
              </View>
              <ValueAdjustButton icon="+" onPress={() => adjustRate(0.1)} />
            </View>
          </View>

          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text
                className="text-[12px] font-semibold"
                style={{ color: theme.grey }}>
                Pitch
              </Text>
              <Text
                className="text-[12px] font-bold"
                style={{ color: theme.primary }}>
                {pitch.toFixed(2)}
              </Text>
            </View>
            <View className="flex-row gap-2">
              <ValueAdjustButton icon="-" onPress={() => adjustPitch(-0.1)} />
              <View
                className="flex-1 rounded-lg border items-center justify-center"
                style={{
                  borderColor: theme.border,
                  backgroundColor: theme.screenBg,
                }}>
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
              !isReady || !text.trim() ? 'opacity-40' : ''
            }`}
            style={{
              backgroundColor: theme.primary,
              borderColor: theme.primary,
            }}
            onPress={handleSpeak}
            disabled={!isReady || !text.trim()}>
            <Text
              className="text-sm font-bold tracking-wide"
              style={{ color: theme.screenBg }}>
              ▶ Speak
            </Text>
          </Pressable>
          <Pressable
            className={`flex-1 py-3.5 rounded-xl justify-center items-center border ${
              !isReady ? 'opacity-40' : ''
            }`}
            style={{
              backgroundColor: theme.cardBg,
              borderColor: theme.warning + '50',
            }}
            onPress={handleStop}
            disabled={!isReady}>
            <Text
              className="text-sm font-bold tracking-wide"
              style={{ color: theme.white }}>
              ◼ Stop
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ExploreTtsScreen;
