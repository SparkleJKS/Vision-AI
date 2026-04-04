from __future__ import annotations

import time
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from ..core.config import get_settings
from ..schemas.inference import DetectResponse, DescribeResponse, HealthResponse
from ..services.inference import InferenceService

router = APIRouter()
service = InferenceService()


def validate_upload_type(file: UploadFile) -> None:
    # Some mobile clients omit file content type or send application/octet-stream.
    if not file.content_type:
        return

    normalized = file.content_type.lower()
    if normalized.startswith("image/") or normalized == "application/octet-stream":
        return

    raise HTTPException(status_code=415, detail="Only image uploads are supported.")


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(
        status="ok",
        service=settings.app_name,
        version="0.1.0",
        time=datetime.now(timezone.utc).isoformat(),
    )


@router.post("/v1/describe", response_model=DescribeResponse)
async def describe_image(
    file: UploadFile = File(...),
    device_id: str | None = Form(default=None),
) -> DescribeResponse:
    validate_upload_type(file)

    start = time.perf_counter()
    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded image is empty.")

    description, confidence = service.describe(image_bytes)
    elapsed_ms = int((time.perf_counter() - start) * 1000)

    settings = get_settings()
    return DescribeResponse(
        request_id=str(uuid4()),
        description=description,
        confidence=confidence,
        model_version=settings.model_version,
        processing_ms=elapsed_ms,
    )


@router.post("/v1/detect", response_model=DetectResponse)
async def detect_objects(
    file: UploadFile = File(...),
    device_id: str | None = Form(default=None),
) -> DetectResponse:
    validate_upload_type(file)

    start = time.perf_counter()
    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded image is empty.")

    objects = service.detect(image_bytes)
    elapsed_ms = int((time.perf_counter() - start) * 1000)

    settings = get_settings()
    return DetectResponse(
        request_id=str(uuid4()),
        objects=objects,
        model_version=settings.model_version,
        processing_ms=elapsed_ms,
    )
