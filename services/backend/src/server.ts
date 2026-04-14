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

if (env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    res.header(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With'
    );

    if (req.method === 'OPTIONS') {
      res.status(204).send();
      return;
    }

    next();
  });
}

app.use(express.json());

app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.get('/api/v1/docs.json', (_req: Request, res: Response) => {
  res.json(openApiDocument);
});

app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/courses', coursesRouter);
app.use('/api/v1/tasks', tasksRouter);

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
