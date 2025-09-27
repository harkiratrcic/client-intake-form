import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { AuthService, ValidationResult } from './auth-service';
import { getSessionTokenFromRequest } from '@/lib/api/session';
import { prisma } from '@/lib/prisma';

const authService = new AuthService(prisma);

export async function getSession(request?: NextRequest): Promise<ValidationResult> {
  let sessionToken: string | null = null;

  if (request) {
    // When called from API routes with request object
    sessionToken = getSessionTokenFromRequest(request);
  } else {
    // When called from server components without request object
    const cookieStore = await cookies();
    sessionToken = cookieStore.get('session-token')?.value || null;
  }

  if (!sessionToken) {
    return { success: false, error: 'No session token provided' };
  }

  return authService.validateSession(sessionToken);
}