import React, { useCallback, useMemo, useState } from "react";
import {
  type GestureResponderEvent,
  type LayoutChangeEvent,
  PanResponder,
  Text,
  View,
} from "react-native";
import type { DimensionValue } from "react-native";
import { clamp } from "./utils";
import type { ConfidenceSliderProps } from "./types";

const ConfidenceSlider = ({
  value,
  onChange,
  min = 0.05,
  max = 0.95,
}: ConfidenceSliderProps) => {
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
    () => ({
      width: `${Math.round(normalizedProgress * 100)}%` as DimensionValue,
    }),
    [normalizedProgress],
  );
  const thumbStyle = useMemo(
    () => ({ left: normalizedProgress * trackWidth }),
    [normalizedProgress, trackWidth],
  );

  const handleAccessibilityAction = useCallback(
    (event: { nativeEvent: { actionName?: string } }) => {
      if (event.nativeEvent.actionName === "increment") {
        onChange(Number(clamp(normalizedValue + 0.05, min, max).toFixed(2)));
      } else if (event.nativeEvent.actionName === "decrement") {
        onChange(Number(clamp(normalizedValue - 0.05, min, max).toFixed(2)));
      }
    },
    [max, min, normalizedValue, onChange],
  );

  return (
    <View className="flex-row items-center gap-2.5">
      <View
        className="flex-1 min-h-9 justify-center"
        onLayout={(event: LayoutChangeEvent) =>
          setTrackWidth(Math.max(1, event.nativeEvent.layout.width))
        }
        {...panResponder.panHandlers}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Confidence threshold"
        accessibilityValue={{
          min,
          max,
          now: Number(normalizedValue.toFixed(2)),
        }}
        accessibilityActions={[
          { name: "increment", label: "Increase confidence threshold" },
          { name: "decrement", label: "Decrease confidence threshold" },
        ]}
        onAccessibilityAction={handleAccessibilityAction}
      >
        <View className="h-1.5 rounded-full bg-[#374151]" />
        <View
          className="absolute left-0 h-1.5 rounded-full bg-[#FFD54F]"
          style={fillStyle}
        />
        <View
          className="absolute w-[18px] h-[18px] rounded-full -ml-[9px] bg-white border-2 border-[#FFD54F]"
          style={thumbStyle}
        />
      </View>
      <Text className="text-white text-xs font-bold w-[46px] text-right">
        {Math.round(normalizedValue * 100)}%
      </Text>
    </View>
  );
};

export default ConfidenceSlider;
