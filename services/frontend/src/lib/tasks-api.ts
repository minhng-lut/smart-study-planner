import { useAuthStore } from '@/stores/auth-store';

import { ApiError, refreshSession } from './auth-api';

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatusInput =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'overdue';
export type TaskPriorityInput = 'low' | 'medium' | 'high';

export type Task = {
  id: number;
  courseId: number;
  title: string;
  description: string | null;
  deadline: string | null;
  estimatedHours: string;
  actualHours: string;
  status: TaskStatus;
  priority: TaskPriority | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type TaskResponse = {
  task: Task;
};

export type CreateTaskPayload = {
  courseId: number;
  title: string;
  description?: string;
  deadline: string;
  estimatedHours: string | number;
  actualHours?: string | number;
  status?: TaskStatusInput;
  priority?: TaskPriorityInput;
  completedAt?: string;
};

export type UpdateTaskPayload = {
  title?: string;
  description?: string | null;
  deadline?: string | null;
  estimatedHours?: string | number;
  actualHours?: string | number;
  status?: TaskStatusInput;
  priority?: TaskPriorityInput | null;
  completedAt?: string | null;
};

type ApiErrorPayload = {
  message?: string;
  issues?: unknown;
};

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return typeof value === 'object' && value !== null;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(
  /\/$/,
  ''
);

function buildApiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
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
  const response = await fetch(buildApiUrl(path), {
    ...init,
    credentials: 'include',
    headers: init.headers
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

export function updateTask(taskId: number, payload: UpdateTaskPayload) {
  return tasksApiRequest<TaskResponse>(`/tasks/${taskId}`, {
    method: 'PATCH',
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
