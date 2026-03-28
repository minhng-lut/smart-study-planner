import type { NextFunction, Request, Response } from 'express';

import { verifyAccessToken } from '../lib/tokens.js';

export function authenticateAccessToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authorization = req.header('authorization');

  if (!authorization?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing or invalid authorization header' });
    return;
  }

  const token = authorization.slice('Bearer '.length);

  try {
    const payload = verifyAccessToken(token);

    req.auth = {
      id: payload.sub,
      email: payload.email,
      role: payload.role
    };

    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired access token' });
  }
}
