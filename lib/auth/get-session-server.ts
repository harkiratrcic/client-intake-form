import { cookies } from 'next/headers';
import { ValidationResult } from './auth-service';
import { verifyJWT, SessionPayload } from './session';
import { prisma } from '@/lib/prisma';

/**
 * Server component compatible session validation
 * Uses Next.js cookies() helper and validates JWT tokens
 */
export async function getServerSession(): Promise<ValidationResult> {
  try {
    console.log('=== SERVER SESSION DEBUG ===');
    const cookieStore = await cookies();
    const jwtToken = cookieStore.get('session-token')?.value;
    console.log('JWT token found:', jwtToken ? `${jwtToken.substring(0, 20)}...` : 'null');

    if (!jwtToken) {
      console.log('SERVER SESSION FAIL: No JWT token');
      return { success: false, error: 'No session token provided' };
    }

    // Verify JWT token
    const jwtResult = verifyJWT(jwtToken);
    console.log('JWT verification result:', { valid: jwtResult.valid, hasPayload: !!jwtResult.payload });
    if (!jwtResult.valid || !jwtResult.payload) {
      console.log('SERVER SESSION FAIL: Invalid JWT token');
      return { success: false, error: 'Invalid JWT token' };
    }

    const payload = jwtResult.payload as SessionPayload;
    console.log('JWT payload:', { ownerId: payload.ownerId, sessionId: payload.sessionId, exp: payload.exp });

    // Get owner from database
    const owner = await prisma.owner.findUnique({
      where: { id: payload.ownerId },
    });
    console.log('Owner lookup result:', { found: !!owner, isActive: owner?.isActive });

    if (!owner || !owner.isActive) {
      console.log('SERVER SESSION FAIL: Owner not found or inactive');
      return { success: false, error: 'Owner not found or inactive' };
    }

    // Check if session still exists in database
    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId },
    });
    console.log('Session lookup result:', {
      found: !!session,
      expiresAt: session?.expiresAt,
      now: new Date(),
      expired: session ? session.expiresAt < new Date() : 'N/A'
    });

    if (!session || session.expiresAt < new Date()) {
      console.log('SERVER SESSION FAIL: Session expired or not found');
      return { success: false, error: 'Session expired or not found' };
    }

    // Update last activity
    await prisma.session.update({
      where: { id: session.id },
      data: { lastActivityAt: new Date() },
    });

    console.log('SERVER SESSION SUCCESS: All checks passed');
    return {
      success: true,
      owner,
      session: {
        id: session.id,
        token: jwtToken,
      },
    };
  } catch (error) {
    console.error('Server session validation error:', error);
    return { success: false, error: 'Session validation failed' };
  }
}