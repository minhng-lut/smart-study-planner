import { Role, type User } from '@prisma/client';
import { Router, type Response } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../lib/async-handler.js';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  getCookie
} from '../lib/cookies.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import {
  decodeRefreshTokenExpiry,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from '../lib/tokens.js';
import { authenticateAccessToken } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/authorize.js';
import { prisma } from '../lib/prisma.js';
import { toAuthRole, type AuthenticatedUser } from '../types/auth.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const registerSchema = loginSchema.extend({
  fullName: z.string().trim().min(1).max(100).optional()
});

function deriveFullName(email: string): string {
  const localPart = email.split('@')[0] ?? 'Study Planner User';

  return (
    localPart
      .replace(/[._-]+/g, ' ')
      .trim()
      .replace(/\b\w/g, (character) => character.toUpperCase()) ||
    'Study Planner User'
  );
}

function serializeUser(user: Pick<User, 'id' | 'fullName' | 'email' | 'role'>) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: toAuthRole(user.role)
  };
}

function getCookieMaxAge(token: string) {
  return Math.max(decodeRefreshTokenExpiry(token).getTime() - Date.now(), 0);
}

function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string
) {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/'
  };

  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, cookieOptions);
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...cookieOptions,
    maxAge: getCookieMaxAge(refreshToken)
  });
}

function clearAuthCookies(res: Response) {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/'
  };

  res.clearCookie(ACCESS_TOKEN_COOKIE, cookieOptions);
  res.clearCookie(REFRESH_TOKEN_COOKIE, cookieOptions);
}

async function issueTokenPair(
  user: Pick<User, 'id' | 'fullName' | 'email' | 'role'>
) {
  const authUser: AuthenticatedUser = {
    id: user.id,
    email: user.email,
    role: toAuthRole(user.role)
  };

  const accessToken = signAccessToken(authUser);
  const { token: refreshToken } = signRefreshToken(authUser);

  const refreshTokenRecord = await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: decodeRefreshTokenExpiry(refreshToken)
    }
  });

  return { accessToken, refreshToken, refreshTokenRecord };
}

function sendAuthResponse(
  res: Response,
  user: Pick<User, 'id' | 'fullName' | 'email' | 'role'>,
  accessToken: string,
  refreshToken: string,
  statusCode = 200
) {
  setAuthCookies(res, accessToken, refreshToken);

  res.status(statusCode).json({
    user: serializeUser(user)
  });
}

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { fullName, email, password } = registerSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      res.status(409).json({ message: 'User already exists' });
      return;
    }

    const user = await prisma.user.create({
      data: {
        fullName: fullName?.trim() || deriveFullName(normalizedEmail),
        email: normalizedEmail,
        passwordHash: await hashPassword(password),
        role: Role.STUDENT
      }
    });

    const { accessToken, refreshToken } = await issueTokenPair(user);

    sendAuthResponse(res, user, accessToken, refreshToken, 201);
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const { accessToken, refreshToken } = await issueTokenPair(user);

    sendAuthResponse(res, user, accessToken, refreshToken);
  })
);

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const refreshToken = getCookie(req, REFRESH_TOKEN_COOKIE);

    if (!refreshToken) {
      res.status(401).json({ message: 'Refresh token is not available' });
      return;
    }

    let payload;

    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      res.status(401).json({ message: 'Invalid or expired refresh token' });
      return;
    }

    const currentToken = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(refreshToken) },
      include: { user: true }
    });

    if (
      !currentToken ||
      currentToken.revokedAt ||
      currentToken.expiresAt <= new Date()
    ) {
      res.status(401).json({ message: 'Refresh token is no longer valid' });
      return;
    }

    if (currentToken.userId !== Number(payload.sub)) {
      res.status(401).json({ message: 'Refresh token does not match user' });
      return;
    }

    const {
      accessToken,
      refreshToken: nextRefreshToken,
      refreshTokenRecord
    } = await issueTokenPair(currentToken.user);

    await prisma.refreshToken.update({
      where: { id: currentToken.id },
      data: {
        revokedAt: new Date(),
        replacedByTokenId: refreshTokenRecord.id
      }
    });

    sendAuthResponse(res, currentToken.user, accessToken, nextRefreshToken);
  })
);

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const refreshToken = getCookie(req, REFRESH_TOKEN_COOKIE);

    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: {
          tokenHash: hashToken(refreshToken),
          revokedAt: null
        },
        data: {
          revokedAt: new Date()
        }
      });
    }

    clearAuthCookies(res);
    res.status(204).send();
  })
);

router.get(
  '/me',
  authenticateAccessToken,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.auth!.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true
      }
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ user: serializeUser(user) });
  })
);

router.get(
  '/admin',
  authenticateAccessToken,
  requireRole('admin'),
  asyncHandler(async (_req, res) => {
    res.json({ message: 'Admin access granted' });
  })
);

export { router as authRouter };
