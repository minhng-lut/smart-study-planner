import express, {
  type NextFunction,
  type Request,
  type Response
} from 'express';
import swaggerUi from 'swagger-ui-express';
import { ZodError } from 'zod';

import { env } from './config/env.js';
import { openApiDocument } from './docs/openapi.js';
import { authRouter } from './routes/auth.js';
import { coursesRouter } from './routes/courses.js';
import { tasksRouter } from './routes/tasks.js';

const app = express();

app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;

  if (origin && origin === env.FRONTEND_ORIGIN) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
  }

  res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
});

app.use(express.json());

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.get('/api/docs.json', (_req: Request, res: Response) => {
  res.json(openApiDocument);
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.use('/api/auth', authRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/tasks', tasksRouter);

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
