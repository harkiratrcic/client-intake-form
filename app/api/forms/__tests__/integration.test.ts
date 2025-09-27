import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@/lib/auth/password';
import { seedTemplates } from '@/prisma/seed';

// Mock the EmailQueue to control email behavior
jest.mock('@/lib/services/email-queue', () => {
  const mockQueueFormLinkEmail = jest.fn();

  return {
    EmailQueue: jest.fn().mockImplementation(() => ({
      queueFormLinkEmail: mockQueueFormLinkEmail,
    })),
    // Export the mock so we can access it in tests
    __mockQueueFormLinkEmail: mockQueueFormLinkEmail,
  };
});

// Get access to the mock
const { __mockQueueFormLinkEmail: mockQueueFormLinkEmail } = require('@/lib/services/email-queue');

describe('Form Creation Integration', () => {
  let prisma: PrismaClient;
  let testOwnerId: string;
  let testTemplateId: string;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Default mock behavior (success)
    mockQueueFormLinkEmail.mockResolvedValue({
      success: true,
      emailId: 'test-email-123',
    });

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

  it('should create form instance and send email', async () => {
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
        'x-owner-id': testOwnerId,
        'x-forwarded-for': '192.168.1.100',
        'user-agent': 'Test Browser/1.0',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.formInstance).toBeDefined();
    expect(data.formUrl).toBeDefined();
    expect(data.emailSent).toBe(true);
    expect(data.emailId).toBe('test-email-123');
    expect(data.message).toContain('Email sent to client');

    // Verify form instance was created in database
    const dbInstance = await prisma.formInstance.findUnique({
      where: { id: data.formInstance.id },
    });
    expect(dbInstance).toBeDefined();
    expect(dbInstance?.status).toBe('SENT');

    // Verify form creation audit log was created
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entityType: 'FormInstance',
        entityId: data.formInstance.id,
      },
    });

    // Should have at least 1 log: form creation (email audit logs are mocked)
    expect(auditLogs.length).toBeGreaterThanOrEqual(1);

    const formCreatedLog = auditLogs.find(log => log.action === 'created');
    expect(formCreatedLog).toBeDefined();
    expect(formCreatedLog?.actorType).toBe('OWNER');

    // Verify EmailQueue was called with correct parameters
    expect(mockQueueFormLinkEmail).toHaveBeenCalledWith({
      instanceId: data.formInstance.id,
      to: 'client@example.com',
      formUrl: data.formUrl,
      personalMessage: 'Please complete this form at your earliest convenience.',
      ownerName: 'Test Immigration Services',
      templateName: 'Basic Information', // Exact template name from seed
      expiresAt: expect.any(Date),
      ownerId: testOwnerId,
      ipAddress: '192.168.1.100',
      userAgent: 'Test Browser/1.0',
    });
  });

  it('should handle email failures gracefully', async () => {
    // Mock email queue to return failure for this test
    mockQueueFormLinkEmail.mockResolvedValue({
      success: false,
      error: 'Invalid recipient email',
    });

    const formData = {
      templateId: testTemplateId,
      clientEmail: 'client@example.com',
      personalMessage: 'Please complete this form.',
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

    // Form creation should still succeed
    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.formInstance).toBeDefined();
    expect(data.emailSent).toBe(false);
    expect(data.emailError).toBe('Invalid recipient email');
    expect(data.message).toContain('Warning: Email could not be sent');

    // Verify form instance was still created
    const dbInstance = await prisma.formInstance.findUnique({
      where: { id: data.formInstance.id },
    });
    expect(dbInstance).toBeDefined();

    // Verify EmailQueue was called even though it failed
    expect(mockQueueFormLinkEmail).toHaveBeenCalledWith({
      instanceId: data.formInstance.id,
      to: 'client@example.com',
      formUrl: data.formUrl,
      personalMessage: 'Please complete this form.',
      ownerName: 'Test Immigration Services',
      templateName: 'Basic Information', // Exact template name from seed
      expiresAt: expect.any(Date),
      ownerId: testOwnerId,
      ipAddress: 'unknown', // Default value when not provided
      userAgent: 'unknown', // Default value when not provided
    });
  });
});