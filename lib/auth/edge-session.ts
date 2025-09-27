import { NextRequest } from 'next/server';
import { getSessionTokenFromRequest } from '@/lib/api/session';

interface SessionPayload {
  ownerId: string;
  email: string;
  sessionId: string;
  exp: number;
  iat: number;
  iss: string;
  aud: string;
}

/**
 * Edge-compatible JWT validation for middleware
 * This doesn't use Prisma since middleware runs on Edge Runtime
 */
export function validateSessionToken(request: NextRequest): { success: boolean; userId?: string; email?: string; error?: string } {
  try {
    // Debug logging
    console.log('=== MIDDLEWARE DEBUG ===');
    console.log('URL:', request.url);
    console.log('Cookie header:', request.headers.get('Cookie'));
    console.log('All headers:', Object.fromEntries(request.headers.entries()));

    const token = getSessionTokenFromRequest(request);

    console.log('Extracted token:', token ? `${token.substring(0, 20)}...` : 'null');

    if (!token) {
      console.log('No session token found');
      return { success: false, error: 'No session token provided' };
    }

    // Basic JWT structure validation
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { success: false, error: 'Invalid JWT format' };
    }

    try {
      // Decode JWT payload (without signature verification for edge runtime)
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as SessionPayload;
      console.log('Decoded payload:', payload);

      // Validate required fields
      if (!payload.ownerId || !payload.email) {
        console.log('Missing required fields:', { ownerId: payload.ownerId, email: payload.email });
        return { success: false, error: 'Invalid JWT payload' };
      }

      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      console.log('Token expiry check:', { exp: payload.exp, now, expired: payload.exp && payload.exp < now });
      if (payload.exp && payload.exp < now) {
        console.log('Token is EXPIRED');
        return { success: false, error: 'JWT expired' };
      }

      // Validate issuer and audience
      console.log('Issuer/Audience check:', { iss: payload.iss, aud: payload.aud });
      if (payload.iss !== 'immigration-form-sender' || payload.aud !== 'owner') {
        console.log('Invalid issuer or audience');
        return { success: false, error: 'Invalid JWT issuer or audience' };
      }

      return {
        success: true,
        userId: payload.ownerId,
        email: payload.email
      };
    } catch (decodeError) {
      return { success: false, error: 'Invalid JWT payload' };
    }
  } catch (error) {
    return { success: false, error: 'JWT validation failed' };
  }
}