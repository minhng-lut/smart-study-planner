import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../lib/async-handler.js';
import { prisma } from '../lib/prisma.js';
import { authenticateAccessToken } from '../middleware/authenticate.js';

const router = Router();

const createTaskSchema = z.object({
  courseId: z.coerce.number().int().positive(),
  title: z.string().trim().min(1).max(150),
  description: z.string().trim().max(10_000).optional()
});

const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(150).optional(),
    description: z.string().trim().max(10_000).optional()
  })
  .refine(
    (value) => value.title !== undefined || value.description !== undefined,
    {
      message: 'At least one field must be provided'
    }
  );

const taskRouteParamsSchema = z.object({
  taskId: z.coerce.number().int().positive()
});

router.use(authenticateAccessToken);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { courseId, title, description } = createTaskSchema.parse(req.body);
    const userId = req.auth!.id;

    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        userId
      },
      select: {
        id: true
      }
    });

    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    const task = await prisma.task.create({
      data: {
        courseId,
        title,
        description
      }
    });

    res.status(201).json({ task });
  })
);

router.patch(
  '/:taskId',
  asyncHandler(async (req, res) => {
    const { taskId } = taskRouteParamsSchema.parse(req.params);
    const updates = updateTaskSchema.parse(req.body);
    const userId = req.auth!.id;

    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        course: {
          userId
        }
      },
      select: {
        id: true
      }
    });

    if (!existingTask) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const task = await prisma.task.update({
      where: {
        id: taskId
      },
      data: {
        ...(updates.title !== undefined ? { title: updates.title } : {}),
        ...(updates.description !== undefined
          ? { description: updates.description }
          : {})
      }
    });

    res.json({ task });
  })
);

router.delete(
  '/:taskId',
  asyncHandler(async (req, res) => {
    const { taskId } = taskRouteParamsSchema.parse(req.params);
    const userId = req.auth!.id;

    const deletion = await prisma.task.deleteMany({
      where: {
        id: taskId,
        course: {
          userId
        }
      }
    });

    if (deletion.count === 0) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    res.status(204).send();
  })
);

export { router as tasksRouter };