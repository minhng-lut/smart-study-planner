import express, { type NextFunction, type Request, type Response } from 'express';
import { ZodError } from 'zod';

import { env } from './config/env.js';
import { authRouter } from './routes/auth.js';

const app = express();

app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRouter);

app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  void next;
  if (err instanceof ZodError) {
    res.status(400).json({
      message: 'Invalid request payload',
      issues: err.flatten()
    });
    return;
  }

  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(env.PORT, () => {
  console.log(`backend listening on ${env.PORT}`);
});
