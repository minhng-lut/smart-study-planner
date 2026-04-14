import { useAuthStore } from '@/stores/auth-store';
import type {
  AdminAccessResponse,
  AuthResponse,
  Credentials,
  CurrentUserResponse
} from '@/types/auth';
import { getApiBaseUrl } from './runtime-config';

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  auth?: boolean;
  body?: unknown;
  retryOnUnauthorized?: boolean;
};

type ApiErrorPayload = {
  message?: string;
  issues?: unknown;
};

export class ApiError extends Error {
  status: number;
  issues?: unknown;

  constructor(message: string, status: number, issues?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.issues = issues;
  }
}

let refreshPromise: Promise<AuthResponse> | null = null;

const API_BASE = getApiBaseUrl();

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return typeof value === 'object' && value !== null;
}

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== 'undefined' && value instanceof FormData;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type');

  if (contentType?.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

function createHeaders(
  body: unknown,
  headers?: HeadersInit,
  accessToken?: string
) {
  const requestHeaders = new Headers(headers);

  if (
    body !== undefined &&
    !isFormData(body) &&
    !requestHeaders.has('Content-Type')
  ) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  if (accessToken) {
    requestHeaders.set('Authorization', `Bearer ${accessToken}`);
  }

  return requestHeaders;
}

async function refreshSession(): Promise<AuthResponse> {
  const refreshToken = useAuthStore.getState().refreshToken;

  if (!refreshToken) {
    throw new ApiError('Refresh token is not available', 401);
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });

      const payload = await parseResponseBody(response);

      if (!response.ok || !payload || typeof payload !== 'object') {
        const errorPayload = isApiErrorPayload(payload) ? payload : undefined;

        throw new ApiError(
          errorPayload?.message ?? 'Session refresh failed',
          response.status,
          errorPayload?.issues
        );
      }

      const session = payload as AuthResponse;
      useAuthStore.getState().setSession(session);

      return session;
    })()
      .catch((error) => {
        useAuthStore.getState().clearSession();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

async function apiRequest<T>(
  path: string,
  {
    auth = false,
    body,
    headers,
    retryOnUnauthorized = true,
    ...init
  }: ApiRequestOptions = {}
): Promise<T> {
  const accessToken = auth ? useAuthStore.getState().accessToken : null;
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: createHeaders(body, headers, accessToken ?? undefined),
    body:
      body === undefined
        ? undefined
        : isFormData(body)
          ? body
          : JSON.stringify(body)
  });

  if (response.status === 401 && auth && retryOnUnauthorized) {
    try {
      await refreshSession();

      return apiRequest<T>(path, {
        ...init,
        auth,
        body,
        headers,
        retryOnUnauthorized: false
      });
    } catch {
      useAuthStore.getState().clearSession();
    }
  }

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    const errorPayload = isApiErrorPayload(payload) ? payload : undefined;

    throw new ApiError(
      errorPayload?.message ?? 'Request failed',
      response.status,
      errorPayload?.issues
    );
  }

  return payload as T;
}

export function register(credentials: Credentials) {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: credentials
  });
}

export function login(credentials: Credentials) {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: credentials
  });
}

export async function logout() {
  const refreshToken = useAuthStore.getState().refreshToken;

  try {
    if (refreshToken) {
      await apiRequest('/auth/logout', {
        method: 'POST',
        body: { refreshToken },
        retryOnUnauthorized: false
      });
    }
  } finally {
    useAuthStore.getState().clearSession();
  }
}

export function getCurrentUser() {
  return apiRequest<CurrentUserResponse>('/auth/me', {
    auth: true
  });
}

export function getAdminAccess() {
  return apiRequest<AdminAccessResponse>('/auth/admin', {
    auth: true
  });
}

export { refreshSession };
