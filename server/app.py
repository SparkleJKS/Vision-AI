from __future__ import annotations

import base64
import binascii
import json
import os
import threading
import time
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from io import BytesIO
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, HTTPException, Query, Request, UploadFile, WebSocket
from fastapi.concurrency import run_in_threadpool
from fastapi.websockets import WebSocketDisconnect
from PIL import Image, UnidentifiedImageError
from ultralytics import YOLO

try:
    import torch
except ImportError:  # pragma: no cover - ultralytics usually brings torch.
    torch = None  # type: ignore[assignment]


DEFAULT_CONFIDENCE = 0.25
DEFAULT_IOU = 0.45
DEFAULT_IMAGE_SIZE = 640


@dataclass
class InferenceState:
    model: YOLO | None = None
    model_path: Path | None = None
    device: str = "cpu"
    lock: threading.Lock = field(default_factory=threading.Lock)


state = InferenceState()


def resolve_default_model_path() -> Path:
    repo_root = Path(__file__).resolve().parents[1]
    return repo_root / "models" / "yolov8n.pt"


def resolve_device() -> str:
    forced = os.getenv("YOLO_DEVICE")
    if forced:
        return forced

    # GPU/CUDA note:
    # If CUDA is available, running on "cuda:0" significantly lowers inference latency.
    # To force CPU (or a different GPU), set YOLO_DEVICE (e.g. "cpu", "cuda:1").
    if torch is not None and torch.cuda.is_available():
        return "cuda:0"
    return "cpu"


def load_model_once() -> None:
    if state.model is not None:
        return

    model_path = Path(os.getenv("YOLO_MODEL_PATH", str(resolve_default_model_path()))).resolve()
    if not model_path.exists():
        raise FileNotFoundError(f"YOLO model not found at: {model_path}")

    state.model_path = model_path
    state.device = resolve_device()
    state.model = YOLO(str(model_path))


def decode_image(image_bytes: bytes) -> Image.Image:
    try:
        return Image.open(BytesIO(image_bytes)).convert("RGB")
    except UnidentifiedImageError as exc:
        raise ValueError("Invalid image payload.") from exc


def prediction_from_result(result: Any) -> list[dict[str, Any]]:
    predictions: list[dict[str, Any]] = []
    boxes = getattr(result, "boxes", None)
    names = getattr(result, "names", {})

    if boxes is None:
        return predictions

    for box in boxes:
        cls_id = int(box.cls.item())
        score = float(box.conf.item())
        x1, y1, x2, y2 = map(float, box.xyxy[0].tolist())

        if isinstance(names, dict):
            class_name = names.get(cls_id, str(cls_id))
        elif isinstance(names, list) and 0 <= cls_id < len(names):
            class_name = names[cls_id]
        else:
            class_name = str(cls_id)

        predictions.append(
            {
                "class": class_name,
                "score": round(score, 4),
                "bbox": [round(x1, 2), round(y1, 2), round(x2, 2), round(y2, 2)],
            }
        )

    return predictions


def run_inference(image_bytes: bytes, confidence: float, iou: float, image_size: int) -> dict[str, Any]:
    if state.model is None:
        raise RuntimeError("Model is not loaded.")

    image = decode_image(image_bytes)
    started_at = time.perf_counter()

    # Ultralytics YOLO applies preprocess + NMS internally.
    # `imgsz` controls resize preprocessing and `conf`/`iou` control NMS behavior.
    with state.lock:
        results = state.model.predict(
            source=image,
            conf=confidence,
            iou=iou,
            imgsz=image_size,
            device=state.device,
            verbose=False,
        )

    infer_ms = (time.perf_counter() - started_at) * 1000
    result = results[0] if results else None
    predictions = prediction_from_result(result) if result is not None else []

    return {
        "predictions": predictions,
        "infer_ms": round(infer_ms, 2),
    }


def clamp_threshold(value: float, min_value: float, max_value: float) -> float:
    return max(min_value, min(max_value, value))


def parse_threshold(value: Any, fallback: float, min_value: float, max_value: float) -> float:
    if value is None:
        return fallback
    try:
        numeric_value = float(value)
    except (TypeError, ValueError):
        return fallback
    return clamp_threshold(numeric_value, min_value, max_value)


def parse_image_size(value: Any, fallback: int) -> int:
    if value is None:
        return fallback
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return fallback
    return max(32, min(2048, parsed))


def decode_base64_image(data: str) -> bytes:
    payload = data
    if data.startswith("data:"):
        _, _, payload = data.partition(",")
    try:
        return base64.b64decode(payload, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise ValueError("Invalid base64 image payload.") from exc


def parse_ws_message(message: dict[str, Any]) -> tuple[bytes, float, float, int]:
    confidence = DEFAULT_CONFIDENCE
    iou = DEFAULT_IOU
    image_size = DEFAULT_IMAGE_SIZE

    raw_bytes = message.get("bytes")
    if raw_bytes is not None:
        return raw_bytes, confidence, iou, image_size

    raw_text = message.get("text")
    if raw_text is None:
        raise ValueError("WebSocket payload must be binary image bytes or JSON text.")

    try:
        payload = json.loads(raw_text)
    except json.JSONDecodeError as exc:
        raise ValueError("WebSocket text payload must be valid JSON.") from exc

    if not isinstance(payload, dict):
        raise ValueError("WebSocket JSON payload must be an object.")

    if "image" not in payload:
        raise ValueError('WebSocket JSON payload must include "image".')
    image_field = payload["image"]
    if not isinstance(image_field, str) or not image_field.strip():
        raise ValueError('"image" must be a non-empty base64 string.')

    confidence = parse_threshold(payload.get("confidence"), DEFAULT_CONFIDENCE, 0.0, 1.0)
    iou = parse_threshold(payload.get("iou"), DEFAULT_IOU, 0.0, 1.0)
    image_size = parse_image_size(payload.get("imgsz"), DEFAULT_IMAGE_SIZE)

    return decode_base64_image(image_field), confidence, iou, image_size


@asynccontextmanager
async def lifespan(_: FastAPI):
    load_model_once()
    yield
    state.model = None


app = FastAPI(
    title="Vision AI PyTorch Inference",
    version="1.0.0",
    lifespan=lifespan,
)


@app.post("/infer")
async def infer(
    request: Request,
    file: UploadFile | None = File(default=None),
    confidence: float = Query(default=DEFAULT_CONFIDENCE, ge=0.0, le=1.0),
    iou: float = Query(default=DEFAULT_IOU, ge=0.0, le=1.0),
    imgsz: int = Query(default=DEFAULT_IMAGE_SIZE, ge=32, le=2048),
) -> dict[str, Any]:
    image_bytes = await file.read() if file is not None else await request.body()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image payload.")

    try:
        return await run_in_threadpool(run_inference, image_bytes, confidence, iou, imgsz)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.websocket("/ws/infer")
async def ws_infer(websocket: WebSocket) -> None:
    await websocket.accept()
    while True:
        try:
            message = await websocket.receive()
        except WebSocketDisconnect:
            break

        try:
            image_bytes, confidence, iou, image_size = parse_ws_message(message)
            result = await run_in_threadpool(
                run_inference,
                image_bytes,
                confidence,
                iou,
                image_size,
            )
            await websocket.send_json(result)
        except ValueError as exc:
            await websocket.send_json({"error": str(exc)})
        except RuntimeError as exc:
            await websocket.send_json({"error": str(exc)})
        except WebSocketDisconnect:
            break
