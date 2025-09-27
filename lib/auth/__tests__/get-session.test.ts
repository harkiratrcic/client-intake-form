import { describe, expect, it, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { getSession } from '../get-session';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../auth-service';
import { hashPassword } from '../password';

describe('getSession helper', () => {
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

  it('should extract session from Authorization header', async () => {
    const request = new NextRequest('http://localhost/test', {
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
      },
    });

    const result = await getSession(request);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.owner.id).toBe(testOwnerId);
      expect(result.owner.email).toBe('test@rcic.ca');
    }
  });

  it('should extract session from cookie', async () => {
    const request = new NextRequest('http://localhost/test', {
      headers: {
        'Cookie': `session-token=${sessionToken}`,
      },
    });

    const result = await getSession(request);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.owner.id).toBe(testOwnerId);
    }
  });

  it('should return failure for missing token', async () => {
    const request = new NextRequest('http://localhost/test');
    const result = await getSession(request);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('No session token provided');
    }
  });

  it('should return failure for invalid token', async () => {
    const request = new NextRequest('http://localhost/test', {
      headers: {
        'Authorization': 'Bearer invalid-token',
      },
    });

    const result = await getSession(request);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Invalid session');
    }
  });

  it('should prefer Authorization header over cookie', async () => {
    const request = new NextRequest('http://localhost/test', {
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Cookie': 'session-token=invalid-cookie-token',
      },
    });

    const result = await getSession(request);

    expect(result.success).toBe(true);
  });
});