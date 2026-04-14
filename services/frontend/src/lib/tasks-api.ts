import { useAuthStore } from '@/stores/auth-store';

import { ApiError, refreshSession } from './auth-api';
import { getApiBaseUrl } from './runtime-config';

const API_BASE = getApiBaseUrl();

export type Task = {
  id: number;
  courseId: number;
  title: string;
  description: string | null;
  deadline: string | null;
  estimatedHours: string;
  actualHours: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ListTasksResponse = {
  tasks: Task[];
};

type TaskResponse = {
  task: Task;
};

type UpdateTaskPayload = {
  title?: string;
  description?: string;
  deadline?: string;
  completedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  status?: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority?: 'low' | 'medium' | 'high';
};

type CreateTaskPayload = {
  courseId: number;
  title: string;
  description?: string;
  deadline?: string;
  estimatedHours?: number;
  priority?: 'low' | 'medium' | 'high';
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

  const response = await fetch(`${API_BASE}${path}`, {
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

export function listTasks(courseId?: number) {
  const query = courseId ? `?courseId=${encodeURIComponent(courseId)}` : '';
  return tasksApiRequest<ListTasksResponse>(`/tasks${query}`);
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
