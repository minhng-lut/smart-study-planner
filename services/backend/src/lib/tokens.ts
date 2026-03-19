import { createHash, randomUUID } from 'node:crypto';

import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';
import type {
  AccessTokenPayload,
  AuthenticatedUser,
  RefreshTokenPayload
} from '../types/auth.js';

function ensureObjectPayload<T>(value: string | jwt.JwtPayload): T {
  if (typeof value === 'string') {
    throw new Error('Invalid token payload');
  }

  return value as T;
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function signAccessToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenType: 'access'
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_TTL as jwt.SignOptions['expiresIn'] }
  );
}

export function signRefreshToken(user: AuthenticatedUser): { token: string; jti: string } {
  const jti = randomUUID();

  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenType: 'refresh',
      jti
    },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_TTL as jwt.SignOptions['expiresIn'] }
  );

  return { token, jti };
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return ensureObjectPayload<AccessTokenPayload>(
    jwt.verify(token, env.JWT_ACCESS_SECRET)
  );
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return ensureObjectPayload<RefreshTokenPayload>(
    jwt.verify(token, env.JWT_REFRESH_SECRET)
  );
}

export function decodeRefreshTokenExpiry(token: string): Date {
  const payload = ensureObjectPayload<jwt.JwtPayload>(jwt.decode(token) ?? '');

  if (!payload.exp) {
    throw new Error('Refresh token missing expiry');
  }

  return new Date(payload.exp * 1000);
}
