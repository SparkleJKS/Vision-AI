// @ts-nocheck
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const DEFAULT_MODEL_SIZE = [640, 640];
const DEFAULT_SMOOTHING_ALPHA = 0.35;
const DEFAULT_MAX_BOXES = 50;
const MIN_CONFIDENCE = 0;
const MAX_CONFIDENCE = 1;

const COLOR_PALETTE = [
  '#22C55E',
  '#3B82F6',
  '#F97316',
  '#EF4444',
  '#14B8A6',
  '#F59E0B',
  '#06B6D4',
  '#84CC16',
  '#EAB308',
  '#A855F7',
  '#10B981',
  '#F43F5E',
];

function toFiniteNumber(value, fallback = NaN) {
  const numericValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeSize(size, fallback = DEFAULT_MODEL_SIZE) {
  if (Array.isArray(size) && size.length === 2) {
    const width = Math.trunc(toFiniteNumber(size[0], NaN));
    const height = Math.trunc(toFiniteNumber(size[1], NaN));
    if (width > 0 && height > 0) {
      return [width, height];
    }
  }
  return [...fallback];
}

function normalizeBbox(bbox) {
  if (!Array.isArray(bbox) || bbox.length < 4) {
    return null;
  }

  const x1 = toFiniteNumber(bbox[0], NaN);
  const y1 = toFiniteNumber(bbox[1], NaN);
  const x2 = toFiniteNumber(bbox[2], NaN);
  const y2 = toFiniteNumber(bbox[3], NaN);
  if ([x1, y1, x2, y2].some((value) => !Number.isFinite(value))) {
    return null;
  }

  return [Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2)];
}

function isNormalizedBbox([x1, y1, x2, y2]) {
  return x1 >= 0 && y1 >= 0 && x2 <= 1.01 && y2 <= 1.01;
}

function getPredictionClassKey(prediction) {
  const className =
    typeof prediction?.className === 'string' && prediction.className.trim()
      ? prediction.className.trim().toLowerCase()
      : null;
  if (className) {
    return className;
  }

  const classId = prediction?.classId ?? prediction?.class;
  if (typeof classId === 'number' && Number.isFinite(classId)) {
    return `class_${Math.trunc(classId)}`;
  }
  if (typeof classId === 'string' && classId.trim()) {
    return classId.trim().toLowerCase();
  }
  return 'unknown';
}

function hashString(input) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash *= 16777619;
  }
  return Math.abs(hash >>> 0);
}

function getClassColor(classKey) {
  const index = hashString(classKey) % COLOR_PALETTE.length;
  return COLOR_PALETTE[index];
}

function hexToRgba(hexColor, alpha) {
  const hex = hexColor.replace('#', '');
  const value = hex.length === 3
    ? hex
        .split('')
        .map((char) => `${char}${char}`)
        .join('')
    : hex;
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  const normalizedAlpha = clamp(alpha, 0, 1);
  return `rgba(${red}, ${green}, ${blue}, ${normalizedAlpha})`;
}

function getDisplayTransform(sourceWidth, sourceHeight, overlayWidth, overlayHeight, resizeMode) {
  if (resizeMode === 'stretch') {
    return {
      scaleX: overlayWidth / sourceWidth,
      scaleY: overlayHeight / sourceHeight,
      offsetX: 0,
      offsetY: 0,
    };
  }

  const uniformScale =
    resizeMode === 'contain'
      ? Math.min(overlayWidth / sourceWidth, overlayHeight / sourceHeight)
      : Math.max(overlayWidth / sourceWidth, overlayHeight / sourceHeight);

  return {
    scaleX: uniformScale,
    scaleY: uniformScale,
    offsetX: (overlayWidth - sourceWidth * uniformScale) / 2,
    offsetY: (overlayHeight - sourceHeight * uniformScale) / 2,
  };
}

function modelToSourceBox(modelBox, modelSize, sourceSize, modelResizeMode) {
  const [modelWidth, modelHeight] = modelSize;
  const [sourceWidth, sourceHeight] = sourceSize;

  if (modelResizeMode === 'letterbox') {
    const gain = Math.min(modelWidth / sourceWidth, modelHeight / sourceHeight);
    const padX = (modelWidth - sourceWidth * gain) / 2;
    const padY = (modelHeight - sourceHeight * gain) / 2;
    return [
      (modelBox[0] - padX) / gain,
      (modelBox[1] - padY) / gain,
      (modelBox[2] - padX) / gain,
      (modelBox[3] - padY) / gain,
    ];
  }

  // Default to stretch because current preprocessing path resizes directly.
  return [
    modelBox[0] * (sourceWidth / modelWidth),
    modelBox[1] * (sourceHeight / modelHeight),
    modelBox[2] * (sourceWidth / modelWidth),
    modelBox[3] * (sourceHeight / modelHeight),
  ];
}

function sourceToScreenBox(sourceBox, sourceSize, overlaySize, resizeMode) {
  const [sourceWidth, sourceHeight] = sourceSize;
  const [overlayWidth, overlayHeight] = overlaySize;
  const transform = getDisplayTransform(
    sourceWidth,
    sourceHeight,
    overlayWidth,
    overlayHeight,
    resizeMode,
  );

  const x1 = sourceBox[0] * transform.scaleX + transform.offsetX;
  const y1 = sourceBox[1] * transform.scaleY + transform.offsetY;
  const x2 = sourceBox[2] * transform.scaleX + transform.offsetX;
  const y2 = sourceBox[3] * transform.scaleY + transform.offsetY;

  const left = clamp(Math.min(x1, x2), 0, overlayWidth);
  const top = clamp(Math.min(y1, y2), 0, overlayHeight);
  const right = clamp(Math.max(x1, x2), 0, overlayWidth);
  const bottom = clamp(Math.max(y1, y2), 0, overlayHeight);

  return [left, top, right, bottom];
}

function toModelSpaceBox(bbox, modelSize) {
  if (isNormalizedBbox(bbox)) {
    return [
      bbox[0] * modelSize[0],
      bbox[1] * modelSize[1],
      bbox[2] * modelSize[0],
      bbox[3] * modelSize[1],
    ];
  }
  return bbox;
}

function sanitizePrediction(prediction) {
  const bbox = normalizeBbox(prediction?.bbox ?? prediction?.box);
  if (!bbox) {
    return null;
  }

  const confidence = clamp(
    toFiniteNumber(prediction?.confidence, MIN_CONFIDENCE),
    MIN_CONFIDENCE,
    MAX_CONFIDENCE,
  );
  const classKey = getPredictionClassKey(prediction);
  const label =
    typeof prediction?.className === 'string' && prediction.className.trim()
      ? prediction.className.trim()
      : classKey.replace(/^class_/, 'class ');

  return {
    raw: prediction,
    bbox,
    confidence,
    classKey,
    label,
  };
}

function mapPredictionsToScreen({
  predictions,
  modelSize,
  sourceSize,
  overlaySize,
  resizeMode,
  modelResizeMode,
  maxBoxes,
  minBoxSize,
}) {
  const valid = predictions
    .map(sanitizePrediction)
    .filter(Boolean)
    .sort((first, second) => {
      if (second.confidence !== first.confidence) {
        return second.confidence - first.confidence;
      }
      return first.classKey.localeCompare(second.classKey);
    })
    .slice(0, maxBoxes);

  const classOrder = new Map();

  return valid
    .map((item) => {
      const classCount = classOrder.get(item.classKey) ?? 0;
      classOrder.set(item.classKey, classCount + 1);

      const trackKey = `${item.classKey}:${classCount}`;
      const modelSpaceBox = toModelSpaceBox(item.bbox, modelSize);
      const sourceBox = modelToSourceBox(
        modelSpaceBox,
        modelSize,
        sourceSize,
        modelResizeMode,
      );
      const screenBox = sourceToScreenBox(sourceBox, sourceSize, overlaySize, resizeMode);
      const width = screenBox[2] - screenBox[0];
      const height = screenBox[3] - screenBox[1];

      if (width < minBoxSize || height < minBoxSize) {
        return null;
      }

      return {
        trackKey,
        classKey: item.classKey,
        label: item.label,
        confidence: item.confidence,
        color: getClassColor(item.classKey),
        x: screenBox[0],
        y: screenBox[1],
        width,
        height,
        modelBox: modelSpaceBox,
        sourceBox,
      };
    })
    .filter(Boolean);
}

function smoothBoxes(targetBoxes, previousBoxesByKey, smoothingAlpha) {
  const alpha = clamp(smoothingAlpha, 0, 1);
  const nextBoxesByKey = new Map();

  const smoothed = targetBoxes.map((target) => {
    const previous = previousBoxesByKey.get(target.trackKey);
    if (!previous) {
      nextBoxesByKey.set(target.trackKey, target);
      return target;
    }

    const blended = {
      ...target,
      x: previous.x + alpha * (target.x - previous.x),
      y: previous.y + alpha * (target.y - previous.y),
      width: previous.width + alpha * (target.width - previous.width),
      height: previous.height + alpha * (target.height - previous.height),
    };

    nextBoxesByKey.set(target.trackKey, blended);
    return blended;
  });

  return {
    boxes: smoothed,
    nextBoxesByKey,
  };
}

const OverlayBox = memo(function OverlayBox({
  box,
  showLabels,
  onPress,
  isPressable,
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
    () => ({
      backgroundColor: hexToRgba(box.color, 0.85),
    }),
    [box.color],
  );

  const labelText = useMemo(
    () => `${box.label} ${Math.round(box.confidence * 100)}%`,
    [box.label, box.confidence],
  );

  return (
    <Pressable
      style={[styles.box, borderStyle]}
      onPress={onPress}
      disabled={!isPressable}
      pointerEvents={isPressable ? 'auto' : 'none'}
    >
      {showLabels ? (
        <View style={[styles.labelContainer, labelContainerStyle]}>
          <Text style={styles.labelText} numberOfLines={1}>
            {labelText}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
});

function propsAreEqual(previousProps, nextProps) {
  const isSamePair = (first, second) =>
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

function BoxOverlay({
  predictions = [],
  modelSize = DEFAULT_MODEL_SIZE,
  sourceSize = modelSize,
  resizeMode = 'cover',
  modelResizeMode = 'stretch',
  smoothingAlpha = DEFAULT_SMOOTHING_ALPHA,
  maxBoxes = DEFAULT_MAX_BOXES,
  minBoxSize = 2,
  showLabels = true,
  enableTapDetails = false,
  onBoxPress = null,
  style,
}) {
  const [layoutSize, setLayoutSize] = useState([0, 0]);
  const [selectedBox, setSelectedBox] = useState(null);
  const previousBoxesByKeyRef = useRef(new Map());

  const normalizedModelSize = useMemo(() => normalizeSize(modelSize), [modelSize]);
  const normalizedSourceSize = useMemo(
    () => normalizeSize(sourceSize, normalizedModelSize),
    [sourceSize, normalizedModelSize],
  );

  const handleLayout = useCallback((event) => {
    const width = Math.round(event.nativeEvent.layout.width);
    const height = Math.round(event.nativeEvent.layout.height);

    setLayoutSize((previousSize) => {
      if (previousSize[0] === width && previousSize[1] === height) {
        return previousSize;
      }
      return [width, height];
    });
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
    if (layoutSize[0] <= 0 || layoutSize[1] <= 0 || predictions.length === 0) {
      return [];
    }

    return mapPredictionsToScreen({
      predictions,
      modelSize: normalizedModelSize,
      sourceSize: normalizedSourceSize,
      overlaySize: layoutSize,
      resizeMode,
      modelResizeMode,
      maxBoxes: Math.max(1, Math.trunc(toFiniteNumber(maxBoxes, DEFAULT_MAX_BOXES))),
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

  const isPressable = enableTapDetails || typeof onBoxPress === 'function';
  const handleBoxPress = useCallback(
    (box) => {
      if (typeof onBoxPress === 'function') {
        onBoxPress(box);
      } else if (enableTapDetails) {
        // Stub detail panel for quick integration; screen can replace this using onBoxPress.
        setSelectedBox(box);
      }
    },
    [enableTapDetails, onBoxPress],
  );

  const closePanel = useCallback(() => {
    setSelectedBox(null);
  }, []);

  return (
    <View style={[styles.overlay, style]} pointerEvents="box-none" onLayout={handleLayout}>
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
        <View style={styles.detailPanel} pointerEvents="box-none">
          <Pressable style={styles.detailCard} onPress={closePanel}>
            <Text style={styles.detailTitle}>{selectedBox.label}</Text>
            <Text style={styles.detailText}>
              Confidence: {Math.round(selectedBox.confidence * 100)}%
            </Text>
            <Text style={styles.detailText}>
              Box: [{Math.round(selectedBox.sourceBox[0])}, {Math.round(selectedBox.sourceBox[1])},{' '}
              {Math.round(selectedBox.sourceBox[2])}, {Math.round(selectedBox.sourceBox[3])}]
            </Text>
            <Text style={styles.detailHint}>Tap panel to dismiss</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  box: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 6,
  },
  labelContainer: {
    position: 'absolute',
    left: 0,
    top: -24,
    maxWidth: 220,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  labelText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  detailPanel: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
  },
  detailCard: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(10, 10, 10, 0.86)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  detailTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  detailText: {
    color: '#E5E7EB',
    fontSize: 12,
    marginTop: 3,
  },
  detailHint: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 8,
  },
});

export default memo(BoxOverlay, propsAreEqual);
