import React, { useCallback, useMemo, useState } from 'react';
import {
  type GestureResponderEvent,
  type LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { DimensionValue } from 'react-native';
import { clamp } from './utils';
import type { ConfidenceSliderProps } from './types';

export function ConfidenceSlider({
  value,
  onChange,
  min = 0.05,
  max = 0.95,
}: ConfidenceSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);

  const normalizedValue = clamp(value, min, max);
  const normalizedProgress = (normalizedValue - min) / (max - min);

  const updateFromLocation = useCallback(
    (locationX: number) => {
      if (trackWidth <= 0) return;
      const progress = clamp(locationX / trackWidth, 0, 1);
      const next = min + progress * (max - min);
      onChange(Number(next.toFixed(2)));
    },
    [max, min, onChange, trackWidth],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event: GestureResponderEvent) => {
          updateFromLocation(event.nativeEvent.locationX);
        },
        onPanResponderMove: (event: GestureResponderEvent) => {
          updateFromLocation(event.nativeEvent.locationX);
        },
      }),
    [updateFromLocation],
  );

  const fillStyle = useMemo(
    () => ({ width: `${Math.round(normalizedProgress * 100)}%` as DimensionValue }),
    [normalizedProgress],
  );
  const thumbStyle = useMemo(
    () => ({ left: normalizedProgress * trackWidth }),
    [normalizedProgress, trackWidth],
  );

  const handleAccessibilityAction = useCallback(
    (event: { nativeEvent: { actionName?: string } }) => {
      if (event.nativeEvent.actionName === 'increment') {
        onChange(Number(clamp(normalizedValue + 0.05, min, max).toFixed(2)));
      } else if (event.nativeEvent.actionName === 'decrement') {
        onChange(Number(clamp(normalizedValue - 0.05, min, max).toFixed(2)));
      }
    },
    [max, min, normalizedValue, onChange],
  );

  return (
    <View style={styles.sliderSection}>
      <View
        style={styles.sliderTrackTouch}
        onLayout={(event: LayoutChangeEvent) => setTrackWidth(Math.max(1, event.nativeEvent.layout.width))}
        {...panResponder.panHandlers}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Confidence threshold"
        accessibilityValue={{ min, max, now: Number(normalizedValue.toFixed(2)) }}
        accessibilityActions={[
          { name: 'increment', label: 'Increase confidence threshold' },
          { name: 'decrement', label: 'Decrease confidence threshold' },
        ]}
        onAccessibilityAction={handleAccessibilityAction}
      >
        <View style={styles.sliderTrack} />
        <View style={[styles.sliderFill, fillStyle]} />
        <View style={[styles.sliderThumb, thumbStyle]} />
      </View>
      <Text style={styles.sliderValue}>{Math.round(normalizedValue * 100)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sliderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sliderTrackTouch: {
    flex: 1,
    minHeight: 36,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#374151',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#FFD54F',
  },
  sliderThumb: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 999,
    marginLeft: -9,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FFD54F',
  },
  sliderValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    width: 46,
    textAlign: 'right',
  },
});
