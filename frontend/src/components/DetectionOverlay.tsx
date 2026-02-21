import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DeviceEventEmitter,
  Text,
  type LayoutChangeEvent,
  View,
} from "react-native";

const COCO_CLASSES: string[] = [
  "person",
  "bicycle",
  "car",
  "motorcycle",
  "airplane",
  "bus",
  "train",
  "truck",
  "boat",
  "traffic light",
  "fire hydrant",
  "stop sign",
  "parking meter",
  "bench",
  "bird",
  "cat",
  "dog",
  "horse",
  "sheep",
  "cow",
  "elephant",
  "bear",
  "zebra",
  "giraffe",
  "backpack",
  "umbrella",
  "handbag",
  "tie",
  "suitcase",
  "frisbee",
  "skis",
  "snowboard",
  "sports ball",
  "kite",
  "baseball bat",
  "baseball glove",
  "skateboard",
  "surfboard",
  "tennis racket",
  "bottle",
  "wine glass",
  "cup",
  "fork",
  "knife",
  "spoon",
  "bowl",
  "banana",
  "apple",
  "sandwich",
  "orange",
  "broccoli",
  "carrot",
  "hot dog",
  "pizza",
  "donut",
  "cake",
  "chair",
  "couch",
  "potted plant",
  "bed",
  "dining table",
  "toilet",
  "tv",
  "laptop",
  "mouse",
  "remote",
  "keyboard",
  "cell phone",
  "microwave",
  "oven",
  "toaster",
  "sink",
  "refrigerator",
  "book",
  "clock",
  "vase",
  "scissors",
  "teddy bear",
  "hair drier",
  "toothbrush",
];

type Detection = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  classId: number;
};

type ViewSize = {
  width: number;
  height: number;
};

type DetectionOverlayProps = {
  enabled?: boolean;
};

const MODEL_SIZE = 320;
const MAX_RENDER_BOXES = 20;

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
};

const normalizeDetections = (payload: unknown): Detection[] => {
  if (!Array.isArray(payload)) return [];
  const normalized: Detection[] = [];
  for (const item of payload) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const x1 = toFiniteNumber(record.x1);
    const y1 = toFiniteNumber(record.y1);
    const x2 = toFiniteNumber(record.x2);
    const y2 = toFiniteNumber(record.y2);
    const classId = typeof record.classId === "number" ? record.classId : 0;
    if (x1 == null || y1 == null || x2 == null || y2 == null) continue;
    normalized.push({ x1, y1, x2, y2, classId });
  }
  return normalized;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const mapDetectionToBox = (detection: Detection, viewSize: ViewSize) => {
  const scaleX = viewSize.width / MODEL_SIZE;
  const scaleY = viewSize.height / MODEL_SIZE;
  const left = clamp(
    Math.min(detection.x1, detection.x2) * scaleX,
    0,
    viewSize.width,
  );
  const right = clamp(
    Math.max(detection.x1, detection.x2) * scaleX,
    0,
    viewSize.width,
  );
  const top = clamp(
    Math.min(detection.y1, detection.y2) * scaleY,
    0,
    viewSize.height,
  );
  const bottom = clamp(
    Math.max(detection.y1, detection.y2) * scaleY,
    0,
    viewSize.height,
  );
  return {
    left,
    top,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
};

// Distinct vivid colors per class family
const BOX_COLORS = [
  "#00FF41",
  "#FF3131",
  "#00D4FF",
  "#FFD600",
  "#FF6B00",
  "#BF5FFF",
  "#00FFB3",
  "#FF007A",
  "#4DFFFF",
  "#FF9500",
];

const getColor = (classId: number) => BOX_COLORS[classId % BOX_COLORS.length];

function useLatestDetectionsLoop(enabled: boolean) {
  const latestDetectionsRef = useRef<Detection[]>([]);
  const detectionsVersionRef = useRef(0);

  useEffect(() => {
    latestDetectionsRef.current = [];
    detectionsVersionRef.current = 0;
    if (!enabled) return;

    const subscription = DeviceEventEmitter.addListener(
      "onYoloDetections",
      (data: { detections: Detection[] }) => {
        latestDetectionsRef.current = normalizeDetections(data?.detections);
        detectionsVersionRef.current += 1;
      },
    );

    return () => subscription.remove();
  }, [enabled]);

  return { latestDetectionsRef, detectionsVersionRef };
}

const DetectionOverlay = ({ enabled = true }: DetectionOverlayProps) => {
  const { latestDetectionsRef, detectionsVersionRef } =
    useLatestDetectionsLoop(enabled);
  const viewSizeRef = useRef<ViewSize>({ width: 0, height: 0 });
  const boxRefs = useRef<Array<View | null>>([]);
  const lastDrawnVersionRef = useRef(-1);
  const [labels, setLabels] = useState<
    Array<{ text: string; left: number; top: number; color: string }>
  >([]);

  const boxRefCallbacks = useMemo(
    () =>
      Array.from(
        { length: MAX_RENDER_BOXES },
        (_, i) => (node: View | null) => {
          boxRefs.current[i] = node;
        },
      ),
    [],
  );

  const hideAllBoxes = useCallback(() => {
    for (let i = 0; i < MAX_RENDER_BOXES; i += 1) {
      boxRefs.current[i]?.setNativeProps({ style: { opacity: 0 } });
    }
  }, []);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    viewSizeRef.current = { width, height };
    lastDrawnVersionRef.current = -1;
  }, []);

  useEffect(() => {
    if (!enabled) {
      hideAllBoxes();
      setLabels([]);
      lastDrawnVersionRef.current = -1;
      return;
    }

    let rafId = 0;
    let cancelled = false;
    lastDrawnVersionRef.current = -1;

    const draw = () => {
      if (cancelled) return;

      const currentVersion = detectionsVersionRef.current;
      const { width, height } = viewSizeRef.current;

      if (
        lastDrawnVersionRef.current === currentVersion &&
        width > 0 &&
        height > 0
      ) {
        rafId = requestAnimationFrame(draw);
        return;
      }

      if (width > 0 && height > 0) {
        const detections = latestDetectionsRef.current;
        const renderCount = Math.min(detections.length, MAX_RENDER_BOXES);

        for (let i = 0; i < MAX_RENDER_BOXES; i += 1) {
          const boxView = boxRefs.current[i];
          if (!boxView) continue;

          if (i < renderCount) {
            const det = detections[i];
            const mapped = mapDetectionToBox(det, viewSizeRef.current);
            const color = getColor(det.classId);

            boxView.setNativeProps({
              style: {
                opacity: 1,
                left: mapped.left,
                top: mapped.top,
                width: mapped.width,
                height: mapped.height,
                borderColor: color,
              },
            });
          } else {
            boxView.setNativeProps({ style: { opacity: 0 } });
          }
        }

        const nextLabels = [];
        for (let i = 0; i < renderCount; i++) {
          const det = detections[i];
          const mapped = mapDetectionToBox(det, viewSizeRef.current);
          const color = getColor(det.classId);
          const label = COCO_CLASSES[det.classId] ?? `class ${det.classId}`;
          nextLabels.push({
            text: label,
            left: mapped.left,
            top: Math.max(0, mapped.top - 26),
            color,
          });
        }
        setLabels(nextLabels);

        lastDrawnVersionRef.current = currentVersion;
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      hideAllBoxes();
      setLabels([]);
      lastDrawnVersionRef.current = -1;
    };
  }, [detectionsVersionRef, enabled, hideAllBoxes, latestDetectionsRef]);

  return (
    <View
      pointerEvents="none"
      className="absolute inset-0 z-20"
      onLayout={handleLayout}
    >
      <>
        {Array.from({ length: MAX_RENDER_BOXES }, (_, i) => (
          <View
            key={`box-${i}`}
            ref={boxRefCallbacks[i]}
            className="absolute left-0 top-0 w-0 h-0 opacity-0 border-[2.5px] border-[#00FF41]"
          />
        ))}
        {labels.map((label, i) => (
          <View
            key={`label-${i}`}
            className="absolute px-1.5 py-0.5 rounded-[5px] max-w-[140px]"
            style={{
              left: label.left,
              top: label.top,
              backgroundColor: label.color,
            }}
          >
            <Text
              className="text-black text-xs font-black tracking-wide"
              numberOfLines={1}
            >
              {label.text}
            </Text>
          </View>
        ))}
      </>
    </View>
  );
};

export default DetectionOverlay;
