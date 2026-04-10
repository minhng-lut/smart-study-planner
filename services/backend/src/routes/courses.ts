import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../lib/async-handler.js';
import { prisma } from '../lib/prisma.js';
import { authenticateAccessToken } from '../middleware/authenticate.js';

const router = Router();

const createCourseSchema = z.object({
  name: z.string().trim().min(1).max(100),
  color: z.string().trim().min(1).max(20).optional(),
  code: z.string().trim().max(30).optional(),
  description: z.string().trim().max(10_000).optional()
});

const updateCourseSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    color: z.string().trim().min(1).max(20).optional(),
    code: z.string().trim().max(30).optional(),
    description: z.string().trim().max(10_000).optional()
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.color !== undefined ||
      value.code !== undefined ||
      value.description !== undefined,
    {
      message: 'At least one field must be provided'
    }
  );

const routeParamsSchema = z.object({
  courseId: z.coerce.number().int().positive()
});

router.use(authenticateAccessToken);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, color, code, description } = createCourseSchema.parse(
      req.body
    );
    const userId = req.auth!.id;

    const course = await prisma.course.create({
      data: {
        userId,
        name,
        color,
        code,
        description
      }
    });

    res.status(201).json({ course: { ...course, tasks: [] } });
  })
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = req.auth!.id;

    const courses = await prisma.course.findMany({
      where: { userId },
      include: {
        tasks: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ courses });
  })
);

router.patch(
  '/:courseId',
  asyncHandler(async (req, res) => {
    const { courseId } = routeParamsSchema.parse(req.params);
    const updates = updateCourseSchema.parse(req.body);
    const userId = req.auth!.id;

    const existingCourse = await prisma.course.findMany({
      where: {
        id: courseId,
        userId
      },
      select: { id: true }
    });

    if (existingCourse.length === 0) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    const course = await prisma.course.update({
      where: {
        id: courseId
      },
      data: {
        ...(updates.name !== undefined ? { name: updates.name } : {}),
        ...(updates.color !== undefined ? { color: updates.color } : {}),
        ...(updates.code !== undefined ? { code: updates.code } : {}),
        ...(updates.description !== undefined
          ? { description: updates.description }
          : {})
      },
      include: {
        tasks: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    res.json({ course });
  })
);

router.delete(
  '/:courseId',
  asyncHandler(async (req, res) => {
    const { courseId } = routeParamsSchema.parse(req.params);
    const userId = req.auth!.id;

    const existing = await prisma.course.findMany({
      where: {
        id: courseId,
        userId
      },
      select: { id: true }
    });

    if (existing.length === 0) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    await prisma.course.delete({
      where: { id: courseId }
    });

    res.status(204).send();
  })
);

export { router as coursesRouter };
