import { useEffect, useRef, useState } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BAR_COUNT = 8;
const BAR_MIN = 0.15;
const BAR_MAX = 1;

function SoundWaveBars({ isActive }: { isActive: boolean }) {
  const bars = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(BAR_MIN)),
  ).current;

  useEffect(() => {
    if (!isActive) {
      bars.forEach((b) => b.setValue(BAR_MIN));
      return;
    }

    const STAGGER = 60;
    const DURATION = 120;

    const waveForward = Animated.parallel(
      bars.map((bar, i) =>
        Animated.sequence([
          Animated.delay(i * STAGGER),
          Animated.timing(bar, {
            toValue: BAR_MAX,
            useNativeDriver: true,
            duration: DURATION,
          }),
        ]),
      ),
    );

    const waveBack = Animated.parallel(
      bars.map((bar, i) =>
        Animated.sequence([
          Animated.delay((BAR_COUNT - 1 - i) * STAGGER),
          Animated.timing(bar, {
            toValue: BAR_MIN,
            useNativeDriver: true,
            duration: DURATION,
          }),
        ]),
      ),
    );

    const loop = Animated.loop(
      Animated.sequence([waveForward, waveBack]),
      { iterations: -1 },
    );
    loop.start();
    return () => loop.stop();
  }, [isActive]);

  return (
    <View className="flex-row items-center justify-center gap-1.5 mb-1 h-7">
      {bars.map((bar, i) => {
        const scaleY = bar.interpolate({
          inputRange: [0, 1],
          outputRange: [0.12, 1],
        });
        const translateY = bar.interpolate({
          inputRange: [0, 1],
          outputRange: [11, 0],
        });
        return (
          <View
            key={`bar-${i}`}
            className="w-1 h-6 items-center justify-end"
          >
            <Animated.View
              className="w-1 h-6 rounded-sm bg-[#6366F1]"
              style={{ transform: [{ scaleY }, { translateY }] }}
            />
          </View>
        );
      })}
    </View>
  );
}

const VoiceScreen = () => {
  const insets = useSafeAreaInsets();
  const [isListening, setIsListening] = useState<boolean>(false);

  return (
    <View
      className="flex-1 bg-[#080B10] items-center"
      style={{ paddingTop: insets.top }}
    >
      <View className="items-center">
        <View className="self-center border border-[#6366F135] rounded-md px-3 py-1 mt-6 mb-2 bg-[#6366F118]">
          <Text className="text-[#6366F1] text-[10px] font-bold tracking-widest">
            VOICE MODE
          </Text>
        </View>
        <Text className="text-[#F1F5F9] text-[28px] font-extrabold tracking-tight mb-2">
          Voice Mode
        </Text>
      </View>

      <View className="flex-1 items-center justify-center px-6">
        <TouchableOpacity
          className={`w-40 h-40 rounded-full mb-7 border-2 justify-center items-center ${
            isListening ? 'bg-[#6366F112] border-[#6366F1]' : 'bg-[#0F1620] border-[#6366F135]'
          }`}
          activeOpacity={0.9}
          onPress={() => setIsListening((p) => !p)}
        >
          <Ionicons name="mic" size={64} color="#6366F1" />
        </TouchableOpacity>

        <SoundWaveBars isActive={isListening} />

        <Text
          className={`text-[13px] font-bold tracking-widest mb-8 ${
            isListening ? 'text-[#6366F1]' : 'text-[#F1F5F9]'
          }`}
        >
          {isListening ? 'LISTENING...' : 'TAP TO START'}
        </Text>

        <TouchableOpacity
          className={`rounded-[14px] py-4 px-7 min-w-[260px] flex-row items-center justify-center gap-2.5 border ${
            isListening
              ? 'bg-[#6366F1] border-0'
              : 'bg-[#0F1620] border-[#6366F140]'
          }`}
          activeOpacity={0.8}
          onPress={() => setIsListening((p) => !p)}
        >
          <Ionicons
            name={isListening ? 'stop-circle' : 'mic'}
            size={24}
            color={isListening ? '#FFFFFF' : '#6366F1'}
          />
          <Text
            className={`text-[15px] font-bold ${
              isListening ? 'text-white' : 'text-[#6366F1]'
            }`}
          >
            {isListening ? 'Stop Listening' : 'Start Listening'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default VoiceScreen;
