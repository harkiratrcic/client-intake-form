import { cookies } from 'next/headers';
import { verifyJWT } from './session';

/**
 * Server-side session validation for React Server Components
 * This uses cookies() instead of NextRequest for server components
 */
export async function getServerSession() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session-token')?.value;

    if (!sessionToken) {
      return { success: false, error: 'No session token provided' };
    }

    // Verify JWT token
    const payload = verifyJWT(sessionToken);
    if (!payload) {
      return { success: false, error: 'Invalid or expired session token' };
    }

    // For server components, we don't need to do a full database lookup
    // The JWT contains the essential user info we need
    return {
      success: true,
      owner: {
        id: payload.ownerId,
        email: payload.email,
      }
    };
  } catch (error) {
    console.error('Server session validation error:', error);
    return { success: false, error: 'Session validation failed' };
  }
}