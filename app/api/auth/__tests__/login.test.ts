import { describe, expect, it, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '../login/route';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@/lib/auth/password';

describe('/api/auth/login', () => {
  let prisma: PrismaClient;
  let testOwnerId: string;

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
  });

  afterEach(async () => {
    await prisma.session.deleteMany();
    await prisma.owner.deleteMany();
    await prisma.$disconnect();
  });

  it('should login with valid credentials', async () => {
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@rcic.ca',
        password: 'TestPass123!'
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.owner.email).toBe('test@rcic.ca');
    expect(data.session.token).toBeDefined();
    expect(data.session.jwt).toBeDefined();
    expect(data.owner.passwordHash).toBeUndefined(); // Should not return password hash
  });

  it('should reject invalid email', async () => {
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'wrong@email.com',
        password: 'TestPass123!'
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid credentials');
  });

  it('should reject invalid password', async () => {
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@rcic.ca',
        password: 'WrongPassword'
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid credentials');
  });

  it('should validate email format', async () => {
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'invalid-email',
        password: 'TestPass123!'
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Validation failed');
    expect(data.details).toBeDefined();
  });

  it('should require both email and password', async () => {
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@rcic.ca'
        // Missing password
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Validation failed');
  });

  it('should handle malformed JSON', async () => {
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid-json',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid request body');
  });
});