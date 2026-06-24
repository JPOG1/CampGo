import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';

const CSRF_COOKIE = 'csrf-token';
const CSRF_HEADER = 'x-csrf-token';

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  if (!req.cookies?.[CSRF_COOKIE]) {
    const token = generateCsrfToken();
    res.cookie(CSRF_COOKIE, token, { httpOnly: false, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
  }
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  const headerToken = req.headers[CSRF_HEADER] as string;
  const cookieToken = req.cookies?.[CSRF_COOKIE];
  if (!headerToken || headerToken !== cookieToken) {
    return res.status(403).json({ detail: 'Invalid CSRF token' });
  }
  return next();
}
