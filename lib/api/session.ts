import { NextRequest } from 'next/server';

export function getSessionTokenFromRequest(request: NextRequest): string | null {
  // Try to get from Authorization header first
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try to get from cookie
  const cookies = request.headers.get('Cookie');
  if (cookies) {
    const sessionCookie = cookies
      .split(';')
      .find(cookie => cookie.trim().startsWith('session-token='));

    if (sessionCookie) {
      return sessionCookie.split('=')[1];
    }
  }

  return null;
}

export function getClientIpFromRequest(request: NextRequest): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  return undefined;
}

export function getUserAgentFromRequest(request: NextRequest): string | undefined {
  return request.headers.get('user-agent') || undefined;
}