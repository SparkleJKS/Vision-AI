import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Pressable, Text, View } from "react-native";
import type { LayoutChangeEvent } from "react-native";
import {
  DEFAULT_MODEL_SIZE,
  DEFAULT_SMOOTHING_ALPHA,
  DEFAULT_MAX_BOXES,
} from "./config";
import {
  toFiniteNumber,
  normalizeSize,
  mapPredictionsToScreen,
  smoothBoxes,
  hexToRgba,
} from "./utils";
import type { BoxOverlayProps } from "./types";
import type { ScreenBox } from "./utils";

function propsAreEqual(
  previousProps: BoxOverlayProps,
  nextProps: BoxOverlayProps,
): boolean {
  const isSamePair = (first: unknown, second: unknown) =>
    Array.isArray(first) &&
    Array.isArray(second) &&
    first.length === 2 &&
    second.length === 2 &&
    first[0] === second[0] &&
    first[1] === second[1];

  return (
    previousProps.predictions === nextProps.predictions &&
    isSamePair(previousProps.modelSize, nextProps.modelSize) &&
    isSamePair(previousProps.sourceSize, nextProps.sourceSize) &&
    previousProps.resizeMode === nextProps.resizeMode &&
    previousProps.modelResizeMode === nextProps.modelResizeMode &&
    previousProps.smoothingAlpha === nextProps.smoothingAlpha &&
    previousProps.showLabels === nextProps.showLabels &&
    previousProps.maxBoxes === nextProps.maxBoxes &&
    previousProps.minBoxSize === nextProps.minBoxSize &&
    previousProps.enableTapDetails === nextProps.enableTapDetails &&
    previousProps.onBoxPress === nextProps.onBoxPress &&
    previousProps.style === nextProps.style
  );
}

const OverlayBox = memo(function OverlayBox({
  box,
  showLabels,
  onPress,
  isPressable,
}: {
  box: ScreenBox;
  showLabels: boolean;
  onPress?: () => void;
  isPressable: boolean;
}) {
  const borderStyle = useMemo(
    () => ({
      left: box.x,
      top: box.y,
      width: box.width,
      height: box.height,
      borderColor: box.color,
    }),
    [box.x, box.y, box.width, box.height, box.color],
  );

  const labelContainerStyle = useMemo(
    () => ({ backgroundColor: hexToRgba(box.color, 0.85) }),
    [box.color],
  );

  const labelText = useMemo(
    () => `${box.label} ${Math.round(box.confidence * 100)}%`,
    [box.label, box.confidence],
  );

  return (
    <Pressable
      className="absolute border-2 rounded-md"
      style={borderStyle}
      onPress={onPress}
      disabled={!isPressable}
      pointerEvents={isPressable ? "auto" : "none"}
    >
      {showLabels ? (
        <View
          className="absolute left-0 -top-6 max-w-[220px] rounded px-1.5 py-0.5"
          style={labelContainerStyle}
        >
          <Text className="text-white text-[11px] font-bold" numberOfLines={1}>
            {labelText}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
});

function BoxOverlay({
  predictions = [],
  modelSize = [...DEFAULT_MODEL_SIZE],
  sourceSize = modelSize,
  resizeMode = "cover",
  modelResizeMode = "stretch",
  smoothingAlpha = DEFAULT_SMOOTHING_ALPHA,
  maxBoxes = DEFAULT_MAX_BOXES,
  minBoxSize = 2,
  showLabels = true,
  enableTapDetails = false,
  onBoxPress = null,
  style,
}: BoxOverlayProps) {
  const [layoutSize, setLayoutSize] = useState<[number, number]>([0, 0]);
  const [selectedBox, setSelectedBox] = useState<ScreenBox | null>(null);
  const previousBoxesByKeyRef = useRef(new Map<string, ScreenBox>());

  const normalizedModelSize = useMemo(
    () => normalizeSize(modelSize),
    [modelSize],
  );
  const normalizedSourceSize = useMemo(
    () => normalizeSize(sourceSize, normalizedModelSize),
    [sourceSize, normalizedModelSize],
  );

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const width = Math.round(event.nativeEvent.layout.width);
    const height = Math.round(event.nativeEvent.layout.height);
    setLayoutSize((prev) =>
      prev[0] === width && prev[1] === height ? prev : [width, height],
    );
  }, []);

  useEffect(() => {
    previousBoxesByKeyRef.current = new Map();
    setSelectedBox(null);
  }, [
    normalizedModelSize[0],
    normalizedModelSize[1],
    normalizedSourceSize[0],
    normalizedSourceSize[1],
    resizeMode,
    modelResizeMode,
  ]);

  const targetBoxes = useMemo(() => {
    if (layoutSize[0] <= 0 || layoutSize[1] <= 0 || predictions.length === 0)
      return [];
    return mapPredictionsToScreen({
      predictions: (predictions ?? []) as Record<string, unknown>[],
      modelSize: normalizedModelSize,
      sourceSize: normalizedSourceSize,
      overlaySize: layoutSize,
      resizeMode,
      modelResizeMode,
      maxBoxes: Math.max(
        1,
        Math.trunc(toFiniteNumber(maxBoxes, DEFAULT_MAX_BOXES)),
      ),
      minBoxSize: Math.max(1, toFiniteNumber(minBoxSize, 2)),
    });
  }, [
    predictions,
    normalizedModelSize,
    normalizedSourceSize,
    layoutSize,
    resizeMode,
    modelResizeMode,
    maxBoxes,
    minBoxSize,
  ]);

  const smoothedBoxesResult = useMemo(
    () =>
      smoothBoxes(
        targetBoxes,
        previousBoxesByKeyRef.current,
        toFiniteNumber(smoothingAlpha, DEFAULT_SMOOTHING_ALPHA),
      ),
    [targetBoxes, smoothingAlpha],
  );

  useEffect(() => {
    previousBoxesByKeyRef.current = smoothedBoxesResult.nextBoxesByKey;
  }, [smoothedBoxesResult.nextBoxesByKey]);

  const isPressable = enableTapDetails || typeof onBoxPress === "function";
  const handleBoxPress = useCallback(
    (box: ScreenBox) => {
      if (typeof onBoxPress === "function") onBoxPress(box);
      else if (enableTapDetails) setSelectedBox(box);
    },
    [enableTapDetails, onBoxPress],
  );

  const closePanel = useCallback(() => setSelectedBox(null), []);

  return (
    <View
      className="absolute inset-0"
      style={style}
      pointerEvents="box-none"
      onLayout={handleLayout}
    >
      {smoothedBoxesResult.boxes.map((box) => (
        <OverlayBox
          key={box.trackKey}
          box={box}
          showLabels={showLabels}
          isPressable={isPressable}
          onPress={isPressable ? () => handleBoxPress(box) : undefined}
        />
      ))}

      {enableTapDetails && selectedBox ? (
        <View
          className="absolute left-3 right-3 bottom-3"
          pointerEvents="box-none"
        >
          <Pressable
            className="rounded-[10px] px-3 py-2.5 border border-white/20 bg-[rgba(10,10,10,0.86)]"
            onPress={closePanel}
          >
            <Text className="text-white text-[15px] font-bold">
              {selectedBox.label}
            </Text>
            <Text className="text-[#E5E7EB] text-xs mt-0.5">
              Confidence: {Math.round(selectedBox.confidence * 100)}%
            </Text>
            <Text className="text-[#E5E7EB] text-xs mt-0.5">
              Box: [{Math.round(selectedBox.sourceBox[0])},{" "}
              {Math.round(selectedBox.sourceBox[1])},{" "}
              {Math.round(selectedBox.sourceBox[2])},{" "}
              {Math.round(selectedBox.sourceBox[3])}]
            </Text>
            <Text className="text-[#9CA3AF] text-[11px] mt-2">
              Tap panel to dismiss
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

export default memo(BoxOverlay, propsAreEqual);
