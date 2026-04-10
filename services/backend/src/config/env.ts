import 'dotenv/config';
import fs from 'fs';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  PYTHON_SERVICE_URL: z.string().url().default('http://localhost:8000/analyze'),
  FRONTEND_ORIGIN: z.string().url().default('http://localhost:5173'),
  JWT_ACCESS_SECRET: z.string().min(32).optional(),
  JWT_REFRESH_SECRET: z.string().min(32).optional(),
  JWT_ACCESS_SECRET_FILE: z.string().min(1).optional(),
  JWT_REFRESH_SECRET_FILE: z.string().min(1).optional(),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d')
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error(`Invalid environment variables: ${parsedEnv.error.message}`);
}

function readSecretFile(path: string | undefined): string | undefined {
  if (!path) return undefined;
  return fs.readFileSync(path, 'utf8').trim();
}

const baseEnv = parsedEnv.data;

const jwtAccessSecret =
  baseEnv.JWT_ACCESS_SECRET ?? readSecretFile(baseEnv.JWT_ACCESS_SECRET_FILE);
const jwtRefreshSecret =
  baseEnv.JWT_REFRESH_SECRET ?? readSecretFile(baseEnv.JWT_REFRESH_SECRET_FILE);

if (
  baseEnv.NODE_ENV === 'production' &&
  (!jwtAccessSecret || !jwtRefreshSecret)
) {
  throw new Error(
    'Invalid environment variables: provide JWT_ACCESS_SECRET/JWT_REFRESH_SECRET or *_FILE variants in production'
  );
}

export const env = {
  ...baseEnv,
  JWT_ACCESS_SECRET:
    jwtAccessSecret ??
    'dev-only-placeholder-dev-only-placeholder-dev-only-placeholder-dev-only-placeholder',
  JWT_REFRESH_SECRET:
    jwtRefreshSecret ??
    'dev-only-placeholder-dev-only-placeholder-dev-only-placeholder-dev-only-placeholder'
};
