from typing import List

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    time: str


class DescribeResponse(BaseModel):
    request_id: str
    description: str
    confidence: float = Field(ge=0.0, le=1.0)
    model_version: str
    processing_ms: int


class DetectedObject(BaseModel):
    label: str
    confidence: float = Field(ge=0.0, le=1.0)
    box: List[float] = Field(min_length=4, max_length=4)


class DetectResponse(BaseModel):
    request_id: str
    objects: List[DetectedObject]
    model_version: str
    processing_ms: int
