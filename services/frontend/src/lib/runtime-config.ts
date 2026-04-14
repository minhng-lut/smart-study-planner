declare global {
  interface Window {
    __ENV?: {
      API_BASE_URL?: string;
    };
  }
}

export function getApiBaseUrl(): string {
  const runtime = window.__ENV?.API_BASE_URL;
  if (runtime && runtime.trim()) return runtime.trim().replace(/\/+$/, '');

  const buildTime = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (buildTime && buildTime.trim())
    return buildTime.trim().replace(/\/+$/, '');

  return '/api/v1';
}

