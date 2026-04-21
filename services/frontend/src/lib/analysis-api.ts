import { useAuthStore } from '@/stores/auth-store';

import { ApiError, refreshSession } from './auth-api';

export type RiskLevel = 'none' | 'low' | 'medium' | 'high';

export type TaskPriorityAnalysis = {
  taskId: number;
  title: string;
  courseId: number | null;
  deadline: string | null;
  status: string;
  remainingHours: number;
  daysLeft: number | null;
  priorityScore: number;
};

export type TaskRiskAnalysis = {
  taskId: number;
  title: string;
  courseId: number | null;
  deadline: string | null;
  status: string;
  remainingHours: number;
  daysLeft: number | null;
  riskLevel: RiskLevel;
};

export type OverdueTaskAnalysis = {
  taskId: number;
  title: string;
  courseId: number | null;
  deadline: string | null;
  status: string;
  remainingHours: number;
  daysOverdue: number;
};

export type WorkloadSummary = {
  totalRemainingHours: number;
  planningDays: number;
  recommendedHoursPerDay: number;
  workloadScore: number;
};

export type StudyDistributionItem = {
  day: number;
  date: string;
  taskId: number;
  hours: number;
};

export type AnalysisResult = {
  id: number;
  userId: number;
  generatedAt: string;
  workloadScore: number;
  riskLevel: RiskLevel;
  recommendedHoursPerDay: number;
  taskPriorities: TaskPriorityAnalysis[];
  taskRiskLevels: TaskRiskAnalysis[];
  overdueTasks: OverdueTaskAnalysis[];
  workloadSummary: WorkloadSummary;
  recommendedStudyDistribution: StudyDistributionItem[];
};

type ListAnalysesResponse = {
  analyses: AnalysisResult[];
};

type AnalysisResponse = {
  analysis: AnalysisResult;
};

export type CreateAnalysisPayload = {
  courseId?: number;
  currentDate?: string;
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

async function analysisApiRequest<T>(
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

      return analysisApiRequest<T>(path, init, false);
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

export function listAnalyses() {
  return analysisApiRequest<ListAnalysesResponse>('/analysis');
}

export function createAnalysis(payload: CreateAnalysisPayload = {}) {
  return analysisApiRequest<AnalysisResponse>('/analysis', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function getAnalysis(analysisId: number) {
  return analysisApiRequest<AnalysisResponse>(`/analysis/${analysisId}`);
}
