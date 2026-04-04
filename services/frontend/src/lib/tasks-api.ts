import { useAuthStore } from '@/stores/auth-store';

import { ApiError, refreshSession } from './auth-api';

export type Task = {
  id: number;
  courseId: number;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

type TaskResponse = {
  task: Task;
};

type CreateTaskPayload = {
  courseId: number;
  title: string;
  description?: string;
};

type ApiErrorPayload = {
  message?: string;
  issues?: unknown;
};

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return typeof value === 'object' && value !== null;
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

async function tasksApiRequest<T>(
  path: string,
  init: RequestInit = {},
  retryOnUnauthorized = true
): Promise<T> {
  const accessToken = useAuthStore.getState().accessToken;

  const response = await fetch(`/api${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    }
  });

  if (response.status === 401 && retryOnUnauthorized) {
    try {
      await refreshSession();

      return tasksApiRequest<T>(path, init, false);
    } catch {
      useAuthStore.getState().clearSession();
      throw new ApiError('Authentication required', 401);
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

export function createTask(payload: CreateTaskPayload) {
  return tasksApiRequest<TaskResponse>('/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export async function deleteTask(taskId: number) {
  await tasksApiRequest<null>(`/tasks/${taskId}`, {
    method: 'DELETE'
  });
}
