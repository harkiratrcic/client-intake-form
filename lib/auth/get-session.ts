import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { AuthService, ValidationResult } from './auth-service';
import { getSessionTokenFromRequest } from '@/lib/api/session';
import { prisma } from '@/lib/prisma';

const authService = new AuthService(prisma);

export async function getSession(request?: NextRequest): Promise<ValidationResult> {
  // First, check if middleware already validated the session and set headers
  if (request) {
    const ownerId = request.headers.get('x-owner-id');

    if (ownerId) {
      // Middleware already validated the session, fetch owner from database
      try {
        const owner = await prisma.owner.findUnique({
          where: { id: ownerId },
        });

        if (owner && owner.isActive) {
          return {
            success: true,
            owner,
            session: {
              id: 'middleware-validated',
              token: 'middleware-validated',
            },
          };
        }
      } catch (error) {
        console.error('Error fetching owner from middleware headers:', error);
      }
    }
  }

  // Fallback to full session validation for server components or if headers not set
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