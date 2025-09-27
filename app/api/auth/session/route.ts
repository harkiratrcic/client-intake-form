import { NextRequest } from 'next/server';
import { AuthService } from '@/lib/auth/auth-service';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  internalErrorResponse,
} from '@/lib/api/response';
import { getSessionTokenFromRequest } from '@/lib/api/session';

const authService = new AuthService(prisma);

export async function GET(request: NextRequest) {
  try {
    const sessionToken = getSessionTokenFromRequest(request);

    if (!sessionToken) {
      return errorResponse('No session token provided', 401);
    }

    const result = await authService.validateSession(sessionToken);

    if (!result.success) {
      return errorResponse(result.error, 401);
    }

    // Remove sensitive data from response
    const { passwordHash, ...ownerData } = result.owner;

    return successResponse({
      owner: ownerData,
      session: {
        id: result.session.id,
      },
    });

  } catch (error) {
    return internalErrorResponse(error);
  }
}