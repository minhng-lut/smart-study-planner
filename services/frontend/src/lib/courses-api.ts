import { useAuthStore } from '@/stores/auth-store';

import { ApiError, refreshSession } from './auth-api';

export type CourseTask = {
  id: number;
  courseId: number;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Course = {
  id: number;
  userId: number;
  name: string;
  code: string | null;
  description: string | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
  tasks: CourseTask[];
};

type ListCoursesResponse = {
  courses: Course[];
};

type CourseResponse = {
  course: Course;
};

type CreateCoursePayload = {
  name: string;
  color?: string;
  code?: string;
  description?: string;
};

type UpdateCoursePayload = {
  name?: string;
  color?: string;
  code?: string;
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

async function coursesApiRequest<T>(
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

      return coursesApiRequest<T>(path, init, false);
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

export function listCourses() {
  return coursesApiRequest<ListCoursesResponse>('/courses');
}

export function createCourse(payload: CreateCoursePayload) {
  return coursesApiRequest<CourseResponse>('/courses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function updateCourse(courseId: number, payload: UpdateCoursePayload) {
  return coursesApiRequest<CourseResponse>(`/courses/${courseId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export async function deleteCourse(courseId: number) {
  await coursesApiRequest<null>(`/courses/${courseId}`, {
    method: 'DELETE'
  });
}
