from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

try:
    from ultralytics import YOLO
except ImportError:  # pragma: no cover - optional runtime dependency in local/dev environments.
    YOLO = None  # type: ignore[assignment]

# Import class/threshold mapping from models/
sys.path.append(str(Path(__file__).resolve().parents[3] / "models"))
try:
    from coco_mapping import COCO_ID_TO_APP, CONF_THRESHOLDS
except ImportError:  # pragma: no cover - fallback for partial checkouts.
    COCO_ID_TO_APP = {}
    CONF_THRESHOLDS = {}


class DetectorService:
    def __init__(self) -> None:
        self.model = None
        if YOLO is None:
            return

        model_path = Path(__file__).resolve().parents[3] / "models" / "yolov8n.pt"
        if not model_path.exists():
            return

        try:
            self.model = YOLO(str(model_path))
        except Exception:
            self.model = None

    def detect(self, image: Any) -> list[dict[str, Any]]:
        if self.model is None:
            return []

        results = self.model(image, verbose=False)[0]
        detections: list[dict[str, Any]] = []
        boxes = results.boxes

        if boxes is None:
            return detections

        for box in boxes:
            cls_id = int(box.cls.item())
            confidence = float(box.conf.item())
            label = COCO_ID_TO_APP.get(cls_id)

            if label is None:
                continue

            if confidence < CONF_THRESHOLDS.get(label, 0.5):
                continue

            x1, y1, x2, y2 = map(float, box.xyxy[0].tolist())
            detections.append(
                {
                    "label": label,
                    "confidence": round(confidence, 2),
                    "box": [x1, y1, x2, y2],
                }
            )

        return detections
