import React, { useEffect, useRef, useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';

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
    <View className="flex-row items-center justify-center gap-1.5 mb-4 h-7">
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
          <View key={`bar-${i}`} className="w-1 h-6 items-center justify-end">
            <Animated.View
              style={[
                styles.waveBar,
                { transform: [{ scaleY }, { translateY }] },
              ]}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  waveBar: {
    width: 4,
    height: 24,
    backgroundColor: colors.accentYellow,
    borderRadius: 2,
  },
});

export function VoiceScreen() {
  const insets = useSafeAreaInsets();
  const [isListening, setIsListening] = useState(true);

  return (
    <View
      className="flex-1 bg-screen items-center"
      style={{ paddingTop: insets.top }}
    >
      <Text className="text-white text-[28px] font-bold mt-6 mb-8">
        Voice Mode
      </Text>

      <View className="flex-1 items-center justify-center px-6">
        <TouchableOpacity
          className="w-40 h-40 rounded-full bg-dark border-[3px] border-accent items-center justify-center mb-6"
          activeOpacity={0.9}
          onPress={() => setIsListening((p) => !p)}
        >
          <Ionicons name="mic" size={64} color={colors.accentYellow} />
        </TouchableOpacity>

        <SoundWaveBars isActive={isListening} />

        <Text className="text-white text-base font-semibold tracking-[2px] mb-8">
          {isListening ? 'LISTENING...' : 'TAP TO START'}
        </Text>

        <TouchableOpacity
          className={`flex-row items-center justify-center py-4 px-7 rounded-xl gap-3 min-w-[260px] ${
            isListening ? 'bg-accent' : 'bg-card border-2 border-accent'
          }`}
          activeOpacity={0.8}
          onPress={() => setIsListening((p) => !p)}
        >
          <Ionicons
            name={isListening ? 'stop-circle' : 'mic'}
            size={24}
            color={isListening ? '#000000' : colors.white}
          />
          <Text
            className={`text-base font-bold ${
              isListening ? 'text-black' : 'text-accent'
            }`}
          >
            {isListening ? 'Stop Listening' : 'Start Listening'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
