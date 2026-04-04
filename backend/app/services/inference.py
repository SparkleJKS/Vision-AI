from __future__ import annotations

from collections import Counter
from io import BytesIO
from typing import Any

try:
    from PIL import Image, UnidentifiedImageError
except ImportError:  # pragma: no cover - optional in partial local setups.
    Image = None  # type: ignore[assignment]

    class UnidentifiedImageError(Exception):
        pass

from .detector_service import DetectorService


HUMAN_LABELS: dict[str, str] = {
    "person": "person",
    "vehicle": "vehicle",
    "bike": "bike",
    "chair": "chair",
    "table": "table",
    "traffic_light": "traffic light",
    "sign": "sign",
}

PLURAL_LABELS: dict[str, str] = {
    "person": "people",
    "vehicle": "vehicles",
    "bike": "bikes",
    "chair": "chairs",
    "table": "tables",
    "traffic_light": "traffic lights",
    "sign": "signs",
}


def _label_text(label: str, count: int) -> str:
    if count == 1:
        return HUMAN_LABELS.get(label, label.replace("_", " "))
    return PLURAL_LABELS.get(label, f"{label.replace('_', ' ')}s")


def _join_with_and(parts: list[str]) -> str:
    if not parts:
        return ""
    if len(parts) == 1:
        return parts[0]
    if len(parts) == 2:
        return f"{parts[0]} and {parts[1]}"
    return ", ".join(parts[:-1]) + f", and {parts[-1]}"


def _horizontal_position(box: list[float], image_width: int) -> str:
    if image_width <= 0 or len(box) < 4:
        return "ahead"
    center_x = (box[0] + box[2]) / 2.0
    ratio = center_x / float(image_width)
    if ratio < 0.35:
        return "on your left"
    if ratio > 0.65:
        return "on your right"
    return "ahead"


class InferenceService:
    def __init__(self) -> None:
        self.detector = DetectorService()

    def describe(self, image_bytes: bytes) -> tuple[str, float]:
        if not image_bytes:
            return "Empty image input.", 0.0
        if Image is None:
            return "Image processing dependencies are not available on the server.", 0.0

        try:
            image = Image.open(BytesIO(image_bytes)).convert("RGB")
        except UnidentifiedImageError:
            return "I could not read the image from the camera.", 0.0

        detections = self.detector.detect(image)
        if not detections:
            return "No known obstacles were detected in front of you.", 0.35

        label_counts = Counter(
            str(detection.get("label", "object"))
            for detection in detections
            if detection.get("label")
        )
        if not label_counts:
            avg_confidence = sum(float(item.get("confidence", 0.0)) for item in detections) / len(detections)
            confidence = max(0.0, min(1.0, avg_confidence))
            return "I detected objects in front of you.", round(confidence, 2)

        top_labels = sorted(label_counts.items(), key=lambda item: (-item[1], item[0]))[:3]
        summary_parts = [f"{count} {_label_text(label, count)}" for label, count in top_labels]
        summary = _join_with_and(summary_parts)

        primary_detection = max(
            detections,
            key=lambda item: float(item.get("confidence", 0.0)),
        )
        primary_label = str(primary_detection.get("label", "object"))
        primary_box = primary_detection.get("box")
        normalized_box: list[float] = (
            [float(value) for value in primary_box[:4]]
            if isinstance(primary_box, list) and len(primary_box) >= 4
            else [0.0, 0.0, 0.0, 0.0]
        )
        primary_position = _horizontal_position(normalized_box, image.width)
        primary_label_text = _label_text(primary_label, 1)

        description = f"I can see {summary}. The most prominent {primary_label_text} is {primary_position}."
        avg_confidence = sum(float(item.get("confidence", 0.0)) for item in detections) / len(detections)
        confidence = max(0.0, min(1.0, avg_confidence))
        return description, round(confidence, 2)

    def detect(self, image_bytes: bytes) -> list[dict[str, Any]]:
        if not image_bytes:
            return []
        if Image is None:
            return []

        try:
            image = Image.open(BytesIO(image_bytes)).convert("RGB")
        except UnidentifiedImageError:
            return []

        return self.detector.detect(image)
