import type { Role } from '@prisma/client';

export type AuthRole = 'student' | 'admin';

export type AuthenticatedUser = {
  id: number;
  email: string;
  role: AuthRole;
};

export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: AuthRole;
  tokenType: 'access';
};

export type RefreshTokenPayload = {
  sub: string;
  email: string;
  role: AuthRole;
  tokenType: 'refresh';
  jti: string;
};

export function toAuthRole(role: Role): AuthRole {
  return role === 'ADMIN' ? 'admin' : 'student';
}
