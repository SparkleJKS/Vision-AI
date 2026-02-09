# COCO class IDs to VisionApp labels
COCO_ID_TO_APP = {
    0: "person",
    1: "bike",
    2: "vehicle",
    5: "vehicle",
    7: "vehicle",
    9: "traffic_light",
    11: "sign",
    56: "chair",
    60: "table",
}

# Confidence threshold per class (can tune later)
CONF_THRESHOLDS = {
    "person": 0.4,
    "vehicle": 0.5,
    "bike": 0.5,
    "chair": 0.6,
    "table": 0.6,
    "traffic_light": 0.5,
    "sign": 0.5,
}
