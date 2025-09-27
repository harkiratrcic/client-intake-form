import { describe, expect, it, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@/lib/auth/password';
import { seedTemplates } from '@/prisma/seed';

describe('/api/forms POST', () => {
  let prisma: PrismaClient;
  let testOwnerId: string;
  let testTemplateId: string;

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

    // Clear and seed templates
    await prisma.formTemplate.deleteMany();
    await seedTemplates(prisma);

    // Get a template ID for testing
    const template = await prisma.formTemplate.findFirst();
    testTemplateId = template?.id || '';
  });

  afterEach(async () => {
    await prisma.formResponse.deleteMany();
    await prisma.formInstance.deleteMany();
    await prisma.formTemplate.deleteMany();
    await prisma.owner.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.$disconnect();
  });

  it('should create form instance with valid data', async () => {
    const formData = {
      templateId: testTemplateId,
      clientEmail: 'client@example.com',
      personalMessage: 'Please complete this form at your earliest convenience.',
      expiryDays: 7,
    };

    const request = new NextRequest('http://localhost:3000/api/forms', {
      method: 'POST',
      body: JSON.stringify(formData),
      headers: {
        'Content-Type': 'application/json',
        'x-owner-id': testOwnerId, // Simulate authenticated owner
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.formInstance).toBeDefined();
    expect(data.formInstance.templateId).toBe(testTemplateId);
    expect(data.formInstance.clientEmail).toBe('client@example.com');
    expect(data.formInstance.personalMessage).toBe(formData.personalMessage);
    expect(data.formInstance.secureToken).toBeDefined();
    expect(data.formUrl).toBeDefined();
    expect(data.formUrl).toContain(data.formInstance.secureToken);

    // Verify in database
    const dbInstance = await prisma.formInstance.findUnique({
      where: { id: data.formInstance.id },
    });
    expect(dbInstance).toBeDefined();
    expect(dbInstance?.status).toBe('SENT');
  });

  it('should create form with minimal data', async () => {
    const formData = {
      templateId: testTemplateId,
      clientEmail: 'client@example.com',
    };

    const request = new NextRequest('http://localhost:3000/api/forms', {
      method: 'POST',
      body: JSON.stringify(formData),
      headers: {
        'Content-Type': 'application/json',
        'x-owner-id': testOwnerId,
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.formInstance.personalMessage).toBeNull();
  });

  it('should reject invalid email format', async () => {
    const formData = {
      templateId: testTemplateId,
      clientEmail: 'invalid-email',
    };

    const request = new NextRequest('http://localhost:3000/api/forms', {
      method: 'POST',
      body: JSON.stringify(formData),
      headers: {
        'Content-Type': 'application/json',
        'x-owner-id': testOwnerId,
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('email');
  });

  it('should reject missing required fields', async () => {
    const formData = {
      clientEmail: 'client@example.com',
      // templateId missing
    };

    const request = new NextRequest('http://localhost:3000/api/forms', {
      method: 'POST',
      body: JSON.stringify(formData),
      headers: {
        'Content-Type': 'application/json',
        'x-owner-id': testOwnerId,
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('templateId');
  });

  it('should reject invalid template ID', async () => {
    const formData = {
      templateId: 'invalid-template-id',
      clientEmail: 'client@example.com',
    };

    const request = new NextRequest('http://localhost:3000/api/forms', {
      method: 'POST',
      body: JSON.stringify(formData),
      headers: {
        'Content-Type': 'application/json',
        'x-owner-id': testOwnerId,
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Template not found');
  });

  it('should require authenticated owner', async () => {
    const formData = {
      templateId: testTemplateId,
      clientEmail: 'client@example.com',
    };

    const request = new NextRequest('http://localhost:3000/api/forms', {
      method: 'POST',
      body: JSON.stringify(formData),
      headers: {
        'Content-Type': 'application/json',
        // x-owner-id missing
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toContain('authentication');
  });

  it('should validate expiry days limits', async () => {
    const formData = {
      templateId: testTemplateId,
      clientEmail: 'client@example.com',
      expiryDays: 100, // Exceeds maximum
    };

    const request = new NextRequest('http://localhost:3000/api/forms', {
      method: 'POST',
      body: JSON.stringify(formData),
      headers: {
        'Content-Type': 'application/json',
        'x-owner-id': testOwnerId,
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('expiryDays');
  });

  it('should normalize client email', async () => {
    const formData = {
      templateId: testTemplateId,
      clientEmail: '  CLIENT@EXAMPLE.COM  ',
    };

    const request = new NextRequest('http://localhost:3000/api/forms', {
      method: 'POST',
      body: JSON.stringify(formData),
      headers: {
        'Content-Type': 'application/json',
        'x-owner-id': testOwnerId,
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.formInstance.clientEmail).toBe('client@example.com');
  });

  it('should include audit logging', async () => {
    const formData = {
      templateId: testTemplateId,
      clientEmail: 'client@example.com',
    };

    const request = new NextRequest('http://localhost:3000/api/forms', {
      method: 'POST',
      body: JSON.stringify(formData),
      headers: {
        'Content-Type': 'application/json',
        'x-owner-id': testOwnerId,
        'x-forwarded-for': '192.168.1.100',
        'user-agent': 'Test Browser/1.0',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);

    // Verify audit log was created
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entityType: 'FormInstance',
        entityId: data.formInstance.id,
        action: 'created',
      },
    });

    expect(auditLogs.length).toBe(1);
    expect(auditLogs[0].actorType).toBe('OWNER');
    expect(auditLogs[0].actorId).toBe(testOwnerId);
  });
});