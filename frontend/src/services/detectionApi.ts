import { API_BASE_URL } from '../config/api';

export interface DetectedObject {
  label: string;
  confidence: number;
  box: number[];
}

export interface DetectResponse {
  request_id: string;
  objects: DetectedObject[];
  model_version: string;
  processing_ms: number;
}

function parseErrorDetail(payload: unknown): string | null {
  if (typeof payload === 'object' && payload !== null && 'detail' in payload) {
    const detail = (payload as { detail: unknown }).detail;
    if (typeof detail === 'string') {
      return detail;
    }
  }
  return null;
}

export async function detectObjects(imageUri: string): Promise<DetectResponse> {
  const formData = new FormData();
  formData.append(
    'file',
    {
      uri: imageUri,
      name: `frame-${Date.now()}.jpg`,
      type: 'image/jpeg',
    } as any,
  );

  const response = await fetch(`${API_BASE_URL}/v1/detect`, {
    method: 'POST',
    body: formData,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = parseErrorDetail(payload);
    throw new Error(detail ?? `Detection failed with status ${response.status}.`);
  }

  return payload as DetectResponse;
}
