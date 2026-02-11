from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

from ultralytics import YOLO

# Import class/threshold mapping from models/
sys.path.append(str(Path(__file__).resolve().parents[3] / "models"))
from coco_mapping import COCO_ID_TO_APP, CONF_THRESHOLDS


class DetectorService:
    def __init__(self) -> None:
        model_path = Path(__file__).resolve().parents[3] / "models" / "yolov8n.pt"
        self.model = YOLO(str(model_path))

    def detect(self, image: Any) -> list[dict[str, Any]]:
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
