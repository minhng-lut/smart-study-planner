import type { Prisma, TaskPriority, TaskStatus } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../lib/async-handler.js';
import { prisma } from '../lib/prisma.js';
import { authenticateAccessToken } from '../middleware/authenticate.js';

const router = Router();

const createTaskSchema = z.object({
  courseId: z.coerce.number().int().positive(),
  title: z.string().trim().min(1).max(150),
  description: z.string().trim().max(10_000).optional(),
  deadline: z.preprocess(
    (v) => (v ? new Date(v as string) : undefined),
    z.date().optional()
  ),
  completedAt: z.preprocess(
    (v) => (v ? new Date(v as string) : undefined),
    z.date().optional()
  ),
  estimatedHours: z
    .preprocess(
      (v) => (v === undefined || v === null ? undefined : Number(v)),
      z.number().nonnegative()
    )
    .optional(),
  actualHours: z
    .preprocess(
      (v) => (v === undefined || v === null ? undefined : Number(v)),
      z.number().nonnegative()
    )
    .optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'overdue']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional()
});

const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(150).optional(),
    description: z.string().trim().max(10_000).optional(),
    deadline: z.preprocess(
      (v) => (v ? new Date(v as string) : undefined),
      z.date().optional()
    ),
    completedAt: z.preprocess(
      (v) => (v ? new Date(v as string) : undefined),
      z.date().optional()
    ),
    estimatedHours: z
      .preprocess(
        (v) => (v === undefined || v === null ? undefined : Number(v)),
        z.number().nonnegative()
      )
      .optional(),
    actualHours: z
      .preprocess(
        (v) => (v === undefined || v === null ? undefined : Number(v)),
        z.number().nonnegative()
      )
      .optional(),
    status: z
      .enum(['pending', 'in_progress', 'completed', 'overdue'])
      .optional(),
    priority: z.enum(['low', 'medium', 'high']).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided'
  });

const taskRouteParamsSchema = z.object({
  taskId: z.coerce.number().int().positive()
});

router.use(authenticateAccessToken);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const {
      courseId,
      title,
      description,
      deadline,
      estimatedHours,
      actualHours,
      status,
      priority,
      completedAt
    } = createTaskSchema.parse(req.body);
    const userId = req.auth!.id;

    const course = await prisma.course.findMany({
      where: { id: courseId, userId },
      select: { id: true }
    });

    if (course.length === 0) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    const createData: Prisma.TaskCreateInput = {
      course: { connect: { id: courseId } },
      title,
      description,
      deadline: deadline ?? undefined,
      estimatedHours: estimatedHours ?? 0,
      actualHours: actualHours ?? 0,
      completedAt: completedAt ?? undefined
    };

    if (status !== undefined) {
      // map lowercase zod enum values to Prisma enum values (UPPERCASE)
      createData.status = (status as string).toUpperCase() as TaskStatus;
    }

    if (priority !== undefined) {
      createData.priority = (priority as string).toUpperCase() as TaskPriority;
    }

    const task = await prisma.task.create({ data: createData });

    res.status(201).json({ task });
  })
);

router.patch(
  '/:taskId',
  asyncHandler(async (req, res) => {
    const { taskId } = taskRouteParamsSchema.parse(req.params);
    const updates = updateTaskSchema.parse(req.body);
    const userId = req.auth!.id;

    const existingTask = await prisma.task.findMany({
      where: {
        id: taskId,
        course: {
          userId
        }
      },
      select: { id: true }
    });

    if (existingTask.length === 0) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.deadline !== undefined) updateData.deadline = updates.deadline;
    if (updates.completedAt !== undefined)
      updateData.completedAt = updates.completedAt;
    if (updates.estimatedHours !== undefined)
      updateData.estimatedHours = updates.estimatedHours;
    if (updates.actualHours !== undefined)
      updateData.actualHours = updates.actualHours;
    if (updates.status !== undefined)
      updateData.status = (
        updates.status as string
      ).toUpperCase() as TaskStatus;
    if (updates.priority !== undefined)
      updateData.priority = (
        updates.priority as string
      ).toUpperCase() as TaskPriority;

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData
    });

    res.json({ task });
  })
);

router.delete(
  '/:taskId',
  asyncHandler(async (req, res) => {
    const { taskId } = taskRouteParamsSchema.parse(req.params);
    const userId = req.auth!.id;

    const deletion = await prisma.task.delete({
      where: {
        id: taskId,
        course: {
          userId
        }
      }
    });
    res.status(204).send();
  })
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = req.auth!.id;
    const courseIdRaw = req.query.courseId as string | undefined;
    const courseId = courseIdRaw ? Number(courseIdRaw) : undefined;

    const whereClause = courseId
      ? { courseId, course: { userId } }
      : { course: { userId } };

    const tasks = await prisma.task.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' }
    });

    res.json({ tasks });
  })
);

router.get(
  '/:taskId',
  asyncHandler(async (req, res) => {
    const { taskId } = taskRouteParamsSchema.parse(req.params);
    const userId = req.auth!.id;

    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
        course: {
          userId
        }
      }
    });

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    res.json({ task: task });
  })
);

export { router as tasksRouter };
