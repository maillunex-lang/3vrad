import { API_BASE_URL } from '../config';

export type VersionResponse = {
  service: string;
  version: string;
  env: string;
  started_at: string;
  uptime_sec: number;
};

export async function fetchApiVersion(signal?: AbortSignal): Promise<VersionResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/version`, { signal });
  if (!res.ok) {
    throw new Error(`API version failed: ${res.status}`);
  }
  return (await res.json()) as VersionResponse;
}

export async function fetchHealth(signal?: AbortSignal): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE_URL}/healthz`, { signal });
  if (!res.ok) {
    throw new Error(`healthz failed: ${res.status}`);
  }
  return (await res.json()) as { status: string };
}
