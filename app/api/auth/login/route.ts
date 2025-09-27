import { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { AuthService } from '@/lib/auth/auth-service';
import { loginSchema } from '@/lib/validation/auth';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  internalErrorResponse,
} from '@/lib/api/response';
import {
  getClientIpFromRequest,
  getUserAgentFromRequest,
} from '@/lib/api/session';

const authService = new AuthService(prisma);

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Invalid request body', 400);
    }

    // Validate input
    const validatedData = loginSchema.parse(body);

    // Get client info
    const ipAddress = getClientIpFromRequest(request);
    const userAgent = getUserAgentFromRequest(request);

    // Attempt login
    const result = await authService.login(
      validatedData.email,
      validatedData.password,
      ipAddress,
      userAgent
    );

    if (!result.success) {
      return errorResponse(result.error, 401);
    }

    // Remove sensitive data from response
    const { passwordHash, ...ownerData } = result.owner;

    // Set session cookie
    const response = successResponse({
      owner: ownerData,
      session: result.session,
    });

    // Set HTTP-only cookie for session using JWT (for middleware validation)
    response.cookies.set('session-token', result.session.jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Changed from strict to lax for better navigation
      maxAge: 24 * 60 * 60, // 24 hours instead of 30 minutes
      path: '/',
    });

    return response;

  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    return internalErrorResponse(error);
  }
}