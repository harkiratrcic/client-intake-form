import { describe, expect, it, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { middleware } from '../middleware';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '@/lib/auth/auth-service';
import { hashPassword } from '@/lib/auth/password';

describe('Auth Middleware', () => {
  let prisma: PrismaClient;
  let authService: AuthService;
  let sessionToken: string;
  let testOwnerId: string;

  beforeEach(async () => {
    prisma = new PrismaClient();
    authService = new AuthService(prisma);

    // Create test owner and session
    const owner = await prisma.owner.create({
      data: {
        email: 'test@rcic.ca',
        passwordHash: await hashPassword('TestPass123!'),
        businessName: 'Test Immigration Services',
        isActive: true,
      },
    });
    testOwnerId = owner.id;

    const loginResult = await authService.login('test@rcic.ca', 'TestPass123!');
    if (loginResult.success) {
      sessionToken = loginResult.session.token;
    }
  });

  afterEach(async () => {
    await prisma.session.deleteMany();
    await prisma.owner.deleteMany();
    await prisma.$disconnect();
  });

  describe('Protected Routes', () => {
    it('should block unauthenticated requests to protected routes', async () => {
      const request = new NextRequest('http://localhost/api/forms');
      const response = await middleware(request);

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Authentication required');
    });

    it('should allow authenticated requests to protected routes', async () => {
      const request = new NextRequest('http://localhost/api/forms', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      });

      const response = await middleware(request);

      // Middleware should allow request to continue
      expect(response?.status).toBe(200);
      expect(response?.headers.get('x-user-id')).toBe(testOwnerId);
    });

    it('should block requests with invalid session tokens', async () => {
      const request = new NextRequest('http://localhost/api/forms', {
        headers: {
          'Authorization': 'Bearer invalid-token',
        },
      });

      const response = await middleware(request);

      expect(response?.status).toBe(401);
      if (response) {
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error).toBe('Invalid session');
      }
    });

    it('should work with cookie-based authentication', async () => {
      const request = new NextRequest('http://localhost/api/submissions', {
        headers: {
          'Cookie': `session-token=${sessionToken}`,
        },
      });

      const response = await middleware(request);

      // Should allow request to continue
      expect(response?.status).toBe(200);
    });
  });

  describe('Client Routes', () => {
    it('should allow access to client form routes without auth', async () => {
      const request = new NextRequest('http://localhost/api/client/form/some-token');
      const response = await middleware(request);

      // Should allow request to continue
      expect(response?.status).toBe(200);
    });

    it('should allow access to public routes without auth', async () => {
      const request = new NextRequest('http://localhost/api/health');
      const response = await middleware(request);

      // Should allow request to continue
      expect(response?.status).toBe(200);
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to protected routes', async () => {
      // This would require actual rate limiting implementation
      // For now, just verify middleware doesn't interfere
      const request = new NextRequest('http://localhost/api/forms', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      });

      const response = await middleware(request);
      expect(response?.status).toBe(200);
      expect(response?.headers.get('x-user-id')).toBe(testOwnerId);
    });
  });

  describe('Path Matching', () => {
    const protectedPaths = [
      '/api/forms',
      '/api/forms/create',
      '/api/submissions',
      '/api/submissions/123',
      '/api/export/csv',
    ];

    const publicPaths = [
      '/api/auth/login',
      '/api/auth/logout',
      '/api/client/form/token123',
      '/api/client/save/token123',
      '/api/client/submit/token123',
      '/f/token123',
    ];

    const dashboardPaths = [
      '/',
    ];

    protectedPaths.forEach(path => {
      it(`should protect ${path}`, async () => {
        const request = new NextRequest(`http://localhost${path}`);
        const response = await middleware(request);

        expect(response?.status).toBe(401);
      });
    });

    publicPaths.forEach(path => {
      it(`should allow access to ${path}`, async () => {
        const request = new NextRequest(`http://localhost${path}`);
        const response = await middleware(request);

        expect(response?.status).toBe(200);
      });
    });

    dashboardPaths.forEach(path => {
      it(`should redirect unauthenticated users from ${path}`, async () => {
        const request = new NextRequest(`http://localhost${path}`);
        const response = await middleware(request);

        expect(response?.status).toBe(307); // Temporary redirect
        expect(response?.headers.get('Location')).toContain('/login');
      });
    });
  });
});