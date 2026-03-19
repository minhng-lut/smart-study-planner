import type { NextFunction, Request, Response } from 'express';

import type { AuthRole } from '../types/auth.js';

export function requireRole(...roles: AuthRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.auth.role)) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    next();
  };
}
