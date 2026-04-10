import type { Request } from 'express';

export const ACCESS_TOKEN_COOKIE = 'ssp_access_token';
export const REFRESH_TOKEN_COOKIE = 'ssp_refresh_token';

export function getCookie(req: Request, name: string) {
  const cookieHeader = req.headers.cookie;

  if (!cookieHeader) {
    return undefined;
  }

  for (const cookie of cookieHeader.split(';')) {
    const [rawName, ...rawValueParts] = cookie.trim().split('=');

    if (rawName !== name) {
      continue;
    }

    const rawValue = rawValueParts.join('=');

    try {
      return decodeURIComponent(rawValue);
    } catch {
      return rawValue;
    }
  }

  return undefined;
}
