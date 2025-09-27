import { describe, expect, it, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '../logout/route';
import { POST as loginPost } from '../login/route';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@/lib/auth/password';

describe('/api/auth/logout', () => {
  let prisma: PrismaClient;
  let testOwnerId: string;
  let sessionToken: string;

  beforeEach(async () => {
    prisma = new PrismaClient();

    // Create test owner
    const owner = await prisma.owner.create({
      data: {
        email: 'test@rcic.ca',
        passwordHash: await hashPassword('TestPass123!'),
        businessName: 'Test Immigration Services',
        isActive: true,
      },
    });
    testOwnerId = owner.id;

    // Login to get session token
    const loginRequest = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@rcic.ca',
        password: 'TestPass123!'
      }),
    });

    const loginResponse = await loginPost(loginRequest);
    const loginData = await loginResponse.json();
    sessionToken = loginData.session.token;
  });

  afterEach(async () => {
    await prisma.session.deleteMany();
    await prisma.owner.deleteMany();
    await prisma.$disconnect();
  });

  it('should logout with valid session token', async () => {
    const request = new NextRequest('http://localhost/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `session-token=${sessionToken}`,
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Verify session is actually deleted
    const sessions = await prisma.session.findMany();
    expect(sessions.length).toBe(0);
  });

  it('should handle logout without session token gracefully', async () => {
    const request = new NextRequest('http://localhost/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should handle invalid session token gracefully', async () => {
    const request = new NextRequest('http://localhost/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'session-token=invalid-token',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});