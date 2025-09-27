import { NextRequest } from 'next/server';
import { AuthService } from '@/lib/auth/auth-service';
import { prisma } from '@/lib/prisma';
import { successResponse, internalErrorResponse } from '@/lib/api/response';
import { getSessionTokenFromRequest } from '@/lib/api/session';

const authService = new AuthService(prisma);

export async function POST(request: NextRequest) {
  try {
    const sessionToken = getSessionTokenFromRequest(request);

    if (sessionToken) {
      await authService.logout(sessionToken);
    }

    // Create response
    const response = successResponse({ message: 'Logged out successfully' });

    // Clear session cookie
    response.cookies.set('session-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(0), // Expire immediately
      path: '/',
    });

    return response;

  } catch (error) {
    return internalErrorResponse(error);
  }
}