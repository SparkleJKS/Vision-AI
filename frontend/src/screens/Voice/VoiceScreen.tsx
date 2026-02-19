import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
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
    <View style={styles.waveContainer}>
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
          <View key={`bar-${i}`} style={styles.waveBarWrapper}>
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
  screen: {
    flex: 1,
    backgroundColor: '#080B10',
    alignItems: 'center',
  },
  headerSection: {
    alignItems: 'center',
  },
  headerBadge: {
    alignSelf: 'center',
    backgroundColor: '#6366F118',
    borderWidth: 1,
    borderColor: '#6366F135',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 24,
    marginBottom: 8,
  },
  headerBadgeText: {
    color: '#6366F1',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },
  headerTitle: {
    color: '#F1F5F9',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  micButton: {
    width: 160,
    height: 160,
    borderRadius: 999,
    marginBottom: 28,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonIdle: {
    backgroundColor: '#0F1620',
    borderColor: '#6366F135',
  },
  micButtonListening: {
    backgroundColor: '#6366F112',
    borderColor: '#6366F1',
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 4,
    height: 28,
  },
  waveBarWrapper: {
    width: 4,
    height: 24,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  waveBar: {
    width: 4,
    height: 24,
    backgroundColor: '#6366F1',
    borderRadius: 2,
  },
  statusText: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 32,
  },
  statusTextListening: {
    color: '#6366F1',
  },
  ctaButton: {
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 28,
    minWidth: 260,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
  },
  ctaButtonIdle: {
    backgroundColor: '#0F1620',
    borderColor: '#6366F140',
  },
  ctaButtonListening: {
    backgroundColor: '#6366F1',
    borderWidth: 0,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
  },
  ctaTextIdle: {
    color: '#6366F1',
  },
  ctaTextListening: {
    color: '#FFFFFF',
  },
});

export function VoiceScreen() {
  const insets = useSafeAreaInsets();
  const [isListening, setIsListening] = useState<boolean>(false);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.headerSection}>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>VOICE MODE</Text>
        </View>
        <Text style={styles.headerTitle}>Voice Mode</Text>
      </View>

      <View style={styles.centerSection}>
        <TouchableOpacity
          style={[
            styles.micButton,
            isListening ? styles.micButtonListening : styles.micButtonIdle,
          ]}
          activeOpacity={0.9}
          onPress={() => setIsListening((p) => !p)}
        >
          <Ionicons name="mic" size={64} color="#6366F1" />
        </TouchableOpacity>

        <SoundWaveBars isActive={isListening} />

        <Text style={[styles.statusText, isListening && styles.statusTextListening]}>
          {isListening ? 'LISTENING...' : 'TAP TO START'}
        </Text>

        <TouchableOpacity
          style={[
            styles.ctaButton,
            isListening ? styles.ctaButtonListening : styles.ctaButtonIdle,
          ]}
          activeOpacity={0.8}
          onPress={() => setIsListening((p) => !p)}
        >
          <Ionicons
            name={isListening ? 'stop-circle' : 'mic'}
            size={24}
            color={isListening ? '#FFFFFF' : '#6366F1'}
          />
          <Text style={[styles.ctaText, isListening ? styles.ctaTextListening : styles.ctaTextIdle]}>
            {isListening ? 'Stop Listening' : 'Start Listening'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
