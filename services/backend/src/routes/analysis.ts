import type { Request, Response } from 'express';
import { Router } from 'express';

import { asyncHandler } from '../lib/async-handler.js';
import { prisma } from '../lib/prisma.js';
import { authenticateAccessToken } from '../middleware/authenticate.js';

const router = Router();

// All analysis endpoints require an authenticated user
router.use(authenticateAccessToken);

// GET / - this returns saved analysis results for the authenticated user
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth!.id;

    const results = await prisma.analyticsResult.findMany({
      where: { userId },
      orderBy: { generatedAt: 'desc' }
    });

    const analyses = results.map((r) => ({
      id: r.id,
      userId: r.userId,
      generatedAt: r.generatedAt,
      workloadScore:
        r.workloadScore !== null && r.workloadScore !== undefined
          ? Number((r.workloadScore as any).toString())
          : undefined,
      riskLevel: r.riskLevel ? String(r.riskLevel).toLowerCase() : undefined,
      recommendedHoursPerDay:
        r.recommendedHoursPerDay !== null && r.recommendedHoursPerDay !== undefined
          ? Number((r.recommendedHoursPerDay as any).toString())
          : undefined,
      summaryJson: r.summaryJson ?? undefined
    }));

    res.json({ analyses });
  })
);

// POST / - this forwards the analysis request to the python-service and persists the result
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth!.id;

    // we can forward the request body to the python analysis service.
    // we can also adjust the target URL if your python service runs on a different host/port.
    const pythonUrl = process.env.PYTHON_SERVICE_URL ?? 'http://localhost:8000/analyze';

    const response = await fetch(pythonUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId, ...(req.body ?? {}) })
    });

    if (!response.ok) {
      const text = await response.text();
      res.status(502).json({ message: 'Analysis service error', details: text });
      return;
    }

    const analysis = await response.json();

    // i mapped python-service risk values (lowercase) to Prisma enum keys (NONE/LOW/MEDIUM/HIGH)
    const rawRisk = typeof analysis.riskLevel === 'string' ? analysis.riskLevel.trim() : undefined;
    const normalizedRisk = rawRisk ? rawRisk.toLowerCase() : undefined;
    const riskMap: Record<string, string> = {
      none: 'NONE',
      low: 'LOW',
      medium: 'MEDIUM',
      high: 'HIGH'
    };
    const prismaRisk = normalizedRisk && riskMap[normalizedRisk] ? riskMap[normalizedRisk] : undefined;

    const created = await prisma.analyticsResult.create({
      data: {
        userId,
        generatedAt: analysis.generatedAt ? new Date(analysis.generatedAt) : undefined,
        workloadScore: analysis.workloadScore ?? undefined,
        riskLevel: prismaRisk ?? undefined,
        recommendedHoursPerDay: analysis.recommendedHoursPerDay ?? undefined,
        summaryJson: analysis.summaryJson ?? undefined
      }
    });

    res.status(201).json({ analysis: { ...analysis, id: created.id } });
      })
    );

    // GET /:id - return a single analysis result for the authenticated user
    // we have this so that the clients fetch one analysis directly and avoids fetchiing a large list or getting extra data
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

        const analysis = {
          id: result.id,
          userId: result.userId,
          generatedAt: result.generatedAt,
          workloadScore:
            result.workloadScore !== null && result.workloadScore !== undefined
              ? Number((result.workloadScore as any).toString())
              : undefined,
          riskLevel: result.riskLevel ? String(result.riskLevel).toLowerCase() : undefined,
          recommendedHoursPerDay:
            result.recommendedHoursPerDay !== null && result.recommendedHoursPerDay !== undefined
              ? Number((result.recommendedHoursPerDay as any).toString())
              : undefined,
          summaryJson: result.summaryJson ?? undefined
        };

        res.json({ analysis });
      })
    );

    export { router as analysisRouter };
