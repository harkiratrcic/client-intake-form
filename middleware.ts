import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateSessionToken } from '@/lib/auth/edge-session';

// Define protected routes
const PROTECTED_PATHS = [
  '/api/forms',
  '/api/submissions',
  '/api/templates', // Only if we want to protect template access
  '/api/clients', // Protect client management endpoints
  '/api/export',
];

// Define public routes that don't need authentication
const PUBLIC_PATHS = [
  '/api/auth',
  '/api/client',
  '/api/health',
  '/f/', // Client form paths - unauthenticated access allowed
  '/_next',
  '/favicon.ico',
];

// Define dashboard routes (require authentication)
const DASHBOARD_PATHS = [
  '/dashboard',
];

function isProtectedApiPath(pathname: string): boolean {
  // Special case: Allow public access to form instances via token
  // Patterns: /api/forms/{token}, /api/forms/{token}/draft, /api/forms/{token}/autosave, /api/forms/{token}/submit
  if (pathname.match(/^\/api\/forms\/[^\/]+(\/draft|\/autosave|\/submit)?$/)) {
    return false;
  }

  return PROTECTED_PATHS.some(path => pathname.startsWith(path));
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(path => pathname.startsWith(path));
}

function isDashboardPath(pathname: string): boolean {
  return DASHBOARD_PATHS.some(path => pathname.startsWith(path)) || pathname === '/';
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths to pass through
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Check if this is a protected API path
  if (isProtectedApiPath(pathname)) {
    const sessionResult = validateSessionToken(request);
    if (!sessionResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: sessionResult.error === 'No session token provided'
            ? 'Authentication required'
            : 'Invalid session',
        },
        { status: 401 }
      );
    }

    // Add user info to headers for downstream handlers
    const response = NextResponse.next();
    if (sessionResult.userId) {
      response.headers.set('x-owner-id', sessionResult.userId);
      response.headers.set('x-user-email', sessionResult.email || '');
    }
    return response;
  }

  // Check if this is a dashboard path (redirect to login if not authenticated)
  if (isDashboardPath(pathname)) {
    console.log('=== DASHBOARD PATH CHECK ===');
    console.log('Path:', pathname);
    console.log('isDashboardPath result:', isDashboardPath(pathname));

    const sessionResult = validateSessionToken(request);
    console.log('Session validation result:', sessionResult);

    if (!sessionResult.success) {
      console.log('SESSION VALIDATION FAILED - redirecting to login');
      // Redirect to login page
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    console.log('SESSION VALIDATION PASSED - allowing access');
    // Allow authenticated users to access dashboard
    return NextResponse.next();
  }

  // All other paths are allowed
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication endpoints)
     * - api/client (client-facing endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|api/client|_next/static|_next/image|favicon.ico).*)',
  ],
};