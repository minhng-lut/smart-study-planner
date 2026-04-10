import type { NextFunction, Request, Response } from 'express';

import { ACCESS_TOKEN_COOKIE, getCookie } from '../lib/cookies.js';
import { verifyAccessToken } from '../lib/tokens.js';

export function authenticateAccessToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authorization = req.header('authorization');
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : getCookie(req, ACCESS_TOKEN_COOKIE);

  if (!token) {
    res.status(401).json({ message: 'Missing authentication token' });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    const userId = Number(payload.sub);

    if (!Number.isInteger(userId)) {
      throw new Error('Invalid token subject');
    }

    req.auth = {
      id: userId,
      email: payload.email,
      role: payload.role
    };

    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired access token' });
  }
}
