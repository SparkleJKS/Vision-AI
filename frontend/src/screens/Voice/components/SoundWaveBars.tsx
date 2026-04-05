import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { BAR_COUNT, BAR_MAX, BAR_MIN } from '../voice/constants';

export type SoundWaveBarsProps = { isActive: boolean; barColor?: string };

export const SoundWaveBars = ({
  isActive,
  barColor = '#6366F1',
}: SoundWaveBarsProps) => {
  const bars = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(BAR_MIN)),
  ).current;

  useEffect(() => {
    if (!isActive) {
      bars.forEach(bar => bar.setValue(BAR_MIN));
      return;
    }

    const STAGGER_MS = 60;
    const DURATION_MS = 120;

    const waveForward = Animated.parallel(
      bars.map((bar, index) =>
        Animated.sequence([
          Animated.delay(index * STAGGER_MS),
          Animated.timing(bar, {
            toValue: BAR_MAX,
            useNativeDriver: true,
            duration: DURATION_MS,
          }),
        ]),
      ),
    );

    const waveBack = Animated.parallel(
      bars.map((bar, index) =>
        Animated.sequence([
          Animated.delay((BAR_COUNT - 1 - index) * STAGGER_MS),
          Animated.timing(bar, {
            toValue: BAR_MIN,
            useNativeDriver: true,
            duration: DURATION_MS,
          }),
        ]),
      ),
    );

    const loop = Animated.loop(Animated.sequence([waveForward, waveBack]), {
      iterations: -1,
    });
    loop.start();
    return () => loop.stop();
  }, [bars, isActive]);

  return (
    <View className="flex-row items-center justify-center gap-1.5 mb-1 h-7">
      {bars.map((bar, index) => {
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
            key={`bar-${index}`}
            className="w-1 h-6 items-center justify-end">
            <Animated.View
              className="w-1 h-6 rounded-sm"
              style={{
                backgroundColor: barColor,
                transform: [{ scaleY }, { translateY }],
              }}
            />
          </View>
        );
      })}
    </View>
  );
};
