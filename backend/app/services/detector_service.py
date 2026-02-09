from ultralytics import YOLO
from pathlib import Path

# Import mapping from models/
import sys
sys.path.append(str(Path(__file__).resolve().parents[3] / "models"))

from coco_mapping import COCO_ID_TO_APP, CONF_THRESHOLDS


class DetectorService:
    def __init__(self):
        model_path = Path(__file__).resolve().parents[3] / "models" / "yolov8n.pt"
        self.model = YOLO(str(model_path))

    def detect(self, image_path: str):
        results = self.model(image_path, verbose=False)[0]
        detections = []

        if results.boxes is None:
            return detections

        for box in results.boxes:
            cls_id = int(box.cls.item())
            conf = float(box.conf.item())

            if cls_id not in COCO_ID_TO_APP:
                continue

            label = COCO_ID_TO_APP[cls_id]
            if conf < CONF_THRESHOLDS[label]:
                continue

            x1, y1, x2, y2 = map(float, box.xyxy[0])

            detections.append({
                "label": label,
                "confidence": round(conf, 2),
                "bbox": [x1, y1, x2, y2]
            })

        return detections

if __name__ == "__main__":
    detector = DetectorService()
    results = detector.detect(
        r"D:\BITS\SEM 8\SOP(JK Sahoo)\Vision-AI\models\data\raw\custom\images\pexels-kindelmedia-7148445.jpg"
    )
    print(results)
