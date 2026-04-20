import type { Prisma, RiskLevel, TaskStatus } from '@prisma/client';
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';

import { env } from '../config/env.js';
import { asyncHandler } from '../lib/async-handler.js';
import { prisma } from '../lib/prisma.js';
import { authenticateAccessToken } from '../middleware/authenticate.js';

const router = Router();

const analysisRequestSchema = z.object({
  courseId: z.coerce.number().int().positive().optional(),
  currentDate: z.string().datetime({ offset: true }).optional()
});

const pythonTaskPrioritySchema = z.object({
  task_id: z.number().int().positive(),
  title: z.string(),
  course_id: z.number().int().positive().nullable().optional(),
  deadline: z.string().datetime({ offset: true }).nullable().optional(),
  status: z.string(),
  remaining_hours: z.number().nonnegative(),
  days_left: z.number().int().nullable(),
  priority_score: z.number().nonnegative()
});

const pythonTaskRiskSchema = z.object({
  task_id: z.number().int().positive(),
  title: z.string(),
  course_id: z.number().int().positive().nullable().optional(),
  deadline: z.string().datetime({ offset: true }).nullable().optional(),
  status: z.string(),
  remaining_hours: z.number().nonnegative(),
  days_left: z.number().int().nullable(),
  risk_level: z.enum(['none', 'low', 'medium', 'high'])
});

const pythonWorkloadSummarySchema = z.object({
  total_remaining_hours: z.number().nonnegative(),
  planning_days: z.number().int().nonnegative(),
  recommended_hours_per_day: z.number().nonnegative(),
  workload_score: z.number().nonnegative()
});

const pythonStudyDistributionItemSchema = z.object({
  day: z.number().int().positive(),
  date: z.string(),
  task_id: z.number().int().positive(),
  hours: z.number().positive()
});

const pythonAnalysisSchema = z.object({
  generated_at: z.string().datetime({ offset: true }),
  overall_risk_level: z.enum(['none', 'low', 'medium', 'high']),
  workload_score: z.number().nonnegative(),
  recommended_hours_per_day: z.number().nonnegative(),
  task_priorities: z.array(pythonTaskPrioritySchema),
  task_risk_levels: z.array(pythonTaskRiskSchema),
  workload_summary: pythonWorkloadSummarySchema,
  recommended_study_distribution: z.array(pythonStudyDistributionItemSchema)
});

type AnalysisSummaryJson = {
  taskPriorities?: unknown;
  taskRiskLevels?: unknown;
  workloadSummary?: unknown;
  recommendedStudyDistribution?: unknown;
};

function mapPrismaRiskLevel(value: string): RiskLevel {
  const riskMap: Record<string, RiskLevel> = {
    none: 'NONE',
    low: 'LOW',
    medium: 'MEDIUM',
    high: 'HIGH'
  };

  return riskMap[value] ?? 'NONE';
}

function formatTaskStatus(status: TaskStatus) {
  return String(status).toLowerCase();
}

function formatDecimal(value: Prisma.Decimal | number | null | undefined) {
  if (value === null || value === undefined) {
    return undefined;
  }

  return Number(String(value));
}

function serializeAnalysisResult(result: {
  id: number;
  userId: number;
  generatedAt: Date;
  workloadScore: Prisma.Decimal | number | null | undefined;
  riskLevel: RiskLevel | string | null | undefined;
  recommendedHoursPerDay: Prisma.Decimal | number | null | undefined;
  summaryJson: Prisma.JsonValue | null | undefined;
}) {
  const summary =
    result.summaryJson && typeof result.summaryJson === 'object'
      ? (result.summaryJson as AnalysisSummaryJson)
      : undefined;

  return {
    id: result.id,
    userId: result.userId,
    generatedAt: result.generatedAt,
    workloadScore: formatDecimal(result.workloadScore) ?? 0,
    riskLevel: result.riskLevel
      ? String(result.riskLevel).toLowerCase()
      : 'none',
    recommendedHoursPerDay: formatDecimal(result.recommendedHoursPerDay) ?? 0,
    taskPriorities: Array.isArray(summary?.taskPriorities)
      ? summary.taskPriorities
      : [],
    taskRiskLevels: Array.isArray(summary?.taskRiskLevels)
      ? summary.taskRiskLevels
      : [],
    workloadSummary:
      summary?.workloadSummary && typeof summary.workloadSummary === 'object'
        ? summary.workloadSummary
        : {
            totalRemainingHours: formatDecimal(result.workloadScore) ?? 0,
            planningDays: 0,
            recommendedHoursPerDay:
              formatDecimal(result.recommendedHoursPerDay) ?? 0,
            workloadScore: formatDecimal(result.workloadScore) ?? 0
          },
    recommendedStudyDistribution: Array.isArray(
      summary?.recommendedStudyDistribution
    )
      ? summary.recommendedStudyDistribution
      : []
  };
}

router.use(authenticateAccessToken);

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth!.id;

    const results = await prisma.analyticsResult.findMany({
      where: { userId },
      orderBy: { generatedAt: 'desc' }
    });

    res.json({
      analyses: results.map((result) => serializeAnalysisResult(result))
    });
  })
);

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth!.id;
    const { courseId, currentDate } = analysisRequestSchema.parse(
      req.body ?? {}
    );

    const tasks = await prisma.task.findMany({
      where: {
        course: {
          userId
        },
        ...(courseId !== undefined ? { courseId } : {})
      },
      orderBy: [{ deadline: 'asc' }, { createdAt: 'asc' }]
    });

    const pythonResponse = await fetch(env.PYTHON_SERVICE_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        tasks: tasks.map((task) => ({
          id: task.id,
          title: task.title,
          deadline: task.deadline?.toISOString(),
          estimated_hours: Number(String(task.estimatedHours)),
          actual_hours: Number(String(task.actualHours)),
          status: formatTaskStatus(task.status),
          course_id: task.courseId
        })),
        ...(currentDate ? { current_datetime: currentDate } : {})
      })
    });

    if (!pythonResponse.ok) {
      const text = await pythonResponse.text();
      res.status(502).json({
        message: 'Analysis service error',
        details: text
      });
      return;
    }

    const analysis = pythonAnalysisSchema.parse(await pythonResponse.json());

    const summaryJson: Prisma.JsonObject = {
      taskPriorities: analysis.task_priorities.map((item) => ({
        taskId: item.task_id,
        title: item.title,
        courseId: item.course_id ?? null,
        deadline: item.deadline ?? null,
        status: item.status,
        remainingHours: item.remaining_hours,
        daysLeft: item.days_left,
        priorityScore: item.priority_score
      })),
      taskRiskLevels: analysis.task_risk_levels.map((item) => ({
        taskId: item.task_id,
        title: item.title,
        courseId: item.course_id ?? null,
        deadline: item.deadline ?? null,
        status: item.status,
        remainingHours: item.remaining_hours,
        daysLeft: item.days_left,
        riskLevel: item.risk_level
      })),
      workloadSummary: {
        totalRemainingHours: analysis.workload_summary.total_remaining_hours,
        planningDays: analysis.workload_summary.planning_days,
        recommendedHoursPerDay:
          analysis.workload_summary.recommended_hours_per_day,
        workloadScore: analysis.workload_summary.workload_score
      },
      recommendedStudyDistribution: analysis.recommended_study_distribution.map(
        (item) => ({
          day: item.day,
          date: item.date,
          taskId: item.task_id,
          hours: item.hours
        })
      )
    };

    const created = await prisma.analyticsResult.create({
      data: {
        userId,
        generatedAt: new Date(analysis.generated_at),
        workloadScore: analysis.workload_score,
        riskLevel: mapPrismaRiskLevel(analysis.overall_risk_level),
        recommendedHoursPerDay: analysis.recommended_hours_per_day,
        summaryJson
      }
    });

    res.status(201).json({
      analysis: serializeAnalysisResult({
        id: created.id,
        userId,
        generatedAt: new Date(analysis.generated_at),
        workloadScore: analysis.workload_score,
        riskLevel: analysis.overall_risk_level,
        recommendedHoursPerDay: analysis.recommended_hours_per_day,
        summaryJson
      })
    });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth!.id;
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ message: 'Invalid analysis id' });
      return;
    }

    const result = await prisma.analyticsResult.findUnique({ where: { id } });

    if (!result || result.userId !== userId) {
      res.status(404).json({ message: 'Analysis not found' });
      return;
    }

    res.json({ analysis: serializeAnalysisResult(result) });
  })
);

export { router as analysisRouter };
