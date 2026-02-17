import { API_BASE_URL } from '@/configs/rest/api';
import { logApi } from '@/utils/logger';

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

const parseErrorDetail = (payload: unknown): string | null => {
  if (typeof payload === 'object' && payload !== null && 'detail' in payload) {
    const detail = (payload as { detail: unknown }).detail;
    if (typeof detail === 'string') {
      return detail;
    }
  }
  return null;
}

const detectObjects = async (imageUri: string): Promise<DetectResponse> => {
  const endpoint = `${API_BASE_URL}/v1/detect`;
  logApi('request', endpoint, { method: 'POST', imageUri: imageUri.slice(0, 50) + '...' });

  const formData = new FormData();
  formData.append(
    'file',
    {
      uri: imageUri,
      name: `frame-${Date.now()}.jpg`,
      type: 'image/jpeg',
    } as any,
  );

  const startTime = Date.now();
  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  const payload = await response.json().catch(() => null);
  const duration = Date.now() - startTime;

  if (!response.ok) {
    const detail = parseErrorDetail(payload);
    logApi('error', endpoint, { status: response.status, detail, duration });
    throw new Error(detail ?? `Detection failed with status ${response.status}.`);
  }

  logApi('response', endpoint, {
    status: response.status,
    duration,
    objectCount: (payload as DetectResponse)?.objects?.length ?? 0,
  });
  return payload as DetectResponse;
}

export { detectObjects };
